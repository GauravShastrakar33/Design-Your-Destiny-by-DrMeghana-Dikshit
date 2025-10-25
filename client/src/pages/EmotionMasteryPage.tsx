import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

const emotions = [
  {
    id: "anxiety",
    title: "Anxiety",
    gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
    videos: ["Anxiety Code 1", "Anxiety Code 2"],
    audios: ["Anxiety Relief Audio 1", "Anxiety Relief Audio 2"]
  },
  {
    id: "anger",
    title: "Anger",
    gradient: "bg-gradient-to-br from-red-400 to-red-600",
    videos: ["Anger Management Part 1", "Anger Management Part 2"],
    audios: ["Calm Anger Audio 1", "Release Anger Audio 2"]
  },
  {
    id: "stress",
    title: "Stress",
    gradient: "bg-gradient-to-br from-orange-400 to-orange-600",
    videos: ["Stress Relief Session 1", "Stress Relief Session 2"],
    audios: ["De-stress Audio 1", "Relaxation Audio 2"]
  },
  {
    id: "self-love",
    title: "Self Love",
    gradient: "bg-gradient-to-br from-pink-400 to-pink-600",
    videos: ["Self Love Practice 1", "Self Love Practice 2"],
    audios: ["Self Compassion Audio 1", "Love Yourself Audio 2"]
  }
];

export default function EmotionMasteryPage() {
  const [, setLocation] = useLocation();
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setLocation("/")}
                className="hover-elevate active-elevate-2 rounded-lg p-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="text-2xl font-bold text-foreground">Emotion Mastery</h1>
            </div>

            {/* Segmented Control */}
            <div className="flex gap-2 bg-muted rounded-xl p-1">
              <button
                onClick={() => setMediaType("video")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  mediaType === "video"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                data-testid="button-video-tab"
              >
                Video
              </button>
              <button
                onClick={() => setMediaType("audio")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  mediaType === "audio"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
                data-testid="button-audio-tab"
              >
                Audio
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {emotions.map((emotion) => (
            <Card key={emotion.id} className="overflow-hidden" data-testid={`card-${emotion.id}`}>
              <div className={`${emotion.gradient} p-4`}>
                <h2 className="text-white text-xl font-bold">{emotion.title}</h2>
              </div>
              <div className="p-4 space-y-2">
                {(mediaType === "video" ? emotion.videos : emotion.audios).map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover-elevate active-elevate-2"
                    data-testid={`${emotion.id}-${mediaType}-${index}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{item}</p>
                      <p className="text-xs text-muted-foreground">
                        {mediaType === "video" ? "12:45" : "15:20"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
