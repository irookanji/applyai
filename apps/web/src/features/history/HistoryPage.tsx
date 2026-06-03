import { useSignals } from "@preact/signals-react/runtime";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { Application } from "@applyai/shared";
import { formatApplicationDate } from "@applyai/shared";

import { SearchIcon } from "../../components/icons";
import {
  Badge,
  Card,
  ErrorBanner,
  FilterPill,
  LoadingState,
  StatCard,
} from "../../components/ui";
import { api } from "../../lib/api";
import { debounce } from "../../lib/utils";
import { searchQuery$, selectedId$, statusFilter$ } from "../../signals/app";
import { ApplicationDetail } from "./ApplicationDetail";

const filterOptions = [
  { id: "all", label: "All" },
  { id: "interview", label: "Interview" },
  { id: "applied", label: "Applied" },
  { id: "rejected", label: "Rejected" },
  { id: "no_response", label: "No response" },
] as const;

type HistoryPageProps = {
  readonly onReapply: (application: Application) => void;
};

export function HistoryPage({ onReapply }: HistoryPageProps) {
  useSignals();

  const statusFilter = statusFilter$.value;
  const searchQuery = searchQuery$.value;
  const selectedId = selectedId$.value;
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const syncDebouncedSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearch(value), 500),
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["applications", statusFilter, debouncedSearch],
    queryFn: () =>
      api.getApplications({
        status: statusFilter,
        search: debouncedSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!data?.applications.length) {
      selectedId$.value = null;
      return;
    }

    const currentSelectedId = selectedId$.value;
    if (
      !currentSelectedId ||
      !data.applications.some((app) => app.id === currentSelectedId)
    ) {
      selectedId$.value = data.applications[0]?.id ?? null;
    }
  }, [data]);

  const selectedApplication =
    data?.applications.find((application) => application.id === selectedId) ??
    null;

  if (isLoading && !data) {
    return <LoadingState message="Loading your application history..." />;
  }

  if (isError) {
    return (
      <ErrorBanner
        message={
          error instanceof Error ? error.message : "Failed to load history"
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Applied" value={data?.stats.applied ?? 0} />
        <StatCard
          label="Interview"
          value={data?.stats.interview ?? 0}
          tone="success"
        />
        <StatCard
          label="Rejected"
          value={data?.stats.rejected ?? 0}
          tone="danger"
        />
        <StatCard
          label="No response"
          value={data?.stats.noResponse ?? 0}
          tone="muted"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                searchQuery$.value = value;
                syncDebouncedSearch(value);
              }}
              placeholder="Search company or role..."
              className="w-full rounded-xl border border-border bg-surface py-3 pr-4 pl-10 text-sm outline-none focus:border-primary"
            />
            <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
              <SearchIcon />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <FilterPill
                key={option.id}
                label={option.label}
                active={statusFilter === option.id}
                onClick={() => {
                  statusFilter$.value = option.id;
                }}
              />
            ))}
          </div>

          <div className="space-y-3">
            {data?.applications.length ? (
              data.applications.map((application) => (
                <Card
                  key={application.id}
                  selected={application.id === selectedId}
                  onClick={() => {
                    selectedId$.value = application.id;
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {application.companyName}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {application.jobTitle}
                      </p>
                      <p className="mt-3 text-xs text-muted">
                        {formatApplicationDate(application.appliedAt)}
                      </p>
                    </div>
                    <Badge status={application.status} />
                  </div>
                  <div className="mt-4 text-right text-sm font-medium text-primary">
                    {application.matchScore}% match
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <p className="text-sm text-muted">
                  No applications yet. Create your first one.
                </p>
              </Card>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          {selectedApplication ? (
            <ApplicationDetail
              application={selectedApplication}
              onReapply={onReapply}
            />
          ) : (
            <div className="flex min-h-80 items-center justify-center text-sm text-muted">
              Select an application to view details
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
