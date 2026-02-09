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
  MessageSquare
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
      PENDING: "secondary",
      CONFIRMED: "success",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filters = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "Upcoming" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {isTutor ? "Manage your tutoring sessions" : "View and manage your tutoring sessions"}
          </p>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
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
              <Card key={booking.id}>
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{otherPersonName}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-muted-foreground">{booking.subject}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground line-clamp-2">
                              {booking.notes}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-lg font-semibold">
                        {formatCurrency(booking.price)}
                      </p>
                      
                      <div className="flex gap-2">
                        {canReview && (
                          <Link href={`/bookings/${booking.id}/review`}>
                            <Button size="sm" variant="outline">
                              <Star className="h-4 w-4 mr-1" />
                              Leave Review
                            </Button>
                          </Link>
                        )}
                        {booking.review && !isTutor && (
                          <Badge variant="outline" className="text-green-600">
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
  );
}
