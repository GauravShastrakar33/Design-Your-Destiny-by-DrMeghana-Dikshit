import { ListMusic, Play } from "lucide-react";

export default function MyPracticePlaylistPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Practice Playlist</h1>
        <p className="text-muted-foreground mb-8">
          Your personalized practice collection
        </p>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <ListMusic className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              No Practices Yet
            </h2>
            <p className="text-muted-foreground max-w-xs">
              Design your practice to create your custom playlist
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
