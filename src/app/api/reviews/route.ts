import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Create a review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, rating, comment } = body;

    // Validate input
    if (!bookingId || !rating) {
      return NextResponse.json(
        { success: false, error: "Booking ID and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutorProfile: true,
        review: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify the user is the student who made the booking
    if (booking.studentId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the student can review this booking" },
        { status: 403 }
      );
    }

    // Check if booking is completed
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Can only review completed bookings" },
        { status: 400 }
      );
    }

    // Check if already reviewed
    if (booking.review) {
      return NextResponse.json(
        { success: false, error: "This booking has already been reviewed" },
        { status: 400 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        userId: session.user.id,
        rating,
        comment: comment || null,
      },
    });

    // Update tutor's average rating
    const tutorReviews = await prisma.review.findMany({
      where: {
        booking: {
          tutorProfileId: booking.tutorProfileId,
        },
      },
    });

    const totalRating = tutorReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
    const avgRating = totalRating / tutorReviews.length;

    await prisma.tutorProfile.update({
      where: { id: booking.tutorProfileId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: tutorReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 }
    );
  }
}
