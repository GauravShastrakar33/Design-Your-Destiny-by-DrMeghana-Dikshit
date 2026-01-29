import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, Check, Lock, Play, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { CmsCourse, CmsModule, CmsLesson, CmsLessonFile } from "@shared/schema";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  // Fetch course with modules
  const { data: courseData, isLoading: courseLoading } = useQuery<CourseResponse>({
    queryKey: ["/api/public/v1/courses", courseId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/courses/${courseId}`);
      if (!response.ok) throw new Error("Failed to fetch course");
      return response.json();
    },
    enabled: !!courseId,
  });

  // Fetch all modules with their lessons
  const { data: modulesData, isLoading: modulesLoading } = useQuery<ModuleResponse[]>({
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
  const { data: progressData, isLoading: progressLoading } = useQuery<{ completedLessonIds: number[] }>({
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
  const currentDay = currentDayIndex !== null && currentDayIndex < allDays.length 
    ? allDays[currentDayIndex] 
    : null;

  // Fetch current lesson content
  const { data: lessonData, isLoading: lessonLoading } = useQuery<LessonResponse>({
    queryKey: ["/api/public/v1/lessons", currentDay?.lessonId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/lessons/${currentDay?.lessonId}`);
      if (!response.ok) throw new Error("Failed to fetch lesson");
      return response.json();
    },
    enabled: !!currentDay?.lessonId,
  });

  // Mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("POST", `/api/v1/lesson-progress/${lessonId}/complete`);
      return res.json();
    },
    onSuccess: (_data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/lesson-progress"] });
      
      // Find the next lesson
      const currentIndex = allDays.findIndex(d => d.lessonId === lessonId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < allDays.length) {
        toast({
          title: "Day complete! 🎉",
          description: "Next lesson unlocked",
          duration: 3000,
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
          duration: 5000,
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
      if (progress >= 90 && !hasReached90 && isAuthenticated && !completedLessonIds.has(currentDay.lessonId)) {
        setHasReached90(true);
        markCompleteMutation.mutate(currentDay.lessonId);
      }
    }
  }, [hasReached90, currentDay, isAuthenticated, completedLessonIds, markCompleteMutation]);

  // Audio progress tracking - triggers auto-complete at 90%
  const handleAudioTimeUpdate = useCallback(() => {
    if (audioRef.current && currentDay) {
      const audio = audioRef.current;
      const progress = (audio.currentTime / audio.duration) * 100;
      setWatchProgress(progress);
      
      // Auto-complete at 90% if not already completed
      if (progress >= 90 && !hasReached90 && isAuthenticated && !completedLessonIds.has(currentDay.lessonId)) {
        setHasReached90(true);
        markCompleteMutation.mutate(currentDay.lessonId);
      }
    }
  }, [hasReached90, currentDay, isAuthenticated, completedLessonIds, markCompleteMutation]);

  // Handle video/audio ended - no-op if already completed at 90%
  const handleMediaEnded = useCallback(() => {
    if (currentDay && isAuthenticated && !completedLessonIds.has(currentDay.lessonId) && !hasReached90) {
      markCompleteMutation.mutate(currentDay.lessonId);
    }
  }, [currentDay, isAuthenticated, completedLessonIds, hasReached90, markCompleteMutation]);

  // Reset progress when changing lessons
  useEffect(() => {
    setWatchProgress(0);
    setHasReached90(false);
  }, [currentDay?.lessonId]);

  // Day click handler
  const handleDayClick = (index: number) => {
    const day = allDays[index];
    const isCompleted = completedLessonIds.has(day.lessonId);
    
    // Check if this day is unlocked (completed or is the current incomplete)
    const firstIncompleteIndex = allDays.findIndex(d => !completedLessonIds.has(d.lessonId));
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your journey...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!courseData || allDays.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto p-4">
          <button
            onClick={handleBack}
            className="hover-elevate active-elevate-2 rounded-lg p-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="text-center py-12 text-muted-foreground">
            Course not found or no lessons available
          </div>
        </div>
      </div>
    );
  }

  // Completion screen
  if (currentDayIndex !== null && currentDayIndex >= allDays.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background">
        <div className="max-w-md mx-auto">
          <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border/50 z-10">
            <div className="px-4 py-4 flex items-center gap-3">
              <button
                onClick={handleBack}
                className="hover-elevate active-elevate-2 rounded-lg p-2"
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">Challenge Complete</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Congratulations!
            </h1>
            <p className="text-muted-foreground mb-8 max-w-xs">
              You've completed all {allDays.length} days of the Money Manifestation Challenge!
            </p>
            
            <div className="w-full space-y-3">
              <Button
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setCurrentDayIndex(0)}
                data-testid="button-rewatch"
              >
                <Play className="w-4 h-4 mr-2" />
                Rewatch from Day 1
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleBack}
                data-testid="button-return-home"
              >
                Return to Money Mastery
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get video/audio file
  const videoFile = lessonData?.files?.find(f => f.fileType === "video" && f.signedUrl);
  const audioFile = lessonData?.files?.find(f => f.fileType === "audio" && f.signedUrl);
  const hasMedia = videoFile || audioFile;

  // Calculate first incomplete for locking logic
  const firstIncompleteIndex = allDays.findIndex(d => !completedLessonIds.has(d.lessonId));
  const isCurrentLessonCompleted = currentDay ? completedLessonIds.has(currentDay.lessonId) : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - minimal */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border/50 z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="hover-elevate active-elevate-2 rounded-lg p-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Day {currentDay?.dayNumber} of {allDays.length}
            </span>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content - Video First */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        {/* Top 60% - Video Player */}
        <div className="flex-[6] min-h-0 bg-black relative">
          {lessonLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : videoFile ? (
            <video
              ref={videoRef}
              src={videoFile.signedUrl!}
              controls
              autoPlay
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleMediaEnded}
              data-testid="video-player"
            />
          ) : audioFile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-900 to-amber-950 p-6">
              <div className="w-32 h-32 bg-amber-500/20 rounded-full flex items-center justify-center mb-6">
                <Play className="w-12 h-12 text-amber-400" />
              </div>
              <audio
                ref={audioRef}
                src={audioFile.signedUrl!}
                controls
                autoPlay
                className="w-full max-w-xs"
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleMediaEnded}
                data-testid="audio-player"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60">
              <p className="text-sm">No media for this lesson</p>
            </div>
          )}

          {/* Progress indicator overlay */}
          {hasMedia && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div 
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${watchProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Lesson Info Bar */}
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-base leading-tight" data-testid="text-lesson-title">
                Day {currentDay?.dayNumber} – {currentDay?.title}
              </h2>
            </div>
            {isCurrentLessonCompleted ? (
              <div className="flex items-center gap-1 text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Done</span>
              </div>
            ) : hasReached90 ? (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                onClick={() => currentDay && markCompleteMutation.mutate(currentDay.lessonId)}
                disabled={markCompleteMutation.isPending}
                data-testid="button-complete-now"
              >
                {markCompleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  "Complete ✓"
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Bottom 40% - Timeline Navigator */}
        <div className="flex-[4] min-h-0 overflow-y-auto bg-muted/30 px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Your Journey
          </p>
          
          <div className="space-y-2">
            {allDays.map((day, index) => {
              const isCompleted = completedLessonIds.has(day.lessonId);
              const isCurrent = index === currentDayIndex;
              const isLocked = !isCompleted && index !== firstIncompleteIndex && firstIncompleteIndex !== -1 && index > firstIncompleteIndex;
              
              return (
                <Card
                  key={day.lessonId}
                  className={`p-3 transition-all cursor-pointer ${
                    isCurrent 
                      ? "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/30" 
                      : isLocked 
                        ? "opacity-50 cursor-not-allowed" 
                        : "hover-elevate active-elevate-2"
                  }`}
                  onClick={() => !isLocked && handleDayClick(index)}
                  data-testid={`timeline-day-${day.dayNumber}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompleted 
                        ? "bg-green-500 text-white"
                        : isCurrent 
                          ? "bg-amber-500 text-white"
                          : isLocked 
                            ? "bg-muted text-muted-foreground"
                            : "bg-amber-500/20 text-amber-600"
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : isCurrent ? (
                        <Play className="w-3.5 h-3.5" />
                      ) : (
                        day.dayNumber
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isLocked ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        Day {day.dayNumber}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {day.title}
                      </p>
                    </div>
                    {isCurrent && !isCompleted && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full uppercase">
                        Now
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
