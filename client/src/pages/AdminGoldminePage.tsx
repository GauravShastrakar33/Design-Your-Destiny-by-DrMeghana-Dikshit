import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Video,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GoldmineVideo {
  id: string;
  title: string;
  description: string | null;
  r2Key: string;
  thumbnailKey: string;
  thumbnailSignedUrl?: string | null;
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data, isLoading, isError } = useQuery<GoldmineListResponse>(
    {
      queryKey: ["/api/admin/goldmine/videos", page],
      queryFn: async () => {
        const res = await fetch(
          `/api/admin/goldmine/videos?page=${page}&limit=${LIMIT}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        // Only throw (→ error state) when HTTP status is not 2xx
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<GoldmineListResponse>;
      },
      staleTime: 30_000,
    }
  );

  const videos = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  // ── Mutation ──────────────────────────────────────────────────────────────

  const createVideoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/goldmine/videos", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (HTTP ${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video uploaded successfully",
        className: "bg-green-50 border-green-200",
      });
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/goldmine/videos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand hover:bg-brand/90 text-white text-sm font-semibold px-4 gap-2 shadow-sm transition-all active:scale-[0.98]"
            data-testid="btn-add-video"
          >
            <PlusCircle className="w-4 h-4" />
            Add Video
          </Button>
        </div>
      </header>

      {/* ── Add Video Modal ── */}
      <AddVideoModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={(fd) => createVideoMutation.mutate(fd)}
        isPending={createVideoMutation.isPending}
      />

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
                    <div className="flex flex-col items-center gap-4 opacity-60">
                      <Film className="w-10 h-10 text-gray-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-500">
                          No videos added yet.
                        </p>
                        <p className="text-xs text-gray-400 italic">
                          Upload your first GoldMine video to get started.
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-1 bg-brand hover:bg-brand/90 text-white text-sm font-semibold px-4 gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Video
                      </Button>
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
                        <ThumbnailCell 
                          thumbnailKey={video.thumbnailKey} 
                          thumbnailSignedUrl={video.thumbnailSignedUrl}
                        />
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
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
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

function ThumbnailCell({ 
  thumbnailKey, 
  thumbnailSignedUrl 
}: { 
  thumbnailKey: string; 
  thumbnailSignedUrl?: string | null;
}) {
  const [errored, setErrored] = useState(false);

  // Prioritize signed URL from backend if available
  const src = thumbnailSignedUrl || null;

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

// ── Components ────────────────────────────────────────────────────────────────

interface AddVideoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}

function AddVideoModal({
  isOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: AddVideoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !thumbnailFile) return;

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("isPublished", String(isPublished));
    formData.append("tags", tags); // Backend expects a comma-separated string

    formData.append("video", videoFile);
    formData.append("thumbnail", thumbnailFile);

    onSubmit(formData);
  };

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setTags("");
      setIsPublished(false);
      setVideoFile(null);
      setThumbnailFile(null);
    }
  }, [isOpen]);

  const canSubmit = title && videoFile && thumbnailFile && !isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="px-6 py-4 bg-gray-50/80 border-b border-gray-100">
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand" />
            Upload GoldMine Video
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              required
              className="bg-white border-gray-200 focus:ring-brand focus:border-brand h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-sm font-semibold text-gray-700">
              Description
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this video about?"
              className="bg-white border-gray-200 focus:ring-brand focus:border-brand min-h-[80px] resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">
              Tags (comma separated)
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="meditation, focus, mindset"
              className="bg-white border-gray-200 focus:ring-brand focus:border-brand h-10"
            />
          </div>

          {/* Files Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Video <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                  required
                />
                <label
                  htmlFor="video-upload"
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors h-24 ${
                    videoFile
                      ? "border-brand bg-brand/5"
                      : "border-gray-200 hover:border-brand/40 hover:bg-gray-50"
                  }`}
                >
                  <Video
                    className={`w-5 h-5 mb-1 ${
                      videoFile ? "text-brand" : "text-gray-400"
                    }`}
                  />
                  <span className="text-[11px] font-medium text-gray-500 text-center line-clamp-1 px-2">
                    {videoFile ? videoFile.name : "Select Video"}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Thumbnail <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="thumb-upload"
                  required
                />
                <label
                  htmlFor="thumb-upload"
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors h-24 ${
                    thumbnailFile
                      ? "border-brand bg-brand/5"
                      : "border-gray-200 hover:border-brand/40 hover:bg-gray-50"
                  }`}
                >
                  <ImageIcon
                    className={`w-5 h-5 mb-1 ${
                      thumbnailFile ? "text-brand" : "text-gray-400"
                    }`}
                  />
                  <span className="text-[11px] font-medium text-gray-500 text-center line-clamp-1 px-2">
                    {thumbnailFile ? thumbnailFile.name : "Select Image"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-gray-800">
                Publish immediately
              </Label>
              <p className="text-[11px] text-gray-500">
                Make this video visible to users right away.
              </p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Actions */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-brand hover:bg-brand/90 text-white min-w-[120px] shadow-md shadow-brand/20 transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Video"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
