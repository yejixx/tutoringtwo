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
import { 
  AlertCircle, 
  CheckCircle, 
  X, 
  Plus, 
  Trash2, 
  Linkedin, 
  Globe, 
  MapPin,
  GraduationCap,
  Save,
  Languages
} from "lucide-react";
import { SUBJECTS } from "@/lib/utils";

interface Qualification {
  id: string;
  type: string;
  subject: string;
  institution: string;
  grade?: string | null;
  year?: number | null;
  verified: boolean;
}

interface TutorProfileData {
  id: string;
  headline: string;
  bio: string;
  subjects: string[];
  hourlyRate: number;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  location?: string | null;
  languages: string[];
  teachingStyle?: string | null;
  experience?: string | null;
  qualifications: Qualification[];
}

const QUALIFICATION_TYPES = [
  { value: "GCSE", label: "GCSE" },
  { value: "A_LEVEL", label: "A-Level" },
  { value: "BACHELORS", label: "Bachelor's Degree" },
  { value: "MASTERS", label: "Master's Degree" },
  { value: "PHD", label: "PhD / Doctorate" },
  { value: "DIPLOMA", label: "Diploma" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "OTHER", label: "Other" },
];

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Arabic",
  "Hindi",
  "Portuguese",
  "Italian",
  "Japanese",
  "Korean",
  "Russian",
];

