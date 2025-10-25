import { ArrowLeft, Play, Pause } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

const thetaMusic = [
  {
    id: 1,
    title: "Deep Theta Meditation",
    duration: "30:00",
    description: "Perfect for deep relaxation and meditation"
  },
  {
    id: 2,
    title: "Theta Healing Waves",
    duration: "25:00",
    description: "Healing frequencies for emotional release"
  },
  {
    id: 3,
    title: "Creative Theta Flow",
    duration: "20:00",
    description: "Enhance creativity and inspiration"
  },
  {
    id: 4,
    title: "Sleep Inducing Theta",
    duration: "45:00",
    description: "Fall asleep naturally with theta waves"
  },
  {
    id: 5,
    title: "Morning Theta Boost",
    duration: "15:00",
    description: "Start your day with calm energy"
  }
];

export default function MusicJournalingPage() {
  const [, setLocation] = useLocation();
  const [playingId, setPlayingId] = useState<number | null>(null);

  const togglePlay = (id: number) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Music Journaling</h1>
              <p className="text-sm text-muted-foreground">Theta wave audio collection</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {thetaMusic.map((audio) => (
            <Card key={audio.id} className="p-4" data-testid={`audio-${audio.id}`}>
              <div className="flex items-start gap-4">
                <button
                  onClick={() => togglePlay(audio.id)}
                  className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover-elevate active-elevate-2"
                  data-testid={`button-play-${audio.id}`}
                >
                  {playingId === audio.id ? (
                    <Pause className="w-6 h-6 text-primary" fill="currentColor" />
                  ) : (
                    <Play className="w-6 h-6 text-primary" fill="currentColor" />
                  )}
                </button>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{audio.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{audio.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{audio.duration}</span>
                    {playingId === audio.id && (
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-primary rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
