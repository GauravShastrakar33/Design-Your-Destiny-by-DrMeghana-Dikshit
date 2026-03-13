import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import {
  ListMusic,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  Plus,
  Pencil,
  Music,
  Loader2,
  MoreVertical,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Playlist, PlaylistItem } from "@shared/schema";
import { MediaSession } from "@capgo/capacitor-media-session";

interface PlaylistWithItems {
  playlist: Playlist;
  items: (PlaylistItem & {
    lesson?: { id: number; title: string };
    audioFiles: { id: number; fileName: string; signedUrl: string | null }[];
  })[];
}

interface PlaylistSourceData {
  course: { id: number; title: string } | null;
  modules: {
    id: number;
    title: string;
    lessons: {
      id: number;
      title: string;
      audioFiles: { id: number; fileName: string; signedUrl: string | null }[];
    }[];
  }[];
}

// Full Screen Player Component
interface PlayerUIProps {
  track: any;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: (offset: number) => void;
  onSeek: (val: number[]) => void;
  onClose: () => void;
  volume: number;
  onVolumeChange: (val: number[]) => void;
  hasPrev: boolean;
  hasNext: boolean;
  queue: any[];
  onTrackClick: (idx: number) => void;
  currentIdx: number;
  isLoading?: boolean;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

const FullScreenPlayer = ({
  track,
  isPlaying,
  progress,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSkip,
  onSeek,
  onClose,
  volume,
  onVolumeChange,
  hasPrev,
  hasNext,
  queue,
  onTrackClick,
  currentIdx,
  isLoading,
  playbackRate,
  onPlaybackRateChange,
}: PlayerUIProps) => {
  const [showQueue, setShowQueue] = useState(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[70] bg-[#F8F9FB] flex flex-col overflow-hidden"
    >
      {/* Background Aesthetic Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand/2 via-white to-white pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] bg-brand/2 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-[-10%] w-[60%] h-[50%] bg-purple-500/2 blur-[120px] rounded-full pointer-events-none" />

      {/* Full Page Dynamic Glows — Static CSS optimized for GPU */}
      <div className="absolute w-[70vw] h-[70vw] bg-brand/15 blur-[80px] rounded-full pointer-events-none left-[-10%] top-[-10%]" />
      <div className="absolute w-[70vw] h-[70vw] bg-fuchsia-500/15 blur-[80px] rounded-full pointer-events-none right-[-10%] bottom-[-10%]" />

      {/* Header */}
      <Header
        title="Now Playing"
        hasBackButton={true}
        onBack={onClose}
        maxWidthClassName="max-w-4xl sm:max-w-5xl"
        rightContent={
          <Button
            variant="ghost"
            onClick={() => setShowQueue(!showQueue)}
            className={`w-10 h-10 rounded-full transition-colors shrink-0 flex items-center justify-center p-0 [&_svg]:size-6 ${
              showQueue ? "bg-brand/10 text-brand" : "text-slate-600"
            }`}
          >
            <ListMusic strokeWidth={1.5} size={20} />
          </Button>
        }
      />

      <div className="flex-1 w-full flex flex-col items-center justify-start relative z-10 pt-[calc(env(safe-area-inset-top)+5rem)]">
        <div className="w-full max-w-2xl md:max-w-4xl px-4 md:px-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!showQueue ? (
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center flex-1 justify-start gap-4 sm:gap-8 md:gap-10"
              >
                {/* Artwork - Music Disk Aesthetic */}
                <div className="relative group flex items-center justify-center w-full mt-2 mb-2 sm:mt-6 sm:mb-4">
                  {/* Visual Disk - Vinyl Groove Look */}
                  <div
                    style={{
                      animation: "slow-spin 20s linear infinite",
                      animationPlayState: isPlaying ? "running" : "paused",
                    }}
                    className="w-full aspect-square max-w-[180px] sm:max-w-[240px] md:max-w-[320px] rounded-full bg-slate-900 flex items-center justify-center shadow-sm border-[8px] sm:border-[12px] border-slate-800 relative z-10"
                  >
                    {/* Groove Rings */}
                    <div className="absolute inset-2 sm:inset-3 rounded-full border border-white/10" />
                    <div className="absolute inset-4 sm:inset-6 rounded-full border border-white/10" />
                    <div className="absolute inset-6 sm:inset-9 rounded-full border border-white/10" />
                    <div className="absolute inset-8 sm:inset-12 rounded-full border border-white/10" />

                    {/* Inner Content Label */}
                    <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center border-4 border-slate-900 shadow-inner overflow-hidden relative">
                      <div className="absolute inset-0 bg-white/20 blur-sm" />
                      <Music className="w-1/2 h-1/2 text-white/90 relative z-10" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="w-full text-center">
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight mb-2 sm:mb-4 px-2">
                    {track?.lesson?.title || "Unknown Track"}
                  </h2>
                </div>

                {/* Progress */}
                <div className="w-full space-y-2 sm:space-y-4 px-2">
                  <Slider
                    value={[progress]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={onSeek}
                    className="cursor-pointer"
                    trackClassName="h-1 bg-slate-100"
                    thumbClassName="h-3 w-3 border-[1.5px] border-brand"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-600 tabular-nums uppercase tracking-widest">
                    <span>{formatTime(progress)}</span>
                    {isLoading || duration === 0 ? (
                      <Loader2 className="w-3 h-3 animate-spin text-brand" />
                    ) : (
                      <span>{formatTime(duration)}</span>
                    )}
                  </div>
                </div>

                {/* Controls - Equal sizes, disabled states */}
                <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrev}
                    disabled={!hasPrev}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/10 text-brand border border-brand/20 shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                  >
                    <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  </Button>

                  <button
                    onClick={() => onSkip(-10)}
                    disabled={isLoading}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/10 text-brand border border-brand/20 shadow-sm hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center disabled:opacity-30 relative"
                    title="Backward 10s"
                  >
                    <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-black mt-[1.5px] sm:mt-[2px]">
                      10
                    </span>
                  </button>

                  <Button
                    onClick={onTogglePlay}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-brand text-white shadow-xl shadow-brand/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                    )}
                  </Button>

                  <button
                    onClick={() => onSkip(10)}
                    disabled={isLoading}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/10 text-brand border border-brand/20 shadow-sm hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center disabled:opacity-30 relative"
                    title="Forward 10s"
                  >
                    <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-black mt-[1.5px] sm:mt-[2px]">
                      10
                    </span>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNext}
                    disabled={!hasNext}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand/10 text-brand border border-brand/20 shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                  >
                    <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  </Button>
                </div>