export default function TutorProfileEditPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState<TutorProfileData>({
    id: "",
    headline: "",
    bio: "",
    subjects: [],
    hourlyRate: 0,
    linkedinUrl: "",
    websiteUrl: "",
    location: "",
    languages: [],
    teachingStyle: "",
    experience: "",
    qualifications: [],
  });

  const [customSubject, setCustomSubject] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [showAddQualification, setShowAddQualification] = useState(false);
  const [newQualification, setNewQualification] = useState({
    type: "BACHELORS",
    subject: "",
    institution: "",
    grade: "",
    year: "",
  });
  const [addingQualification, setAddingQualification] = useState(false);

  // Fetch existing profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/tutor/profile");
        const data = await response.json();

        if (data.success) {
          setFormData({
            id: data.data.id,
            headline: data.data.headline || "",
            bio: data.data.bio || "",
            subjects: data.data.subjects || [],
            hourlyRate: data.data.hourlyRate || 0,
            linkedinUrl: data.data.linkedinUrl || "",
            websiteUrl: data.data.websiteUrl || "",
            location: data.data.location || "",
            languages: data.data.languages || [],
            teachingStyle: data.data.teachingStyle || "",
            experience: data.data.experience || "",
            qualifications: data.data.qualifications || [],
          });
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated" && session?.user?.role === "TUTOR") {
      fetchProfile();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading" || loading) {
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

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim() && !formData.languages.includes(customLanguage.trim())) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, customLanguage.trim()],
      }));
      setCustomLanguage("");
    }
  };

  const handleAddQualification = async () => {
    if (!newQualification.subject || !newQualification.institution) {
      setError("Please fill in the subject and institution");
      return;
    }

    setAddingQualification(true);
    setError("");

    try {
      const response = await fetch("/api/tutor/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newQualification.type,
          subject: newQualification.subject,
          institution: newQualification.institution,
          grade: newQualification.grade || null,
          year: newQualification.year ? parseInt(newQualification.year) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          qualifications: [...prev.qualifications, data.data],
        }));
        setNewQualification({
          type: "BACHELORS",
          subject: "",
          institution: "",
          grade: "",
          year: "",
        });
        setShowAddQualification(false);
      } else {
        setError(data.error || "Failed to add qualification");
      }
    } catch (err) {
      setError("Failed to add qualification");
    } finally {
      setAddingQualification(false);
    }
  };

  const handleDeleteQualification = async (id: string) => {
    try {
      const response = await fetch(`/api/tutor/qualifications?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setFormData((prev) => ({
          ...prev,
          qualifications: prev.qualifications.filter((q) => q.id !== id),
        }));
      } else {
        setError(data.error || "Failed to delete qualification");
      }
    } catch (err) {
      setError("Failed to delete qualification");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/tutor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: formData.headline,
          bio: formData.bio,
          hourlyRate: formData.hourlyRate,
          subjects: formData.subjects,
          linkedinUrl: formData.linkedinUrl,
          websiteUrl: formData.websiteUrl,
          location: formData.location,
          languages: formData.languages,
          teachingStyle: formData.teachingStyle,
          experience: formData.experience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save profile");
      } else {
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Your Profile</h1>
        <p className="text-muted-foreground">
          Update your profile information. Changes are saved individually per section.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 text-sm text-green-700 bg-green-50 rounded-md mb-6">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your professional headline and bio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                placeholder="e.g., Experienced Math Tutor with 10+ Years"
                value={formData.headline}
                onChange={(e) =>
                  setFormData({ ...formData, headline: e.target.value })
                }
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.headline.length}/100 characters
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
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/2000 characters (min 50)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })
                    }
                    min="1"
                    max="500"
                    step="1"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., London, UK"
                  value={formData.location || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects You Teach</CardTitle>
            <CardDescription>Select all subjects you're qualified to teach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((subject) => (
                <Badge
                  key={subject}
                  variant={formData.subjects.includes(subject) ? "default" : "outline"}
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

            {/* Custom subjects (not in predefined list) */}
            {formData.subjects.filter((s) => !SUBJECTS.includes(s as any)).length > 0 && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">Custom subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects
                    .filter((s) => !SUBJECTS.includes(s as any))
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
              <p className="text-sm text-muted-foreground">
                Selected: {formData.subjects.length} subject(s)
              </p>
            )}
          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Languages Spoken
            </CardTitle>
            <CardDescription>Languages you can teach in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {COMMON_LANGUAGES.map((language) => (
                <Badge
                  key={language}
                  variant={formData.languages.includes(language) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => handleLanguageToggle(language)}
                >
                  {language}
                  {formData.languages.includes(language) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>

            {/* Custom languages */}
            {formData.languages.filter((l) => !COMMON_LANGUAGES.includes(l)).length > 0 && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-2">Other languages:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.languages
                    .filter((l) => !COMMON_LANGUAGES.includes(l))
                    .map((language) => (
                      <Badge
                        key={language}
                        variant="default"
                        className="cursor-pointer"
                        onClick={() => handleLanguageToggle(language)}
                      >
                        {language}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Add another language..."
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomLanguage();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddCustomLanguage}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social & Professional Links</CardTitle>
            <CardDescription>Add links to your professional profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">
                <Linkedin className="h-4 w-4 inline mr-1" />
                LinkedIn Profile
              </Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, linkedinUrl: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">
                <Globe className="h-4 w-4 inline mr-1" />
                Personal Website
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://yourwebsite.com"
                value={formData.websiteUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, websiteUrl: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Teaching Details */}
        <Card>
          <CardHeader>
            <CardTitle>Teaching Details</CardTitle>
            <CardDescription>Tell students about your teaching approach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teachingStyle">Teaching Style & Methodology</Label>
              <Textarea
                id="teachingStyle"
                placeholder="Describe your teaching approach, methods, and what makes your sessions unique..."
                value={formData.teachingStyle || ""}
                onChange={(e) =>
                  setFormData({ ...formData, teachingStyle: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Teaching Experience</Label>
              <Textarea
                id="experience"
                placeholder="Describe your teaching experience, previous roles, and achievements..."
                value={formData.experience || ""}
                onChange={(e) =>
                  setFormData({ ...formData, experience: e.target.value })
                }
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Qualifications
            </CardTitle>
            <CardDescription>Add your educational background and certifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.qualifications.length > 0 && (
              <div className="space-y-3">
                {formData.qualifications.map((qual) => (
                  <div
                    key={qual.id}
                    className="flex items-start justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {QUALIFICATION_TYPES.find((t) => t.value === qual.type)?.label || qual.type}
                        </Badge>
                        {qual.verified && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium mt-2">{qual.subject}</p>
                      <p className="text-sm text-muted-foreground">{qual.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {qual.grade && `Grade: ${qual.grade}`}
                        {qual.grade && qual.year && " • "}
                        {qual.year && `Year: ${qual.year}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQualification(qual.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showAddQualification ? (
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Add Qualification</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={newQualification.type}
                      onChange={(e) =>
                        setNewQualification({ ...newQualification, type: e.target.value })
                      }
                    >
                      {QUALIFICATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject / Field of Study</Label>
                    <Input
                      placeholder="e.g., Mathematics, Computer Science"
                      value={newQualification.subject}
                      onChange={(e) =>
                        setNewQualification({ ...newQualification, subject: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      placeholder="e.g., University of Oxford"
                      value={newQualification.institution}
                      onChange={(e) =>
                        setNewQualification({ ...newQualification, institution: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Grade (optional)</Label>
                    <Input
                      placeholder="e.g., A*, First Class, 2:1"
                      value={newQualification.grade}
                      onChange={(e) =>
                        setNewQualification({ ...newQualification, grade: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Year Completed (optional)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 2020"
                      value={newQualification.year}
                      onChange={(e) =>
                        setNewQualification({ ...newQualification, year: e.target.value })
                      }
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddQualification(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddQualification}
                    disabled={addingQualification}
                  >
                    {addingQualification ? <Spinner size="sm" /> : "Add Qualification"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddQualification(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Qualification
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
