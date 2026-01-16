import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ListMusic,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  Pencil,
  X,
  Check,
  Music,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { AudioPlayer } from "@/components/AudioPlayer";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import type { Playlist, PlaylistItem } from "@shared/schema";

interface PlaylistWithItems {
  playlist: Playlist;
  items: (PlaylistItem & {
    lesson?: { id: number; title: string };
    audioFiles: { id: number; fileName: string; signedUrl: string | null }[];
  })[];
}

interface PlaylistSourceData {
  course: { id: number; title: string } | null;
  modules: {
    id: number;
    title: string;
    lessons: {
      id: number;
      title: string;
      audioFiles: { id: number; fileName: string; signedUrl: string | null }[];
    }[];
  }[];
}

export default function MyPracticePlaylistPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [expandedPlaylistId, setExpandedPlaylistId] = useState<number | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<number | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [playlistToRename, setPlaylistToRename] = useState<Playlist | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [lessonPickerOpen, setLessonPickerOpen] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<number | null>(null);
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
  const [editMode, setEditMode] = useState<number | null>(null);

  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  
  // Store playing playlist items snapshot - independent of UI expansion state
  const [playingItems, setPlayingItems] = useState<PlaylistWithItems["items"]>([]);

  const { data: playlists = [], isLoading: playlistsLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/public/v1/playlists"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  });

  const { data: expandedPlaylistData, isLoading: expandedLoading } = useQuery<PlaylistWithItems>({
    queryKey: ["/api/public/v1/playlists", expandedPlaylistId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!expandedPlaylistId && isAuthenticated,
  });

  const { data: playlistSource, isLoading: sourceLoading } = useQuery<PlaylistSourceData>({
    queryKey: ["/api/public/v1/playlist/source"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: lessonPickerOpen && isAuthenticated,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/public/v1/playlists", { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      setCreateDialogOpen(false);
      setCreateTitle("");
      toast({ title: "Playlist created!" });
    },
    onError: () => {
      toast({ title: "Failed to create playlist", variant: "destructive" });
    },
  });

  const renamePlaylistMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const res = await apiRequest("PATCH", `/api/public/v1/playlists/${id}`, { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      setRenameDialogOpen(false);
      setPlaylistToRename(null);
      setNewTitle("");
      toast({ title: "Playlist renamed!" });
    },
    onError: () => {
      toast({ title: "Failed to rename playlist", variant: "destructive" });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/public/v1/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      setPlaylistToDelete(null);
      if (currentPlaylistId === playlistToDelete) {
        handleStopPlaylist();
      }
      toast({ title: "Playlist deleted!" });
    },
    onError: () => {
      toast({ title: "Failed to delete playlist", variant: "destructive" });
    },
  });

  const setItemsMutation = useMutation({
    mutationFn: async ({ playlistId, lessonIds }: { playlistId: number; lessonIds: number[] }) => {
      const res = await apiRequest("POST", `/api/public/v1/playlists/${playlistId}/items`, { lessonIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists", editingPlaylistId] });
      setLessonPickerOpen(false);
      setEditingPlaylistId(null);
      setSelectedLessonIds([]);
      toast({ title: "Playlist updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update playlist", variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ playlistId, itemId }: { playlistId: number; itemId: number }) => {
      await apiRequest("DELETE", `/api/public/v1/playlists/${playlistId}/items/${itemId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists", variables.playlistId] });
      toast({ title: "Item removed!" });
    },
    onError: () => {
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  const reorderItemsMutation = useMutation({
    mutationFn: async ({ playlistId, orderedItemIds }: { playlistId: number; orderedItemIds: number[] }) => {
      await apiRequest("PATCH", `/api/public/v1/playlists/${playlistId}/items/reorder`, { orderedItemIds });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/v1/playlists", variables.playlistId] });
    },
    onError: () => {
      toast({ title: "Failed to reorder items", variant: "destructive" });
    },
  });

  // Activity logging mutation for AI Insights
  const logActivityMutation = useMutation({
    mutationFn: async (params: { lessonId: number; lessonName: string }) => {
      const res = await apiRequest("POST", "/api/v1/activity/log", {
        lessonId: params.lessonId,
        lessonName: params.lessonName,
        featureType: "PROCESS",
        activityDate: new Date().toISOString().split('T')[0],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey[0] === "/api/v1/activity/monthly-stats"
      });
    },
  });

  // Track which lessons have been logged this session to avoid duplicate logs
  const loggedLessonsRef = useRef<Set<number>>(new Set());

  const logPlaylistActivity = (lessonId: number, lessonName: string) => {
    if (!isAuthenticated) return;
    if (loggedLessonsRef.current.has(lessonId)) return;
    
    loggedLessonsRef.current.add(lessonId);
    logActivityMutation.mutate({ lessonId, lessonName });
  };

  const handleOpenRename = (playlist: Playlist) => {
    setPlaylistToRename(playlist);
    setNewTitle(playlist.title);
    setRenameDialogOpen(true);
  };

  const handleRename = () => {
    if (!playlistToRename || !newTitle.trim()) return;
    renamePlaylistMutation.mutate({ id: playlistToRename.id, title: newTitle.trim() });
  };

  const handleCreate = () => {
    if (!createTitle.trim()) return;
    createPlaylistMutation.mutate(createTitle.trim());
  };

  const handleOpenLessonPicker = (playlistId: number) => {
    setEditingPlaylistId(playlistId);
    const playlistData = expandedPlaylistData?.items || [];
    setSelectedLessonIds(playlistData.map((item) => item.lessonId));
    setLessonPickerOpen(true);
  };

  const handleToggleLesson = (lessonId: number) => {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleSaveLessons = () => {
    if (!editingPlaylistId) return;
    setItemsMutation.mutate({ playlistId: editingPlaylistId, lessonIds: selectedLessonIds });
  };

  const handlePlayPlaylist = (playlistId: number) => {
    // Capture items snapshot when playback starts (independent of UI state)
    const items = expandedPlaylistData?.items || [];
    setPlayingItems(items);
    setCurrentPlaylistId(playlistId);
    setCurrentTrackIndex(0);
    setInitialTime(0);
    setIsPlayingPlaylist(true);
    // Activity is logged only when tracks complete (in handleTrackEnded)
  };

  const handleStopPlaylist = () => {
    setCurrentPlaylistId(null);
    setCurrentTrackIndex(0);
    setIsPlayingPlaylist(false);
    setInitialTime(0);
    setPlayingItems([]);
  };

  const handleTrackEnded = () => {
    // Log the track that just completed
    const completedItem = playingItems[currentTrackIndex];
    if (completedItem) {
      const lessonName = completedItem.lesson?.title || `Lesson ${completedItem.lessonId}`;
      logPlaylistActivity(completedItem.lessonId, lessonName);
    }
    
    // Advance to next track or stop
    if (currentTrackIndex < playingItems.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setInitialTime(0);
    } else {
      handleStopPlaylist();
    }
  };

  const getCurrentAudio = () => {
    if (!currentPlaylistId || playingItems.length === 0) return null;
    const item = playingItems[currentTrackIndex];
    if (!item || !item.audioFiles.length) return null;
    const audioFile = item.audioFiles[0];
    return {
      url: audioFile.signedUrl,
      title: item.lesson?.title || audioFile.fileName,
    };
  };

  const currentAudio = getCurrentAudio();

  const handleReorder = (newOrder: PlaylistWithItems["items"]) => {
    if (!expandedPlaylistId || !expandedPlaylistData) return;
    const orderedItemIds = newOrder.map((item) => item.id);
    reorderItemsMutation.mutate({ playlistId: expandedPlaylistId, orderedItemIds });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F3F3F3" }}>
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-white border-b border-border z-10">
            <div className="px-4 py-4 flex items-center gap-4">
              <button
                onClick={() => setLocation("/")}
                className="hover-elevate active-elevate-2 rounded-lg p-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-base font-semibold text-gray-500" style={{ fontFamily: "Montserrat" }}>
                  MY PROCESS
                </h1>
              </div>
              <div className="w-10"></div>
            </div>
          </div>

          <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
              <ListMusic className="w-8 h-8 text-brand" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 max-w-xs mb-4">
              Please log in to create and manage your practice playlists.
            </p>
            <Button onClick={() => setLocation("/login")} style={{ backgroundColor: "#703DFA" }} data-testid="button-login">
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (playlistsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F3F3F3" }}>
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-white border-b border-border z-10">
            <div className="px-4 py-4 flex items-center gap-4">
              <button
                onClick={() => setLocation("/")}
                className="hover-elevate active-elevate-2 rounded-lg p-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-xl font-semibold text-gray-500" style={{ fontFamily: "Montserrat" }}>
                  MY PROCESS
                </h1>
              </div>
              <div className="w-10"></div>
            </div>
          </div>

          <div className="px-4 py-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#F3F0FF" }}>
                  <ListMusic className="w-10 h-10" style={{ color: "#703DFA" }} />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No Processes Yet</h2>
                <p className="text-muted-foreground max-w-xs">Create your first custom practice playlist</p>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-4 border-0"
                  style={{ backgroundColor: "#703DFA" }}
                  data-testid="button-create-playlist"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Playlist
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-create-playlist">
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
              <DialogDescription>Give your playlist a name to get started.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="e.g., Morning Ritual"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                data-testid="input-playlist-title"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!createTitle.trim() || createPlaylistMutation.isPending}
                style={{ backgroundColor: "#703DFA" }}
                data-testid="button-confirm-create"
              >
                {createPlaylistMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-base font-semibold text-gray-500" style={{ fontFamily: "Montserrat" }}>
                MY PROCESS
              </h1>
            </div>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-add-playlist"
            >
              <Plus className="w-6 h-6" style={{ color: "#703DFA" }} />
            </button>
          </div>
        </div>

        <div className="px-4 py-6 space-y-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden bg-white" data-testid={`playlist-${playlist.id}`}>
              <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F3F0FF" }}>
                  <ListMusic className="w-6 h-6" style={{ color: "#703DFA" }} />
                </div>
                <button
                  onClick={() => setExpandedPlaylistId(expandedPlaylistId === playlist.id ? null : playlist.id)}
                  className="flex-1 text-left hover-elevate active-elevate-2 rounded-lg py-1"
                  data-testid={`button-expand-${playlist.id}`}
                >
                  <h3 className="font-semibold text-foreground">{playlist.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(playlist.createdAt).toLocaleDateString()}
                  </p>
                </button>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenRename(playlist)}
                    className="p-2 hover-elevate active-elevate-2 rounded-lg"
                    data-testid={`button-rename-${playlist.id}`}
                  >
                    <Pencil className="w-4 h-4" style={{ color: "#703DFA" }} />
                  </button>
                  <button
                    onClick={() => setExpandedPlaylistId(expandedPlaylistId === playlist.id ? null : playlist.id)}
                    className="p-2 hover-elevate active-elevate-2 rounded-lg"
                    data-testid={`button-toggle-${playlist.id}`}
                  >
                    {expandedPlaylistId === playlist.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedPlaylistId === playlist.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-3">
                      {expandedLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-brand" />
                        </div>
                      ) : (
                        <>
                          {expandedPlaylistData?.items.length === 0 ? (
                            <div className="text-center py-2">
                              <p className="text-muted-foreground text-sm">No items in this playlist yet.</p>
                            </div>
                          ) : expandedPlaylistData?.items && expandedPlaylistData.items.length > 0 ? (
                            <div className="space-y-2">
                              {expandedPlaylistData.items.map((item, index) => (
                                <div
                                  key={item.id}
                                  className={`flex items-center gap-2 text-sm ${
                                    currentPlaylistId === playlist.id && currentTrackIndex === index
                                      ? "text-brand font-semibold"
                                      : "text-foreground"
                                  }`}
                                  data-testid={`practice-item-${index}`}
                                >
                                  <div
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: "#703DFA" }}
                                  />
                                  <span className="font-medium">{item.lesson?.title || `Lesson ${item.lessonId}`}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {currentPlaylistId === playlist.id && isPlayingPlaylist && currentAudio && (
                            <div className="pt-2">
                              <AudioPlayer
                                src={currentAudio.url || ""}
                                title={currentAudio.title}
                                mode="playlist"
                                autoPlay={true}
                                initialTime={initialTime}
                                onEnded={handleTrackEnded}
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-2 flex-wrap">
                            {(expandedPlaylistData?.items?.length || 0) > 0 && (
                              <Button
                                className="flex-1 border-0"
                                style={{ backgroundColor: "#703DFA", color: "white" }}
                                onClick={() =>
                                  currentPlaylistId === playlist.id ? handleStopPlaylist() : handlePlayPlaylist(playlist.id)
                                }
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
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenLessonPicker(playlist.id)}
                              data-testid={`button-edit-items-${playlist.id}`}
                            >
                              <Plus className="w-4 h-4" style={{ color: "#703DFA" }} />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setPlaylistToDelete(playlist.id)}
                              data-testid={`button-delete-${playlist.id}`}
                            >
                              <Trash2 className="w-4 h-4" style={{ color: "#703DFA" }} />
                            </Button>
                          </div>
                        </>
                      )}
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
            <AlertDialogDescription>This action cannot be undone. This will permanently delete your playlist.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playlistToDelete && deletePlaylistMutation.mutate(playlistToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deletePlaylistMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-rename-playlist">
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
            <DialogDescription>Enter a new name for your playlist.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name"
              data-testid="input-rename-title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} data-testid="button-cancel-rename">
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!newTitle.trim() || renamePlaylistMutation.isPending}
              style={{ backgroundColor: "#703DFA" }}
              data-testid="button-confirm-rename"
            >
              {renamePlaylistMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-create-playlist">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>Give your playlist a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Morning Ritual"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              data-testid="input-playlist-title"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createTitle.trim() || createPlaylistMutation.isPending}
              style={{ backgroundColor: "#703DFA" }}
              data-testid="button-confirm-create"
            >
              {createPlaylistMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonPickerOpen} onOpenChange={setLessonPickerOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-lesson-picker">
          <DialogHeader>
            <DialogTitle>Select Lessons</DialogTitle>
            <DialogDescription>Choose audio lessons to add to your playlist.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {sourceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            ) : !playlistSource?.course ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No content available yet. Please check back later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {playlistSource.modules.map((module) => (
                  <div key={module.id} className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">{module.title}</h4>
                    <div className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const selectionIndex = selectedLessonIds.indexOf(lesson.id);
                        const isSelected = selectionIndex !== -1;
                        const hasAudio = lesson.audioFiles.length > 0;
                        if (!hasAudio) return null;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleToggleLesson(lesson.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isSelected ? "bg-brand/10 border border-brand" : "bg-gray-50 hover:bg-gray-100"
                            }`}
                            data-testid={`lesson-option-${lesson.id}`}
                          >
                            <Music className="w-4 h-4 text-brand flex-shrink-0" />
                            <span className="flex-1 text-left text-sm">{lesson.title}</span>
                            {isSelected && (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: "#703DFA" }}
                              >
                                {selectionIndex + 1}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setLessonPickerOpen(false)} data-testid="button-cancel-lessons">
              Cancel
            </Button>
            <Button
              onClick={handleSaveLessons}
              disabled={selectedLessonIds.length === 0 || setItemsMutation.isPending}
              style={{ backgroundColor: "#703DFA" }}
              data-testid="button-save-lessons"
            >
              {setItemsMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Save (${selectedLessonIds.length} selected)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
