import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoPlayerProps {
  videoId?: string;
  title?: string;
  author?: string;
  description?: string;
  thumbnail?: string;
  url?: string;
}

interface LastWatchedData {
  videoId: string;
  title: string;
  thumbnail: string;
  author?: string;
  progressInSeconds: number;
}

export default function VideoPlayerPage() {
  const [location, setLocation] = useLocation();
  const [player, setPlayer] = useState<any>(null);
  const [showSpeedDialog, setShowSpeedDialog] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const saveIntervalRef = useRef<number | null>(null);

  // Get video data from URL params or state
  const searchParams = new URLSearchParams(window.location.search);
  const videoId = searchParams.get("videoId") || "";
  const title = searchParams.get("title") || "Video";
  const author = searchParams.get("author") || "";
  const description = searchParams.get("description") || "";
  const thumbnail = searchParams.get("thumbnail") || "";
  const url = searchParams.get("url") || "";

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string => {
    if (!url) return "";
    
    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/clip\/)([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return "";
  };

  const youtubeId = getYouTubeVideoId(url) || videoId;

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
    if (duration > 0 && (currentTime / duration) > 0.95) {
      // Remove from last watched if completed
      localStorage.removeItem("last-watched");
    }
  };

  // Initialize YouTube Player
  useEffect(() => {
    if (!youtubeId) return;

    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      const savedProgress = getSavedProgress();
      
      const newPlayer = new (window as any).YT.Player("youtube-player", {
        videoId: youtubeId,
        playerVars: {
          autoplay: 1,
          start: savedProgress,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setPlayer(event.target);
            
            // Start saving progress every 5 seconds
            saveIntervalRef.current = window.setInterval(() => {
              if (event.target && event.target.getCurrentTime) {
                const currentTime = event.target.getCurrentTime();
                const duration = event.target.getDuration();
                saveProgress(currentTime);
                checkIfCompleted(currentTime, duration);
              }
            }, 5000);
          },
          onStateChange: (event: any) => {
            // Save on pause or end
            if (event.data === (window as any).YT.PlayerState.PAUSED || 
                event.data === (window as any).YT.PlayerState.ENDED) {
              if (event.target && event.target.getCurrentTime) {
                const currentTime = event.target.getCurrentTime();
                const duration = event.target.getDuration();
                saveProgress(currentTime);
                checkIfCompleted(currentTime, duration);
              }
            }
          },
        },
      });
      setPlayer(newPlayer);
    };

    // Cleanup
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          console.error("Error destroying player:", error);
        }
      }
    };
  }, [youtubeId]);

  // Handle playback speed change
  const handleSpeedChange = (speed: number) => {
    if (player && isReady) {
      player.setPlaybackRate(speed);
      setCurrentSpeed(speed);
      setShowSpeedDialog(false);
    }
  };

  const speedOptions = [0.5, 1, 1.25, 1.5, 2];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Top App Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                // Save final progress before leaving
                if (player && player.getCurrentTime) {
                  const currentTime = player.getCurrentTime();
                  saveProgress(currentTime);
                }
                setLocation("/workshops");
              }}
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
        <div className="w-full aspect-video bg-black">
          <div id="youtube-player" className="w-full h-full" ref={playerRef} data-testid="video-player"></div>
        </div>

        {/* Video Info */}
        <div className="px-4 py-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="video-title">
              {title}
            </h1>
            {author && (
              <p className="text-sm text-muted-foreground" data-testid="video-author">
                {author}
              </p>
            )}
          </div>

          {description && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="video-description">
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
