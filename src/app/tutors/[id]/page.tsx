import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageTutorButton } from "@/components/message-tutor-button";
import { 
  Star, 
  CheckCircle, 
  Calendar, 
  Clock, 
  DollarSign,
  MessageSquare,
  MapPin,
  Linkedin,
  Globe,
  GraduationCap,
  Languages,
  Briefcase
} from "lucide-react";
import { formatCurrency, formatTime, getInitials } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getTutor(id: string) {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
      availabilitySlots: {
        orderBy: [
          { dayOfWeek: "asc" },
          { startTime: "asc" },
        ],
      },
      qualifications: {
        orderBy: [
          { year: "desc" },
          { createdAt: "desc" },
        ],
      },
      bookings: {
        where: {
          review: {
            isNot: null,
          },
        },
        include: {
          review: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  return tutorProfile;
}

export default async function TutorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const tutor = await getTutor(id);

  if (!tutor) {
    notFound();
  }

  const displayName = `${tutor.user.firstName} ${tutor.user.lastName}`;
  const memberSince = new Date(tutor.user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Group availability by day
  type AvailabilitySlot = (typeof tutor.availabilitySlots)[number];
  const availabilityByDay = tutor.availabilitySlots.reduce<Record<string, AvailabilitySlot[]>>((acc: Record<string, AvailabilitySlot[]>, slot: AvailabilitySlot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});

  const dayOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const dayLabels: Record<string, string> = {
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
    SUNDAY: "Sunday",
  };

  type BookingWithReview = (typeof tutor.bookings)[number];
  const reviews = tutor.bookings
    .filter((b: BookingWithReview) => b.review)
    .map((b: BookingWithReview) => b.review!);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Avatar
                  src={tutor.user.avatarUrl}
                  fallback={getInitials(tutor.user.firstName, tutor.user.lastName)}
                  size="xl"
                  className="w-24 h-24"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{displayName}</h1>
                        {tutor.verified && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {tutor.headline && (
                        <p className="text-muted-foreground mt-1">{tutor.headline}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                      </span>
                      {tutor.totalReviews > 0 && (
                        <span className="text-muted-foreground">
                          ({tutor.totalReviews} reviews)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Member since {memberSince}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {tutor.subjects.map((subject: string) => (
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
              <p className="whitespace-pre-wrap">{tutor.bio}</p>
            </CardContent>
          </Card>

          {/* Location & Links */}
          {(tutor.location || tutor.linkedinUrl || tutor.websiteUrl || (tutor.languages && tutor.languages.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tutor.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{tutor.location}</span>
                  </div>
                )}
                
                {tutor.languages && tutor.languages.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Languages className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {tutor.languages.map((lang: string) => (
                        <Badge key={lang} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {tutor.linkedinUrl && (
                    <a 
                      href={tutor.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {tutor.websiteUrl && (
                    <a 
                      href={tutor.websiteUrl} 
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
          {tutor.teachingStyle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Teaching Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{tutor.teachingStyle}</p>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {tutor.experience && (
            <Card>
              <CardHeader>
                <CardTitle>Teaching Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{tutor.experience}</p>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {tutor.qualifications && tutor.qualifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tutor.qualifications.map((qual: { id: string; type: string; subject: string; institution: string; grade?: string | null; year?: number | null; verified: boolean }) => (
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

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews ({tutor.totalReviews})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No reviews yet. Be the first to leave a review!
                </p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review: NonNullable<BookingWithReview["review"]>) => (
                    <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={review.user.avatarUrl}
                          fallback={getInitials(review.user.firstName, review.user.lastName)}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {review.user.firstName} {review.user.lastName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[...Array(5)].map((_, i: number) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <Card className="sticky top-24">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(tutor.hourlyRate)}
                </div>
                <p className="text-muted-foreground text-sm">per hour</p>
              </div>

              <Link href={`/tutors/${tutor.id}/book`}>
                <Button className="w-full" size="lg">
                  Book a Session
                </Button>
              </Link>

              <div className="mt-3">
                <MessageTutorButton 
                  tutorId={tutor.user.id} 
                  tutorName={`${tutor.user.firstName} ${tutor.user.lastName}`}
                />
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Availability
                </h4>
                {Object.keys(availabilityByDay).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No availability set yet
                  </p>
                ) : (
                  <div className="space-y-3 text-sm">
                    {dayOrder.map((day) => {
                      const slots = availabilityByDay[day];
                      if (!slots) return null;
                      return (
                        <div key={day} className="flex justify-between">
                          <span className="font-medium">{dayLabels[day]}</span>
                          <span className="text-muted-foreground">
                            {slots.map((slot: AvailabilitySlot, i: number) => (
                              <span key={slot.id}>
                                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                {i < slots.length - 1 && ", "}
                              </span>
                            ))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
