import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sanitizeString } from "@/lib/sanitize";
import { rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit: 10 profile updates per minute
    const rateLimitResult = rateLimiters.standard(`profile:${session.user.id}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json();
    const { firstName, lastName } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedFirstName = sanitizeString(firstName).slice(0, 50);
    const sanitizedLastName = sanitizeString(lastName).slice(0, 50);

    if (!sanitizedFirstName || sanitizedFirstName.length < 1) {
      return NextResponse.json(
        { error: "Please enter a valid first name" },
        { status: 400 }
      );
    }

    if (!sanitizedLastName || sanitizedLastName.length < 1) {
      return NextResponse.json(
        { error: "Please enter a valid last name" },
        { status: 400 }
      );
    }

    // Update user profile (email is not changeable)
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
