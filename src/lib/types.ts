// Type definitions for the Tutor Marketplace

export type UserRole = "STUDENT" | "TUTOR" | "ADMIN";

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser extends Omit<User, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

// Tutor Profile types
export interface TutorProfile {
  id: string;
  userId: string;
  bio: string;
  headline: string | null;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  verified: boolean;
  profileComplete: boolean;
  stripeAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorProfileWithUser extends TutorProfile {
  user: User;
}

export interface TutorCardData {
  id: string;
  userId: string;
  bio: string;
  headline: string | null;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  verified: boolean;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

// Availability types
export interface AvailabilitySlot {
  id: string;
  tutorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  createdAt: Date;
}

export interface AvailabilitySlotInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
}

// Booking types
export interface Booking {
  id: string;
  studentId: string;
  tutorProfileId: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  price: number;
  platformFee: number;
  tutorEarnings: number;
  notes: string | null;
  stripePaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingWithDetails extends Booking {
  student: User;
  tutorProfile: TutorProfileWithUser;
  review: Review | null;
}

export interface CreateBookingInput {
  tutorProfileId: string;
  subject: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Review types
export interface Review {
  id: string;
  bookingId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface ReviewWithUser extends Review {
  user: User;
}

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment?: string;
}

// Search & Filter types
export interface TutorSearchParams {
  subject?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth types
export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Earnings types
export interface EarningsSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedSessions: number;
  upcomingSessions: number;
  monthlyEarnings: {
    month: string;
    amount: number;
  }[];
}
