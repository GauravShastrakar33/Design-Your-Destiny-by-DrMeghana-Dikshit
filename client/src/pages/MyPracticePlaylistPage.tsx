import { useState, useEffect } from "react";
import { ListMusic, Trash2, Play, Pause, ChevronDown, ChevronUp, Bell, BellOff } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { getPlaylists, deletePlaylist, updatePlaylist, type SavedPlaylist } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/AudioPlayer";
import { findAudioByTitle } from "@/lib/audioLibrary";

export default function MyPracticePlaylistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<SavedPlaylist[]>([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedPlaylistForReminder, setSelectedPlaylistForReminder] = useState<SavedPlaylist | null>(null);
  const [reminderTime, setReminderTime] = useState("");
  
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);

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

  const handleSetReminder = (playlist: SavedPlaylist) => {
    setSelectedPlaylistForReminder(playlist);
    setReminderTime(playlist.reminderTime || "");
    setReminderDialogOpen(true);
  };

  const handleSaveReminder = () => {
    if (!selectedPlaylistForReminder) return;

    if (!reminderTime) {
      toast({
        title: "Time Required",
        description: "Please select a reminder time.",
        variant: "destructive",
      });
      return;
    }

    updatePlaylist(selectedPlaylistForReminder.id, {
      reminderTime: reminderTime,
    });

    loadPlaylists();
    setReminderDialogOpen(false);
    setSelectedPlaylistForReminder(null);
    setReminderTime("");

    toast({
      title: "Reminder Set!",
      description: `Daily reminder set for ${formatTime(reminderTime)}`,
    });
  };

  const handleRemoveReminder = () => {
    if (!selectedPlaylistForReminder) return;

    updatePlaylist(selectedPlaylistForReminder.id, {
      reminderTime: undefined,
    });

    loadPlaylists();
    setReminderDialogOpen(false);
    setSelectedPlaylistForReminder(null);
    setReminderTime("");

    toast({
      title: "Reminder Removed",
      description: "Your reminder has been cleared.",
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handlePlayPlaylist = (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    setCurrentTrackIndex(0);
    setIsPlayingPlaylist(true);
  };

  const handleStopPlaylist = () => {
    setCurrentPlaylistId(null);
    setCurrentTrackIndex(0);
    setIsPlayingPlaylist(false);
  };

  const handleTrackEnded = () => {
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    if (!currentPlaylist) return;

    if (currentTrackIndex < currentPlaylist.practices.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else {
      handleStopPlaylist();
    }
  };

  const getCurrentAudio = () => {
    if (!currentPlaylistId) return null;
    
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist) return null;

    const practiceName = playlist.practices[currentTrackIndex];
    return findAudioByTitle(practiceName);
  };

  const currentAudio = getCurrentAudio();

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
                  {playlist.reminderTime && (
                    <div className="flex items-center gap-1 mt-1">
                      <Bell className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary font-medium">
                        {formatTime(playlist.reminderTime)}
                      </span>
                    </div>
                  )}
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
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className={currentPlaylistId === playlist.id && currentTrackIndex === index ? "font-semibold text-primary" : "font-medium"}>
                              {practice}
                            </span>
                          </div>
                        ))}
                      </div>

                      {currentPlaylistId === playlist.id && isPlayingPlaylist && currentAudio && (
                        <div className="pt-2">
                          <AudioPlayer
                            src={currentAudio.file}
                            title={currentAudio.title}
                            mode="basic"
                            autoPlay={true}
                            onEnded={handleTrackEnded}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => currentPlaylistId === playlist.id ? handleStopPlaylist() : handlePlayPlaylist(playlist.id)}
                          data-testid={`button-play-${playlist.id}`}
                        >
                          {currentPlaylistId === playlist.id ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Stop
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Play
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSetReminder(playlist)}
                          data-testid={`button-reminder-${playlist.id}`}
                        >
                          {playlist.reminderTime ? (
                            <Bell className="w-4 h-4" fill="currentColor" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
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

      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-set-reminder">
          <DialogHeader>
            <DialogTitle>Set Daily Reminder</DialogTitle>
            <DialogDescription>
              Choose a time to be reminded about "{selectedPlaylistForReminder?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reminder-time" className="text-sm font-medium">
              Reminder Time
            </Label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-2"
              data-testid="input-reminder-time"
            />
            <p className="text-xs text-muted-foreground mt-2">
              You'll receive a daily notification at this time
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedPlaylistForReminder?.reminderTime && (
              <Button
                variant="outline"
                onClick={handleRemoveReminder}
                className="w-full sm:w-auto"
                data-testid="button-remove-reminder"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Remove Reminder
              </Button>
            )}
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={() => {
                  setReminderDialogOpen(false);
                  setSelectedPlaylistForReminder(null);
                  setReminderTime("");
                }}
                className="flex-1"
                data-testid="button-cancel-reminder"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveReminder}
                className="flex-1"
                data-testid="button-save-reminder"
              >
                Save Reminder
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
