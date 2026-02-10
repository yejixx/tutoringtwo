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
      <div className="bg-white -mx-4 px-4 py-6 sm:-mx-8 sm:px-8 border-b border-slate-200 -mt-8 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.firstName}!</h1>
        <p className="text-slate-500 mt-1">
          Manage your bookings and find new tutors
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tutors">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full bg-white">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Find Tutors</h3>
                <p className="text-sm text-slate-500">Browse available tutors</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bookings">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full bg-white">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">My Bookings</h3>
                <p className="text-sm text-slate-500">{bookings.length} total sessions</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-0 shadow-sm h-full bg-white">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Learning</h3>
              <p className="text-sm text-slate-500">
                {upcomingBookings.length} upcoming session(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Sessions</CardTitle>
            <CardDescription className="text-slate-500">Your scheduled tutoring sessions</CardDescription>
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
              <p className="text-slate-500 mb-4">
                Find a tutor and book your first session
              </p>
              <Link href="/tutors">
                <Button>Find a Tutor</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
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
                      <h4 className="font-medium text-slate-900">
                        {booking.tutorProfile.user.firstName} {booking.tutorProfile.user.lastName}
                      </h4>
                      <p className="text-sm text-slate-500">{booking.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(booking.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(booking.status) as any}>
                      {booking.status}
                    </Badge>
                    <p className="text-sm font-medium text-slate-700 mt-1">
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
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Sessions</CardTitle>
            <CardDescription className="text-slate-500">Sessions you&apos;ve completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
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
                      <h4 className="font-medium text-slate-900">
                        {booking.tutorProfile.user.firstName} {booking.tutorProfile.user.lastName}
                      </h4>
                      <p className="text-sm text-slate-500">{booking.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {booking.status === "COMPLETED" && !booking.review ? (
                      <Link href={`/bookings/${booking.id}/review`}>
                        <Button size="sm" variant="outline" className="bg-white">
                          <Star className="h-4 w-4 mr-1" />
                          Leave Review
                        </Button>
                      </Link>
                    ) : booking.review ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Reviewed</Badge>
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
