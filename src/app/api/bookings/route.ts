import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CreateBookingInput } from "@/lib/types";
import { calculatePlatformFee, calculateTutorEarnings } from "@/lib/utils";
import { emailService } from "@/lib/email";

// GET - Fetch bookings for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = session.user.role;

    let bookings;

    if (role === "TUTOR") {
      const profile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!profile) {
        return NextResponse.json(
          { success: false, error: "Profile not found" },
          { status: 404 }
        );
      }

      bookings = await prisma.booking.findMany({
        where: {
          tutorProfileId: profile.id,
          ...(status && { status: status as any }),
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          review: true,
        },
        orderBy: { startTime: "desc" },
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: {
          studentId: session.user.id,
          ...(status && { status: status as any }),
        },
        include: {
          tutorProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          review: true,
        },
        orderBy: { startTime: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Only students can create bookings" },
        { status: 403 }
      );
    }

    const body: CreateBookingInput = await request.json();
    const { tutorProfileId, subject, startTime, endTime, notes } = body;

    // Validate input
    if (!tutorProfileId || !subject || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get tutor profile
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: {
        user: true,
        availabilitySlots: true,
      },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { success: false, error: "Tutor not found" },
        { status: 404 }
      );
    }

    if (!tutorProfile.profileComplete) {
      return NextResponse.json(
        { success: false, error: "Tutor profile is not complete" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return NextResponse.json(
        { success: false, error: "Cannot book in the past" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Calculate session duration in hours
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (durationHours < 0.5 || durationHours > 4) {
      return NextResponse.json(
        { success: false, error: "Session must be between 30 minutes and 4 hours" },
        { status: 400 }
      );
    }

    // Check for double booking (include REQUESTED status)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        tutorProfileId,
        status: {
          in: ["REQUESTED", "PENDING", "CONFIRMED"] as any[],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
          {
            AND: [
              { startTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    // Calculate price
    const price = tutorProfile.hourlyRate * durationHours;
    const platformFee = calculatePlatformFee(price);
    const tutorEarnings = calculateTutorEarnings(price);

    // Create booking with REQUESTED status (tutor must approve)
    const booking = await prisma.booking.create({
      data: {
        studentId: session.user.id,
        tutorProfileId,
        subject,
        startTime: start,
        endTime: end,
        status: "REQUESTED" as any,
        price,
        platformFee,
        tutorEarnings,
        notes,
      },
      include: {
        tutorProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Send email notification to tutor
    try {
      const bookingUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/tutor/bookings/${booking.id}`;
      await emailService.sendBookingRequestEmail(
        booking.tutorProfile.user.email,
        booking.tutorProfile.user.firstName,
        `${session.user.firstName} ${session.user.lastName}`,
        subject,
        start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        bookingUrl
      );
    } catch (emailError) {
      console.error("Failed to send booking request email:", emailError);
    }

    return NextResponse.json({
      success: true,
      data: booking,
      message: "Booking request sent! The tutor will review and respond soon.",
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
