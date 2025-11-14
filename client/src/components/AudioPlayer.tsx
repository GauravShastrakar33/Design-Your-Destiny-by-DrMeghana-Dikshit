import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AudioPlayerProps {
  src: string;
  title: string;
  mode?: "basic" | "playlist";
  userId?: string;
  audioId?: string | number;
  playlistId?: string;
  isActive?: boolean;
  onPlay?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  initialTime?: number;
  onProgressUpdate?: (time: number, duration: number) => void;
  onComplete?: () => void;
}

export function AudioPlayer({
  src,
  title,
  mode = "basic",
  userId,
  audioId,
  playlistId,
  isActive,
  onPlay,
  onEnded,
  autoPlay = false,
  initialTime = 0,
  onProgressUpdate,
  onComplete,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasTracked90Percent, setHasTracked90Percent] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      
      // Call onProgressUpdate for playlist mode
      if (mode === "playlist" && onProgressUpdate) {
        onProgressUpdate(audio.currentTime, audio.duration);
      }
    };
    
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onEnded, mode, onProgressUpdate]);

  useEffect(() => {
    if (mode === "playlist" && duration > 0 && !hasTracked90Percent) {
      const progress = (currentTime / duration) * 100;
      if (progress >= 90) {
        trackProgress();
        setHasTracked90Percent(true);
        
        // Call onComplete callback for 90% completion
        if (onComplete) {
          onComplete();
        }
      }
    }
  }, [currentTime, duration, mode, hasTracked90Percent, onComplete]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive === false && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(0);
    setHasTracked90Percent(false);
    audio.load();

    // Set initial time if provided (for resume feature)
    if (initialTime > 0) {
      audio.currentTime = initialTime;
      setCurrentTime(initialTime);
    }

    if (autoPlay) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [src, autoPlay, initialTime]);

  const trackProgress = async () => {
    if (!userId || !audioId || !playlistId) return;
    
    try {
      await fetch("/api/track-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          audioId,
          playlistId,
          progress: 90,
        }),
      });
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      if (onPlay) {
        onPlay();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (value: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    const speed = parseFloat(value);
    audio.playbackRate = speed;
    setPlaybackRate(speed);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 space-y-3" data-testid="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        <Button
          size="icon"
          onClick={togglePlayPause}
          className="w-12 h-12 rounded-full flex-shrink-0 bg-brand hover:bg-brand/90 text-brand-foreground"
          data-testid="button-play-pause"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5" fill="currentColor" />
          )}
        </Button>

        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium text-gray-900 truncate" data-testid="text-audio-title">
            {title}
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand"
              style={{
                background: `linear-gradient(to right, hsl(var(--brand-purple)) 0%, hsl(var(--brand-purple)) ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`,
              }}
              data-testid="input-audio-seek"
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span data-testid="text-current-time">{formatTime(currentTime)}</span>
              <span data-testid="text-duration">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <Select value={playbackRate.toString()} onValueChange={handleSpeedChange}>
          <SelectTrigger className="w-20 h-9" data-testid="select-speed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
