import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Settings, Loader2, AlertCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface GoldMineVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  durationSec: number | null;
  createdAt: string;
}

export default function GoldMinePlayerPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [showSpeedDialog, setShowSpeedDialog] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Fetch metadata (from the list endpoint as requested)
  const { data: videos, isLoading: isListLoading } = useQuery<GoldMineVideo[]>({
    queryKey: ["/api/goldmine/videosList"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/goldmine/videosList");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const videoMetadata = videos?.find((v) => v.id === id);

  // 2. Fetch playback URL
  const { 
    data: playbackData, 
    isLoading: isPlaybackLoading, 
    isError: isPlaybackError 
  } = useQuery<{ videoUrl: string }>({
    queryKey: ["/api/goldmine/videos", id, "play"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/goldmine/videos/${id}/play`);
      return res.json();
    },
    enabled: !!id,
  });

  const handleBack = () => {
    setLocation("/goldmine");
  };

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedDialog(false);
  };

  const speedOptions = [0.5, 1, 1.25, 1.5, 2];

  if (isListLoading || isPlaybackLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Preparing your video...
        </p>
      </div>
    );
  }

  if (isPlaybackError || (!isListLoading && !videoMetadata)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20 text-center gap-4 px-6">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Oops!</h3>
          <p className="text-slate-500 text-sm mt-1">
            We couldn't load the video. It may be unavailable.
          </p>
        </div>
        <Button onClick={handleBack} variant="outline" className="rounded-full">
          Back to Gold Mine
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Top Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10 p-[env(safe-area-inset-top)]">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                Now Playing
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => setShowSpeedDialog(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full aspect-video shadow-2xl bg-black relative">
          <video
            ref={videoRef}
            src={playbackData?.videoUrl}
            controls
            playsInline
            className="w-full h-full"
            autoPlay
            onError={(e) => console.error("❌ Video failed to load:", e)}
          />
        </div>

        {/* Video Info */}
        <div className="px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              {videoMetadata?.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 bg-brand/5 text-brand text-[10px] font-black uppercase tracking-widest rounded-md">
                Gold Mine Exclusive
              </span>
            </div>
          </div>

          {videoMetadata?.description && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                About this video
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {videoMetadata.description}
              </p>
            </div>
          )}
        </div>

        {/* Speed Dialog */}
        <Dialog open={showSpeedDialog} onOpenChange={setShowSpeedDialog}>
          <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center font-black uppercase tracking-widest text-sm text-slate-900 pb-2">
                Playback Speed
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-2 pt-2">
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`w-full px-4 py-4 rounded-2xl text-center font-bold text-sm transition-all active:scale-[0.98] ${
                    currentSpeed === speed
                      ? "bg-brand text-white shadow-lg shadow-brand/20"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {speed}x {speed === 1 && "(Normal)"}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
