import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  Loader2,
  Check,
  Lock,
  Play,
  Sparkles,
  Trophy,
  FileText,
  Headphones,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
  CmsCourse,
  CmsModule,
  CmsLesson,
  CmsLessonFile,
} from "@shared/schema";
import { Header } from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";

interface LessonFileWithUrl extends CmsLessonFile {
  signedUrl: string | null;
}

interface CourseWithThumbnail extends CmsCourse {
  thumbnailUrl: string | null;
}

interface CourseResponse {
  course: CourseWithThumbnail;
  modules: CmsModule[];
}

interface ModuleResponse {
  module: CmsModule;
  folders: any[];
  lessons: CmsLesson[];
}

interface LessonResponse {
  lesson: CmsLesson;
  files: LessonFileWithUrl[];
}

interface FlattenedDay {
  lessonId: number;
  dayNumber: number;
  title: string;
  moduleId: number;
  moduleName: string;
}

export default function VideoFirstChallengePage() {
  const params = useParams();
  const courseId = params.courseId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [allDays, setAllDays] = useState<FlattenedDay[]>([]);
  const [watchProgress, setWatchProgress] = useState(0);
  const [hasReached90, setHasReached90] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  // Fetch course with modules
  const { data: courseData, isLoading: courseLoading } =
    useQuery<CourseResponse>({
      queryKey: ["/api/public/v1/courses", courseId],
      queryFn: async () => {
        const response = await fetch(`/api/public/v1/courses/${courseId}`);
        if (!response.ok) throw new Error("Failed to fetch course");
        return response.json();
      },
      enabled: !!courseId,
    });

  // Fetch all modules with their lessons
  const { data: modulesData, isLoading: modulesLoading } = useQuery<
    ModuleResponse[]
  >({
    queryKey: ["/api/public/v1/course-modules-lessons", courseId],
    queryFn: async () => {
      if (!courseData?.modules) return [];
      const modulePromises = courseData.modules.map(async (module) => {
        const response = await fetch(`/api/public/v1/modules/${module.id}`);
        if (!response.ok) throw new Error("Failed to fetch module");
        return response.json();
      });
      return Promise.all(modulePromises);
    },
    enabled: !!courseData?.modules?.length,
  });

  // Fetch lesson progress
  const { data: progressData, isLoading: progressLoading } = useQuery<{
    completedLessonIds: number[];
  }>({
    queryKey: ["/api/v1/lesson-progress"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/v1/lesson-progress");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const completedLessonIds = new Set(progressData?.completedLessonIds || []);

  // Flatten modules into linear days
  useEffect(() => {
    if (modulesData && modulesData.length > 0) {
      const days: FlattenedDay[] = [];
      let dayNumber = 1;

      modulesData.forEach((moduleData) => {
        moduleData.lessons.forEach((lesson) => {
          days.push({
            lessonId: lesson.id,
            dayNumber,
            title: lesson.title,
            moduleId: moduleData.module.id,
            moduleName: moduleData.module.title,
          });
          dayNumber++;
        });
      });

      setAllDays(days);
    }
  }, [modulesData]);

  // Auto-select first incomplete lesson
  useEffect(() => {
    if (allDays.length > 0 && currentDayIndex === null) {
      const firstIncompleteIndex = allDays.findIndex(
        (day) => !completedLessonIds.has(day.lessonId)
      );

      if (firstIncompleteIndex >= 0) {
        setCurrentDayIndex(firstIncompleteIndex);
      } else {
        // All complete - show last day or completion screen
        setCurrentDayIndex(allDays.length); // Special value for completion
      }
    }
  }, [allDays, completedLessonIds, currentDayIndex]);

  // Current day info
  const currentDay =
    currentDayIndex !== null && currentDayIndex < allDays.length
      ? allDays[currentDayIndex]
      : null;

  // Fetch current lesson content
  const { data: lessonData, isLoading: lessonLoading } =
    useQuery<LessonResponse>({
      queryKey: ["/api/public/v1/lessons", currentDay?.lessonId],
      queryFn: async () => {
        const response = await fetch(
          `/api/public/v1/lessons/${currentDay?.lessonId}`
        );
        if (!response.ok) throw new Error("Failed to fetch lesson");
        return response.json();
      },
      enabled: !!currentDay?.lessonId,
    });

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest(
        "POST",
        `/api/v1/lesson-progress/${lessonId}/complete`
      );
      return res.json();
    },
    onSuccess: (_data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/lesson-progress"] });

      // Find the next lesson
      const currentIndex = allDays.findIndex((d) => d.lessonId === lessonId);
      const nextIndex = currentIndex + 1;

      if (nextIndex < allDays.length) {
        toast({
          title: "Day complete! 🎉",
          description: "Next lesson unlocked",
        });
        // Auto-advance to next lesson after brief delay
        setTimeout(() => {
          setCurrentDayIndex(nextIndex);
          setWatchProgress(0);
          setHasReached90(false);
        }, 1500);
      } else {
        toast({
          title: "Congratulations! 🏆",
          description: "You've completed all lessons!",
        });
        setCurrentDayIndex(allDays.length); // Show completion screen
      }
    },
  });

  // Video progress tracking - triggers auto-complete at 90%
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && currentDay) {
      const video = videoRef.current;
      const progress = (video.currentTime / video.duration) * 100;
      setWatchProgress(progress);

      // Auto-complete at 90% if not already completed
      if (
        progress >= 90 &&
        !hasReached90 &&
        isAuthenticated &&
        !completedLessonIds.has(currentDay.lessonId)
      ) {
        setHasReached90(true);
        markCompleteMutation.mutate(currentDay.lessonId);
      }
    }
  }, [
    hasReached90,
    currentDay,
    isAuthenticated,
    completedLessonIds,
    markCompleteMutation,
  ]);

  // Audio progress tracking - triggers auto-complete at 90%
  const handleAudioTimeUpdate = useCallback(() => {
    if (audioRef.current && currentDay) {
      const audio = audioRef.current;
      const progress = (audio.currentTime / audio.duration) * 100;
      setWatchProgress(progress);

      // Auto-complete at 90% if not already completed
      if (
        progress >= 90 &&
        !hasReached90 &&
        isAuthenticated &&
        !completedLessonIds.has(currentDay.lessonId)
      ) {
        setHasReached90(true);
        markCompleteMutation.mutate(currentDay.lessonId);
      }
    }
  }, [
    hasReached90,
    currentDay,
    isAuthenticated,
    completedLessonIds,
    markCompleteMutation,
  ]);

  // Handle video/audio ended - no-op if already completed at 90%
  const handleMediaEnded = useCallback(() => {
    if (
      currentDay &&
      isAuthenticated &&
      !completedLessonIds.has(currentDay.lessonId) &&
      !hasReached90
    ) {
      markCompleteMutation.mutate(currentDay.lessonId);
    }
  }, [
    currentDay,
    isAuthenticated,
    completedLessonIds,
    hasReached90,
    markCompleteMutation,
  ]);

  // Reset progress when changing lessons
  useEffect(() => {
    setWatchProgress(0);
    setHasReached90(false);
    setShowAudioPlayer(false);
  }, [currentDay?.lessonId]);

  // Day click handler
  const handleDayClick = (index: number) => {
    const day = allDays[index];
    const isCompleted = completedLessonIds.has(day.lessonId);

    // Check if this day is unlocked (completed or is the current incomplete)
    const firstIncompleteIndex = allDays.findIndex(
      (d) => !completedLessonIds.has(d.lessonId)
    );
    const isUnlocked = isCompleted || index === firstIncompleteIndex;

    if (isUnlocked) {
      setCurrentDayIndex(index);
      setWatchProgress(0);
      setHasReached90(false);
    }
  };

  const handleBack = () => {
    setLocation("/money-mastery");
  };

  // Loading state
  if (courseLoading || modulesLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand mx-auto" />
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
            Preparing Your Journey...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (!courseData || allDays.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <Header title="Not Found" hasBackButton onBack={handleBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4 text-gray-300">
            <Sparkles className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Wait, designer!
          </h2>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">
            We couldn't find the lessons for this challenge. Let's head back and
            try again.
          </p>
          <Button
            onClick={handleBack}
            className="bg-brand text-white font-bold rounded-lg px-8"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Completion screen
  if (currentDayIndex !== null && currentDayIndex >= allDays.length) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header title="Challenge Complete" hasBackButton onBack={handleBack} />

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-2xl shadow-amber-500/30"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              Absolute Legend!
            </h1>
            <p className="text-gray-500 mb-5 max-w-sm text-sm  px-4">
              You've officially conquered all{" "}
              <span className="text-brand font-black">
                {allDays.length} days
              </span>{" "}
              of the {courseData.course.title}. Your mindset is rewired for
              victory!
            </p>

            <div className="w-full space-y-4">
              <Button
                size="lg"
                className="w-full bg-brand hover:bg-brand/90 text-white rounded-lg shadow-xl shadow-brand/20 transition-all active:scale-95"
                onClick={() => setCurrentDayIndex(0)}
              >
                <Play className="w-5 h-5 mr-3" />
                Rewatch Journey
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full font-semibold text-gray-400 hover:text-gray-900 transition-colors"
                onClick={handleBack}
              >
                Return to Mastery
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Get files
  const videoFile = lessonData?.files?.find(
    (f) => f.fileType === "video" && f.signedUrl
  );
  const audioFile = lessonData?.files?.find(
    (f) => f.fileType === "audio" && f.signedUrl
  );
  const pdfFile = lessonData?.files?.find(
    (f) => (f.fileType === "pdf" || f.fileType === "script") && f.signedUrl
  );

  const primaryPlayerType = videoFile
    ? "video"
    : audioFile
    ? "audio"
    : pdfFile
    ? "pdf"
    : "none";
  const hasMedia = videoFile || audioFile;
  const hasResources = pdfFile || (videoFile && audioFile);
  const isCurrentLessonCompleted = currentDay
    ? completedLessonIds.has(currentDay.lessonId)
    : false;

  const handleOpenPdf = () =>
    pdfFile?.signedUrl && window.open(pdfFile.signedUrl, "_blank");
  const handleSwitchToAudio = () => {
    setShowAudioPlayer(true);
    videoRef.current?.pause();
  };
  const handleSwitchToVideo = () => {
    setShowAudioPlayer(false);
    audioRef.current?.pause();
  };

  // For locking logic
  const firstIncompleteIndex = allDays.findIndex(
    (d) => !completedLessonIds.has(d.lessonId)
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-30">
        <Header
          title={`Day ${currentDay?.dayNumber} of ${allDays.length}`}
          hasBackButton={true}
          onBack={handleBack}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full pb-24 px-3">
        {/* Adaptive Player Stage */}
        <div className="w-full aspect-video bg-gray-900 rounded-2xl mt-4 overflow-hidden shadow-2xl shadow-black/20 relative">
          {lessonLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-white/20" />
            </div>
          ) : primaryPlayerType === "video" && !showAudioPlayer ? (
            <video
              ref={videoRef}
              src={videoFile!.signedUrl!}
              controls
              controlsList="nodownload"
              disablePictureInPicture
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleMediaEnded}
            />
          ) : (primaryPlayerType === "audio" || showAudioPlayer) &&
            audioFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-brand to-brand-dark p-8 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <Zap className="w-full h-full" />
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mb-8 border border-white/20 shadow-2xl"
              >
                <Headphones className="w-14 h-14 text-white" />
              </motion.div>
              <audio
                ref={audioRef}
                src={audioFile.signedUrl!}
                controls
                controlsList="nodownload noplaybackrate"
                className="w-full max-w-xs h-10 filter invert brightness-100 opacity-90"
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleMediaEnded}
              />
              {showAudioPlayer && videoFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-8 text-white/70 hover:text-white font-black text-xs uppercase tracking-widest"
                  onClick={handleSwitchToVideo}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Switch to Video
                </Button>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                <Play className="w-10 h-10 text-white/20" />
              </div>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                No Content Available
              </p>
            </div>
          )}
        </div>

        {/* Lesson Info Card */}
        <div className="px-5 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-brand tracking-wide mb-1">
              Current Day
            </p>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              Day {currentDay?.dayNumber}: {currentDay?.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isCurrentLessonCompleted ? (
              <div className="flex items-center gap-2 bg-emerald-50 content-none px-2 py-1 rounded-full border border-emerald-100">
                <div className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Check className="w-2 h-2 text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                  Complete
                </span>
              </div>
            ) : hasReached90 ? (
              <Button
                onClick={() =>
                  currentDay && markCompleteMutation.mutate(currentDay.lessonId)
                }
                disabled={markCompleteMutation.isPending}
                className=" text-white font-bold px-2 py-1 rounded-full hover:bg-brand/90 shadow-lg shadow-brand/20 transition-all"
              >
                {markCompleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Finish Day →"
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-2 content-none px-2 py-1 rounded-full border border-gray-200 bg-gray-50">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Learning...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Resources & Journey Grid */}
        <div className="px-5 grid grid-cols-1 md:grid-cols-12 gap-8 mt-2">
          {/* Journey Section (Mainly for Mobile) */}
          <div className="md:col-span-12 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                Your Journey
              </h3>
              <div className="h-px flex-1 bg-gray-200 mx-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allDays.map((day, index) => {
                const isCompleted = completedLessonIds.has(day.lessonId);
                const isCurrent = index === currentDayIndex;
                const isLocked =
                  !isCompleted &&
                  index !== firstIncompleteIndex &&
                  firstIncompleteIndex !== -1 &&
                  index > firstIncompleteIndex;

                return (
                  <motion.div
                    key={day.lessonId}
                    whileHover={!isLocked ? { y: -2 } : {}}
                    onClick={() => !isLocked && handleDayClick(index)}
                    className={`cursor-pointer p-2 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-brand/5 border-brand shadow-lg shadow-brand/5"
                        : isLocked
                        ? "opacity-70 pointer-events-none"
                        : "bg-white border-gray-200 hover:border-brand/30 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                            ? "bg-brand text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          day.dayNumber
                        )}
                      </div>
                      <div className="min-w-0 pr-2">
                        <p
                          className={`text-xs font-bold truncate ${
                            isCurrent ? "text-brand" : "text-gray-900"
                          }`}
                        >
                          Day {day.dayNumber}
                        </p>
                        <p className="text-xs text-gray-400 font-bold truncate">
                          {day.title}
                        </p>
                      </div>
                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 ml-auto text-gray-400" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Resources Section */}
          {hasResources && (
            <div className="md:col-span-12 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                  Bonus Materials
                </h3>
                <div className="h-px flex-1 bg-gray-100 mx-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pdfFile && (
                  <Card
                    onClick={handleOpenPdf}
                    className="p-4 bg-white border-0 shadow-xl shadow-black/[0.03] rounded-2xl group cursor-pointer hover:shadow-emerald-500/10 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6 text-emerald-500 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-gray-900">
                        Training Script
                      </h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        PDF Document
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-brand" />
                  </Card>
                )}
                {videoFile && audioFile && !showAudioPlayer && (
                  <Card
                    onClick={handleSwitchToAudio}
                    className="p-4 bg-white border-0 shadow-xl shadow-black/[0.03] rounded-2xl group cursor-pointer hover:shadow-brand/10 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand/5 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                      <Headphones className="w-6 h-6 text-brand group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-gray-900">
                        Audio Only
                      </h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        MP3 Version
                      </p>
                    </div>
                    <Play className="w-4 h-4 text-gray-300 group-hover:text-brand" />
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
