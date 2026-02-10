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
  MessageSquare,
  MapPin,
  Linkedin,
  Globe,
  GraduationCap,
  Languages,
  Briefcase,
  ArrowLeft,
  Users,
  Award
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
    MONDAY: "Mon",
    TUESDAY: "Tue",
    WEDNESDAY: "Wed",
    THURSDAY: "Thu",
    FRIDAY: "Fri",
    SATURDAY: "Sat",
    SUNDAY: "Sun",
  };

  type BookingWithReview = (typeof tutor.bookings)[number];
  const reviews = tutor.bookings
    .filter((b: BookingWithReview) => b.review)
    .map((b: BookingWithReview) => b.review!);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/tutors"
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tutors
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar
              src={tutor.user.avatarUrl}
              fallback={getInitials(tutor.user.firstName, tutor.user.lastName)}
              size="2xl"
              className="ring-4 ring-white shadow-lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                {tutor.verified && (
                  <Badge className="bg-blue-100 text-blue-700 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              {tutor.headline && (
                <p className="text-slate-600 mt-1 text-lg">{tutor.headline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">
                    {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                  </span>
                  {tutor.totalReviews > 0 && (
                    <span>({tutor.totalReviews} reviews)</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Joined {memberSince}
                </div>
                {tutor.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {tutor.location}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {tutor.subjects.map((subject: string) => (
                  <Badge key={subject} variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-400" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{tutor.bio}</p>
              </CardContent>
            </Card>

            {/* Teaching Style */}
            {tutor.teachingStyle && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                    Teaching Approach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{tutor.teachingStyle}</p>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {tutor.experience && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-slate-400" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{tutor.experience}</p>
                </CardContent>
              </Card>
            )}

            {/* Qualifications */}
            {tutor.qualifications && tutor.qualifications.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-slate-400" />
                    Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tutor.qualifications.map((qual: { id: string; type: string; subject: string; institution: string; grade?: string | null; year?: number | null; verified: boolean }) => (
                      <div key={qual.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-slate-900">{qual.subject}</p>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                              {qual.type === "A_LEVEL" ? "A-Level" : 
                               qual.type === "BACHELORS" ? "Bachelor's" :
                               qual.type === "MASTERS" ? "Master's" :
                               qual.type === "PHD" ? "PhD" :
                               qual.type}
                            </Badge>
                            {qual.verified && (
                              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{qual.institution}</p>
                          {(qual.grade || qual.year) && (
                            <p className="text-sm text-slate-400">
                              {qual.grade && `Grade: ${qual.grade}`}
                              {qual.grade && qual.year && " • "}
                              {qual.year && `${qual.year}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            {(tutor.linkedinUrl || tutor.websiteUrl || (tutor.languages && tutor.languages.length > 0)) && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-slate-400" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tutor.languages && tutor.languages.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Languages className="h-5 w-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Languages</p>
                        <div className="flex flex-wrap gap-2">
                          {tutor.languages.map((lang: string) => (
                            <Badge key={lang} variant="outline" className="text-slate-600">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {(tutor.linkedinUrl || tutor.websiteUrl) && (
                    <div className="flex gap-4 pt-2">
                      {tutor.linkedinUrl && (
                        <a 
                          href={tutor.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {tutor.websiteUrl && (
                        <a 
                          href={tutor.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-slate-400" />
                  Reviews
                  {tutor.totalReviews > 0 && (
                    <span className="text-sm font-normal text-slate-400">({tutor.totalReviews})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto mb-3">
                      <MessageSquare className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review: NonNullable<BookingWithReview["review"]>) => (
                      <div key={review.id} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar
                            src={review.user.avatarUrl}
                            fallback={getInitials(review.user.firstName, review.user.lastName)}
                            size="md"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-medium text-slate-900">
                                {review.user.firstName} {review.user.lastName}
                              </span>
                              <span className="text-sm text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-1">
                              {[...Array(5)].map((_, i: number) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <p className="mt-2 text-slate-600 text-sm leading-relaxed">{review.comment}</p>
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
            <Card className="border-0 shadow-sm sticky top-24">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-slate-900">
                    {formatCurrency(tutor.hourlyRate)}
                  </div>
                  <p className="text-slate-500 text-sm">per hour</p>
                </div>

                <Link href={`/tutors/${tutor.id}/book`}>
                  <Button className="w-full font-medium" size="lg">
                    Book a Session
                  </Button>
                </Link>

                <div className="mt-3">
                  <MessageTutorButton 
                    tutorId={tutor.user.id} 
                    tutorName={`${tutor.user.firstName} ${tutor.user.lastName}`}
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Weekly Availability
                  </h4>
                  {Object.keys(availabilityByDay).length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No availability set yet
                    </p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {dayOrder.map((day) => {
                        const slots = availabilityByDay[day];
                        if (!slots) return null;
                        return (
                          <div key={day} className="flex justify-between py-1.5 border-b border-slate-50 last:border-0">
                            <span className="font-medium text-slate-700">{dayLabels[day]}</span>
                            <span className="text-slate-500">
                              {slots.map((slot: AvailabilitySlot, i: number) => (
                                <span key={slot.id}>
                                  {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
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
    </div>
  );
}
