import { NextRequest, NextResponse } from "next/server";
import { verifyToken, markEmailVerified } from "@/lib/email-verification";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required" },
        { status: 400 }
      );
    }

    // Verify the token
    const result = await verifyToken(token, "email_verification");

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Mark email as verified
    await markEmailVerified(result.user.id, result.tokenId);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now access all features.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
