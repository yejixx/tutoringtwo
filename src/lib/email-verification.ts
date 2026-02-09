import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate a secure verification token
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create an email verification token for a user
 */
export async function createVerificationToken(userId: string, type: "email_verification" | "password_reset" = "email_verification") {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Delete any existing tokens of this type for the user
  await (prisma as any).verificationToken.deleteMany({
    where: {
      userId,
      type,
    },
  });

  // Create new token
  const verificationToken = await (prisma as any).verificationToken.create({
    data: {
      userId,
      token,
      type,
      expiresAt,
    },
  });

  return verificationToken;
}

/**
 * Verify a token and return the associated user
 */
export async function verifyToken(token: string, type: "email_verification" | "password_reset" = "email_verification") {
  const verificationToken = await (prisma as any).verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return { success: false, error: "Invalid verification link" };
  }

  if (verificationToken.type !== type) {
    return { success: false, error: "Invalid token type" };
  }

  if (verificationToken.expiresAt < new Date()) {
    // Delete expired token
    await (prisma as any).verificationToken.delete({
      where: { id: verificationToken.id },
    });
    return { success: false, error: "Verification link has expired" };
  }

  return { success: true, user: verificationToken.user, tokenId: verificationToken.id };
}

/**
 * Mark user's email as verified and delete the token
 */
export async function markEmailVerified(userId: string, tokenId: string) {
  await Promise.all([
    (prisma as any).user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    }),
    (prisma as any).verificationToken.delete({
      where: { id: tokenId },
    }),
  ]);
}

/**
 * Generate verification URL
 */
export function getVerificationUrl(token: string, type: "email_verification" | "password_reset" = "email_verification") {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  if (type === "email_verification") {
    return `${baseUrl}/verify-email?token=${token}`;
  }
  
  return `${baseUrl}/reset-password?token=${token}`;
}
