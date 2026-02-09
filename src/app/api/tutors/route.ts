import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TutorSearchParams } from "@/lib/types";

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
    const skip = (page - 1) * limit;

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

    // Get tutors with pagination
    const [tutors, total] = await Promise.all([
      prisma.tutorProfile.findMany({
        where,
        include: {
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
        take: limit,
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tutors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tutors" },
      { status: 500 }
    );
  }
}
