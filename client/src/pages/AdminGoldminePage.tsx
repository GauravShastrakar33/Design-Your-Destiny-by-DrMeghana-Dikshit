import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Gem,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Film,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Search,
  PlusCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GoldmineVideo {
  id: string;
  title: string;
  description: string | null;
  r2Key: string;
  thumbnailKey: string;
  durationSec: number | null;
  sizeMb: number | null;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface GoldmineListResponse {
  data: GoldmineVideo[];
  pagination: PaginationMeta;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LIMIT = 20;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminGoldminePage() {
  const [page, setPage] = useState(1);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data, isLoading, isError } = useQuery<GoldmineListResponse>({
    queryKey: ["/api/admin/goldmine/videos", page],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/goldmine/videos?page=${page}&limit=${LIMIT}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch goldmine videos");
      return res.json();
    },
    staleTime: 30_000,
  });

  const videos = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa] gap-3">
        <Film className="w-10 h-10 text-red-400" />
        <p className="text-sm font-semibold text-gray-500">
          Failed to load GoldMine videos. Please try again.
        </p>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      {/* ── Header bar ── */}
      <header className="mb-6 flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <Gem className="w-5 h-5 text-brand shrink-0" />
          <h1
            className="text-xl font-bold text-gray-900 leading-none"
            data-testid="text-goldmine-title"
          >
            Gold Mine
          </h1>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Search (placeholder — no logic yet per spec) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="search"
              disabled
              className="pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg w-44 placeholder:text-gray-400 focus:outline-none cursor-not-allowed opacity-60"
              data-testid="input-goldmine-search"
            />
          </div>

          {/* Add Video (placeholder — no logic yet per spec) */}
          <Button
            disabled
            className="bg-brand hover:bg-brand/90 text-white text-sm font-semibold px-4 gap-2 opacity-60 cursor-not-allowed"
            data-testid="btn-add-video"
          >
            <PlusCircle className="w-4 h-4" />
            Add Video
          </Button>
        </div>
      </header>

      <hr className="border-gray-200 mb-6" />

      {/* ── Table card ── */}
      <Card className="p-0 border border-gray-200 shadow-sm bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left border-collapse"
            data-testid="table-goldmine-videos"
          >
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="py-3.5 px-5 text-sm font-semibold text-gray-600 w-16">
                  Sr no.
                </th>
                <th className="py-3.5 px-5 text-sm font-semibold text-gray-600">
                  Title
                </th>
                <th className="py-3.5 px-5 text-sm font-semibold text-gray-600 w-32">
                  Thumbnail
                </th>
                <th className="py-3.5 px-5 text-sm font-semibold text-gray-600">
                  Tags
                </th>
                <th className="py-3.5 px-5 text-sm font-semibold text-gray-600 w-36">
                  Upload Date
                </th>
                <th className="py-3.5 px-5 text-sm font-semibold text-gray-600 w-32 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Film className="w-10 h-10 text-gray-400" />
                      <p className="text-sm font-bold text-gray-500">
                        No videos uploaded yet
                      </p>
                      <p className="text-xs text-gray-400 italic">
                        Videos added via the upload endpoint will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                videos.map((video, idx) => {
                  const rowNumber = (page - 1) * LIMIT + idx + 1;
                  return (
                    <tr
                      key={video.id}
                      className="group transition-colors hover:bg-gray-50/70"
                      data-testid={`row-goldmine-video-${video.id}`}
                    >
                      {/* Sr no */}
                      <td className="py-4 px-5 text-sm font-medium text-gray-500 text-center">
                        {rowNumber}
                      </td>

                      {/* Title */}
                      <td className="py-4 px-5 max-w-[180px]">
                        <p
                          className="text-sm font-semibold text-gray-900 truncate"
                          title={video.title}
                        >
                          {video.title}
                        </p>
                      </td>

                      {/* Thumbnail */}
                      <td className="py-4 px-5">
                        <ThumbnailCell thumbnailKey={video.thumbnailKey} />
                      </td>

                      {/* Tags */}
                      <td className="py-4 px-5">
                        <p className="text-sm text-gray-600">
                          {video.tags.length === 0
                            ? <span className="italic text-gray-400">—</span>
                            : video.tags.join(", ")}
                        </p>
                      </td>

                      {/* Upload Date */}
                      <td className="py-4 px-5">
                        <span className="text-sm text-gray-600">
                          {format(new Date(video.createdAt), "dd-MM-yyyy")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-3">
                          {/* Delete */}
                          <button
                            disabled
                            title="Delete (coming soon)"
                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            data-testid={`btn-delete-${video.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            disabled
                            title="Edit (coming soon)"
                            className="text-gray-400 hover:text-brand transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            data-testid={`btn-edit-${video.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Publish toggle */}
                          <button
                            disabled
                            title={
                              video.isPublished
                                ? "Published (toggle coming soon)"
                                : "Draft (toggle coming soon)"
                            }
                            className="transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            data-testid={`btn-toggle-${video.id}`}
                          >
                            {video.isPublished ? (
                              <ToggleRight className="w-5 h-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        {pagination && totalPages >= 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-xs font-semibold text-gray-400">
              Page {pagination.page} of {totalPages} &mdash;{" "}
              {pagination.total} video{pagination.total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-bold gap-1"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="btn-prev-page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs font-bold gap-1"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                data-testid="btn-next-page"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── ThumbnailCell ─────────────────────────────────────────────────────────────

function ThumbnailCell({ thumbnailKey }: { thumbnailKey: string }) {
  const [errored, setErrored] = useState(false);

  const r2Base = import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined;
  const src = r2Base ? `${r2Base}/${thumbnailKey}` : null;

  if (!src || errored) {
    return (
      <div className="w-20 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
        <Film className="w-5 h-5 text-gray-300" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="thumbnail"
      className="w-20 h-12 object-cover rounded-md bg-gray-100 border border-gray-200"
      onError={() => setErrored(true)}
    />
  );
}
