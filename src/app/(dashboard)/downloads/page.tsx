"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTip } from "@/components/ui/help-tip";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import {
  DashboardPanel,
  EmptyPanelState,
  MetricCard,
} from "@/components/dashboard/portal-dashboard-ui";
import { useDownloadHistory } from "@/lib/hooks/useDownloadHistory";
import { PORTAL_DOWNLOADS_PAGE_TIP } from "@/lib/constants/portal-tooltips";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type DownloadRow = {
  id: string;
  downloadedAt: string;
  dataset: {
    slug: string;
    title: string;
    format: string;
    version?: number;
    isDeleted?: boolean;
  };
};

export default function DownloadsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: downloadHistory, isLoading, error } = useDownloadHistory(page, 20);

  const filteredDownloads =
    downloadHistory?.data.filter((item) =>
      searchQuery
        ? item.dataset.title.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    ) ?? [];

  const totalDownloads = downloadHistory?.meta.total ?? 0;
  const thisWeekCount =
    downloadHistory?.data.filter(
      (d) =>
        Date.now() - new Date(d.downloadedAt).getTime() < 7 * 24 * 60 * 60 * 1000,
    ).length ?? 0;

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-info/25 bg-info/[0.06] px-2.5 py-1">
            <Download className="size-3.5 text-info" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-info">
              Account
            </span>
          </div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            Downloads
            <HelpTip content={PORTAL_DOWNLOADS_PAGE_TIP} label="Downloads page help" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and re-open datasets you have downloaded before.
          </p>
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        {!isLoading && filteredDownloads.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <MetricCard
              label="Total"
              value={totalDownloads}
              hint="All-time downloads"
              icon={Download}
              tone="info"
            />
            <MetricCard
              label="This page"
              value={downloadHistory?.data.length ?? 0}
              hint={`Page ${page} of ${downloadHistory?.meta.totalPages ?? 1}`}
              icon={FileText}
              tone="muted"
            />
            <MetricCard
              label="This week"
              value={thisWeekCount}
              hint="On current page"
              icon={Calendar}
              tone="primary"
            />
          </div>
        ) : null}

        <DashboardPanel
          title="Download history"
          description="Search by dataset title or open a record to download again."
          icon={Download}
          tone="info"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search downloads…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl sm:h-20" />
                ))}
              </div>
            ) : error ? (
              <EmptyPanelState
                icon={Download}
                message="Failed to load download history."
                action={
                  <Button variant="outline" className="h-11" onClick={() => window.location.reload()}>
                    Try again
                  </Button>
                }
              />
            ) : filteredDownloads.length === 0 ? (
              <EmptyPanelState
                icon={Download}
                message={
                  searchQuery
                    ? "No downloads match your search."
                    : "No downloads yet — datasets you download will appear here."
                }
                action={
                  searchQuery ? undefined : (
                    <Link href="/dataportal" className={cn(buttonVariants(), "h-11 gap-2")}>
                      Browse datasets
                    </Link>
                  )
                }
              />
            ) : (
              <>
                <ul className="space-y-3 lg:hidden">
                  {filteredDownloads.map((item) => (
                    <DownloadMobileCard key={item.id} item={item as DownloadRow} />
                  ))}
                </ul>

                <div className="hidden overflow-hidden rounded-xl border lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Dataset</th>
                          <th className="px-4 py-3 text-left font-medium">Format</th>
                          <th className="px-4 py-3 text-left font-medium">Downloaded</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredDownloads.map((item) => (
                          <DownloadTableRow key={item.id} item={item as DownloadRow} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {downloadHistory && downloadHistory.meta.totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {downloadHistory.meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10"
                      onClick={() =>
                        setPage((p) => Math.min(downloadHistory.meta.totalPages, p + 1))
                      }
                      disabled={page === downloadHistory.meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}

                <p className="text-center text-sm text-muted-foreground">
                  Showing {filteredDownloads.length} of {totalDownloads} downloads
                </p>
              </>
            )}
          </div>
        </DashboardPanel>
      </DashboardPageContent>
    </DashboardPage>
  );
}

function isDeletedDataset(item: DownloadRow) {
  return !!item.dataset.isDeleted;
}

function DownloadMobileCard({ item }: { item: DownloadRow }) {
  const deleted = isDeletedDataset(item);

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {deleted ? (
              <p className="font-medium text-muted-foreground">{item.dataset.title}</p>
            ) : (
              <Link
                href={`/datasets/${item.dataset.slug}`}
                className="font-medium hover:text-primary"
              >
                {item.dataset.title}
              </Link>
            )}
            {deleted ? (
              <Badge variant="secondary" className="text-xs">
                No longer available
              </Badge>
            ) : (
              <Badge variant="secondary" className="uppercase">
                {item.dataset.format}
              </Badge>
            )}
          </div>
          {!deleted && item.dataset.version ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Version {item.dataset.version}
            </p>
          ) : null}
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5" />
            {formatDate(item.downloadedAt)}
          </p>
        </div>
      </div>
      {!deleted ? (
        <div className="mt-3 flex gap-2">
          <Link
            href={`/datasets/${item.dataset.slug}`}
            className={cn(buttonVariants({ size: "sm" }), "h-10 flex-1 gap-2")}
          >
            <Download className="size-4" />
            Re-download
          </Link>
          <Link
            href={`/datasets/${item.dataset.slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 flex-1 gap-2")}
          >
            <ExternalLink className="size-4" />
            View
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm italic text-muted-foreground">Dataset removed from catalogue</p>
      )}
    </li>
  );
}

function DownloadTableRow({ item }: { item: DownloadRow }) {
  const deleted = isDeletedDataset(item);

  return (
    <tr className={cn("hover:bg-muted/30", deleted && "opacity-60")}>
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            {deleted ? (
              <p className="font-medium text-muted-foreground">{item.dataset.title}</p>
            ) : (
              <Link
                href={`/datasets/${item.dataset.slug}`}
                className="font-medium hover:text-primary"
              >
                {item.dataset.title}
              </Link>
            )}
            {!deleted && item.dataset.version ? (
              <p className="text-xs text-muted-foreground">Version {item.dataset.version}</p>
            ) : null}
            {deleted ? (
              <Badge variant="secondary" className="mt-1 text-xs">
                No longer available
              </Badge>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {!deleted ? (
          <Badge variant="secondary" className="uppercase">
            {item.dataset.format}
          </Badge>
        ) : null}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {formatDate(item.downloadedAt)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {deleted ? (
          <span className="text-sm italic text-muted-foreground">Removed</span>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/datasets/${item.dataset.slug}`}>
              <Button size="sm" variant="outline" className="h-9 gap-2">
                <Download className="size-4" />
                Re-download
              </Button>
            </Link>
            <Link href={`/datasets/${item.dataset.slug}`}>
              <Button size="sm" variant="ghost" className="h-9">
                View
              </Button>
            </Link>
          </div>
        )}
      </td>
    </tr>
  );
}
