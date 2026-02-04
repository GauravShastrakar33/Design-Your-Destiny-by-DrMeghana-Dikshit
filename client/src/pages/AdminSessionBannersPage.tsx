import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Video,
  Image,
  Sparkles,
  Clock,
  Calendar,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { SessionBanner } from "@shared/schema";
import { cn } from "@/lib/utils";

function getBannerStatus(
  banner: SessionBanner
): "scheduled" | "active" | "expired" {
  const now = new Date();
  const startAt = new Date(banner.startAt);
  const endAt = new Date(banner.endAt);

  if (now < startAt) return "scheduled";
  if (now >= startAt && now < endAt) return "active";
  return "expired";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </Badge>
      );
    case "scheduled":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Scheduled
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 px-2 py-0.5 rounded-full font-semibold text-[11px] uppercase tracking-wider">
          Expired
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="px-2 py-0.5 rounded-full">
          {status}
        </Badge>
      );
  }
}

export default function AdminSessionBannersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("@app:admin_token");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: banners = [], isLoading } = useQuery<SessionBanner[]>({
    queryKey: ["/api/admin/v1/session-banners"],
    queryFn: async () => {
      const response = await fetch("/api/admin/v1/session-banners", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch banners");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/v1/session-banners/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/session-banners"],
      });
      toast({ title: "Banner deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete banner", variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        `/api/admin/v1/session-banners/${id}/duplicate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to duplicate banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/v1/session-banners"],
      });
      toast({ title: "Banner duplicated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to duplicate banner", variant: "destructive" });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Session Banners</h1>
        <Button
          onClick={() => setLocation("/admin/session-banner/banners/new")}
          className="bg-brand hover:bg-brand/90"
          data-testid="button-add-banner"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : banners.length === 0 ? (
        <Card className="p-8 text-center bg-white rounded-lg shadow-sm border border-gray-100">
          <p className="text-muted-foreground mb-4">No banners created yet</p>
          <Button
            onClick={() => setLocation("/admin/session-banner/banners/new")}
            data-testid="button-add-first-banner"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Banner
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => {
            const status = getBannerStatus(banner);
            const isAdvertisement = banner.type === "advertisement";

            return (
              <Card
                key={banner.id}
                className={cn(
                  "group relative overflow-hidden bg-white hover:bg-gray-50/30 rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                  isAdvertisement
                    ? "hover:border-indigo-200"
                    : "hover:border-brand/20"
                )}
                data-testid={`card-banner-${banner.id}`}
              >
                <div className="flex flex-col md:flex-row md:items-center p-5 gap-6">
                  {/* Media Preview / Icon */}
                  <div
                    className={cn(
                      "relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border shadow-sm",
                      isAdvertisement
                        ? "bg-indigo-50 border-indigo-100"
                        : "bg-brand/5 border-brand/10"
                    )}
                  >
                    {isAdvertisement ? (
                      <Video className="w-7 h-7 text-indigo-500" />
                    ) : (
                      <Image className="w-7 h-7 text-brand" />
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase",
                          isAdvertisement
                            ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                            : "bg-brand/5 text-brand border border-brand/10"
                        )}
                      >
                        {banner.type}
                      </div>
                      {getStatusBadge(status)}
                      {banner.liveEnabled && banner.type === "session" && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-in zoom-in duration-300 shadow-sm shadow-red-100">
                          <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                          LIVE
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-500">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            {format(new Date(banner.startAt), "MMM d, yyyy")}
                          </span>
                          <span className="text-xs text-gray-400">—</span>
                          <span className="text-sm font-medium text-gray-600">
                            {format(new Date(banner.endAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">
                            {format(new Date(banner.startAt), "h:mm a")}
                          </span>
                          <span className="text-xs text-gray-400">—</span>
                          <span className="text-sm font-medium text-gray-600">
                            {format(new Date(banner.endAt), "h:mm a")}
                          </span>
                        </div>
                      </div>

                      {banner.ctaText && (
                        <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full w-fit group-hover:bg-brand/[0.03] transition-colors">
                          <Sparkles className="w-3 h-3 text-brand/60" />
                          <span className="text-xs font-medium text-gray-500">
                            Button:{" "}
                            <span className="text-gray-900 font-semibold">
                              {banner.ctaText}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex items-center gap-2 self-end md:self-center ml-auto">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-9 h-9 rounded-full hover:bg-brand/10 hover:text-brand transition-colors"
                      onClick={() => duplicateMutation.mutate(banner.id)}
                      disabled={duplicateMutation.isPending}
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-9 h-9 rounded-full hover:bg-brand/10 hover:text-brand transition-colors"
                      onClick={() =>
                        setLocation(
                          `/admin/session-banner/banners/${banner.id}/edit`
                        )
                      }
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <div className="w-[1px] h-6 bg-gray-100 mx-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-9 h-9 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                      onClick={() => handleDelete(banner.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
