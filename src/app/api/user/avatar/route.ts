import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    return NextResponse.json({
      success: true,
      data: { avatarUrl: user?.avatarUrl || null },
    });
  } catch (error) {
    console.error("Get avatar error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get avatar" },
      { status: 500 }
    );
  }
}
