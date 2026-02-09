import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useParams, useLocation, useSearch } from "wouter";
import { ArrowLeft, Loader2, Video, Music, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef } from "react";
import type { CmsLesson, CmsLessonFile } from "@shared/schema";

interface LessonFileWithUrl extends CmsLessonFile {
  signedUrl: string | null;
}

interface LessonResponse {
  lesson: CmsLesson;
  files: LessonFileWithUrl[];
}

export default function ProcessLessonPage() {
  const params = useParams();
  const lessonId = params.lessonId;
  const [location, setLocation] = useLocation();
  const [hasLoggedActivity, setHasLoggedActivity] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const fromAbundance = searchParams.get("from") === "abundance";
  const courseId = searchParams.get("courseId");
  const moduleId = searchParams.get("moduleId");
  const isMasterclass = location.startsWith("/masterclasses");

  const handleBack = () => {
    if (isMasterclass && courseId) {
      setLocation(`/masterclasses/course/${courseId}`);
    } else {
      setLocation("/processes");
    }
  };

  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  const logActivityMutation = useMutation({
    mutationFn: async (params: { lessonId: number; lessonName: string }) => {
      const res = await apiRequest("POST", "/api/v1/activity/log", {
        lessonId: params.lessonId,
        lessonName: params.lessonName,
        featureType: "PROCESS",
        activityDate: new Date().toISOString().split("T")[0],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === "/api/v1/activity/monthly-stats",
      });
    },
  });

  const logActivity = (lessonId: number, lessonName: string) => {
    // Only track activity from "All Processes" route (not from Masterclasses, Abundance, etc.)
    const isFromAllProcesses =
      location.startsWith("/processes/lesson") && !fromAbundance;

    if (!hasLoggedActivity && isAuthenticated && isFromAllProcesses) {
      setHasLoggedActivity(true);
      logActivityMutation.mutate({ lessonId, lessonName });
    }
  };

  const handlePlay = (lessonId: number, lessonName: string) => {
    logActivity(lessonId, lessonName);
  };

  const handleTimeUpdate = (
    element: HTMLVideoElement | HTMLAudioElement,
    lessonId: number,
    lessonName: string
  ) => {
    if (element.duration && element.currentTime >= element.duration * 0.5) {
      logActivity(lessonId, lessonName);
    }
  };

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
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-gray-400 font-bold text-sm tracking-wide">
          Loading Lesson...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Header
          title="Lesson Not Found"
          hasBackButton={true}
          onBack={handleBack}
        />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Oops! Lesson not found
          </h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
            The lesson you're looking for might have been moved or doesn't
            exist.
          </p>
          <Button
            onClick={handleBack}
            className="rounded-xl font-bold px-8 bg-brand hover:bg-brand/90"
          >
            Back to Processes
          </Button>
        </main>
      </div>
    );
  }

  const { lesson, files } = data;
  const videoFile = files.find((f) => f.fileType === "video");
  const audioFile = files.find((f) => f.fileType === "audio");
  const scriptFile = files.find((f) => f.fileType === "script");

  const pauseAudioIfPlaying = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  };

  const pauseVideoIfPlaying = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header title={lesson.title} hasBackButton={true} onBack={handleBack} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {videoFile && videoFile.signedUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden border-0 shadow-2xl shadow-black/[0.05] rounded-2xl bg-black">
              <video
                ref={videoRef}
                src={videoFile.signedUrl}
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                playsInline
                className="w-full aspect-video"
                data-testid="video-player"
                onPlay={() => {
                  pauseAudioIfPlaying();
                  handlePlay(lesson.id, lesson.title);
                }}
                onTimeUpdate={(e) =>
                  handleTimeUpdate(e.currentTarget, lesson.id, lesson.title)
                }
              />
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-black/[0.02] overflow-hidden"
        >
          <div className="p-4 pb-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Lesson Title
            </h3>
            <h1 className="text-lg font-bold text-gray-900 leading-tight pb-2">
              {lesson.title}
            </h1>
          </div>

          {lesson.description && (
            <div className="p-4 pt-0">
              <div className="pt-2 border-t border-primary-light">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Description
                </h3>
                <p
                  className="text-gray-600 whitespace-pre-line text-sm leading-relaxed"
                  data-testid="text-lesson-description"
                >
                  {lesson.description}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {audioFile && audioFile.signedUrl && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-0 shadow-lg shadow-black/[0.03] rounded-2xl bg-white group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                  <Music className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">Experience Audio</h3>
              </div>
              <audio
                ref={audioRef}
                src={audioFile.signedUrl}
                controls
                controlsList="nodownload noplaybackrate"
                className="w-full custom-audio"
                data-testid="audio-player"
                onPlay={() => {
                  pauseVideoIfPlaying();
                  handlePlay(lesson.id, lesson.title);
                }}
                onTimeUpdate={(e) =>
                  handleTimeUpdate(e.currentTarget, lesson.id, lesson.title)
                }
              />
            </Card>
          </motion.div>
        )}

        {scriptFile && (scriptFile.scriptHtml || scriptFile.extractedText) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 sm:p-8 border-0 shadow-lg shadow-black/[0.03] rounded-2xl bg-white">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900">
                  Transcription & Notes
                </h3>
              </div>

              <div className="prose prose-slate max-w-none prose-p:text-gray-600 prose-headings:text-gray-900 prose-p:leading-relaxed prose-sm">
                {scriptFile.scriptHtml ? (
                  <div
                    data-testid="text-script-content"
                    dangerouslySetInnerHTML={{ __html: scriptFile.scriptHtml }}
                  />
                ) : (
                  <div
                    className="whitespace-pre-wrap"
                    data-testid="text-script-content"
                  >
                    {scriptFile.extractedText}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {files.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">
              No content available for this lesson yet
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
