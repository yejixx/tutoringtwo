import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TutorSearchParams } from "@/lib/types";
import { withCache, cacheKeys, cacheTTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: TutorSearchParams = {
      subject: searchParams.get("subject") || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
    };

    const { subject, minPrice, maxPrice, minRating, search, page = 1, limit = 12 } = params;

    // Clamp limit to prevent abuse
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    // Build where clause
    const where: any = {
      profileComplete: true,
    };

    if (subject) {
      where.subjects = {
        has: subject,
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.hourlyRate = {};
      if (minPrice !== undefined) where.hourlyRate.gte = minPrice;
      if (maxPrice !== undefined) where.hourlyRate.lte = maxPrice;
    }

    if (minRating !== undefined) {
      where.rating = {
        gte: minRating,
      };
    }

    if (search) {
      where.OR = [
        {
          bio: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          headline: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    // Create a stable cache key from the query parameters
    const cacheKey = cacheKeys.tutorsList(
      JSON.stringify({ where, skip, take: safeLimit })
    );

    const result = await withCache(
      cacheKey,
      async () => {
        // Get tutors with pagination - use select for only needed fields
        const [tutors, total] = await Promise.all([
          prisma.tutorProfile.findMany({
            where,
            select: {
              id: true,
              userId: true,
              bio: true,
              headline: true,
              subjects: true,
              hourlyRate: true,
              rating: true,
              totalReviews: true,
              verified: true,
              profileComplete: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: [
              { verified: "desc" },
              { rating: "desc" },
              { totalReviews: "desc" },
            ],
            skip,
            take: safeLimit,
          }),
          prisma.tutorProfile.count({ where }),
        ]);

        return { tutors, total };
      },
      cacheTTL.MEDIUM, // 2 minute cache
      cacheTTL.SHORT   // Stale after 30s (will serve stale + revalidate)
    );

    const response = NextResponse.json({
      success: true,
      data: {
        tutors: result.tutors,
        total: result.total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(result.total / safeLimit),
      },
    });

    // Set cache headers for CDN/browser caching
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );

    return response;
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tutors" },
      { status: 500 }
    );
  }
}
