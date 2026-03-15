import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withCache, cacheKeys, cacheTTL } from "@/lib/cache";
import { isValidId } from "@/lib/sanitize";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID format to prevent unnecessary DB queries
    if (!id || !isValidId(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid tutor ID" },
        { status: 400 }
      );
    }

    const cacheKey = cacheKeys.tutorProfile(id);

    const result = await withCache(
      cacheKey,
      async () => {
        const tutorProfile = await prisma.tutorProfile.findUnique({
          where: { id },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
            availabilitySlots: {
              orderBy: [
                { dayOfWeek: "asc" },
                { startTime: "asc" },
              ],
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                isRecurring: true,
              },
            },
            qualifications: {
              orderBy: [
                { year: "desc" },
                { createdAt: "desc" },
              ],
              select: {
                id: true,
                type: true,
                subject: true,
                institution: true,
                grade: true,
                year: true,
                verified: true,
              },
            },
            bookings: {
              where: {
                review: {
                  isNot: null,
                },
              },
              include: {
                review: {
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
              },
              orderBy: {
                createdAt: "desc",
              },
              take: 10,
            },
          },
        });

        return tutorProfile;
      },
      cacheTTL.LONG,   // 5 minute cache
      cacheTTL.MEDIUM  // Stale after 2 minutes
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Extract reviews from bookings
    const reviews = result.bookings
      .filter((b: { review: unknown }) => b.review)
      .map((b: { review: unknown }) => b.review);

    const response = NextResponse.json({
      success: true,
      data: {
        ...result,
        reviews,
      },
    });

    // Set cache headers for CDN/browser caching
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );

    return response;
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tutor" },
      { status: 500 }
    );
  }
}
