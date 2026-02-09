import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (!tutorProfile) {
      return NextResponse.json(
        { success: false, error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Extract reviews from bookings
    const reviews = tutorProfile.bookings
      .filter((b: { review: unknown }) => b.review)
      .map((b: { review: unknown }) => b.review);

    return NextResponse.json({
      success: true,
      data: {
        ...tutorProfile,
        reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching tutor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tutor" },
      { status: 500 }
    );
  }
}
