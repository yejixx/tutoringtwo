"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TutorCard } from "@/components/tutor/tutor-card";
import { TutorFilters, FilterState } from "@/components/tutor/tutor-filters";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { TutorCardData } from "@/lib/types";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

function TutorsList() {
  const searchParams = useSearchParams();
  const [tutors, setTutors] = useState<TutorCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams(searchParams.toString());
      const response = await fetch(`/api/tutors?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tutors");
      }

      setTutors(data.data.tutors);
      setPagination({
        page: data.data.page,
        totalPages: data.data.totalPages,
        total: data.data.total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleFilter = (filters: FilterState) => {
    // Filters are applied via URL, so fetchTutors will be called via useEffect
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    window.history.pushState({}, "", `/tutors?${params.toString()}`);
    fetchTutors();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find a Tutor</h1>
        <p className="text-muted-foreground">
          Browse our verified tutors and find the perfect match for your learning needs
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-72 shrink-0">
          <TutorFilters onFilter={handleFilter} />
        </aside>

        {/* Results */}
        <main className="flex-1">
          {isLoading ? (
            <PageLoader />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchTutors}>Try Again</Button>
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No tutors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {tutors.length} of {pagination.total} tutors
              </div>

              {/* Tutor Grid */}
              <div className="grid gap-4">
                {tutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function TutorsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TutorsList />
    </Suspense>
  );
}
