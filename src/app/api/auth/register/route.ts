import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { SignUpInput } from "@/lib/types";
import { 
  validatePassword, 
  validateEmail, 
  validateName, 
  sanitizeInput 
} from "@/lib/validation";
import { createVerificationToken, getVerificationUrl } from "@/lib/email-verification";
import { emailService } from "@/lib/email";

// Rate limiting map (in production, use Redis or similar)
const registrationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = registrationAttempts.get(ip);
  
  if (!attempts) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Reset if outside window
  if (now - attempts.lastAttempt > WINDOW_MS) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  
  // Check if exceeded
  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  // Increment
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Too many registration attempts. Please try again in 15 minutes." 
        },
        { status: 429 }
      );
    }

    const body: SignUpInput = await request.json();
    const { email, password, firstName, lastName, role } = body;

    // Validate all required fields are present
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);

    // Validate email
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { success: false, error: emailValidation.error },
        { status: 400 }
      );
    }

    // Validate first name
    const firstNameValidation = validateName(sanitizedFirstName, "First name");
    if (!firstNameValidation.isValid) {
      return NextResponse.json(
        { success: false, error: firstNameValidation.error },
        { status: 400 }
      );
    }

    // Validate last name
    const lastNameValidation = validateName(sanitizedLastName, "Last name");
    if (!lastNameValidation.isValid) {
      return NextResponse.json(
        { success: false, error: lastNameValidation.error },
        { status: 400 }
      );
    }

    // Validate password with comprehensive checks
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: passwordValidation.errors[0], // Return first error
          errors: passwordValidation.errors, // Return all errors for detailed feedback
          passwordStrength: passwordValidation.strength
        },
        { status: 400 }
      );
    }

    // Validate role
    if (!["STUDENT", "TUTOR"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role selected" },
        { status: 400 }
      );
    }

    // Check if email already exists (use timing-safe comparison indirectly)
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      // Avoid timing attacks by not immediately returning
      // Hash a dummy password to keep timing consistent
      await bcrypt.hash("dummy-password-for-timing", 12);
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with strong cost factor (12 rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with sanitized data
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        role,
      },
    });

    // If tutor, create empty tutor profile
    if (role === "TUTOR") {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          bio: "",
          subjects: [],
          hourlyRate: 0,
          profileComplete: false,
        },
      });
    }

    // Create verification token and send email
    try {
      const verificationToken = await createVerificationToken(user.id, "email_verification");
      const verificationUrl = getVerificationUrl(verificationToken.token, "email_verification");
      
      await emailService.sendVerificationEmail(
        user.email,
        user.firstName,
        verificationUrl
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails - user can request resend
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: false,
        },
        message: "Account created successfully. Please check your email to verify your account.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create account" },
      { status: 500 }
    );
  }
}
