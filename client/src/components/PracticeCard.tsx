import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SegmentedControl from "./SegmentedControl";
import { AudioPlayer } from "./AudioPlayer";
import { audioLibrary } from "@/lib/audioLibrary";

interface PracticeCardProps {
  title: string;
  icon: LucideIcon;
  practiceId?: number;
  videoUrl?: string;
  audioUrl?: string;
  script?: string;
  testId?: string;
}

export default function PracticeCard({ title, icon: Icon, practiceId, videoUrl, audioUrl, script, testId }: PracticeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFormat, setActiveFormat] = useState<"Video" | "Audio" | "Script">("Video");

  const audioFile = practiceId 
    ? audioLibrary.practices.find(p => p.id === practiceId)
    : null;

  return (
    <Card className="overflow-hidden" data-testid={testId}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-3 hover-elevate active-elevate-2"
        data-testid={`button-expand-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <span className="flex-1 text-left font-medium text-foreground">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              <SegmentedControl
                options={["Video", "Audio", "Script"]}
                selected={activeFormat}
                onChange={(val) => setActiveFormat(val as typeof activeFormat)}
                testId={`format-selector-${title.toLowerCase().replace(/\s+/g, '-')}`}
              />

              <div className="pt-2">
                {activeFormat === "Video" && (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center" data-testid="video-player">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Video Player</p>
                      <p className="text-xs mt-1">{title}</p>
                    </div>
                  </div>
                )}

                {activeFormat === "Audio" && (
                  <>
                    {audioFile ? (
                      <AudioPlayer
                        src={audioFile.file}
                        title={title}
                        mode="basic"
                      />
                    ) : (
                      <div className="bg-muted rounded-lg p-4 flex items-center gap-3" data-testid="audio-placeholder">
                        <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <div className="h-1.5 bg-background rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/3 rounded-full" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Audio coming soon</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeFormat === "Script" && (
                  <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto" data-testid="script-text">
                    <p className="text-sm leading-relaxed text-foreground">
                      {script || `Begin by finding a comfortable seated position. Close your eyes gently and take a deep breath in through your nose, filling your lungs completely. Hold for a moment at the top, then slowly exhale through your mouth. 

As you continue to breathe naturally, bring your awareness to the present moment. Notice any sensations in your body, any thoughts passing through your mind, without judgment or attachment.

This practice will help you connect with your inner wisdom and cultivate a sense of peace and clarity.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
