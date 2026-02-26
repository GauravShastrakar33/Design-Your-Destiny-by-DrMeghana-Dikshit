import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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

interface GoldmineListResponse {
  data: GoldMineVideo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Persist observer instance for cleanup
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<GoldmineListResponse>({
    queryKey: ["/api/goldmine/videosList", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const url = `/api/goldmine/videosList?page=${pageParam}&limit=5${
        debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""
      }`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const allVideos = data?.pages.flatMap((page) => page.data) ?? [];

  // Callback ref for the sentinel element at the bottom of the list.
  // Using a callback ref instead of useRef + useEffect because the sentinel
  // is conditionally rendered inside AnimatePresence — useEffect would run
  // before the DOM node exists. The callback ref fires the instant the node
  // is mounted by React, guaranteeing the observer is attached correctly.
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Tear down previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Nothing to observe
      if (!node) return;

      // Create a fresh observer with current closure values
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { rootMargin: "200px" }
      );

      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

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
        hasBackButton={true}
        onBack={() => setLocation("/")}
      />

      <main className="max-w-3xl mx-auto p-4 pt-2">
        {/* Info Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 mb-6"
        >
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-brand border border-indigo-100 shadow-sm">
            <Gem className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 px-4">
            Gold Mine is your curated vault of powerful teachings.
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto px-4">
            Search by topic, emotion, or concept to quickly find what you need
          </p>
        </motion.div>

        {/* Always Visible Search Bar */}
        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand transition-colors" />
            <input
              type="text"
              placeholder="Self sabotage, Motivation, Anxiety, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-brand/20 h-10 pl-12 pr-4 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

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
          ) : allVideos.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center gap-6"
            >
              <div className="w-24 h-24 bg-brand/5 rounded-[2.5rem] flex items-center justify-center rotate-6">
                {debouncedSearch ? (
                  <Search className="w-12 h-12 text-brand/30" />
                ) : (
                  <Gem className="w-12 h-12 text-brand/30" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {debouncedSearch ? "No results found" : "Vault is Empty"}
                </h3>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  {debouncedSearch
                    ? `We couldn't find anything matching "${debouncedSearch}"`
                    : "No videos available yet."}
                </p>
              </div>
              {debouncedSearch && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold active:scale-95 transition-all"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {allVideos.map((video) => (
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

              {/* Sentinel element observed by IntersectionObserver */}
              <div ref={sentinelRef} className="py-8 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more...</span>
                  </div>
                ) : hasNextPage ? (
                  <div className="h-1" />
                ) : (
                  <div className="text-slate-400 text-sm font-medium">
                    You've reached the end of the vault
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
