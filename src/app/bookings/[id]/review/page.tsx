"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Spinner, PageLoader } from "@/components/ui/spinner";
import { AlertCircle, Star, ArrowLeft, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface BookingData {
  id: string;
  subject: string;
  startTime: string;
  price: number;
  status: string;
  tutorProfile: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
  review: { id: string } | null;
}

export default function ReviewPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { status: authStatus } = useSession();

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchBooking();
    } else if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/bookings/${id}/review`);
    }
  }, [id, authStatus]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${id}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.data);
        if (data.data.review) {
          setError("This booking has already been reviewed");
        }
      } else {
        setError(data.error || "Failed to load booking");
      }
    } catch (err) {
      setError("Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: id,
          rating,
          comment: comment || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/bookings");
        }, 2000);
      } else {
        setError(data.error || "Failed to submit review");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Failed to submit review");
      setIsSubmitting(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return <PageLoader />;
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <Link href="/bookings">
          <Button>View Your Bookings</Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
        <p className="text-muted-foreground mb-4">
          Your review has been submitted successfully.
        </p>
        <Link href="/bookings">
          <Button>Back to Bookings</Button>
        </Link>
      </div>
    );
  }

  const tutorName = `${booking.tutorProfile.user.firstName} ${booking.tutorProfile.user.lastName}`;

  return (
    <div className="container max-w-xl mx-auto px-4 py-8">
      <Link
        href="/bookings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to bookings
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Leave a Review</CardTitle>
          <CardDescription>
            Share your experience with {tutorName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Session Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-6">
            <Avatar
              src={booking.tutorProfile.user.avatarUrl}
              fallback={getInitials(
                booking.tutorProfile.user.firstName,
                booking.tutorProfile.user.lastName
              )}
              size="lg"
            />
            <div>
              <h3 className="font-semibold">{tutorName}</h3>
              <p className="text-sm text-muted-foreground">{booking.subject}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(booking.startTime)} • {formatCurrency(booking.price)}
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {booking.status !== "COMPLETED" ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                You can only review completed sessions.
              </p>
            </div>
          ) : booking.review ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                You have already reviewed this session.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {rating === 0
                    ? "Select a rating"
                    : rating === 1
                    ? "Poor"
                    : rating === 2
                    ? "Fair"
                    : rating === 3
                    ? "Good"
                    : rating === 4
                    ? "Very Good"
                    : "Excellent"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment">Your Review (optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Share details about your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  {comment.length}/1000 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? <Spinner size="sm" /> : "Submit Review"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
