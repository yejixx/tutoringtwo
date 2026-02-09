"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner, PageLoader } from "@/components/ui/spinner";
import { AlertCircle, Plus, Trash2, Clock } from "lucide-react";
import { formatTime, DAYS_OF_WEEK } from "@/lib/utils";
import type { AvailabilitySlot, DayOfWeek } from "@/lib/types";

const dayLabels: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const dayOptions = DAYS_OF_WEEK.map((day) => ({
  value: day,
  label: dayLabels[day],
}));

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const time = `${hour.toString().padStart(2, "0")}:${minute}`;
  return { value: time, label: formatTime(time) };
});

export default function TutorAvailabilityPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [newSlot, setNewSlot] = useState({
    dayOfWeek: "MONDAY" as DayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "TUTOR") {
      fetchAvailability();
    }
  }, [status, session]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch("/api/tutor/availability");
      const data = await response.json();

      if (response.ok) {
        setSlots(data.data);
      } else {
        setError(data.error || "Failed to fetch availability");
      }
    } catch (err) {
      setError("Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/tutor/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlot),
      });

      const data = await response.json();

      if (response.ok) {
        setSlots([...slots, data.data]);
        // Reset form
        setNewSlot({
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "17:00",
        });
      } else {
        setError(data.error || "Failed to add slot");
      }
    } catch (err) {
      setError("Failed to add availability slot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const response = await fetch(`/api/tutor/availability?id=${slotId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSlots(slots.filter((s) => s.id !== slotId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to remove slot");
      }
    } catch (err) {
      setError("Failed to remove availability slot");
    }
  };

  if (status === "loading" || isLoading) {
    return <PageLoader />;
  }

  if (status === "unauthenticated" || session?.user?.role !== "TUTOR") {
    router.push("/");
    return null;
  }

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = slots.filter((s) => s.dayOfWeek === day);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Availability</h1>
        <p className="text-muted-foreground">
          Set your weekly availability for tutoring sessions
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-destructive hover:text-destructive/80"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Add New Slot */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Availability
            </CardTitle>
            <CardDescription>
              Add a new time slot when you&apos;re available to tutor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                options={dayOptions}
                value={newSlot.dayOfWeek}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, dayOfWeek: e.target.value as DayOfWeek })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  options={timeOptions}
                  value={newSlot.startTime}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, startTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  options={timeOptions}
                  value={newSlot.endTime}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleAddSlot}
              className="w-full"
              disabled={isSaving || newSlot.startTime >= newSlot.endTime}
            >
              {isSaving ? <Spinner size="sm" /> : "Add Time Slot"}
            </Button>
          </CardContent>
        </Card>

        {/* Current Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Schedule
            </CardTitle>
            <CardDescription>
              Your current weekly availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No availability set yet. Add your first time slot!
              </p>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const daySlots = slotsByDay[day];
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day} className="border-b pb-3 last:border-0">
                      <h4 className="font-medium mb-2">{dayLabels[day]}</h4>
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                          >
                            <span className="text-sm">
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={() => router.push("/dashboard")}>
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}
