import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Video,
  Music,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CmsLesson, CmsLessonFile } from "@shared/schema";
import { AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PdfViewerModal } from "@/components/PdfViewerModal";

interface LessonFileWithUrl extends CmsLessonFile {
  signedUrl: string | null;
}

interface LessonResponse {
  lesson: CmsLesson;
  files: LessonFileWithUrl[];
}

export default function SpiritualBreathLessonPage() {
  const params = useParams();
  const lessonId = params.lessonId;
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<LessonResponse>({
    queryKey: ["/api/public/v1/lessons", lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/lessons/${lessonId}`);
      if (!response.ok) throw new Error("Failed to fetch lesson");
      return response.json();
    },
    enabled: !!lessonId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto p-4">
          <button
            onClick={() => setLocation("/")}
            className="hover-elevate active-elevate-2 rounded-lg p-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div
            className="text-center py-12 text-muted-foreground"
            data-testid="text-error"
          >
            Breath lesson not found
          </div>
        </div>
      </div>
    );
  }

  const { lesson, files } = data;
  const videoFile = files.find((f) => f.fileType === "video");
  const audioFile = files.find((f) => f.fileType === "audio");
  const scriptFile = files.find((f) => f.fileType === "script");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <Header
          title={lesson.title}
          hasBackButton={true}
          onBack={() => setLocation("/spiritual-breaths")}
        />

        <div className="p-4 space-y-6">
          {lesson.description && (
            <p
              className="text-muted-foreground whitespace-pre-line"
              data-testid="text-lesson-description"
            >
              {lesson.description}
            </p>
          )}

          {videoFile && videoFile.signedUrl && (
            <Card className="overflow-hidden">
              <video
                ref={videoRef}
                controls
                className="w-full aspect-video bg-black"
                src={videoFile.signedUrl}
                data-testid="video-player"
              >
                Your browser does not support the video tag.
              </video>
            </Card>
          )}

          {audioFile && audioFile.signedUrl && (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Music className="w-5 h-5 text-cyan-500" />
                <span className="font-medium text-foreground">
                  Breath Audio
                </span>
              </div>
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioFile.signedUrl}
                data-testid="audio-player"
              >
                Your browser does not support the audio tag.
              </audio>
            </Card>
          )}

          {scriptFile && scriptFile.signedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                      Practice Instructions
                    </h3>
                  </div>
                </div>
                <Button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="w-full sm:w-auto rounded-xl px-6 h-10 bg-white text-brand font-bold flex items-center justify-center gap-2.5 transition-all active:scale-95 border border-brand group"
                >
                  <Sparkles className="w-4 h-4 text-brand/80 transition-colors" />
                  <span>View Notes</span>
                </Button>
              </div>

              <PdfViewerModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                url={scriptFile.signedUrl}
                title={`${lesson.title} - Instructions`}
              />
            </motion.div>
          )}

          {files.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No content available for this breath lesson yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
