import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Fetch the booking with tutor details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        tutorProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user is the student who made the booking
    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only pay for your own bookings" },
        { status: 403 }
      );
    }

    // Check if booking is in a payable state (must be approved by tutor)
    if (booking.status !== "PENDING") {
      let errorMessage = "This booking is not in a payable state";
      if ((booking.status as string) === "REQUESTED") {
        errorMessage = "This booking is awaiting tutor approval. You can pay once the tutor accepts your request.";
      } else if ((booking.status as string) === "REJECTED") {
        errorMessage = "This booking request was declined by the tutor.";
      } else if (booking.status === "CONFIRMED") {
        errorMessage = "This booking has already been paid for.";
      } else if (booking.status === "CANCELLED") {
        errorMessage = "This booking has been cancelled.";
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      bookingId: booking.id,
      tutorName: `${booking.tutorProfile.user.firstName} ${booking.tutorProfile.user.lastName}`,
      subject: booking.subject,
      startTime: booking.startTime,
      amount: booking.price,
      customerEmail: booking.student.email,
      tutorStripeAccountId: booking.tutorProfile.stripeAccountId,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
