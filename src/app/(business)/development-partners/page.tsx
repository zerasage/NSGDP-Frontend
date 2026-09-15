"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { DevelopmentPartnerCard } from "@/components/data/development-partner-card";
import { Input } from "@/components/ui/input";
import { OrgCardSkeleton } from "@/components/feedback/skeletons";
import { useDevelopmentPartners } from "@/lib/hooks/useDevelopmentPartners";
import { cn } from "@/lib/utils";

// Development Partner types from API
const ORG_TYPES = [
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
  { value: "private", label: "Private" },
  { value: "international", label: "International" },
  { value: "academic", label: "Academic" },
  { value: "community", label: "Community" },
];

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default function DevelopmentPartnersPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch development partners from real API (fetch all with high limit)
  const { data, isLoading } = useDevelopmentPartners(1, 100);

  // Get active development partners from API
  const organisations = useMemo(() => {
    return data?.data?.filter((org) => org.isActive) || [];
  }, [data]);

  // Filter development partners by type and search
  const filteredOrgs = useMemo(() => {
    let filtered = organisations;

    if (selectedType) {
      filtered = filtered.filter((org) => org.type === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [organisations, selectedType, searchQuery]);

  // Count orgs per type
  const typeCounts = useMemo(() => {
    return organisations.reduce((acc, org) => {
      acc[org.type] = (acc[org.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [organisations]);

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-8">
          <h1 className="text-3xl font-bold">Development Partners</h1>
          <p className="mt-2 text-muted-foreground">
            Browse data-contributing ministries, departments, and agencies
          </p>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search development partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selectedType === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            All
            <span className="text-xs opacity-75">({organisations.length})</span>
          </button>
          {ORG_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                selectedType === type.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {type.label}
              <span className="text-xs opacity-75">
                ({typeCounts[type.value] || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <OrgCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No development partners found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOrgs.map((org) => (
              <DevelopmentPartnerCard key={org.id} organisation={org} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
