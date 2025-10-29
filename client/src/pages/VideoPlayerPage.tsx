import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { useLocation } from "wouter";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LastWatchedData {
  videoId: string;
  title: string;
  thumbnail: string;
  author?: string;
  progressInSeconds: number;
}

export default function VideoPlayerPage() {
  const [, setLocation] = useLocation();
  const [showSpeedDialog, setShowSpeedDialog] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<any>(null);
  const saveIntervalRef = useRef<number | null>(null);

  // Get video data from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const videoId = searchParams.get("videoId") || "";
  const title = searchParams.get("title") || "Video";
  const author = searchParams.get("author") || "";
  const description = searchParams.get("description") || "";
  const thumbnail = searchParams.get("thumbnail") || "";
  const videoUrl = searchParams.get("url") || "";

  // Extract YouTube video ID from URL for storage key
  const youtubeId = videoId;

  // Load saved progress
  const getSavedProgress = (): number => {
    try {
      const saved = localStorage.getItem("last-watched");
      if (saved) {
        const data: LastWatchedData = JSON.parse(saved);
        if (data.videoId === youtubeId) {
          return data.progressInSeconds;
        }
      }
    } catch (error) {
      console.error("Error loading saved progress:", error);
    }
    return 0;
  };

  const savedProgress = getSavedProgress();

  // Save progress to localStorage
  const saveProgress = (currentTime: number) => {
    if (!youtubeId) return;

    try {
      const data: LastWatchedData = {
        videoId: youtubeId,
        title,
        thumbnail,
        author,
        progressInSeconds: Math.floor(currentTime),
      };
      localStorage.setItem("last-watched", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Check if video is completed (>95%)
  const checkIfCompleted = (currentTime: number, duration: number) => {
    if (duration > 0 && currentTime / duration > 0.95) {
      localStorage.removeItem("last-watched");
    }
  };

  // Handle player ready
  const handleReady = () => {
    setIsReady(true);

    // Seek to saved progress if available
    if (savedProgress > 0 && playerRef.current) {
      playerRef.current.seekTo(savedProgress, "seconds");
    }
  };

  // Handle player progress
  const handleProgress = (state: any) => {
    if (!hasStarted) {
      setHasStarted(true);
    }

    const playedSeconds = state.playedSeconds;
    setCurrentTime(playedSeconds);

    const duration = playerRef.current?.getDuration() || 0;

    saveProgress(playedSeconds);
    checkIfCompleted(playedSeconds, duration);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, []);

  // Handle playback speed change
  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    setShowSpeedDialog(false);
  };

  const handleBack = () => {
    // Save final progress before leaving
    saveProgress(currentTime);
    setLocation("/workshops");
  };

  const speedOptions = [0.5, 1, 1.25, 1.5, 2];

  console.log("Video URL inside player:", videoUrl);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Top App Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSpeedDialog(true)}
              data-testid="button-speed-settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Player */}
        <div
          className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black"
          data-testid="video-player"
        >
          {/* @ts-ignore - ReactPlayer types are incompatible with current setup */}
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            controls
            playing={true}
            width="100%"
            height="100%"
            playsinline={true}
            playbackRate={currentSpeed}
            onReady={handleReady}
            onProgress={handleProgress}
            progressInterval={5000}
            style={{ borderRadius: "12px", backgroundColor: "black" }}
          />
        </div>

        {/* Video Info */}
        <div className="px-4 py-6 space-y-4">
          <div>
            <h1
              className="text-2xl font-bold text-foreground mb-2"
              data-testid="video-title"
            >
              {title}
            </h1>
            {author && (
              <p
                className="text-sm text-muted-foreground"
                data-testid="video-author"
              >
                {author}
              </p>
            )}
          </div>

          {description && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Description
              </h3>
              <p
                className="text-sm text-muted-foreground whitespace-pre-wrap"
                data-testid="video-description"
              >
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Speed Control Dialog */}
        <Dialog open={showSpeedDialog} onOpenChange={setShowSpeedDialog}>
          <DialogContent data-testid="dialog-speed-settings">
            <DialogHeader>
              <DialogTitle>Playback Speed</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`w-full px-4 py-3 rounded-lg text-left hover-elevate active-elevate-2 ${
                    currentSpeed === speed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                  data-testid={`speed-option-${speed}`}
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
