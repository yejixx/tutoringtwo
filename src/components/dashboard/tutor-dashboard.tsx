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
  DollarSign, 
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  Settings
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

interface TutorDashboardProps {
  user: User;
}

interface ProfileData {
  id: string;
  profileComplete: boolean;
  rating: number;
  totalReviews: number;
  hourlyRate: number;
}

interface BookingData {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  tutorEarnings: number;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function TutorDashboard({ user }: TutorDashboardProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        fetch("/api/tutor/profile"),
        fetch("/api/bookings"),
      ]);

      const profileData = await profileRes.json();
      const bookingsData = await bookingsRes.json();

      if (profileRes.ok) {
        setProfile(profileData.data);
      }
      if (bookingsRes.ok) {
        setBookings(bookingsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setBookings(
          bookings.map((b) =>
            b.id === bookingId ? { ...b, status } : b
          )
        );
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING");
  const upcomingBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.startTime) > new Date()
  );
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.tutorEarnings, 0);

  if (!profile?.profileComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Complete Your Profile</h1>
        <p className="text-muted-foreground mb-8">
          Before you can start tutoring, you need to complete your profile setup.
        </p>
        <Link href="/tutor/onboarding">
          <Button size="lg">Complete Profile Setup</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.firstName}!</h1>
          <p className="text-muted-foreground mt-1">
            Manage your bookings and track your earnings
          </p>
        </div>
        <Link href="/tutor/availability">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Availability
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Requests ({pendingBookings.length})
            </CardTitle>
            <CardDescription>
              Review and respond to booking requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={booking.student.avatarUrl}
                      fallback={getInitials(booking.student.firstName, booking.student.lastName)}
                      size="md"
                    />
                    <div>
                      <h4 className="font-medium">
                        {booking.student.firstName} {booking.student.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{booking.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium mr-4">
                      {formatCurrency(booking.tutorEarnings)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleBookingAction(booking.id, "CANCELLED")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBookingAction(booking.id, "CONFIRMED")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your confirmed tutoring sessions</CardDescription>
          </div>
          <Link href="/tutor/bookings">
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
              <p className="text-muted-foreground">
                Students will be able to book sessions once you set your availability
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={booking.student.avatarUrl}
                      fallback={getInitials(booking.student.firstName, booking.student.lastName)}
                      size="md"
                    />
                    <div>
                      <h4 className="font-medium">
                        {booking.student.firstName} {booking.student.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">{booking.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Confirmed</Badge>
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(booking.tutorEarnings)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
