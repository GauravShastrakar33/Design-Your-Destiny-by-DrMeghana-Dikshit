import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AudioPlayer } from "@/components/AudioPlayer";

interface SpiritualBreath {
  id: number;
  title: string;
  description: string;
  videoUrl: string | null;
  audioUrl: string | null;
  displayOrder: number;
}

export default function SpiritualBreathsPage() {
  const [, setLocation] = useLocation();

  const { data: breaths = [], isLoading } = useQuery<SpiritualBreath[]>({
    queryKey: ["/api/spiritual-breaths"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page-bg pb-20 flex items-center justify-center">
        <div className="text-gray-500">Loading spiritual breaths...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="py-4 relative flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="absolute left-4 hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-500 tracking-wider font-['Montserrat'] uppercase whitespace-nowrap">
              SPIRITUAL BREATHS
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {breaths.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No spiritual breaths available yet
            </div>
          ) : (
            breaths.map((session) => (
              <div
                key={session.id}
                className="space-y-3"
                data-testid={`breathwork-${session.id}`}
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {session.title}
                  </h3>
                  <p className="text-sm text-gray-600">{session.description}</p>
                </div>

                {session.videoUrl ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      className="w-full h-full"
                      controls
                      controlsList="nodownload"
                      src={session.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-600">
                      <p className="text-sm">Video coming soon</p>
                      <p className="text-xs mt-1">{session.title}</p>
                    </div>
                  </div>
                )}

                {session.audioUrl ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Guided Affirmation
                    </h4>
                    <AudioPlayer
                      src={session.audioUrl}
                      title={session.title}
                      mode="basic"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      Guided Affirmation
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <button className="w-10 h-10 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand w-0 rounded-full" />
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Audio coming soon
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
