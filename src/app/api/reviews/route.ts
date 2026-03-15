import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";
import { isValidId, sanitizeString } from "@/lib/sanitize";
import { cache } from "@/lib/cache";

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

    // Rate limit: 3 reviews per minute
    const rateLimitResult = rateLimiters.strict(`review:${session.user.id}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
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

    // Validate booking ID format
    if (!isValidId(bookingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Sanitize comment
    const sanitizedComment = comment ? sanitizeString(comment).slice(0, 2000) : null;

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
        comment: sanitizedComment,
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

    // Invalidate tutor caches so updated rating shows immediately
    cache.invalidatePrefix("tutors:");

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
