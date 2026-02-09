"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, SlidersHorizontal } from "lucide-react";
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
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search tutors..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Select
          id="subject"
          options={subjectOptions}
          value={filters.subject}
          onChange={(e) => handleFilterChange("subject", e.target.value)}
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range ($/hr)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
            min="0"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
            min="0"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label htmlFor="rating">Minimum Rating</Label>
        <Select
          id="rating"
          options={ratingOptions}
          value={filters.minRating}
          onChange={(e) => handleFilterChange("minRating", e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={applyFilters} className="flex-1">
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
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
          className="w-full"
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
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filters */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <FilterContent />
        </CardContent>
      </Card>
    </>
  );
}
