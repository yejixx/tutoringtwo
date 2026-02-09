import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AvailabilitySlotInput } from "@/lib/types";

// GET - Fetch tutor's availability slots
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
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: { tutorId: profile.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

// POST - Add new availability slot
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
        { success: false, error: "Only tutors can manage availability" },
        { status: 403 }
      );
    }

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const body: AvailabilitySlotInput = await request.json();
    const { dayOfWeek, startTime, endTime, isRecurring = true } = body;

    // Validate input
    if (!dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Day, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, error: "Invalid time format. Use HH:mm" },
        { status: 400 }
      );
    }

    // Validate end time is after start time
    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for overlapping slots
    const existingSlots = await prisma.availabilitySlot.findMany({
      where: {
        tutorId: profile.id,
        dayOfWeek,
      },
    });

    const hasOverlap = existingSlots.some((slot: { startTime: string; endTime: string }) => {
      return (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      );
    });

    if (hasOverlap) {
      return NextResponse.json(
        { success: false, error: "This time slot overlaps with an existing slot" },
        { status: 400 }
      );
    }

    const newSlot = await prisma.availabilitySlot.create({
      data: {
        tutorId: profile.id,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
      },
    });

    return NextResponse.json({
      success: true,
      data: newSlot,
      message: "Availability slot added",
    });
  } catch (error) {
    console.error("Error adding availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add availability" },
      { status: 500 }
    );
  }
}

// DELETE - Remove availability slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("id");

    if (!slotId) {
      return NextResponse.json(
        { success: false, error: "Slot ID is required" },
        { status: 400 }
      );
    }

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify the slot belongs to this tutor
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: slotId,
        tutorId: profile.id,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "Slot not found" },
        { status: 404 }
      );
    }

    await prisma.availabilitySlot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({
      success: true,
      message: "Availability slot removed",
    });
  } catch (error) {
    console.error("Error removing availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove availability" },
      { status: 500 }
    );
  }
}
