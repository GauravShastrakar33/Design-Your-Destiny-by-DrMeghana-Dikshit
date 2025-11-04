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
  const videoRef = useRef<HTMLVideoElement>(null);

  // ✅ Get values from URL
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get("videoId") || "";
  const title = params.get("title") || "Video";
  const author = params.get("author") || "";
  const description = params.get("description") || "";
  const thumbnail = params.get("thumbnail") || "";
  const videoUrl = params.get("url") || "";

  // ✅ Correct final video path
  const finalVideoUrl = videoUrl.startsWith("http")
    ? videoUrl
    : `${window.location.origin}${videoUrl}`;

  // ✅ Load saved progress
  useEffect(() => {
    const savedProgress = params.get("progress"); // ✅ read from URL

    if (savedProgress && videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current!.currentTime = parseInt(savedProgress);
      };
    }
  }, []);

  // ✅ Save progress every 5 seconds
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    if (currentTime % 5 === 0) {
      localStorage.setItem(
        "last-watched",
        JSON.stringify({
          videoId,
          title,
          thumbnail,
          author,
          url: finalVideoUrl, // ✅ store the actual video URL
          progressInSeconds: currentTime,
        }),
      );
    }
  };

  // ✅ Remove "last-watched" when 95% is completed
  const handleEnded = () => {
    localStorage.removeItem("last-watched");
  };

  const handleBack = () => {
    if (videoRef.current) {
      localStorage.setItem(
        "last-watched",
        JSON.stringify({
          videoId,
          title,
          thumbnail,
          author,
          url: finalVideoUrl, // ✅ Include video URL too!
          progressInSeconds: Math.floor(videoRef.current.currentTime),
        }),
      );
    }
    setLocation("/workshops");
  };

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedDialog(false);
  };

  const speedOptions = [0.5, 1, 1.25, 1.5, 2];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Top Bar */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <button onClick={handleBack} className="p-2 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSpeedDialog(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* ✅ Native HTML5 Video Player */}
        <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
          <video
            ref={videoRef}
            src={finalVideoUrl}
            controls
            playsInline
            style={{ width: "100%", height: "100%" }}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={() =>
              console.error("❌ Video failed to load:", finalVideoUrl)
            }
          />
        </div>

        {/* Video Info */}
        <div className="px-4 py-6 space-y-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          {author && <p className="text-sm text-muted-foreground">{author}</p>}
          {description && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Speed Dialog */}
        <Dialog open={showSpeedDialog} onOpenChange={setShowSpeedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Playback Speed</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`w-full px-4 py-3 rounded-lg text-left ${
                    currentSpeed === speed
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
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
