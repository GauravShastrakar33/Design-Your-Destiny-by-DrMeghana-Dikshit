import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { savePlaylist } from "@/lib/storage";

const usmPractices = [
  "Recognition",
  "Vibration Elevation",
  "Neurolinking",
  "EET",
  "Hoponopono",
  "Soul Connection",
  "Donald Duck",
  "Inner Child Healing",
  "Journaling",
];

const dydPractices = [
  "Wealth Code Activation 1",
  "Wealth Code Activation 2",
  "Wealth Code Activation 3",
  "Wealth Code Activation 4",
  "Birth Story Healing",
  "Adoption",
  "Miscarriage",
  "Cesarean",
  "Clearing the Birth Energy",
  "Pre-Birth Story Process",
  "Anxiety Relief Code 1",
  "Anxiety Relief Code 2",
  "Happiness Code Activation 1",
  "Happiness Code Activation 2",
  "Story Burning",
];

export default function DesignYourPracticePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);
  const [usmExpanded, setUsmExpanded] = useState(true);
  const [dydExpanded, setDydExpanded] = useState(true);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const togglePractice = (practice: string) => {
    setSelectedPractices((prev) =>
      prev.includes(practice)
        ? prev.filter((p) => p !== practice)
        : [...prev, practice]
    );
  };

  const handleSaveClick = () => {
    if (selectedPractices.length === 0) return;
    setShowNameDialog(true);
  };

  const handleConfirmSave = () => {
    if (!playlistName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your playlist.",
        variant: "destructive",
      });
      return;
    }

    savePlaylist({
      name: playlistName.trim(),
      practices: selectedPractices,
    });

    toast({
      title: "Playlist Saved!",
      description: `"${playlistName}" with ${selectedPractices.length} practices has been saved.`,
    });

    setShowNameDialog(false);
    setPlaylistName("");
    setSelectedPractices([]);

    setTimeout(() => {
      setLocation("/playlist");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-md mx-auto">
        <Header
          title="Design Your Practice"
          hasBackButton={true}
          onBack={() => setLocation("/")}
        >
          <p className="text-sm text-muted-foreground">
            {selectedPractices.length} selected
          </p>
        </Header>

        <div className="px-4 py-6 space-y-4">
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <button
              onClick={() => setUsmExpanded(!usmExpanded)}
              className="w-full p-4 flex items-center justify-between hover-elevate active-elevate-2"
              data-testid="button-toggle-usm"
            >
              <h2 className="text-lg font-semibold text-foreground">
                USM Practices
              </h2>
              {usmExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {usmExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="border-t border-border">
                    {usmPractices.map((practice, index) => (
                      <div
                        key={practice}
                        className={`flex items-center gap-3 px-4 py-3 hover-elevate ${
                          index !== usmPractices.length - 1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >
                        <Checkbox
                          id={`usm-${practice}`}
                          checked={selectedPractices.includes(practice)}
                          onCheckedChange={() => togglePractice(practice)}
                          data-testid={`checkbox-${practice
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        />
                        <label
                          htmlFor={`usm-${practice}`}
                          className="flex-1 text-sm font-medium text-foreground cursor-pointer"
                        >
                          {practice}
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <button
              onClick={() => setDydExpanded(!dydExpanded)}
              className="w-full p-4 flex items-center justify-between hover-elevate active-elevate-2"
              data-testid="button-toggle-dyd"
            >
              <h2 className="text-lg font-semibold text-foreground">
                DYD Practices
              </h2>
              {dydExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence>
              {dydExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="border-t border-border">
                    {dydPractices.map((practice, index) => (
                      <div
                        key={practice}
                        className={`flex items-center gap-3 px-4 py-3 hover-elevate ${
                          index !== dydPractices.length - 1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >
                        <Checkbox
                          id={`dyd-${practice}`}
                          checked={selectedPractices.includes(practice)}
                          onCheckedChange={() => togglePractice(practice)}
                          data-testid={`checkbox-${practice
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        />
                        <label
                          htmlFor={`dyd-${practice}`}
                          className="flex-1 text-sm font-medium text-foreground cursor-pointer"
                        >
                          {practice}
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleSaveClick}
              className="w-full h-12 text-base font-semibold"
              disabled={selectedPractices.length === 0}
              data-testid="button-save-playlist"
            >
              Save My Playlist ({selectedPractices.length})
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-name-playlist">
          <DialogHeader>
            <DialogTitle>Name Your Playlist</DialogTitle>
            <DialogDescription>
              Give your custom practice playlist a memorable name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="playlist-name" className="text-sm font-medium">
              Playlist Name
            </Label>
            <Input
              id="playlist-name"
              placeholder="e.g., Morning Routine"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirmSave();
                }
              }}
              className="mt-2"
              data-testid="input-playlist-name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNameDialog(false);
                setPlaylistName("");
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              data-testid="button-confirm-save"
            >
              Save Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
