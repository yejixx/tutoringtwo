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

  const handleBookingAction = async (bookingId: string, status: "PENDING" | "REJECTED") => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh bookings to get accurate state
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  };

  // REQUESTED = awaiting tutor approval, PENDING = awaiting student payment
  const requestedBookings = bookings.filter((b) => b.status === "REQUESTED");
  const pendingPaymentBookings = bookings.filter((b) => b.status === "PENDING");
  const upcomingBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.startTime) > new Date()
  );
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");

  const totalEarnings = completedBookings.reduce((sum, b) => sum + b.tutorEarnings, 0);

  if (!profile?.profileComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-6">
          <Settings className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Complete Your Profile</h1>
        <p className="text-slate-500 mb-8">
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
      <div className="bg-white -mx-4 px-4 py-6 sm:-mx-8 sm:px-8 border-b border-slate-200 -mt-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.firstName}!</h1>
            <p className="text-slate-500 mt-1">
              Manage your bookings and track your earnings
            </p>
          </div>
          <Link href="/tutor/availability">
            <Button variant="outline" className="bg-white">
              <Settings className="h-4 w-4 mr-2" />
              Manage Availability
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Earnings</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Upcoming</p>
                <p className="text-2xl font-bold text-slate-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending Approval</p>
                <p className="text-2xl font-bold text-slate-900">{requestedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests - REQUESTED status (awaiting tutor approval) */}
      {requestedBookings.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Approval ({requestedBookings.length})
            </CardTitle>
            <CardDescription className="text-slate-500">
              Review and respond to booking requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requestedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={booking.student.avatarUrl}
                      fallback={getInitials(booking.student.firstName, booking.student.lastName)}
                      size="md"
                    />
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {booking.student.firstName} {booking.student.lastName}
                      </h4>
                      <p className="text-sm text-slate-500">{booking.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 mr-4">
                      {formatCurrency(booking.tutorEarnings)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-white"
                      onClick={() => handleBookingAction(booking.id, "REJECTED")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBookingAction(booking.id, "PENDING")}
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
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Sessions</CardTitle>
            <CardDescription className="text-slate-500">Your confirmed tutoring sessions</CardDescription>
          </div>
          <Link href="/bookings">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
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
              <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No upcoming sessions</h3>
              <p className="text-slate-500">
                Students will be able to book sessions once you set your availability
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={booking.student.avatarUrl}
                      fallback={getInitials(booking.student.firstName, booking.student.lastName)}
                      size="md"
                    />
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {booking.student.firstName} {booking.student.lastName}
                      </h4>
                      <p className="text-sm text-slate-500">{booking.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" className="bg-green-100 text-green-700 border-0">Confirmed</Badge>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
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
