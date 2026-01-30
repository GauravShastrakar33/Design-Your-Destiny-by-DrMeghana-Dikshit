import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Copy, Video, Image } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { SessionBanner } from "@shared/schema";

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
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-500 text-white">Scheduled</Badge>;
    case "expired":
      return <Badge variant="secondary">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
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
    <div className="p-6 max-w-6xl mx-auto">
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
        <Card className="p-8 text-center">
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
            return (
              <Card
                key={banner.id}
                className="p-4 bg-white"
                data-testid={`card-banner-${banner.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border rounded flex items-center justify-center">
                      {banner.type === "session" ? (
                        <Image className="w-6 h-6 text-[#703DFA]" />
                      ) : (
                        <Video className="w-6 h-6 text-[#703DFA]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {banner.type}
                        </Badge>
                        {getStatusBadge(status)}
                        {banner.liveEnabled && banner.type === "session" && (
                          <Badge className="bg-red-500 text-white">LIVE</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(banner.startAt), "MMM d, yyyy h:mm a")}{" "}
                        - {format(new Date(banner.endAt), "MMM d, yyyy h:mm a")}
                      </p>
                      {banner.ctaText && (
                        <p className="text-sm mt-1">CTA: {banner.ctaText}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => duplicateMutation.mutate(banner.id)}
                      disabled={duplicateMutation.isPending}
                      data-testid={`button-duplicate-${banner.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setLocation(
                          `/admin/session-banner/banners/${banner.id}/edit`
                        )
                      }
                      data-testid={`button-edit-${banner.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(banner.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${banner.id}`}
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