                {/* Speed & Volume Container */}
                <div className="w-full max-w-[320px] flex items-center pr-4 gap-4 bg-white/50 backdrop-blur-sm rounded-full border border-brand/50">
                  {/* Playback Speed Select */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-l-full w-12 font-black text-xs text-brand hover:bg-brand/10 bg-brand/5 border border-brand/20 transition-all shrink-0"
                      >
                        {playbackRate === 1 ? "1X" : `${playbackRate}X`}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-24 rounded-xl border-brand/10 bg-white shadow-xl z-[80]"
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <DropdownMenuItem
                          key={speed}
                          onClick={() => onPlaybackRateChange(speed)}
                          className={`text-[11px] font-black rounded-lg ${
                            playbackRate === speed
                              ? "bg-brand/10 text-brand"
                              : "text-slate-600"
                          }`}
                        >
                          {speed === 1 ? "Normal" : `${speed}x`}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  )}
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={onVolumeChange}
                    className="flex-1"
                    trackClassName="h-1 bg-slate-100"
                    thumbClassName="h-3 w-3 border-[1.5px] border-brand"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="queue"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex-1 flex flex-col gap-4 py-4"
              >
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2 mb-2">
                  Up Next
                </h3>
                <div className="flex-1 overflow-y-auto space-y-1 max-h-[60vh] pr-2 scrollbar-hide">
                  {queue.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onTrackClick(idx)}
                      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                        idx === currentIdx
                          ? "bg-brand/10 border border-brand/10"
                          : "hover:bg-white"
                      }`}
                    >
                      <div className="w-8 flex items-center justify-center text-xs font-black tabular-nums">
                        {idx === currentIdx && isPlaying ? (
                          <div className="flex gap-0.5 items-end h-2.5">
                            <div className="w-0.5 bg-brand animate-[bounce_1s_infinite] h-1.5" />
                            <div className="w-0.5 bg-brand animate-[bounce_0.8s_infinite] h-2.5" />
                            <div className="w-0.5 bg-brand animate-[bounce_1.2s_infinite] h-1" />
                          </div>
                        ) : (
                          <span
                            className={
                              idx === currentIdx
                                ? "text-brand"
                                : "text-slate-500"
                            }
                          >
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-sm truncate ${
                            idx === currentIdx ? "text-brand" : "text-slate-800"
                          }`}
                        >
                          {item.lesson?.title || `Lesson ${item.lessonId}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowQueue(false)}
                  className="w-full mt-2 rounded-lg font-bold border border-slate-900 text-slate-900 bg-white"
                >
                  Back to Player
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default function MyPracticePlaylistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // View States
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<number | null>(
    null
  );
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Track/Player Stats
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(
    null
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playingItems, setPlayingItems] = useState<PlaylistWithItems["items"]>(
    []
  );
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [hasLoggedActivity, setHasLoggedActivity] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Data Queries
  const {
    data: playlists = [],
    isLoading: playlistsLoading,
    isFetching: isFetchingPlaylists,
  } = useQuery<Playlist[]>({
    queryKey: ["/api/public/v1/playlists"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  const {
    data: expandedPlaylistData,
    isLoading: expandedLoading,
    isFetching: isFetchingExpanded,
  } = useQuery<PlaylistWithItems>({
    queryKey: ["/api/public/v1/playlists", expandedPlaylistId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!expandedPlaylistId && isAuthenticated,
  });

  const { data: playlistSource, isLoading: sourceLoading } =
    useQuery<PlaylistSourceData>({
      queryKey: ["/api/public/v1/playlist/source"],
      queryFn: getQueryFn({ on401: "returnNull" }),
      enabled: !!expandedPlaylistId && isAuthenticated,
    });

  // Mutations
  const createPlaylistMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/public/v1/playlists", {
        title,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      setCreateDialogOpen(false);
      setCreateTitle("");
      toast({ title: "Playlist created!" });
    },
  });

  const logActivityMutation = useMutation({
    mutationFn: async (params: { lessonId: number; lessonName: string }) => {
      const res = await apiRequest("POST", "/api/v1/activity/log", {
        lessonId: params.lessonId,
        lessonName: params.lessonName,
        featureType: "PLAYLIST",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "/api/v1/activity/monthly-stats",
      });
    },
  });

  const logActivity = (lessonId: number, lessonName: string) => {
    if (!hasLoggedActivity && isAuthenticated) {
      setHasLoggedActivity(true);
      logActivityMutation.mutate({ lessonId, lessonName });
    }
  };

  const renamePlaylistMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const res = await apiRequest("PATCH", `/api/public/v1/playlists/${id}`, {
        title,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      setRenameDialogOpen(false);
      toast({ title: "Playlist renamed!" });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/public/v1/playlists/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      setPlaylistToDelete(null);

      // Stop playback if the current playlist is deleted
      if (currentPlaylistId === deletedId) {
        setIsPlaying(false);
        setIsPlayerInitialized(false);
        setPlayingItems([]);
        setCurrentPlaylistId(null);
      }

      if (expandedPlaylistId === deletedId) {
        setExpandedPlaylistId(null);
      }
      toast({ title: "Playlist deleted!" });
    },
  });

  const setItemsMutation = useMutation({
    mutationFn: async ({
      playlistId,
      lessonIds,
    }: {
      playlistId: number;
      lessonIds: number[];
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/public/v1/playlists/${playlistId}/items`,
        { lessonIds }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/public/v1/playlists", expandedPlaylistId],
      });
      setLessonPickerOpen(false);
      toast({ title: "Playlist updated!" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({
      playlistId,
      itemId,
    }: {
      playlistId: number;
      itemId: number;
    }) => {
      await apiRequest(
        "DELETE",
        `/api/public/v1/playlists/${playlistId}/items/${itemId}`
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/public/v1/playlists", expandedPlaylistId],
      });

      // Stop playback if the removed track is the one currently playing
      if (
        currentPlaylistId === variables.playlistId &&
        playingItems[currentTrackIndex]?.id === variables.itemId
      ) {
        setIsPlaying(false);
        setIsPlayerInitialized(false);
        setPlayingItems([]);
      }

      setTrackItemToDelete(null);
      toast({ title: "Item removed!" });
    },
  });

  const [trackItemToDelete, setTrackItemToDelete] = useState<{
    playlistId: number;
    itemId: number;
  } | null>(null);

  // Dialog States
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [playlistToRename, setPlaylistToRename] = useState<Playlist | null>(
    null
  );
  const [newTitle, setNewTitle] = useState("");
  const [playlistToDelete, setPlaylistToDelete] = useState<number | null>(null);
  const [lessonPickerOpen, setLessonPickerOpen] = useState(false);
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
  const [createError, setCreateError] = useState("");
  const [renameError, setRenameError] = useState("");

  const currentTrack = playingItems[currentTrackIndex];
  const audioSource = currentTrack?.audioFiles?.[0]?.signedUrl;

  // Audio Logic
  useEffect(() => {
    if (audioSource) {
      setDuration(0);
      setIsAudioLoading(true);
      setHasLoggedActivity(false);
    }
  }, [audioSource]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioSource, playbackRate]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsAudioLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 0;
      setProgress(currentTime);
      setDuration(duration);

      // Log activity if 50% finished
      if (duration > 0 && currentTime >= duration * 0.5) {
        if (currentTrack?.lesson) {
          logActivity(currentTrack.lesson.id, currentTrack.lesson.title);
        }
      }
    }
  };

  const handleTrackEnded = () => {
    if (currentTrackIndex < playingItems.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handlePlayAll = () => {
    if (expandedPlaylistData?.items.length) {
      setPlayingItems(expandedPlaylistData.items);
      setCurrentPlaylistId(expandedPlaylistId);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      setIsPlayerInitialized(true);
    }
  };

  const handleTrackClick = (idx: number) => {
    if (expandedPlaylistData?.items.length) {
      setPlayingItems(expandedPlaylistData.items);
      setCurrentPlaylistId(expandedPlaylistId);
      setCurrentTrackIndex(idx);
      setIsPlaying(true);
      setIsPlayerInitialized(true);
    }
  };

  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleNext = () => {
    if (currentTrackIndex < playingItems.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };
  const handlePrev = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };
  const handleSeek = (val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setProgress(val[0]);
    }
  };

  const handleSkip = (offset: number) => {
    if (audioRef.current) {
      const newTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration,
          audioRef.current.currentTime + offset
        )
      );
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  // ─── Media Session API via @jofr/capacitor-media-session ───────────
  // Handle Metadata updates separately to avoid flickering
  useEffect(() => {
    const trackTitle = currentTrack?.lesson?.title || "Dr. M Audio";
    MediaSession.setMetadata({
      title: trackTitle,
      artist: "Dr. Meghana Dikshit",
      album: "Design Your Destiny",
      artwork: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
  }, [currentTrack]);

  // Handle Playback State & Handlers
  useEffect(() => {
    MediaSession.setPlaybackState({
      playbackState: isPlaying ? "playing" : "paused",
    });

    const setupHandlers = async () => {
      MediaSession.setActionHandler({ action: "play" }, () => {
        setIsPlaying(true);
        audioRef.current?.play().catch(console.error);
      });

      MediaSession.setActionHandler({ action: "pause" }, () => {
        setIsPlaying(false);
        audioRef.current?.pause();
      });

      MediaSession.setActionHandler({ action: "previoustrack" }, () => {
        handlePrev();
      });

      MediaSession.setActionHandler({ action: "nexttrack" }, () => {
        handleNext();
      });

      MediaSession.setActionHandler({ action: "seekbackward" }, (details) => {
        const skipTime = details.seekTime ?? 10;
        if (audioRef.current) {
          const newTime = Math.max(0, audioRef.current.currentTime - skipTime);
          audioRef.current.currentTime = newTime;
          setProgress(newTime);
        }
      });

      MediaSession.setActionHandler({ action: "seekforward" }, (details) => {
        const skipTime = details.seekTime ?? 10;
        if (audioRef.current) {
          const newTime = Math.min(
            audioRef.current.duration,
            audioRef.current.currentTime + skipTime
          );
          audioRef.current.currentTime = newTime;
          setProgress(newTime);
        }
      });

      // Handle scrubbing from lock screen / notification drawer
      MediaSession.setActionHandler(
        { action: "seekto" as any },
        (details: any) => {
          if (audioRef.current && typeof details.seekTime === "number") {
            audioRef.current.currentTime = details.seekTime;
            setProgress(details.seekTime);
          }
        }
      );
    };

    setupHandlers();

    return () => {
      const actions: any[] = [
        "play",
        "pause",
        "previoustrack",
        "nexttrack",
        "seekbackward",
        "seekforward",
        "seekto",
      ];
      actions.forEach((action) => {
        try {
          MediaSession.setActionHandler({ action }, null);
        } catch {}
      });
    };
  }, [playingItems, isPlaying, currentTrackIndex]);

  // Handle Position Updates separately to minimize overhead and flicker
  const lastPositionUpdateRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (
      audioRef.current &&
      audioRef.current.duration &&
      now - lastPositionUpdateRef.current >= 5000
    ) {
      lastPositionUpdateRef.current = now;
      try {
        MediaSession.setPositionState({
          duration: duration || 0,
          playbackRate: playbackRate,
          position: Math.min(progress, duration || 0),
        });
      } catch (e) {}
    }
  }, [progress, duration, playbackRate]);
  // ─── End Media Session API ─────────────────────────────────────────

  const handleVolumeChange = (val: number[]) => {
    const v = val[0];
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  if (
    authLoading ||
    playlistsLoading ||
    (expandedPlaylistId && expandedLoading)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        expandedPlaylistId
          ? "bg-gradient-to-b from-brand/[0.08] via-[#F8F9FB] to-[#F8F9FB]"
          : "bg-[#F8F9FB]"
      }`}
    >
      <Header
        title={expandedPlaylistId ? "Your Audio Journey" : "My Playlist"}
        hasBackButton={true}
        onBack={() =>
          expandedPlaylistId ? setExpandedPlaylistId(null) : setLocation("/")
        }
        maxWidthClassName="max-w-2xl md:max-w-5xl"
        rightContent={
          <div className="flex items-center gap-3">
            {(isFetchingPlaylists || isFetchingExpanded) && (
              <Loader2 className="w-4 h-4 animate-spin text-brand/40" />
            )}
            {!expandedPlaylistId && (
              <Button
                variant="default"
                size="icon"
                onClick={() => setCreateDialogOpen(true)}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-white shadow-md hover:shadow-md hover:text-brand transition-all active:scale-95"
              >
                <Plus className="w-6 h-6" />
              </Button>
            )}
          </div>
        }
      />

      <main className="flex-1 w-full max-w-2xl md:max-w-5xl mx-auto px-4 sm:px-8 pb-48">
        {!expandedPlaylistId ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 py-4">
            {/* LIBRARY LIST */}
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
                  <Music className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Your Library is Empty
                </h3>
                <p className="text-sm">
                  Create a playlist to start your practice
                </p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <Card
                  key={playlist.id}
                  onClick={() => setExpandedPlaylistId(playlist.id)}
                  className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-xl hover:shadow-brand/10 border border-slate-200 bg-gradient-to-br from-white to-brand/10 rounded-xl transition-all active:scale-[0.98] group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform shrink-0">
                    <ListMusic className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-md leading-tight">
                      {playlist.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Created on{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(playlist.createdAt))}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-xl border-0 shadow-xl bg-white"
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaylistToRename(playlist);
                          setNewTitle(playlist.title);
                          setRenameDialogOpen(true);
                        }}
                        className="font-bold text-slate-700"
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaylistToDelete(playlist.id);
                        }}
                        className="font-bold text-red-500 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              ))
            )}
          </div>
        ) : (
          // PLAYLIST DETAIL
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center text-center mt-6 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-purple-600 shadow-2xl shadow-brand/20 flex items-center justify-center mb-3 border-4 border-white">
                <Music className="w-10 h-10 text-white/90" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                {expandedPlaylistData?.playlist.title}
              </h1>
              <span className="text-xs font-bold text-brand uppercase tracking-wide bg-brand/5 border border-brand/5 px-4 py-1.5 rounded-full">
                {expandedPlaylistData?.items.length || 0} Processes
              </span>

              <div className="flex gap-4 mt-6 w-full">
                <Button
                  onClick={handlePlayAll}
                  disabled={expandedPlaylistData?.items.length === 0}
                  className="flex-1 h-11 bg-slate-900 text-white font-bold rounded-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" /> Play All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLessonIds(
                      expandedPlaylistData?.items.map((i) => i.lessonId) || []
                    );
                    setLessonPickerOpen(true);
                  }}
                  className="flex-1 h-11 border-slate-200 rounded-lg font-bold hover:bg-slate-50 transition-all text-slate-600"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
            </div>

            {/* REFERENCE INSPIRED HEADER */}
            <div className="flex items-center gap-3 my-2 px-2">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center relative shadow-sm border border-brand/10">
                <div className="absolute inset-[-3px] rounded-full border border-brand/10" />
                <div className="absolute inset-[-6px] rounded-full border border-brand/10" />
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/10">
                  <Music className="w-4 h-4" />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Currently Playing
              </h2>
            </div>

            <div className="space-y-1">
              {expandedPlaylistData?.items.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold opacity-80 tracking-wide">
                    No Tracks Yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2  bg-white p-3 mt-6 rounded-xl border border-slate-200 shadow-md">
                  {expandedPlaylistData?.items.map((item, idx) => {
                    const isActive =
                      currentPlaylistId === expandedPlaylistId &&
                      currentTrackIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleTrackClick(idx)}
                        className={`group flex items-center gap-4 p-1 rounded-md cursor-pointer transition-all ${
                          isActive
                            ? "bg-brand/5 shadow-sm"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Indicator */}
                        <div className="w-8 flex items-center justify-center shrink-0">
                          {isActive && isPlaying ? (
                            <div className="flex gap-1 items-end h-5">
                              <div className="w-1 bg-brand rounded-full animate-[bounce_1s_infinite] h-2.5" />
                              <div className="w-1 bg-brand rounded-full animate-[bounce_0.8s_infinite] h-5" />
                              <div className="w-1 bg-brand rounded-full animate-[bounce_1.2s_infinite] h-3.5" />
                            </div>
                          ) : (
                            <Music
                              className={`w-6 h-6 ${
                                isActive ? "text-brand" : "text-slate-300"
                              }`}
                            />
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-bold text-sm truncate  ${
                              isActive ? "text-brand" : "text-slate-900"
                            }`}
                          >
                            {item.lesson?.title || `Lesson ${item.lessonId}`}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-80 hidden">
                            Practice Session
                          </p>
                        </div>

                        {/* Action */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackItemToDelete({
                              playlistId: expandedPlaylistId!,
                              itemId: item.id,
                            });
                          }}
                          className="text-red-400 hover:text-red-500 transition-all rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* STICKY BAR PLAYER */}
      <AnimatePresence>
        {isPlayerInitialized && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            className="fixed bottom-[calc(4.7rem+env(safe-area-inset-bottom))] left-0 right-0 z-50 px-4 pointer-events-none"
          >
            <div className="max-w-2xl md:max-w-3xl mx-auto pointer-events-auto">
              <div
                onClick={() => setIsFullScreen(true)}
                className="bg-white/90 backdrop-blur-xl bg-gradient-to-r from-brand/[0.08] to-transparent rounded-lg shadow-[0_8px_32px_rgba(110,89,255,0.12)] border border-brand/50 p-2 pr-4 pb-3 flex items-center gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
              >
                {/* Visual Progress Bar Layer */}
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-slate-100/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(progress / (duration || 1)) * 100}%`,
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  />
                </div>

                <div className="w-11 h-11 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 border border-brand/5">
                  {isPlaying ? (
                    <div className="flex gap-1 items-end h-5">
                      <div className="w-1 bg-brand rounded-full animate-[bounce_1s_infinite] h-2.5" />
                      <div className="w-1 bg-brand rounded-full animate-[bounce_0.8s_infinite] h-5" />
                      <div className="w-1 bg-brand rounded-full animate-[bounce_1.2s_infinite] h-3.5" />
                    </div>
                  ) : (
                    <Music className="w-5 h-5 text-brand" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-brand uppercase tracking-widest mb-0.5">
                    Now Playing
                  </p>
                  <h4 className="text-sm font-black text-slate-800 truncate">
                    {currentTrack?.lesson?.title || "Unknown Track"}
                  </h4>
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    disabled={currentTrackIndex === 0}
                    className="w-8 h-8 rounded-full text-slate-400 hover:text-brand disabled:opacity-20 transition-colors"
                  >
                    <SkipBack className="w-4 h-4 fill-current" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleTogglePlay}
                    className="w-10 h-10 rounded-full bg-brand text-white hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={currentTrackIndex === playingItems.length - 1}
                    className="w-8 h-8 rounded-full text-slate-400 hover:text-brand disabled:opacity-20 transition-colors"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN PLAYER MODAL */}
      <AnimatePresence>
        {isFullScreen && (
          <FullScreenPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            duration={duration}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
            onSeek={handleSeek}
            onClose={() => setIsFullScreen(false)}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            hasPrev={currentTrackIndex > 0}
            hasNext={currentTrackIndex < playingItems.length - 1}
            queue={playingItems}
            onTrackClick={(idx) => setCurrentTrackIndex(idx)}
            currentIdx={currentTrackIndex}
            isLoading={isAudioLoading}
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
          />
        )}
      </AnimatePresence>

      {/* HIDDEN AUDIO ELEMENT */}
      <audio
        ref={audioRef}
        src={audioSource || ""}
        preload="auto"
        onPlay={() => {
          if (currentTrack?.lesson) {
            logActivity(currentTrack.lesson.id, currentTrack.lesson.title);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnded}
      />

      {/* DIALOGS */}
      {/* Add new playlist */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setCreateError("");
            setCreateTitle("");
          }
        }}
      >
        <DialogContent className="w-[92vw] sm:max-w-md rounded-2xl p-6 sm:p-8 border-0 shadow-2xl data-[state=open]:-translate-y-[45%] sm:data-[state=open]:-translate-y-1/2 top-1/2 left-1/2 -translate-x-1/2">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-center sm:text-left">
              New Playlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Input
              value={createTitle}
              onChange={(e) => {
                setCreateTitle(e.target.value);
                if (createError) setCreateError("");
              }}
              placeholder="e.g., Morning Meditation"
              className={`border-slate-300 rounded-lg bg-slate-50 focus:bg-white transition-colors ${
                createError ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
            {createError && (
              <p className="text-xs font-bold text-red-500 px-1 animate-in fade-in slide-in-from-top-1">
                {createError}
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-3">
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              className="flex-1 rounded-lg border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!createTitle.trim()) {
                  setCreateError("Please enter a name for your playlist");
                  return;
                }
                createPlaylistMutation.mutate(createTitle);
              }}
              disabled={createPlaylistMutation.isPending}
              className="flex-1 bg-brand text-white rounded-lg shadow-lg shadow-brand/20"
            >
              {createPlaylistMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename playlist */}
      <Dialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) {
            setRenameError("");
          }
        }}
      >
        <DialogContent className="w-[92vw] sm:max-w-md rounded-2xl p-6 sm:p-8 border-0 shadow-2xl data-[state=open]:-translate-y-[45%] sm:data-[state=open]:-translate-y-1/2 top-1/2 left-1/2 -translate-x-1/2">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-center sm:text-left">
              Rename Playlist
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            <Input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (renameError) setRenameError("");
              }}
              className={`border-slate-300 rounded-lg bg-slate-50 ${
                renameError ? "border-red-500 focus:ring-red-500" : ""
              }`}
            />
            {renameError && (
              <p className="text-xs font-bold text-red-500 px-1 animate-in fade-in slide-in-from-top-1">
                {renameError}
              </p>
            )}
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              className="flex-1 rounded-lg border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newTitle.trim()) {
                  setRenameError("Playlist name cannot be empty");
                  return;
                }
                renamePlaylistMutation.mutate({
                  id: playlistToRename!.id!,
                  title: newTitle,
                });
              }}
              disabled={renamePlaylistMutation.isPending}
              className="flex-1 bg-brand text-white rounded-lg shadow-lg shadow-brand/20"
            >
              {renamePlaylistMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete playlist */}
      <Dialog
        open={!!playlistToDelete}
        onOpenChange={() => setPlaylistToDelete(null)}
      >
        <DialogContent className="w-[92vw] sm:max-w-md rounded-2xl p-6 sm:p-8 border-0 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-center sm:text-left text-red-600">
              Delete Playlist?
            </DialogTitle>
            <DialogDescription className="font-semibold text-slate-500 text-center sm:text-left">
              This action cannot be undone. All tracks in this list will be
              unlinked.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setPlaylistToDelete(null)}
              className="flex-1 rounded-lg border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deletePlaylistMutation.mutate(playlistToDelete!)}
              disabled={deletePlaylistMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg shadow-red-500/20"
            >
              {deletePlaylistMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete track */}
      <Dialog
        open={!!trackItemToDelete}
        onOpenChange={() => setTrackItemToDelete(null)}
      >
        <DialogContent className="w-[92vw] sm:max-w-md rounded-2xl p-6 sm:p-8 border-0 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-center sm:text-left text-red-600">
              Remove from Playlist?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-center sm:text-left">
              Are you sure you want to remove this track from your playlist?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setTrackItemToDelete(null)}
              className="flex-1 rounded-lg border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                trackItemToDelete &&
                removeItemMutation.mutate(trackItemToDelete)
              }
              disabled={removeItemMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg shadow-red-500/20"
            >
              {removeItemMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LESSON PICKER */}
      <Dialog open={lessonPickerOpen} onOpenChange={setLessonPickerOpen}>
        <DialogContent className="max-w-[93vw] h-[75vh] flex flex-col p-0 rounded-2xl sm:rounded-2xl border-0 overflow-hidden">
          <div className="p-3 border-b text-center">
            <DialogTitle className="text-xl font-bold">
              Add Practice Items
            </DialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {sourceLoading ? (
              <div className="flex justify-center pt-20">
                <Loader2 className="animate-spin text-brand" />
              </div>
            ) : (
              playlistSource?.modules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-300"
                >
                  <div className="px-5 py-3 bg-slate-200/50 border-b border-b-slate-300 font-black text-xs text-brand uppercase tracking-widest">
                    {mod.title}
                  </div>
                  {mod.lessons
                    .filter((l) => l.audioFiles.length)
                    .map((lesson) => {
                      const isSelected = selectedLessonIds.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          onClick={() =>
                            setSelectedLessonIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== lesson.id)
                                : [...prev, lesson.id]
                            )
                          }
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <span
                            className={`text-sm font-bold ${
                              isSelected ? "text-brand" : "text-slate-700"
                            }`}
                          >
                            {lesson.title}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-brand border-brand text-white"
                                : "border-slate-200"
                            }`}
                          >
                            {isSelected && (
                              <span className="text-xs font-black">
                                {selectedLessonIds.indexOf(lesson.id) + 1}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t bg-white flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setLessonPickerOpen(false)}
              className="flex-1 rounded-lg border border-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                setItemsMutation.mutate({
                  playlistId: expandedPlaylistId!,
                  lessonIds: selectedLessonIds,
                })
              }
              disabled={setItemsMutation.isPending}
              className="flex-1 bg-brand text-white rounded-lg shadow-lg shadow-brand/20 min-w-[140px]"
            >
              {setItemsMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Selection"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
