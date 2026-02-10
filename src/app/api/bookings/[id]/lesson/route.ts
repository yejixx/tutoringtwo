import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { releaseEscrowPayment } from "@/lib/stripe";
import { rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bookings/[id]/lesson - Manage lesson state
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 10 lesson actions per minute per user
    const rateLimitResult = rateLimiters.standard(`lesson:${session.user.id}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const { id: bookingId } = await params;
    const userId = session.user.id;
    const userRole = session.user.role;
    const body = await request.json();
    const { action, meetingLink, meetingNotes } = body;

    // Fetch the booking with tutor profile
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutorProfile: {
          include: {
            user: true,
          },
        },
        student: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify user is part of this booking
    const isStudent = booking.studentId === userId;
    const isTutor = booking.tutorProfile.userId === userId;

    if (!isStudent && !isTutor) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to manage this lesson" },
        { status: 403 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "add_meeting_link":
        // Only tutor can add meeting link
        if (!isTutor) {
          return NextResponse.json(
            { success: false, error: "Only tutors can add meeting links" },
            { status: 403 }
          );
        }

        if (!meetingLink) {
          return NextResponse.json(
            { success: false, error: "Meeting link is required" },
            { status: 400 }
          );
        }

        // Validate URL format
        try {
          new URL(meetingLink);
        } catch {
          return NextResponse.json(
            { success: false, error: "Please enter a valid URL" },
            { status: 400 }
          );
        }

        updateData = { meetingLink };
        break;

      case "confirm_start":
        // Verify booking is in CONFIRMED status (paid)
        if (booking.status !== "CONFIRMED") {
          return NextResponse.json(
            { success: false, error: "Lesson can only be started after payment is confirmed" },
            { status: 400 }
          );
        }

        if (isTutor) {
          updateData.tutorConfirmedStart = true;
        } else {
          updateData.studentConfirmedStart = true;
        }

        // If both confirmed, update status to IN_PROGRESS
        const willBothConfirmStart = 
          (isTutor && booking.studentConfirmedStart) || 
          (isStudent && booking.tutorConfirmedStart);

        if (willBothConfirmStart) {
          updateData.status = "IN_PROGRESS";
          updateData.lessonStartedAt = new Date();
        }
        break;

      case "confirm_end":
        // Verify booking is in progress
        if (booking.status !== "IN_PROGRESS") {
          return NextResponse.json(
            { success: false, error: "Lesson must be in progress to confirm completion" },
            { status: 400 }
          );
        }

        if (isTutor) {
          updateData.tutorConfirmedEnd = true;
        } else {
          updateData.studentConfirmedEnd = true;
        }

        // Add meeting notes if provided
        if (meetingNotes) {
          updateData.meetingNotes = meetingNotes;
        }

        // If both confirmed, update status to AWAITING_REVIEW
        const willBothConfirmEnd = 
          (isTutor && booking.studentConfirmedEnd) || 
          (isStudent && booking.tutorConfirmedEnd);

        if (willBothConfirmEnd) {
          updateData.status = "AWAITING_REVIEW";
          updateData.lessonEndedAt = new Date();
        }
        break;

      case "verify_complete":
        // Can only verify if in AWAITING_REVIEW status
        if (booking.status !== "AWAITING_REVIEW") {
          return NextResponse.json(
            { success: false, error: "Lesson must be awaiting review to verify completion" },
            { status: 400 }
          );
        }

        // Release payment to tutor
        if (booking.stripePaymentId && booking.tutorProfile.stripeAccountId) {
          try {
            const transfer = await releaseEscrowPayment(
              booking.stripePaymentId,
              booking.tutorProfile.stripeAccountId,
              booking.price
            );

            updateData.stripeTransferId = transfer.id;
          } catch (error) {
            console.error("Failed to release payment:", error);
            return NextResponse.json(
              { success: false, error: "Failed to release payment to tutor" },
              { status: 500 }
            );
          }
        }

        updateData.status = "COMPLETED";
        updateData.completedAt = new Date();
        updateData.paymentHeldInEscrow = false;
        break;

      case "cancel":
        // Can only cancel if not yet completed
        if (booking.status === "COMPLETED") {
          return NextResponse.json(
            { success: false, error: "Cannot cancel a completed lesson" },
            { status: 400 }
          );
        }

        // Only allow cancellation before lesson starts or by platform
        if (booking.status === "IN_PROGRESS") {
          return NextResponse.json(
            { success: false, error: "Cannot cancel a lesson in progress. Please contact support." },
            { status: 400 }
          );
        }

        updateData.status = "CANCELLED";

        // If payment was made, process refund
        if (booking.paidAt && booking.stripePaymentId) {
          const { refundEscrowPayment } = await import("@/lib/stripe");
          try {
            await refundEscrowPayment(booking.stripePaymentId, "Lesson cancelled");
          } catch (error) {
            console.error("Failed to refund payment:", error);
            // Continue with cancellation even if refund fails
          }
        }
        break;

      case "dispute":
        // Can only dispute if lesson was in progress or completed
        if (!["IN_PROGRESS", "AWAITING_REVIEW", "COMPLETED"].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: "Cannot dispute at this stage" },
            { status: 400 }
          );
        }

        updateData.status = "DISPUTED";
        // TODO: Create dispute record and notify admin
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
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
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBooking,
      message: getSuccessMessage(action),
    });
  } catch (error) {
    console.error("Error managing lesson:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

function getSuccessMessage(action: string): string {
  switch (action) {
    case "add_meeting_link":
      return "Meeting link added successfully";
    case "confirm_start":
      return "Lesson start confirmed";
    case "confirm_end":
      return "Lesson completion confirmed";
    case "verify_complete":
      return "Lesson verified as complete. Payment released to tutor.";
    case "cancel":
      return "Lesson cancelled";
    case "dispute":
      return "Dispute filed. Our team will review and contact you.";
    default:
      return "Action completed";
  }
}
