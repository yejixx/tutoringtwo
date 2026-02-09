import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

// Platform fee percentage (15%)
export const PLATFORM_FEE_PERCENTAGE = 15;

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));
}

export function calculateTutorPayout(amount: number): number {
  return amount - calculatePlatformFee(amount);
}

// Convert dollars to cents for Stripe
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars
export function centsToDollars(cents: number): number {
  return cents / 100;
}

export interface CreateCheckoutSessionParams {
  bookingId: string;
  tutorName: string;
  subject: string;
  startTime: Date;
  amount: number; // in dollars
  customerEmail: string;
  tutorStripeAccountId?: string | null;
}

export async function createCheckoutSession({
  bookingId,
  tutorName,
  subject,
  startTime,
  amount,
  customerEmail,
  tutorStripeAccountId,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const amountInCents = dollarsToCents(amount);
  const platformFeeInCents = dollarsToCents(calculatePlatformFee(amount));

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tutoring Session: ${subject}`,
            description: `Session with ${tutorName} on ${startTime.toLocaleDateString()}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}?cancelled=true`,
  };

  // If tutor has connected Stripe account, use Stripe Connect
  if (tutorStripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeInCents,
      transfer_data: {
        destination: tutorStripeAccountId,
      },
    };
  }

  return stripe.checkout.sessions.create(sessionParams);
}

export interface CreateConnectAccountParams {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
}

export async function createConnectAccount({
  email,
  firstName,
  lastName,
  userId,
}: CreateConnectAccountParams): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: "express",
    country: "US",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    individual: {
      first_name: firstName,
      last_name: lastName,
      email,
    },
    metadata: {
      userId,
    },
  });
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function getAccountStatus(
  accountId: string
): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean }> {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  };
}

export async function createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
  return stripe.accounts.createLoginLink(accountId);
}
