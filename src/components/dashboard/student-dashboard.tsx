"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { 
  Calendar, 
  Clock, 
  Search, 
  BookOpen,
  ArrowRight,
  Star
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
}

interface StudentDashboardProps {
  user: User;
}

interface BookingData {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
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

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const upcomingBookings = bookings.filter(
    (b) => (b.status === "CONFIRMED" || b.status === "PENDING") && new Date(b.startTime) > new Date()
  );

  const pastBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || new Date(b.startTime) <= new Date()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "success";
      case "PENDING":
        return "secondary";
      case "COMPLETED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Manage your bookings and find new tutors
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tutors">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Find Tutors</h3>
                <p className="text-sm text-muted-foreground">Browse available tutors</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bookings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">My Bookings</h3>
                <p className="text-sm text-muted-foreground">{bookings.length} total sessions</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Learning</h3>
              <p className="text-sm text-muted-foreground">
                {upcomingBookings.length} upcoming session(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled tutoring sessions</CardDescription>
          </div>
          <Link href="/bookings">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-4">
                Find a tutor and book your first session
              </p>
              <Link href="/tutors">
                <Button>Find a Tutor</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={booking.tutorProfile.user.avatarUrl}
                      fallback={getInitials(
                        booking.tutorProfile.user.firstName,
                        booking.tutorProfile.user.lastName
                      )}
                      size="md"
                    />
                    <div>
                      <h4 className="font-medium">
                        {booking.tutorProfile.user.firstName} {booking.tutorProfile.user.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{booking.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(booking.status) as any}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(booking.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Sessions you&apos;ve completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={booking.tutorProfile.user.avatarUrl}
                      fallback={getInitials(
                        booking.tutorProfile.user.firstName,
                        booking.tutorProfile.user.lastName
                      )}
                      size="md"
                    />
                    <div>
                      <h4 className="font-medium">
                        {booking.tutorProfile.user.firstName} {booking.tutorProfile.user.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{booking.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {booking.status === "COMPLETED" && !booking.review ? (
                      <Link href={`/bookings/${booking.id}/review`}>
                        <Button size="sm" variant="outline">
                          <Star className="h-4 w-4 mr-1" />
                          Leave Review
                        </Button>
                      </Link>
                    ) : booking.review ? (
                      <Badge variant="outline">Reviewed</Badge>
                    ) : (
                      <Badge variant={getStatusColor(booking.status) as any}>
                        {booking.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
