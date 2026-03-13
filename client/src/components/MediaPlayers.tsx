import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Music,
  Volume2,
  Maximize,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { MediaSession } from "@capgo/capacitor-media-session";

// Shared utility — defined once at module level, not re-created on every render
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

interface MediaPlayerProps {
  src: string;
  onPlay?: () => void;
  onTimeUpdate?: (element: HTMLVideoElement | HTMLAudioElement) => void;
  onEnded?: () => void;
  title?: string;
  autoPlay?: boolean;
}

export const VideoPlayer = React.forwardRef<HTMLVideoElement, MediaPlayerProps>(
  ({ src, onPlay, onTimeUpdate, onEnded, autoPlay, title }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external ref
    useEffect(() => {
      if (typeof ref === "function") {
        ref(videoRef.current);
      } else if (ref) {
        ref.current = videoRef.current;
      }
    }, [ref]);

    const [isFullscreen, setIsFullscreen] = useState(false);

    // Track fullscreen status
    useEffect(() => {
      const handleFsChange = () => {
        const isFs = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        setIsFullscreen(isFs);
      };

      document.addEventListener("fullscreenchange", handleFsChange);
      document.addEventListener("webkitfullscreenchange", handleFsChange);
      document.addEventListener("mozfullscreenchange", handleFsChange);
      document.addEventListener("MSFullscreenChange", handleFsChange);

      // Also listen for iOS specific fullscreen events on the video element
      const video = videoRef.current;
      if (video) {
        (video as any).addEventListener(
          "webkitbeginfullscreen",
          handleFsChange
        );
        (video as any).addEventListener("webkitendfullscreen", handleFsChange);
      }

      return () => {
        document.removeEventListener("fullscreenchange", handleFsChange);
        document.removeEventListener("webkitfullscreenchange", handleFsChange);
        document.removeEventListener("mozfullscreenchange", handleFsChange);
        document.removeEventListener("MSFullscreenChange", handleFsChange);
        if (video) {
          (video as any).removeEventListener(
            "webkitbeginfullscreen",
            handleFsChange
          );
          (video as any).removeEventListener(
            "webkitendfullscreen",
            handleFsChange
          );
        }
      };
    }, []);

    // Handle back button to exit fullscreen on mobile
    useEffect(() => {
      if (!Capacitor.isNativePlatform() || !isFullscreen) return;

      let backListener: any;

      const initBackListener = async () => {
        backListener = await App.addListener("backButton", async () => {
          // If we're here, isFullscreen is true, so we just exit fullscreen
          try {
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
              await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
              await (document as any).msExitFullscreen();
            } else if (
              videoRef.current &&
              (videoRef.current as any).webkitExitFullscreen
            ) {
              await (videoRef.current as any).webkitExitFullscreen();
            }
          } catch (err) {
            console.error("Error exiting fullscreen:", err);
          }
        });
      };

      initBackListener();

      return () => {
        if (backListener) {
          backListener.remove();
        }
      };
    }, [isFullscreen]);

    // ─── Media Session: Metadata ───────────────────────────────────────
    useEffect(() => {
      MediaSession.setMetadata({
        title: title || "Dr. M Video",
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
    }, [title]);

    // ─── Media Session: Action Handlers (registered ONCE on mount) ─────
    useEffect(() => {
      MediaSession.setActionHandler({ action: "play" }, () => {
        videoRef.current?.play().catch(console.error);
      });
      MediaSession.setActionHandler({ action: "pause" }, () => {
        videoRef.current?.pause();
      });
      MediaSession.setActionHandler({ action: "seekbackward" }, (details) => {
        const skipTime = details.seekTime ?? 10;
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(
            0,
            videoRef.current.currentTime - skipTime
          );
        }
      });
      MediaSession.setActionHandler({ action: "seekforward" }, (details) => {
        const skipTime = details.seekTime ?? 10;
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || 0,
            videoRef.current.currentTime + skipTime
          );
        }
      });
      MediaSession.setActionHandler(
        { action: "seekto" as any },
        (details: any) => {
          if (videoRef.current && typeof details.seekTime === "number") {
            videoRef.current.currentTime = details.seekTime;
          }
        }
      );
      return () => {
        (
          ["play", "pause", "seekbackward", "seekforward", "seekto"] as any[]
        ).forEach((action) => {
          try {
            MediaSession.setActionHandler({ action }, null);
          } catch {}
        });
      };
    }, []); // empty deps — register handlers only once

    // ─── Media Session: Playback State (updates on play/pause) ─────────
    useEffect(() => {
      MediaSession.setPlaybackState({
        playbackState: isPlaying ? "playing" : "paused",
      });
    }, [isPlaying]);

    // ─── Media Session: Position State (throttled to max once per 5s) ──
    const lastPositionUpdateRef = useRef(0);
    useEffect(() => {
      const now = Date.now();
      if (
        videoRef.current &&
        videoRef.current.duration &&
        now - lastPositionUpdateRef.current >= 5000
      ) {
        lastPositionUpdateRef.current = now;
        try {
          MediaSession.setPositionState({
            duration: duration || 0,
            playbackRate: playbackRate,
            position: Math.min(currentTime, duration || 0),
          });
        } catch (e) {}
      }
    }, [currentTime, duration, playbackRate]);
    // ─── End Media Session ─────────────────────────────────────────────

    const togglePlay = async () => {
      if (videoRef.current && !isLoading) {
        try {
          if (isPlaying) {
            videoRef.current.pause();
          } else {
            await videoRef.current.play();
          }
        } catch (error) {
          console.error("Playback error:", error);
        }
      }
    };

    const handleInternalPlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handleInternalPause = () => {
      setIsPlaying(false);
    };

    const handleInternalTimeUpdate = (
      e: React.SyntheticEvent<HTMLVideoElement>
    ) => {
      const element = e.currentTarget;
      setCurrentTime(element.currentTime);
      onTimeUpdate?.(element);
    };

    const handleSliderChange = (value: number[]) => {
      if (videoRef.current) {
        videoRef.current.currentTime = value[0];
        setCurrentTime(value[0]);
      }
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume / 100;
      }
    };

    const handleSpeedChange = (rate: number) => {
      setPlaybackRate(rate);
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
      }
    };

    const handleSeek = (seconds: number) => {
      if (videoRef.current) {
        const newTime = videoRef.current.currentTime + seconds;
        videoRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
        setCurrentTime(videoRef.current.currentTime);
      }
    };

    const toggleFullscreen = () => {
      if (!videoRef.current) return;

      const v = videoRef.current as any;
      if (v.requestFullscreen) {
        v.requestFullscreen();
      } else if (v.webkitRequestFullscreen) {
        /* Safari */
        v.webkitRequestFullscreen();
      } else if (v.msRequestFullscreen) {
        /* IE11 */
        v.msRequestFullscreen();
      } else if (v.webkitEnterFullscreen) {
        /* iOS */
        v.webkitEnterFullscreen();
      }
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-xl overflow-hidden shadow-xl shadow-black/[0.07] flex flex-col"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-black group/video">
          <video
            ref={videoRef}
            src={src}
            playsInline
            disablePictureInPicture
            controlsList="nodownload"
            className="w-full h-full object-contain cursor-pointer"
            onPlay={handleInternalPlay}
            onPause={handleInternalPause}
            onTimeUpdate={handleInternalTimeUpdate}
            onEnded={onEnded}
            autoPlay={autoPlay}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onLoadStart={() => setIsLoading(true)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onClick={togglePlay}
          />

          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-10"
              >
                <div className="w-10 h-10 border-4 border-white/20 border-t-brand rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Controls Bar - Below Video */}
        <div
          className={`p-3 sm:p-5 backdrop-blur-sm border border-brand/20 border-t-brand/10 rounded-b-xl flex flex-col gap-2 sm:gap-4 bg-gradient-to-br from-slate-100 via-brand/[0.05] to-brand/[0.05] transition-opacity duration-300 ${
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          {/* Progress Slider with time at ends */}
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 tabular-nums min-w-[32px] sm:min-w-[40px] text-left">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSliderChange}
                disabled={isLoading}
                className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 sm:[&_[role=slider]]:h-4 sm:[&_[role=slider]]:w-4 [&_.relative]:h-1 sm:[&_.relative]:h-1.5 [&_.bg-secondary]:bg-brand/20"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 tabular-nums min-w-[32px] sm:min-w-[40px] text-right">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleSeek(-10)}
                  disabled={isLoading}
                  className="w-7 h-7 sm:w-10 sm:h-10 rounded-full text-slate-500 flex items-center justify-center hover:bg-brand/5 hover:text-brand transition-all flex-shrink-0 disabled:opacity-50 relative"
                  title="Rewind 10s"
                >
                  <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] font-black mt-[1px] sm:mt-[2px]">
                    10
                  </span>
                </button>

                <button
                  onClick={togglePlay}
                  disabled={isLoading}
                  className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center hover:bg-brand hover:text-white transition-all active:scale-95 shadow-sm flex-shrink-0 disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeek(10)}
                  disabled={isLoading}
                  className="w-7 h-7 sm:w-10 sm:h-10 rounded-full text-slate-500 flex items-center justify-center hover:bg-brand/5 hover:text-brand transition-all flex-shrink-0 disabled:opacity-50 relative"
                  title="Forward 10s"
                >
                  <RotateCw className="w-5 h-5 sm:w-5 sm:h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-[6px] sm:text-[8px] font-black mt-[1px] sm:mt-[2px]">
                    10
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-4 ml-1 sm:ml-2">
                <Volume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-500 flex-shrink-0" />
                <div className="w-12 sm:w-28">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    disabled={isLoading}
                    className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 sm:[&_[role=slider]]:h-4 sm:[&_[role=slider]]:w-4 [&_.relative]:h-1 sm:[&_.relative]:h-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-black text-brand bg-brand/5 hover:bg-brand/10 transition-colors uppercase tracking-tight outline-none"
                  >
                    <span>{playbackRate}x</span>
                    <Settings2 className="w-3 h-3 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-24 min-w-[5rem] p-1 rounded-xl shadow-xl border-brand/10"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`text-xs font-bold rounded-lg cursor-pointer ${
                        playbackRate === rate
                          ? "bg-brand text-white focus:bg-brand focus:text-white"
                          : "text-slate-600 focus:bg-brand/10 focus:text-brand"
                      }`}
                    >
                      {rate}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={toggleFullscreen}
                disabled={isLoading}
                className="w-8 h-8 sm:w-12 sm:h-12 text-slate-500 hover:text-brand flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
              >
                <Maximize className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export const AudioPlayer = React.forwardRef<HTMLAudioElement, MediaPlayerProps>(
  ({ src, onPlay, onTimeUpdate, onEnded, title, autoPlay }, ref) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Sync external ref
    useEffect(() => {
      if (typeof ref === "function") {
        ref(audioRef.current);
      } else if (ref) {
        ref.current = audioRef.current;
      }
    }, [ref]);

    const togglePlay = async () => {
      if (audioRef.current && !isLoading) {
        try {
          if (isPlaying) {
            audioRef.current.pause();
          } else {
            await audioRef.current.play();
          }
        } catch (error) {
          console.error("Audio playback error:", error);
        }
      }
    };

    const handleInternalPlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handleInternalPause = () => {
      setIsPlaying(false);
    };

    const handleInternalTimeUpdate = (
      e: React.SyntheticEvent<HTMLAudioElement>
    ) => {
      const element = e.currentTarget;
      setCurrentTime(element.currentTime);
      onTimeUpdate?.(element);
    };

    const handleSliderChange = (value: number[]) => {
      if (audioRef.current) {
        audioRef.current.currentTime = value[0];
        setCurrentTime(value[0]);
      }
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0];
      setVolume(newVolume);
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
      }
    };

    const handleSpeedChange = (rate: number) => {
      setPlaybackRate(rate);
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }
    };

    const handleSeek = (seconds: number) => {
      if (audioRef.current) {
        const newTime = audioRef.current.currentTime + seconds;
        audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    // ─── Media Session: Metadata ───────────────────────────────────────
    useEffect(() => {
      MediaSession.setMetadata({
        title: title || "Dr. M Audio",
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
    }, [title]);

    // ─── Media Session: Action Handlers (registered ONCE on mount) ─────
    useEffect(() => {
      MediaSession.setActionHandler({ action: "play" }, () => {
        audioRef.current?.play().catch(console.error);
      });
      MediaSession.setActionHandler({ action: "pause" }, () => {
        audioRef.current?.pause();
      });
      MediaSession.setActionHandler({ action: "seekbackward" }, (details) => {
        const skipTime = details.seekTime ?? 10;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(
            0,
            audioRef.current.currentTime - skipTime
          );
        }
      });
      MediaSession.setActionHandler({ action: "seekforward" }, (details) => {
        const skipTime = details.seekTime ?? 10;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(
            audioRef.current.duration || 0,
            audioRef.current.currentTime + skipTime
          );
        }
      });
      MediaSession.setActionHandler(
        { action: "seekto" as any },
        (details: any) => {
          if (audioRef.current && typeof details.seekTime === "number") {
            audioRef.current.currentTime = details.seekTime;
          }
        }
      );
      return () => {
        (
          ["play", "pause", "seekbackward", "seekforward", "seekto"] as any[]
        ).forEach((action) => {
          try {
            MediaSession.setActionHandler({ action }, null);
          } catch {}
        });
      };
    }, []); // empty deps — register handlers only once

    // ─── Media Session: Playback State (updates on play/pause) ─────────
    useEffect(() => {
      MediaSession.setPlaybackState({
        playbackState: isPlaying ? "playing" : "paused",
      });
    }, [isPlaying]);

    // ─── Media Session: Position State (throttled to max once per 5s) ──
    const lastAudioPositionUpdateRef = useRef(0);
    useEffect(() => {
      const now = Date.now();
      if (
        audioRef.current &&
        audioRef.current.duration &&
        now - lastAudioPositionUpdateRef.current >= 5000
      ) {
        lastAudioPositionUpdateRef.current = now;
        try {
          MediaSession.setPositionState({
            duration: duration || 0,
            playbackRate: playbackRate,
            position: Math.min(currentTime, duration || 0),
          });
        } catch (e) {}
      }
    }, [currentTime, duration, playbackRate]);
    // ─── End Media Session ─────────────────────────────────────────────

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-br from-slate-100 via-brand/[0.05] to-brand/[0.05] rounded-xl p-4 sm:p-6 shadow-xl shadow-black/[0.07] border border-brand/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none opacity-50" />

        <audio
          ref={audioRef}
          src={src}
          onPlay={handleInternalPlay}
          onPause={handleInternalPause}
          onTimeUpdate={handleInternalTimeUpdate}
          onEnded={onEnded}
          autoPlay={autoPlay}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onLoadStart={() => setIsLoading(true)}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          controlsList="nodownload"
          className="hidden"
        />

        <div
          className={`flex flex-col gap-4 sm:gap-6 relative z-10 transition-opacity duration-300 ${
            isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative">
              <div
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-brand to-brand/80 flex items-center justify-center text-white shadow-lg shadow-brand/30 ring-2 ring-white/20 animate-spin"
                style={{
                  animationDuration: "20s",
                  animationPlayState: isPlaying ? "running" : "paused",
                }}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Music className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-lg font-bold text-slate-900 truncate">
                {title || "Now Playing"}
              </h4>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                <span
                  className={`w-1 h-1 sm:w-2 sm:h-2 rounded-full ${
                    isLoading
                      ? "bg-brand animate-pulse"
                      : isPlaying
                      ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                      : "bg-slate-300"
                  }`}
                />
                <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest truncate">
                  {isLoading ? "Loading..." : isPlaying ? "Playing" : "Paused"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handleSeek(-10)}
                disabled={isLoading}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-slate-400 flex items-center justify-center hover:bg-brand/5 hover:text-brand transition-all flex-shrink-0 disabled:opacity-50 relative"
                title="Rewind 10s"
              >
                <RotateCcw className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-black mt-[1px] sm:mt-[2px]">
                  10
                </span>
              </button>

              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={togglePlay}
                disabled={isLoading}
                className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white text-slate-900 hover:bg-brand hover:text-white transition-all shadow-sm border border-slate-200 flex-shrink-0 flex items-center justify-center disabled:opacity-50"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-current ml-0.5" />
                )}
              </motion.button>

              <button
                onClick={() => handleSeek(10)}
                disabled={isLoading}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full text-slate-400 flex items-center justify-center hover:bg-brand/5 hover:text-brand transition-all flex-shrink-0 disabled:opacity-50 relative"
                title="Forward 10s"
              >
                <RotateCw className="w-5 h-5 sm:w-5 sm:h-5" />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-black mt-[1px] sm:mt-[2px]">
                  10
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSliderChange}
                disabled={isLoading}
                className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 sm:[&_[role=slider]]:h-4 sm:[&_[role=slider]]:w-4 [&_.relative]:h-1 sm:[&_.relative]:h-1.5 [&_.bg-secondary]:bg-brand/20"
              />
            </div>

            <div className="flex justify-between items-center text-[9px] sm:text-xs font-bold text-slate-400 font-mono tracking-wider">
              <span className="text-slate-600">{formatTime(currentTime)}</span>

              <div className="flex items-center gap-1.5 sm:gap-4 bg-white/60 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-slate-200/40 shadow-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      disabled={isLoading}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black text-brand hover:bg-brand/5 transition-colors uppercase tracking-tight outline-none"
                    >
                      <span>{playbackRate}x</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="w-20 min-w-[4rem] p-1 rounded-xl shadow-xl border-brand/10"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <DropdownMenuItem
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`text-[10px] font-bold rounded-lg cursor-pointer ${
                          playbackRate === rate
                            ? "bg-brand text-white focus:bg-brand focus:text-white"
                            : "text-slate-600 focus:bg-brand/10 focus:text-brand"
                        }`}
                      >
                        {rate}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-3 bg-slate-200" />

                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                <div className="w-16 sm:w-24">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    disabled={isLoading}
                    className="cursor-pointer [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 sm:[&_[role=slider]]:h-3.5 sm:[&_[role=slider]]:w-3.5 [&_.relative]:h-1 sm:[&_.relative]:h-1.5 [&_.bg-secondary]:bg-brand/20"
                  />
                </div>
              </div>

              <span className="text-slate-500">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
AudioPlayer.displayName = "AudioPlayer";
