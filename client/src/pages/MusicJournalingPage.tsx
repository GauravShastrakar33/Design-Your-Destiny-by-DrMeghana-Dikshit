import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { AudioPlayer } from "@/components/AudioPlayer";
import { audioLibrary } from "@/lib/audioLibrary";

export default function MusicJournalingPage() {
  const [, setLocation] = useLocation();
  const [currentTrackId, setCurrentTrackId] = useState<number | string | null>(null);

  const tracks = audioLibrary.journalingAudios;

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
              <h1 className="text-2xl font-bold text-foreground">
                Music Journaling
              </h1>
              <p className="text-sm text-muted-foreground">
                Theta wave audio collection
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className="overflow-hidden"
              data-testid={`audio-${track.id}`}
            >
              <div className="p-4">
                <AudioPlayer
                  src={track.file}
                  title={track.title}
                  mode="basic"
                  isActive={currentTrackId === track.id}
                  onPlay={() => setCurrentTrackId(track.id)}
                  onEnded={() => setCurrentTrackId(null)}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
