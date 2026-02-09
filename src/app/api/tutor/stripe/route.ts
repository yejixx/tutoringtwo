import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  createConnectAccount, 
  createAccountLink, 
  getAccountStatus,
  createLoginLink 
} from "@/lib/stripe";

// GET: Check Stripe Connect status
export async function GET() {
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

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    if (!tutorProfile.stripeAccountId) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          accountId: null,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
        },
      });
    }

    // Get account status from Stripe
    const status = await getAccountStatus(tutorProfile.stripeAccountId);

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        accountId: tutorProfile.stripeAccountId,
        ...status,
      },
    });
  } catch (error) {
    console.error("Get Stripe status error:", error);
    return NextResponse.json(
      { error: "Failed to get Stripe status" },
      { status: 500 }
    );
  }
}

// POST: Create or get Stripe Connect onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Only tutors can connect Stripe accounts" },
        { status: 403 }
      );
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!tutorProfile) {
      return NextResponse.json(
        { error: "Tutor profile not found. Please complete your profile first." },
        { status: 404 }
      );
    }

    let stripeAccountId = tutorProfile.stripeAccountId;

    // Create a new Stripe Connect account if none exists
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        userId: session.user.id,
      });

      stripeAccountId = account.id;

      // Save the account ID to the tutor profile
      await prisma.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: { stripeAccountId },
      });
    }

    // Create an account link for onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await createAccountLink(
      stripeAccountId,
      `${appUrl}/tutor/stripe?refresh=true`,
      `${appUrl}/tutor/stripe?success=true`
    );

    return NextResponse.json({
      success: true,
      data: {
        url: accountLink.url,
        accountId: stripeAccountId,
      },
    });
  } catch (error) {
    console.error("Create Stripe Connect account error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account" },
      { status: 500 }
    );
  }
}
