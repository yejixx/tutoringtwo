import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createVerificationToken, getVerificationUrl } from "@/lib/email-verification";
import { emailService } from "@/lib/email";
import { auth } from "@/lib/auth";

// Rate limiting for resend attempts
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_RESEND_ATTEMPTS = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to resend verification" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check rate limiting
    const attempts = resendAttempts.get(userId);
    const now = Date.now();

    if (attempts) {
      if (now - attempts.lastAttempt < RESEND_WINDOW_MS) {
        if (attempts.count >= MAX_RESEND_ATTEMPTS) {
          return NextResponse.json(
            { success: false, error: "Too many resend attempts. Please try again later." },
            { status: 429 }
          );
        }
        attempts.count++;
      } else {
        resendAttempts.set(userId, { count: 1, lastAttempt: now });
      }
    } else {
      resendAttempts.set(userId, { count: 1, lastAttempt: now });
    }

    // Check if already verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if ((user as any).emailVerified) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Create new verification token
    const verificationToken = await createVerificationToken(userId, "email_verification");
    const verificationUrl = getVerificationUrl(verificationToken.token, "email_verification");

    // Send email
    await emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationUrl
    );

    return NextResponse.json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
