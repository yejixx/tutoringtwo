"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, SlidersHorizontal, Star, DollarSign, BookOpen } from "lucide-react";
import { SUBJECTS } from "@/lib/utils";

interface TutorFiltersProps {
  onFilter: (filters: FilterState) => void;
}

export interface FilterState {
  subject: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  search: string;
}

export function TutorFilters({ onFilter }: TutorFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    subject: searchParams.get("subject") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minRating: searchParams.get("minRating") || "",
    search: searchParams.get("search") || "",
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    router.push(`/tutors?${params.toString()}`);
    onFilter(filters);
    setShowMobileFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      subject: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      search: "",
    };
    setFilters(clearedFilters);
    router.push("/tutors");
    onFilter(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const subjectOptions = [
    { value: "", label: "All Subjects" },
    ...SUBJECTS.map((s) => ({ value: s, label: s })),
  ];

  const ratingOptions = [
    { value: "", label: "Any Rating" },
    { value: "4.5", label: "4.5+ Stars" },
    { value: "4", label: "4+ Stars" },
    { value: "3.5", label: "3.5+ Stars" },
    { value: "3", label: "3+ Stars" },
  ];

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-3">
        <Label htmlFor="search" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </Label>
        <div className="relative">
          <Input
            id="search"
            placeholder="Name, subject, or keyword..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="bg-white border-slate-200"
          />
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-3">
        <Label htmlFor="subject" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Subject
        </Label>
        <Select
          id="subject"
          options={subjectOptions}
          value={filters.subject}
          onChange={(e) => handleFilterChange("subject", e.target.value)}
          className="bg-white border-slate-200"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Price Range (per hour)
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
            min="0"
            className="bg-white border-slate-200"
          />
          <span className="text-slate-400">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
            min="0"
            className="bg-white border-slate-200"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <Label htmlFor="rating" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Minimum Rating
        </Label>
        <Select
          id="rating"
          options={ratingOptions}
          value={filters.minRating}
          onChange={(e) => handleFilterChange("minRating", e.target.value)}
          className="bg-white border-slate-200"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        <Button onClick={applyFilters} className="flex-1 font-medium">
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="px-3">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(true)}
          className="w-full bg-white"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="font-semibold text-lg text-slate-900">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <Card className="hidden lg:block border-0 shadow-sm bg-white sticky top-24">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterContent />
        </CardContent>
      </Card>
    </>
  );
}
