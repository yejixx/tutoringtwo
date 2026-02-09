import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import type { UserRole } from "@/lib/types";
import { validateEmail } from "@/lib/validation";

// Rate limiting for login attempts (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(email: string): { allowed: boolean; message?: string; remainingAttempts?: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const attempts = loginAttempts.get(key);

  if (!attempts) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Check if account is locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - now) / 60000);
    return { 
      allowed: false, 
      message: `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
    };
  }

  // Reset if outside window or lock has expired
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW_MS || (attempts.lockedUntil && now >= attempts.lockedUntil)) {
    loginAttempts.set(key, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Check if max attempts exceeded
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION_MS;
    return { 
      allowed: false, 
      message: "Too many failed login attempts. Account temporarily locked for 15 minutes."
    };
  }

  // Increment attempt count
  attempts.count++;
  attempts.lastAttempt = now;
  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.count };
}

function resetLoginAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      avatarUrl: string | null;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl: string | null;
    emailVerified: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl: string | null;
    emailVerified: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Validate email format first
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          throw new Error("Please enter a valid email address");
        }

        // Check rate limiting
        const rateLimit = checkLoginRateLimit(email);
        if (!rateLimit.allowed) {
          throw new Error(rateLimit.message || "Too many login attempts. Please try again later.");
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Use constant-time comparison to prevent timing attacks
        // Even if user doesn't exist, we still hash to keep timing consistent
        if (!user) {
          // Hash a dummy password to prevent timing attacks
          await bcrypt.compare(password, "$2a$12$dummy.hash.for.timing.attack.prevention");
          throw new Error("Invalid email or password");
        }

        // Check if user has a password (not OAuth-only user)
        if (!user.passwordHash) {
          throw new Error("Please sign in with Google");
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        // Successful login - reset rate limit counter
        resetLoginAttempts(email);

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl,
          emailVerified: !!(user as { emailVerified?: Date }).emailVerified,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google" && profile) {
        const googleProfile = profile as { email: string; given_name?: string; family_name?: string; picture?: string; email_verified?: boolean };
        
        try {
          // Check if user exists with accounts relation
          const existingUser = await (prisma as any).user.findUnique({
            where: { email: googleProfile.email },
            include: { accounts: true },
          });

          if (!existingUser) {
            // Create new user from Google profile
            const newUser = await (prisma as any).user.create({
              data: {
                email: googleProfile.email,
                firstName: googleProfile.given_name || "User",
                lastName: googleProfile.family_name || "",
                avatarUrl: googleProfile.picture,
                emailVerified: googleProfile.email_verified ? new Date() : null,
                role: "STUDENT",
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                  },
                },
              },
              include: { accounts: true },
            });

            user.id = newUser.id;
            user.firstName = newUser.firstName;
            user.lastName = newUser.lastName;
            user.role = newUser.role as UserRole;
            user.avatarUrl = newUser.avatarUrl;
            user.emailVerified = !!newUser.emailVerified;
          } else {
            // Check if this Google account is linked
            const linkedAccount = existingUser.accounts?.find(
              (acc: { provider: string; providerAccountId: string }) => 
                acc.provider === "google" && acc.providerAccountId === account.providerAccountId
            );

            if (!linkedAccount) {
              // Link Google account to existing user
              await (prisma as any).account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }

            // Update email verified status if not already verified
            if (!existingUser.emailVerified && googleProfile.email_verified) {
              await (prisma as any).user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() },
              });
            }

            user.id = existingUser.id;
            user.firstName = existingUser.firstName;
            user.lastName = existingUser.lastName;
            user.role = existingUser.role as UserRole;
            user.avatarUrl = existingUser.avatarUrl;
            user.emailVerified = !!existingUser.emailVerified;
          }

          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
        token.emailVerified = !!user.emailVerified;
      }

      // Handle session update (e.g., after email verification)
      if (trigger === "update" && session) {
        token.emailVerified = session.emailVerified ?? token.emailVerified;
        token.role = session.role ?? token.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.avatarUrl = token.avatarUrl;
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (reduced from default 30 days for security)
    updateAge: 60 * 60, // Refresh session every hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // JWT expires in 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Security headers and options
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
});
