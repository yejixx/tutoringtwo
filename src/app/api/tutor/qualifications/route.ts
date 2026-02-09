import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch tutor's qualifications
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
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const qualifications = await prisma.qualification.findMany({
      where: { tutorProfileId: profile.id },
      orderBy: [
        { year: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: qualifications,
    });
  } catch (error) {
    console.error("Error fetching qualifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch qualifications" },
      { status: 500 }
    );
  }
}

// POST - Add a new qualification
export async function POST(request: NextRequest) {
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
        { success: false, error: "Only tutors can add qualifications" },
        { status: 403 }
      );
    }

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, subject, institution, grade, year } = body;

    // Validate required fields
    if (!type || !subject || !institution) {
      return NextResponse.json(
        { success: false, error: "Type, subject, and institution are required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["GCSE", "A_LEVEL", "BACHELORS", "MASTERS", "PHD", "DIPLOMA", "CERTIFICATE", "OTHER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid qualification type" },
        { status: 400 }
      );
    }

    // Validate year if provided
    if (year !== undefined && year !== null) {
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid year" },
          { status: 400 }
        );
      }
    }

    const qualification = await prisma.qualification.create({
      data: {
        tutorProfileId: profile.id,
        type,
        subject,
        institution,
        grade: grade || null,
        year: year || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: qualification,
      message: "Qualification added successfully",
    });
  } catch (error) {
    console.error("Error adding qualification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add qualification" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a qualification
export async function DELETE(request: NextRequest) {
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
        { success: false, error: "Only tutors can delete qualifications" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const qualificationId = searchParams.get("id");

    if (!qualificationId) {
      return NextResponse.json(
        { success: false, error: "Qualification ID is required" },
        { status: 400 }
      );
    }

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify the qualification belongs to this tutor
    const qualification = await prisma.qualification.findFirst({
      where: {
        id: qualificationId,
        tutorProfileId: profile.id,
      },
    });

    if (!qualification) {
      return NextResponse.json(
        { success: false, error: "Qualification not found" },
        { status: 404 }
      );
    }

    await prisma.qualification.delete({
      where: { id: qualificationId },
    });

    return NextResponse.json({
      success: true,
      message: "Qualification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting qualification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete qualification" },
      { status: 500 }
    );
  }
}
