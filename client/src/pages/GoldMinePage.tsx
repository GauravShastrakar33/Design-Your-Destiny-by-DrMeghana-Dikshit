import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gem,
  Search,
  Play,
  Clock,
  Loader2,
  AlertCircle,
  Film,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface GoldMineVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  durationSec: number | null;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function GoldMinePage() {
  const [, setLocation] = useLocation();
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<GoldMineVideo[]>({
    queryKey: ["/api/goldmine/videosList"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/goldmine/videosList");
      return res.json();
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoClick = (video: GoldMineVideo) => {
    setLocation(`/goldmine/${video.id}`);
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F8F9FB]">
      <Header
        title="Gold Mine"
        subtitle="Your vault of valuable videos"
        hasBackButton={true}
        onBack={() => setLocation("/")}
        rightContent={
          <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-brand transition-all active:scale-95">
            <Search className="w-5 h-5" />
          </button>
        }
      />

      <main className="max-w-3xl mx-auto p-4 pt-28">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                Opening the vault...
              </p>
            </motion.div>
          ) : isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-3xl shadow-sm border border-slate-100 px-6"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Oops!</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Something went wrong. Please try again.
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="mt-2 px-6 py-2.5 bg-brand text-white rounded-full text-sm font-bold shadow-lg shadow-brand/20 active:scale-95 transition-all"
              >
                Retry
              </button>
            </motion.div>
          ) : data?.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-6"
            >
              <div className="w-24 h-24 bg-brand/5 rounded-[2.5rem] flex items-center justify-center rotate-6">
                <Gem className="w-12 h-12 text-brand/30" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Vault is Empty
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  No videos available yet.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {data?.map((video) => (
                <motion.button
                  key={video.id}
                  variants={itemVariants}
                  onClick={() => handleVideoClick(video)}
                  className="w-full bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-4 text-left active:scale-[0.98] transition-all hover:border-brand/30 group"
                  data-testid={`video-card-${video.id}`}
                >
                  {/* Left: Thumbnail */}
                  <div className="relative w-32 h-20 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden ring-1 ring-slate-100">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    {/* Play Icon Overlay or Loader */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 transition-opacity group-hover:bg-black/30">
                      {playingVideoId === video.id ? (
                        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/40">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/40 ring-4 ring-black/5">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                    <h3 className="font-bold text-slate-900 text-sm mb-1.5 line-clamp-2 leading-tight group-hover:text-brand transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      {video.durationSec && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-black tracking-wider uppercase">
                            {formatDuration(video.durationSec)}
                          </span>
                        </div>
                      )}
                      <span className="text-[11px] font-bold text-slate-300 tabular-nums">
                        {format(new Date(video.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
