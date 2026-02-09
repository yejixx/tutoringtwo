"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner, PageLoader } from "@/components/ui/spinner";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { formatCurrency, formatTime, getInitials } from "@/lib/utils";
import type { TutorProfileWithUser, AvailabilitySlot } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface TutorData extends TutorProfileWithUser {
  availabilitySlots: AvailabilitySlot[];
}

export default function BookTutorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [bookingData, setBookingData] = useState({
    subject: "",
    date: "",
    startTime: "",
    duration: "1",
    notes: "",
  });

  useEffect(() => {
    fetchTutor();
  }, [id]);

  const fetchTutor = async () => {
    try {
      const response = await fetch(`/api/tutors/${id}`);
      const data = await response.json();

      if (response.ok) {
        setTutor(data.data);
        if (data.data.subjects.length > 0) {
          setBookingData((prev) => ({
            ...prev,
            subject: data.data.subjects[0],
          }));
        }
      } else {
        setError(data.error || "Failed to load tutor");
      }
    } catch (err) {
      setError("Failed to load tutor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!session?.user) {
      router.push(`/login?callbackUrl=/tutors/${id}/book`);
      return;
    }

    try {
      // Calculate start and end times
      const startDateTime = new Date(`${bookingData.date}T${bookingData.startTime}:00`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + parseInt(bookingData.duration));

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorProfileId: id,
          subject: bookingData.subject,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: bookingData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to booking detail page where user can pay
        router.push(`/bookings/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create booking");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Failed to create booking");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!tutor) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Tutor Not Found</h1>
        <Link href="/tutors">
          <Button>Browse Tutors</Button>
        </Link>
      </div>
    );
  }

  const displayName = `${tutor.user.firstName} ${tutor.user.lastName}`;

  // Get today's date for min date
  const today = new Date().toISOString().split("T")[0];

  // Get available times for selected date
  const selectedDay = bookingData.date
    ? new Date(bookingData.date).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    : null;

  const availableSlotsForDay = tutor.availabilitySlots.filter(
    (slot) => slot.dayOfWeek === selectedDay
  );

  // Generate time options based on availability
  const timeOptions = availableSlotsForDay.flatMap((slot) => {
    const options = [];
    let [hours, minutes] = slot.startTime.split(":").map(Number);
    const [endHours, endMinutes] = slot.endTime.split(":").map(Number);
    const endTime = endHours * 60 + endMinutes;

    while (hours * 60 + minutes < endTime - 30) {
      const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      options.push({
        value: time,
        label: formatTime(time),
      });
      minutes += 30;
      if (minutes >= 60) {
        hours += 1;
        minutes = 0;
      }
    }
    return options;
  });

  const durationOptions = [
    { value: "1", label: "1 hour" },
    { value: "1.5", label: "1.5 hours" },
    { value: "2", label: "2 hours" },
    { value: "3", label: "3 hours" },
  ];

  const subjectOptions = tutor.subjects.map((s) => ({
    value: s,
    label: s,
  }));

  // Calculate price
  const totalPrice = tutor.hourlyRate * parseFloat(bookingData.duration || "1");

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/tutors/${id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to profile
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>
                Schedule a tutoring session with {displayName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {authStatus !== "authenticated" && (
                <div className="flex items-center gap-2 p-3 text-sm bg-muted rounded-md mb-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    You need to{" "}
                    <Link href={`/login?callbackUrl=/tutors/${id}/book`} className="text-primary underline">
                      sign in
                    </Link>{" "}
                    to book a session
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    id="subject"
                    options={subjectOptions}
                    value={bookingData.subject}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, subject: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <input
                    type="date"
                    id="date"
                    min={today}
                    value={bookingData.date}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, date: e.target.value, startTime: "" })
                    }
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                {bookingData.date && (
                  <>
                    {availableSlotsForDay.length === 0 ? (
                      <div className="p-3 text-sm bg-muted rounded-md">
                        No availability on this day. Please select another date.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Select
                            id="startTime"
                            options={timeOptions}
                            value={bookingData.startTime}
                            onChange={(e) =>
                              setBookingData({ ...bookingData, startTime: e.target.value })
                            }
                            placeholder="Select a time"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration</Label>
                          <Select
                            id="duration"
                            options={durationOptions}
                            value={bookingData.duration}
                            onChange={(e) =>
                              setBookingData({ ...bookingData, duration: e.target.value })
                            }
                            required
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Share any details about what you'd like to learn..."
                    value={bookingData.notes}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    isSubmitting ||
                    !bookingData.date ||
                    !bookingData.startTime ||
                    availableSlotsForDay.length === 0 ||
                    authStatus !== "authenticated"
                  }
                >
                  {isSubmitting ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      Continue to Payment - {formatCurrency(totalPrice)}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tutor Summary */}
        <div>
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar
                  src={tutor.user.avatarUrl}
                  fallback={getInitials(tutor.user.firstName, tutor.user.lastName)}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold">{displayName}</h3>
                    {tutor.verified && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>
                      {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                    </span>
                    {tutor.totalReviews > 0 && (
                      <span>({tutor.totalReviews})</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">{formatCurrency(tutor.hourlyRate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{bookingData.duration} hour(s)</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2 text-sm">Session Subjects</h4>
                <div className="flex flex-wrap gap-1">
                  {tutor.subjects.slice(0, 5).map((subject) => (
                    <Badge key={subject} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
