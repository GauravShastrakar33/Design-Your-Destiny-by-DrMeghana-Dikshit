import { useState, useEffect } from "react";
import { ListMusic, Trash2, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { getPlaylists, deletePlaylist, type SavedPlaylist } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function MyPracticePlaylistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = () => {
    setPlaylists(getPlaylists());
  };

  const handleDelete = (id: string) => {
    deletePlaylist(id);
    setPlaylistToDelete(null);
    loadPlaylists();
    toast({
      title: "Playlist Deleted",
      description: "Your playlist has been removed.",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (playlists.length === 0) {
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
                No Playlists Yet
              </h2>
              <p className="text-muted-foreground max-w-xs">
                Design your practice to create your custom playlist
              </p>
              <Button
                onClick={() => setLocation("/design-practice")}
                className="mt-4"
                data-testid="button-create-playlist"
              >
                Create Your First Playlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Playlists</h1>
            <p className="text-sm text-muted-foreground">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/design-practice")}
            data-testid="button-new-playlist"
          >
            New Playlist
          </Button>
        </div>

        <div className="space-y-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden" data-testid={`playlist-${playlist.id}`}>
              <button
                onClick={() => setExpandedPlaylist(
                  expandedPlaylist === playlist.id ? null : playlist.id
                )}
                className="w-full p-4 flex items-center gap-3 hover-elevate active-elevate-2"
                data-testid={`button-expand-${playlist.id}`}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ListMusic className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {playlist.practices.length} practices • {formatDate(playlist.createdAt)}
                  </p>
                </div>
                {expandedPlaylist === playlist.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {expandedPlaylist === playlist.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        {playlist.practices.map((practice, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-foreground"
                            data-testid={`practice-item-${index}`}
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {practice}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => console.log('Play playlist:', playlist.name)}
                          data-testid={`button-play-${playlist.id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPlaylistToDelete(playlist.id)}
                          data-testid={`button-delete-${playlist.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your playlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playlistToDelete && handleDelete(playlistToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
