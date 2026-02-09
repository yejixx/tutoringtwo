"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle, X, Plus } from "lucide-react";
import { SUBJECTS } from "@/lib/utils";

export default function TutorOnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    headline: "",
    bio: "",
    hourlyRate: "",
    subjects: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [customSubject, setCustomSubject] = useState("");

  // Fetch existing profile data if available
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/tutor/profile");
        const data = await response.json();

        if (data.success && data.data) {
          // If profile is already complete, redirect to edit page
          if (data.data.profileComplete) {
            router.push("/tutor/profile/edit");
            return;
          }
          
          // Pre-populate with existing data
          setFormData({
            headline: data.data.headline || "",
            bio: data.data.bio || "",
            hourlyRate: data.data.hourlyRate ? String(data.data.hourlyRate) : "",
            subjects: data.data.subjects || [],
          });
        }
      } catch (err) {
        // Profile might not exist yet, that's okay
      } finally {
        setIsFetching(false);
      }
    }

    if (status === "authenticated" && session?.user?.role === "TUTOR") {
      fetchProfile();
    } else if (status !== "loading") {
      setIsFetching(false);
    }
  }, [status, session, router]);

  if (status === "loading" || isFetching) {
    return <PageLoader />;
  }

  if (status === "unauthenticated" || session?.user?.role !== "TUTOR") {
    router.push("/");
    return null;
  }

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !formData.subjects.includes(customSubject.trim())) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, customSubject.trim()],
      }));
      setCustomSubject("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tutor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: formData.headline,
          bio: formData.bio,
          hourlyRate: parseFloat(formData.hourlyRate),
          subjects: formData.subjects,
          profileComplete: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save profile");
        setIsLoading(false);
        return;
      }

      router.push("/tutor/availability");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const isStep1Valid = formData.headline.length >= 10 && formData.bio.length >= 50;
  const isStep2Valid = formData.subjects.length > 0 && parseFloat(formData.hourlyRate) > 0;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground">
          Let students know about your expertise and teaching style
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 2 && (
              <div
                className={`w-20 h-1 mx-2 ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 ? "Tell us about yourself" : "Set your subjects & rate"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Write a compelling bio that showcases your expertise"
              : "Choose the subjects you teach and set your hourly rate"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional Headline</Label>
                  <Input
                    id="headline"
                    placeholder="e.g., Experienced Math Tutor with 10+ Years"
                    value={formData.headline}
                    onChange={(e) =>
                      setFormData({ ...formData, headline: e.target.value })
                    }
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.headline.length}/100 characters (min 10)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About You</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell students about your background, teaching experience, and what makes you a great tutor..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    required
                    rows={6}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.bio.length}/2000 characters (min 50)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Subjects You Teach</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select all subjects you&apos;re qualified to teach
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((subject) => (
                      <Badge
                        key={subject}
                        variant={
                          formData.subjects.includes(subject)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() => handleSubjectToggle(subject)}
                      >
                        {subject}
                        {formData.subjects.includes(subject) && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>

                  {/* Custom subjects */}
                  {formData.subjects.filter((s) => !SUBJECTS.includes(s as typeof SUBJECTS[number])).length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-2">Custom subjects:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.subjects
                          .filter((s) => !SUBJECTS.includes(s as typeof SUBJECTS[number]))
                          .map((subject) => (
                            <Badge
                              key={subject}
                              variant="default"
                              className="cursor-pointer"
                              onClick={() => handleSubjectToggle(subject)}
                            >
                              {subject}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Add custom subject */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add a custom subject..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSubject();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddCustomSubject}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.subjects.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {formData.subjects.length} subject(s)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="50"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: e.target.value })
                      }
                      required
                      min="1"
                      max="500"
                      step="1"
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set a competitive rate. Average tutors charge $30-80/hour.
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={!isStep2Valid || isLoading}>
                    {isLoading ? <Spinner size="sm" /> : "Complete Setup"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
