"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TutorCard } from "@/components/tutor/tutor-card";
import { TutorFilters, FilterState } from "@/components/tutor/tutor-filters";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { TutorCardData } from "@/lib/types";
import { ChevronLeft, ChevronRight, Users, GraduationCap } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Find a Tutor</h1>
              <p className="text-slate-500">
                Browse verified tutors and find the perfect match for your learning needs
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-80 shrink-0">
            <TutorFilters onFilter={handleFilter} />
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                <PageLoader />
              </div>
            ) : error ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchTutors}>Try Again</Button>
              </div>
            ) : tutors.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">No tutors found</h3>
                <p className="text-slate-500 mb-4">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-slate-500">
                      Showing <span className="font-medium text-slate-700">{tutors.length}</span> of{" "}
                      <span className="font-medium text-slate-700">{pagination.total}</span> tutors
                    </p>
                  </div>
                </div>

                {/* Tutor Grid */}
                <div className="space-y-4">
                  {tutors.map((tutor) => (
                    <TutorCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8 pt-8 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="bg-white"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-9 h-9 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="bg-white"
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
