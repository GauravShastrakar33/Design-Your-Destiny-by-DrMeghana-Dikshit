import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useParams, useLocation, useSearch } from "wouter";
import { Loader2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoPlayer, AudioPlayer } from "@/components/MediaPlayers";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect, useCallback } from "react";
import type {
  CmsLesson,
  CmsLessonFile,
  CmsModule,
  CmsModuleFolder,
} from "@shared/schema";

interface LessonFileWithUrl extends CmsLessonFile {
  signedUrl: string | null;
}

interface LessonResponse {
  lesson: CmsLesson;
  files: LessonFileWithUrl[];
}

interface ModuleLessonsResponse {
  module: CmsModule;
  folders: CmsModuleFolder[];
  lessons: CmsLesson[];
}

import { useAuth } from "@/contexts/AuthContext";

// ... existing imports ...

export default function ProcessLessonPage() {
  const params = useParams();
  const lessonId = params.lessonId;
  const [location, setLocation] = useLocation();
  const [hasLoggedActivity, setHasLoggedActivity] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const searchString =
    useSearch() ||
    (window.location.hash.includes("?")
      ? window.location.hash.split("?")[1]
      : "");
  const searchParams = new URLSearchParams(searchString);
  const fromAbundance = searchParams.get("from") === "abundance";
  const courseId = searchParams.get("courseId");
  const moduleId = searchParams.get("moduleId");
  const isMasterclass = location.startsWith("/masterclasses");

  const handleBack = useCallback(() => {
    if (isMasterclass && courseId) {
      setLocation(`/masterclasses/course/${courseId}`);
    } else {
      // Navigate back to processes with the correct type
      const type = params.type || "dyd";
      setLocation(`/processes/${type.toLowerCase()}`);
    }
  }, [isMasterclass, courseId, params.type, setLocation]);

  const { isAuthenticated } = useAuth();

  const logActivityMutation = useMutation({
    mutationFn: async (params: { lessonId: number; lessonName: string }) => {
      const res = await apiRequest("POST", "/api/v1/activity/log", {
        lessonId: params.lessonId,
        lessonName: params.lessonName,
        featureType: "PROCESS",
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
    // Track activity from both new (/processes/:type/lesson) and legacy (/processes/lesson) routes
    const isFromAllProcesses =
      location.includes("/processes/") &&
      location.includes("/lesson/") &&
      !fromAbundance &&
      !isMasterclass;

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
      // Use apiRequest even for public endpoints to ensure consistency with base URL handling
      const response = await apiRequest(
        "GET",
        `/api/public/v1/lessons/${lessonId}`
      );
      return response.json();
    },
    enabled: !!lessonId,
  });

  const effectiveModuleId = moduleId || data?.lesson?.moduleId;

  const { data: moduleData } = useQuery<ModuleLessonsResponse>({
    queryKey: ["/api/public/v1/modules", effectiveModuleId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/public/v1/modules/${effectiveModuleId}`
      );
      return response.json();
    },
    enabled: !!effectiveModuleId,
  });

  // Reset activity tracking when lesson changes
  useEffect(() => {
    setHasLoggedActivity(false);
  }, [lessonId]);

  const currentFolderId = data?.lesson?.folderId;
  const sameFolderLessons = moduleData?.lessons
    ? moduleData.lessons
        .filter((l) => l.folderId === currentFolderId)
        .sort((a, b) => a.position - b.position)
    : [];

  const currentIndex = sameFolderLessons.findIndex(
    (l) => l.id === Number(lessonId)
  );
  const prevLesson =
    currentIndex > 0 ? sameFolderLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex !== -1 && currentIndex < sameFolderLessons.length - 1
      ? sameFolderLessons[currentIndex + 1]
      : null;

  const navigateToLesson = (id: number) => {
    const type = params.type || "dyd";
    setLocation(
      `/processes/${type.toLowerCase()}/lesson/${id}?moduleId=${effectiveModuleId}`
    );
  };

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
        <main className="max-w-3xl mx-auto p-4 pt-3 text-center">
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
      <Header title="Lesson Details" hasBackButton={true} onBack={handleBack} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {videoFile && videoFile.signedUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <VideoPlayer
              ref={videoRef}
              src={videoFile.signedUrl}
              onPlay={() => {
                pauseAudioIfPlaying();
                handlePlay(lesson.id, lesson.title);
              }}
              onTimeUpdate={(element) =>
                handleTimeUpdate(element, lesson.id, lesson.title)
              }
            />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <AudioPlayer
              ref={audioRef}
              src={audioFile.signedUrl}
              title={lesson.title}
              onPlay={() => {
                pauseVideoIfPlaying();
                handlePlay(lesson.id, lesson.title);
              }}
              onTimeUpdate={(element) =>
                handleTimeUpdate(element, lesson.id, lesson.title)
              }
            />
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

        {(prevLesson || nextLesson) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 mt-4"
          >
            {prevLesson ? (
              <Button
                variant="outline"
                onClick={() => navigateToLesson(prevLesson.id)}
                className="w-full sm:flex-1 rounded-2xl h-14 flex items-center justify-start gap-4 px-5 border-brand/10 bg-white hover:bg-brand/5 hover:border-brand/30 transition-all group/prev"
              >
                <div className="w-8 h-8 rounded-full bg-brand/5 flex items-center justify-center text-brand group-hover/prev:scale-110 transition-transform">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-0.5">
                    Previous
                  </span>
                  <span className="text-sm font-bold text-slate-700 truncate w-full group-hover/prev:text-brand transition-colors">
                    {prevLesson.title}
                  </span>
                </div>
              </Button>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}

            {nextLesson ? (
              <Button
                onClick={() => navigateToLesson(nextLesson.id)}
                className="w-full sm:flex-1 rounded-2xl h-14 flex items-center justify-end gap-4 px-5 bg-brand hover:bg-brand/90 shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] group/next"
              >
                <div className="flex flex-col items-end min-w-0 text-right">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/50 mb-0.5">
                    Next
                  </span>
                  <span className="text-sm font-bold text-white truncate w-full">
                    {nextLesson.title}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white group-hover/next:scale-110 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Button>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
