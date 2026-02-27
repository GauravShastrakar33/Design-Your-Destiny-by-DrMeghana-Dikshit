import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { VideoPlayer } from "@/components/MediaPlayers";
import { motion } from "framer-motion";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Fetch metadata (from the list endpoint as requested)
  const { data: videos, isLoading: isListLoading } = useQuery<GoldMineVideo[]>({
    queryKey: ["/api/goldmine/videosList"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/goldmine/videosList");
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // 2. Fetch playback URL
  const {
    data: playbackData,
    isLoading: isPlaybackLoading,
    isError: isPlaybackError,
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

  if (isListLoading || isPlaybackLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-gray-400 font-bold text-sm tracking-wide">
          Opening the vault...
        </p>
      </div>
    );
  }

  const videoMetadata = videos?.find((v) => v.id === id);

  if (isPlaybackError || (!isListLoading && !videoMetadata)) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Header
          title="Video Not Found"
          hasBackButton={true}
          onBack={handleBack}
        />
        <main className="max-w-3xl mx-auto p-4 pt-3 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Oops! Video not found
          </h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            The video you're looking for might have been moved or doesn't exist
            in the vault.
          </p>
          <Button
            onClick={handleBack}
            className="rounded-lg font-bold px-8 bg-brand hover:bg-brand/90"
          >
            Back to Gold Mine
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header title="Gold Mine" hasBackButton={true} onBack={handleBack} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {playbackData?.videoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <VideoPlayer ref={videoRef} src={playbackData.videoUrl} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-black/[0.02] overflow-hidden"
        >
          <div className="p-4 pb-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Title
            </h3>
            <h1 className="text-lg font-bold text-gray-900 leading-tight pb-2">
              {videoMetadata?.title}
            </h1>
          </div>

          {videoMetadata?.description && (
            <div className="p-4 pt-0">
              <div className="pt-2 border-t border-indigo-50/50">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Description
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                  {videoMetadata.description}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
