import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle, MapPin, Clock } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { TutorCardData } from "@/lib/types";

interface TutorCardProps {
  tutor: TutorCardData;
}

export function TutorCard({ tutor }: TutorCardProps) {
  const displayName = `${tutor.user.firstName} ${tutor.user.lastName}`;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        {/* Header with avatar and basic info */}
        <div className="p-6 pb-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar
                src={tutor.user.avatarUrl}
                fallback={getInitials(tutor.user.firstName, tutor.user.lastName)}
                size="xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-slate-900 truncate">
                      {displayName}
                    </h3>
                    {tutor.verified && (
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                  {tutor.headline && (
                    <p className="text-sm text-slate-600 line-clamp-1 mt-0.5">
                      {tutor.headline}
                    </p>
                  )}
                </div>
              </div>

              {/* Rating and price row */}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-900">
                    {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
                  </span>
                  {tutor.totalReviews > 0 && (
                    <span className="text-sm text-slate-500">
                      ({tutor.totalReviews})
                    </span>
                  )}
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <span className="font-semibold text-primary">
                  {formatCurrency(tutor.hourlyRate)}/hr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {tutor.subjects.slice(0, 4).map((subject) => (
              <Badge 
                key={subject} 
                variant="secondary" 
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
              >
                {subject}
              </Badge>
            ))}
            {tutor.subjects.length > 4 && (
              <Badge variant="outline" className="text-slate-500 font-medium">
                +{tutor.subjects.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Bio Preview */}
        <div className="px-6 pb-4">
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {tutor.bio}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <Link href={`/tutors/${tutor.id}`} className="flex-1">
            <Button variant="outline" className="w-full font-medium">
              View Profile
            </Button>
          </Link>
          <Link href={`/tutors/${tutor.id}/book`} className="flex-1">
            <Button className="w-full font-medium">
              Book Session
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
