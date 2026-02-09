"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { 
  Edit, 
  ExternalLink, 
  Star, 
  CheckCircle,
  MapPin,
  Linkedin,
  Globe,
  GraduationCap,
  Languages,
  AlertCircle
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

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
  rating: number;
  totalReviews: number;
  verified: boolean;
  profileComplete: boolean;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  location?: string | null;
  languages: string[];
  teachingStyle?: string | null;
  experience?: string | null;
  qualifications: Qualification[];
}

export default function TutorProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<TutorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/tutor/profile");
        const data = await response.json();

        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error || "Failed to load profile");
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

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Complete Your Profile</h2>
            <p className="text-muted-foreground mb-4">
              You haven&apos;t set up your tutor profile yet.
            </p>
            <Link href="/tutor/onboarding">
              <Button>Get Started</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your Tutor Profile</h1>
          <p className="text-muted-foreground">
            This is how students see your profile
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tutors/${profile.id}`} target="_blank">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Profile
            </Button>
          </Link>
          <Link href="/tutor/profile/edit">
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {!profile.profileComplete && (
        <div className="flex items-center gap-2 p-4 text-sm text-amber-700 bg-amber-50 rounded-md mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Your profile is incomplete. Complete your profile to appear in tutor search results.
          <Link href="/tutor/onboarding" className="font-medium underline ml-1">
            Complete now
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar
                src={user?.avatarUrl}
                fallback={getInitials(user?.firstName || "", user?.lastName || "")}
                size="xl"
                className="w-24 h-24"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  {profile.verified && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                {profile.headline && (
                  <p className="text-muted-foreground mt-1">{profile.headline}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {profile.rating > 0 ? profile.rating.toFixed(1) : "New"}
                    </span>
                    {profile.totalReviews > 0 && (
                      <span className="text-muted-foreground">
                        ({profile.totalReviews} reviews)
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-primary">
                    {formatCurrency(profile.hourlyRate)}/hr
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{profile.bio || "No bio added yet."}</p>
          </CardContent>
        </Card>

        {/* Languages & Links */}
        {(profile.languages?.length > 0 || profile.linkedinUrl || profile.websiteUrl) && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.languages && profile.languages.length > 0 && (
                <div className="flex items-start gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {profile.languages.map((lang) => (
                      <Badge key={lang} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                {profile.linkedinUrl && (
                  <a 
                    href={profile.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile
                  </a>
                )}
                {profile.websiteUrl && (
                  <a 
                    href={profile.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teaching Style */}
        {profile.teachingStyle && (
          <Card>
            <CardHeader>
              <CardTitle>Teaching Style</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{profile.teachingStyle}</p>
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {profile.experience && (
          <Card>
            <CardHeader>
              <CardTitle>Teaching Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{profile.experience}</p>
            </CardContent>
          </Card>
        )}

        {/* Qualifications */}
        {profile.qualifications && profile.qualifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.qualifications.map((qual) => (
                  <div key={qual.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {qual.type === "A_LEVEL" ? "A-Level" : 
                         qual.type === "BACHELORS" ? "Bachelor's" :
                         qual.type === "MASTERS" ? "Master's" :
                         qual.type === "PHD" ? "PhD" :
                         qual.type}
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
                      {qual.year && `${qual.year}`}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
