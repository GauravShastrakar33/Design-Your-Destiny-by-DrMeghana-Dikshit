import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const breathworkSessions = [
  {
    id: 1,
    title: "Memory Development Breath",
    description:
      "Start your day with revitalizing and memory development Breath",
  },
  {
    id: 2,
    title: "Calming Evening Breath",
    description: "Wind down and prepare for restful sleep",
  },
  {
    id: 3,
    title: "Stress Release Breathing",
    description: "Release tension and find inner peace",
  },
  {
    id: 4,
    title: "Focus & Clarity Breath",
    description: "Enhance mental clarity and concentration",
  },
];

export default function SpiritualBreathsPage() {
  const [, setLocation] = useLocation();

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
            <h1 className="text-2xl font-bold text-foreground">
              Spiritual Breaths
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {breathworkSessions.map((session) => (
            <div
              key={session.id}
              className="space-y-3"
              data-testid={`breathwork-${session.id}`}
            >
              <div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {session.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {session.description}
                </p>
              </div>

              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Video Tutorial</p>
                  <p className="text-xs mt-1">{session.title}</p>
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Guided Affirmation
                </h4>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-primary-foreground"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-0 rounded-full" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      0:00 / 3:24
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
