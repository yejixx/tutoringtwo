"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageLoader } from "@/components/ui/spinner";
import { 
  Calendar, 
  Clock, 
  ArrowLeft,
  CreditCard,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";

interface BookingData {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  notes: string | null;
  tutorProfile: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  review: { id: string } | null;
}

function BookingDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentSuccess = searchParams.get("success") === "true";
  const paymentCancelled = searchParams.get("cancelled") === "true";

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchBooking();
    } else if (authStatus === "unauthenticated") {
      router.push(`/login?callbackUrl=/bookings/${id}`);
    }
  }, [authStatus, id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setBooking(data.data);
      } else {
        setError(data.error || "Failed to load booking");
      }
    } catch (err) {
      setError("Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await response.json();
      
      if (response.ok && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
        setIsProcessing(false);
      }
    } catch (err) {
      setError("Failed to process payment");
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      
      if (response.ok) {
        fetchBooking();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to cancel booking");
      }
    } catch (err) {
      setError("Failed to cancel booking");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });
      
      if (response.ok) {
        fetchBooking();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to confirm booking");
      }
    } catch (err) {
      setError("Failed to confirm booking");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteBooking = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      
      if (response.ok) {
        fetchBooking();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to complete booking");
      }
    } catch (err) {
      setError("Failed to complete booking");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return <PageLoader />;
  }

  if (error && !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/bookings">
              <Button>Back to Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return <PageLoader />;
  }

  const isTutor = session?.user?.id === booking.tutorProfile.user.id;
  const isStudent = session?.user?.id === booking.student.id;
  const otherPerson = isTutor ? booking.student : booking.tutorProfile.user;
  const otherPersonName = `${otherPerson.firstName} ${otherPerson.lastName}`;
  const isPast = new Date(booking.endTime) < new Date();
  const canPay = isStudent && booking.status === "PENDING";
  const canReview = isStudent && booking.status === "COMPLETED" && !booking.review;
  const canCancel = (isStudent || isTutor) && 
    (booking.status === "PENDING" || booking.status === "CONFIRMED") && !isPast;
  const canConfirm = isTutor && booking.status === "PENDING";
  const canComplete = isTutor && booking.status === "CONFIRMED" && isPast;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
      PENDING: "secondary",
      CONFIRMED: "success",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const duration = Math.round(
    (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link 
        href="/bookings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Bookings
      </Link>

      {paymentSuccess && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Payment successful! Your booking is now confirmed.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentCancelled && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Payment was cancelled. You can try again below.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{booking.subject}</CardTitle>
              <CardDescription>Booking #{booking.id.substring(0, 8)}</CardDescription>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Person Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar
              src={otherPerson.avatarUrl}
              fallback={getInitials(otherPerson.firstName, otherPerson.lastName)}
              size="lg"
            />
            <div>
              <p className="text-sm text-muted-foreground">
                {isTutor ? "Student" : "Tutor"}
              </p>
              <p className="font-semibold text-lg">{otherPersonName}</p>
            </div>
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(booking.startTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{duration} hour(s)</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <p className="text-muted-foreground">{booking.notes}</p>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
            <span className="font-medium">Total Price</span>
            <span className="text-2xl font-bold">{formatCurrency(booking.price)}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {canPay && (
              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {formatCurrency(booking.price)}
                  </>
                )}
              </Button>
            )}

            {canConfirm && (
              <Button 
                onClick={handleConfirmBooking}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? "Processing..." : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            )}

            {canComplete && (
              <Button 
                onClick={handleCompleteBooking}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? "Processing..." : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </>
                )}
              </Button>
            )}

            {canReview && (
              <Link href={`/bookings/${booking.id}/review`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Leave Review
                </Button>
              </Link>
            )}

            {canCancel && (
              <Button 
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  
  return (
    <Suspense fallback={<PageLoader />}>
      <BookingDetailContent id={id} />
    </Suspense>
  );
}
