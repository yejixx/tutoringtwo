import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { TutorCardData } from "@/lib/types";

interface TutorCardProps {
  tutor: TutorCardData;
}

export function TutorCard({ tutor }: TutorCardProps) {
  const displayName = `${tutor.user.firstName} ${tutor.user.lastName}`;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
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
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                  {tutor.verified && (
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
                {tutor.headline && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {tutor.headline}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(tutor.hourlyRate)}
                </p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}
              </span>
              {tutor.totalReviews > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({tutor.totalReviews} {tutor.totalReviews === 1 ? "review" : "reviews"})
                </span>
              )}
            </div>

            {/* Subjects */}
            <div className="flex flex-wrap gap-1 mt-3">
              {tutor.subjects.slice(0, 4).map((subject) => (
                <Badge key={subject} variant="secondary" className="text-xs">
                  {subject}
                </Badge>
              ))}
              {tutor.subjects.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{tutor.subjects.length - 4} more
                </Badge>
              )}
            </div>

            {/* Bio Preview */}
            <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
              {tutor.bio}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Link href={`/tutors/${tutor.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Profile
            </Button>
          </Link>
          <Link href={`/tutors/${tutor.id}/book`} className="flex-1">
            <Button className="w-full">Book Session</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
