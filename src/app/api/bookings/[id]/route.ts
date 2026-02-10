import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email";

// GET - Get single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
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
        tutorProfile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        review: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this booking
    const isStudent = booking.studentId === session.user.id;
    const isTutor = booking.tutorProfile.userId === session.user.id;

    if (!isStudent && !isTutor) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Include all lesson tracking fields in response
    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tutorProfile: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, tutorMessage } = body;

    // Validate status transition
    const isStudent = booking.studentId === session.user.id;
    const isTutor = booking.tutorProfile.userId === session.user.id;

    if (!isStudent && !isTutor) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Status transition rules - now includes REQUESTED and REJECTED
    const allowedTransitions: Record<string, { tutor: string[]; student: string[] }> = {
      REQUESTED: {
        tutor: ["PENDING", "REJECTED"], // Tutor can approve (PENDING) or reject
        student: ["CANCELLED"], // Student can cancel their request
      },
      PENDING: {
        tutor: ["CONFIRMED", "CANCELLED"],
        student: ["CANCELLED"],
      },
      CONFIRMED: {
        tutor: ["COMPLETED", "CANCELLED"],
        student: ["CANCELLED"],
      },
      COMPLETED: {
        tutor: [],
        student: [],
      },
      CANCELLED: {
        tutor: [],
        student: [],
      },
      REJECTED: {
        tutor: [],
        student: [],
      },
    };

    const userType = isTutor ? "tutor" : "student";
    const allowed = allowedTransitions[booking.status]?.[userType] || [];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Cannot change status from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { status };
    
    // Add tutor message if provided (for approval/rejection notes)
    if (tutorMessage) {
      updateData.tutorMessage = tutorMessage;
    }

    // If approving (REQUESTED -> PENDING), set approvedAt
    if ((booking.status as string) === "REQUESTED" && status === "PENDING") {
      updateData.approvedAt = new Date();
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            email: true,
            firstName: true,
          },
        },
        tutorProfile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Send email notifications based on status change
    try {
      if ((booking.status as string) === "REQUESTED" && status === "PENDING") {
        // Booking approved - notify student to pay
        const paymentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bookings/${booking.id}`;
        await emailService.sendBookingApprovedEmail(
          updatedBooking.student.email,
          updatedBooking.student.firstName,
          `${updatedBooking.tutorProfile.user.firstName} ${updatedBooking.tutorProfile.user.lastName}`,
          updatedBooking.subject,
          new Date(updatedBooking.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          `${new Date(updatedBooking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(updatedBooking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
          paymentUrl
        );
      }
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
    }

    // Generate appropriate message
    let message = `Booking ${status.toLowerCase()}`;
    if ((booking.status as string) === "REQUESTED" && status === "PENDING") {
      message = "Booking approved! Student has been notified to complete payment.";
    } else if (status === "REJECTED") {
      message = "Booking request declined.";
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
