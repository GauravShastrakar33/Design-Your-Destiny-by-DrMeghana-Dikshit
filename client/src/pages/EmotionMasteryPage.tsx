import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

const emotions = [
  {
    id: "anxiety",
    title: "Anxiety",
    videos: ["Anxiety Code 1", "Anxiety Code 2"],
    audios: ["Anxiety Relief Audio 1", "Anxiety Relief Audio 2"]
  },
  {
    id: "anger",
    title: "Anger",
    videos: ["Anger Management Part 1", "Anger Management Part 2"],
    audios: ["Calm Anger Audio 1", "Release Anger Audio 2"]
  },
  {
    id: "stress",
    title: "Stress",
    videos: ["Stress Relief Session 1", "Stress Relief Session 2"],
    audios: ["De-stress Audio 1", "Relaxation Audio 2"]
  },
  {
    id: "self-love",
    title: "Self Love",
    videos: ["Self Love Practice 1", "Self Love Practice 2"],
    audios: ["Self Compassion Audio 1", "Love Yourself Audio 2"]
  }
];

export default function EmotionMasteryPage() {
  const [, setLocation] = useLocation();
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");

  return (
    <div className="min-h-screen bg-page-bg pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="py-4 flex items-center justify-center relative">
            <button
              onClick={() => setLocation("/")}
              className="absolute left-4 hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>
            <h1 className="text-xl font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase">
              EMOTION MASTERY
            </h1>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-white border border-gray-200 p-1 rounded-lg inline-flex w-full max-w-xs mx-auto">
              <button
                onClick={() => setMediaType("video")}
                className={`flex-1 px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  mediaType === "video"
                    ? "bg-brand text-brand-foreground"
                    : "text-gray-600"
                }`}
                data-testid="button-video-tab"
              >
                Video
              </button>
              <button
                onClick={() => setMediaType("audio")}
                className={`flex-1 px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  mediaType === "audio"
                    ? "bg-brand text-brand-foreground"
                    : "text-gray-600"
                }`}
                data-testid="button-audio-tab"
              >
                Audio
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-3">
          {emotions.map((emotion) => (
            <Card key={emotion.id} className="overflow-hidden bg-white border border-gray-200" data-testid={`card-${emotion.id}`}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-gray-900 text-lg font-semibold">{emotion.title}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {(mediaType === "video" ? emotion.videos : emotion.audios).map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-4 bg-white"
                    data-testid={`${emotion.id}-${mediaType}-${index}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 text-white" fill="white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{item}</p>
                      <p className="text-xs text-gray-600">
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
