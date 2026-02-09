import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createLoginLink } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!tutorProfile?.stripeAccountId) {
      return NextResponse.json(
        { error: "No Stripe account connected" },
        { status: 404 }
      );
    }

    const loginLink = await createLoginLink(tutorProfile.stripeAccountId);

    return NextResponse.json({
      success: true,
      data: {
        url: loginLink.url,
      },
    });
  } catch (error) {
    console.error("Create Stripe dashboard link error:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard link" },
      { status: 500 }
    );
  }
}
