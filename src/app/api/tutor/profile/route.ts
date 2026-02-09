import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch current tutor's profile
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, error: "Only tutors can access this endpoint" },
        { status: 403 }
      );
    }

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        availabilitySlots: true,
        qualifications: {
          orderBy: [
            { year: "desc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update tutor profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json(
        { success: false, error: "Only tutors can update their profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      headline, 
      bio, 
      hourlyRate, 
      subjects, 
      profileComplete,
      linkedinUrl,
      websiteUrl,
      location,
      languages,
      teachingStyle,
      experience,
    } = body;

    // Validate input
    if (bio !== undefined && bio.length < 50) {
      return NextResponse.json(
        { success: false, error: "Bio must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (hourlyRate !== undefined && (hourlyRate < 1 || hourlyRate > 500)) {
      return NextResponse.json(
        { success: false, error: "Hourly rate must be between $1 and $500" },
        { status: 400 }
      );
    }

    if (subjects !== undefined && (!Array.isArray(subjects) || subjects.length === 0)) {
      return NextResponse.json(
        { success: false, error: "At least one subject is required" },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL if provided
    if (linkedinUrl !== undefined && linkedinUrl !== "" && linkedinUrl !== null) {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/i;
      if (!linkedinRegex.test(linkedinUrl)) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid LinkedIn profile URL" },
          { status: 400 }
        );
      }
    }

    // Validate website URL if provided
    if (websiteUrl !== undefined && websiteUrl !== "" && websiteUrl !== null) {
      try {
        new URL(websiteUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: "Please enter a valid website URL" },
          { status: 400 }
        );
      }
    }

    const updatedProfile = await prisma.tutorProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(headline !== undefined && { headline }),
        ...(bio !== undefined && { bio }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(subjects !== undefined && { subjects }),
        ...(profileComplete !== undefined && { profileComplete }),
        ...(linkedinUrl !== undefined && { linkedinUrl: linkedinUrl || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
        ...(location !== undefined && { location: location || null }),
        ...(languages !== undefined && { languages }),
        ...(teachingStyle !== undefined && { teachingStyle: teachingStyle || null }),
        ...(experience !== undefined && { experience: experience || null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating tutor profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
