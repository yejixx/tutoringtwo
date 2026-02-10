"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Star,
  Search,
  MessageSquare,
  CheckCircle,
  XCircle
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
  tutorProfile?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  review: { id: string } | null;
}

export default function BookingsPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchBookings();
    } else if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/bookings");
    }
  }, [authStatus]);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      const data = await response.json();
      if (response.ok) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, status: "PENDING" | "REJECTED") => {
    setProcessingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        fetchBookings(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update booking");
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert("Failed to update booking");
    } finally {
      setProcessingId(null);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return <PageLoader />;
  }

  const isTutor = session?.user?.role === "TUTOR";

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") {
      return (b.status === "CONFIRMED" || b.status === "PENDING") && new Date(b.startTime) > new Date();
    }
    return b.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
      REQUESTED: "outline",
      PENDING: "secondary",
      CONFIRMED: "success",
      IN_PROGRESS: "default",
      AWAITING_REVIEW: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
      REJECTED: "destructive",
    };
    const labels: Record<string, string> = {
      REQUESTED: "Awaiting Approval",
      PENDING: "Awaiting Payment",
      CONFIRMED: "Paid - Scheduled",
      IN_PROGRESS: "In Progress",
      AWAITING_REVIEW: "Awaiting Completion",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      REJECTED: "Rejected",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const filters = isTutor ? [
    { value: "all", label: "All" },
    { value: "REQUESTED", label: "Pending Approval" },
    { value: "upcoming", label: "Upcoming" },
    { value: "PENDING", label: "Awaiting Payment" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ] : [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "REQUESTED", label: "Pending Approval" },
    { value: "PENDING", label: "Awaiting Payment" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
                <p className="text-slate-500">
                  {isTutor ? "Manage your tutoring sessions" : "View and manage your tutoring sessions"}
                </p>
              </div>
            </div>
            {!isTutor && (
              <Link href="/tutors">
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Find Tutors
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className={filter === f.value ? "" : "bg-white"}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="py-12 text-center">
              <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">No bookings found</h3>
              <p className="text-slate-500 mb-4">
                {filter === "all"
                  ? isTutor
                    ? "You don't have any bookings yet"
                    : "You haven't booked any sessions yet"
                  : `No ${filter.toLowerCase()} bookings`}
              </p>
              {!isTutor && (
                <Link href="/tutors">
                  <Button>Find a Tutor</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const otherPerson = isTutor
                ? booking.student
                : booking.tutorProfile?.user;
              const otherPersonName = otherPerson
                ? `${otherPerson.firstName} ${otherPerson.lastName}`
                : "Unknown";
              const isPast = new Date(booking.startTime) < new Date();
              const canReview = !isTutor && booking.status === "COMPLETED" && !booking.review;

              return (
                <Card key={booking.id} className="border-0 shadow-sm bg-white">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={otherPerson?.avatarUrl}
                          fallback={
                            otherPerson
                              ? getInitials(otherPerson.firstName, otherPerson.lastName)
                              : "?"
                          }
                          size="lg"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">{otherPersonName}</h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-slate-600">{booking.subject}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(booking.startTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.round(
                                (new Date(booking.endTime).getTime() -
                                  new Date(booking.startTime).getTime()) /
                                  (1000 * 60 * 60)
                              )}{" "}
                              hour(s)
                            </span>
                          </div>
                          {booking.notes && (
                            <p className="text-sm mt-2 flex items-start gap-1">
                              <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                              <span className="text-slate-500 line-clamp-2">
                                {booking.notes}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-lg font-semibold text-slate-900">
                          {formatCurrency(booking.price)}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 justify-end">
                          {/* Tutor: Accept/Reject buttons for REQUESTED bookings */}
                          {isTutor && booking.status === "REQUESTED" && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleBookingAction(booking.id, "PENDING")}
                                disabled={processingId === booking.id}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {processingId === booking.id ? "Processing..." : "Accept"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleBookingAction(booking.id, "REJECTED")}
                                disabled={processingId === booking.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {/* View details link for all bookings */}
                          <Link href={`/bookings/${booking.id}`}>
                            <Button size="sm" variant="outline" className="bg-white">
                              View Details
                            </Button>
                          </Link>
                          
                          {canReview && (
                            <Link href={`/bookings/${booking.id}/review`}>
                              <Button size="sm" variant="outline" className="bg-white">
                                <Star className="h-4 w-4 mr-1" />
                                Leave Review
                              </Button>
                            </Link>
                          )}
                          {booking.review && !isTutor && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Reviewed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
