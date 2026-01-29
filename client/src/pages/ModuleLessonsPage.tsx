import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, Play, Check, Video, Music, FileText, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";
import type { CmsModule, CmsLesson, CmsLessonFile } from "@shared/schema";

interface LessonFileWithUrl extends CmsLessonFile {
  signedUrl: string | null;
}

interface LessonWithFiles extends CmsLesson {
  files?: LessonFileWithUrl[];
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

export default function ModuleLessonsPage() {
  const params = useParams();
  const moduleId = params.moduleId;
  const courseId = params.courseId;
  const [, setLocation] = useLocation();
  
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [loadingLessonId, setLoadingLessonId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  const { data: moduleData, isLoading: moduleLoading, error: moduleError } = useQuery<ModuleResponse>({
    queryKey: ["/api/public/v1/modules", moduleId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/modules/${moduleId}`);
      if (!response.ok) throw new Error("Failed to fetch module");
      return response.json();
    },
    enabled: !!moduleId,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<{ completedLessonIds: number[] }>({
    queryKey: ["/api/v1/lesson-progress"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/v1/lesson-progress");
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: lessonData, isLoading: lessonLoading } = useQuery<LessonResponse>({
    queryKey: ["/api/public/v1/lessons", selectedLessonId],
    queryFn: async () => {
      const response = await fetch(`/api/public/v1/lessons/${selectedLessonId}`);
      if (!response.ok) throw new Error("Failed to fetch lesson");
      return response.json();
    },
    enabled: !!selectedLessonId,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      const res = await apiRequest("POST", `/api/v1/lesson-progress/${lessonId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/lesson-progress"] });
    },
  });

  const completedLessonIds = new Set(progressData?.completedLessonIds || []);

  const handleLessonClick = async (lessonId: number) => {
    if (selectedLessonId === lessonId) {
      setSelectedLessonId(null);
    } else {
      setLoadingLessonId(lessonId);
      setSelectedLessonId(lessonId);
    }
  };

  useEffect(() => {
    if (lessonData && loadingLessonId === selectedLessonId) {
      setLoadingLessonId(null);
    }
  }, [lessonData, loadingLessonId, selectedLessonId]);

  const handleVideoEnded = (lessonId: number) => {
    if (isAuthenticated && !completedLessonIds.has(lessonId)) {
      markCompleteMutation.mutate(lessonId);
    }
  };

  const handleAudioEnded = (lessonId: number) => {
    if (isAuthenticated && !completedLessonIds.has(lessonId)) {
      markCompleteMutation.mutate(lessonId);
    }
  };

  const handleBack = () => {
    if (courseId) {
      setLocation(`/abundance-mastery/course/${courseId}`);
    } else {
      setLocation("/money-mastery");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "video") return <Video className="w-4 h-4" />;
    if (fileType === "audio") return <Music className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (moduleLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" data-testid="loader-module" />
      </div>
    );
  }

  if (moduleError || !moduleData) {
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
          <div className="text-center py-12 text-muted-foreground" data-testid="text-error">
            Module not found
          </div>
        </div>
      </div>
    );
  }

  const { module, lessons } = moduleData;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-semibold text-foreground truncate" data-testid="text-module-title">
              {module.title}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-4">

          {lessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-lessons">
              No lessons in this module yet
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessonIds.has(lesson.id);
                const isSelected = selectedLessonId === lesson.id;
                const isLoadingLesson = loadingLessonId === lesson.id;

                return (
                  <div key={lesson.id}>
                    <Card
                      className={`p-4 hover-elevate active-elevate-2 cursor-pointer transition-colors ${
                        isSelected ? "ring-2 ring-amber-500" : ""
                      }`}
                      onClick={() => handleLessonClick(lesson.id)}
                      data-testid={`lesson-card-${lesson.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                          isCompleted 
                            ? "bg-green-500/10 text-green-600" 
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" data-testid={`icon-completed-${lesson.id}`} />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">{lesson.title}</p>
                        </div>
                        {isLoadingLesson ? (
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        ) : isCompleted ? (
                          <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded">
                            Completed
                          </span>
                        ) : (
                          <Play className="w-5 h-5 text-amber-500" data-testid={`icon-play-${lesson.id}`} />
                        )}
                      </div>
                    </Card>

                    {isSelected && lessonData && !lessonLoading && (
                      <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-4" data-testid={`lesson-content-${lesson.id}`}>
                        {lessonData.files && lessonData.files.length > 0 ? (
                          lessonData.files.map((file) => (
                            <div key={file.id} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getFileIcon(file.fileType)}
                                <span className="truncate capitalize">{file.fileType}</span>
                              </div>

                              {file.fileType === "video" && file.signedUrl && (
                                <video
                                  ref={videoRef}
                                  src={file.signedUrl}
                                  controls
                                  className="w-full rounded-lg"
                                  onEnded={() => handleVideoEnded(lesson.id)}
                                  data-testid={`video-player-${file.id}`}
                                />
                              )}

                              {file.fileType === "audio" && file.signedUrl && (
                                <audio
                                  ref={audioRef}
                                  src={file.signedUrl}
                                  controls
                                  className="w-full"
                                  onEnded={() => handleAudioEnded(lesson.id)}
                                  data-testid={`audio-player-${file.id}`}
                                />
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No media files for this lesson
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
