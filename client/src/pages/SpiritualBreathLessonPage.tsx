import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, Video, Music, FileText, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
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

export default function SpiritualBreathLessonPage() {
  const params = useParams();
  const lessonId = params.lessonId;
  const [, setLocation] = useLocation();
  const [hasLoggedActivity, setHasLoggedActivity] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isAuthenticated = !!localStorage.getItem("@app:user_token");

  const logActivityMutation = useMutation({
    mutationFn: async (params: { lessonId: number; lessonName: string }) => {
      const res = await apiRequest("POST", "/api/v1/activity/log", {
        lessonId: params.lessonId,
        lessonName: params.lessonName,
        featureType: "BREATH",
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

  const logActivity = (lessonId: number, lessonName: string) => {
    if (!hasLoggedActivity && isAuthenticated) {
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
          <div className="text-center py-12 text-muted-foreground" data-testid="text-error">
            Breath lesson not found
          </div>
        </div>
      </div>
    );
  }

  const { lesson, files } = data;
  const videoFile = files.find(f => f.fileType === "video");
  const audioFile = files.find(f => f.fileType === "audio");
  const scriptFile = files.find(f => f.fileType === "script");

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setLocation("/search")}
              className="hover-elevate active-elevate-2 rounded-lg p-2"
              data-testid="button-back"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <Wind className="w-5 h-5 text-cyan-500" />
            <h1 className="text-lg font-semibold text-foreground truncate" data-testid="text-lesson-title">
              {lesson.title}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {lesson.description && (
            <p className="text-muted-foreground" data-testid="text-lesson-description">
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
                onPlay={() => handlePlay(lesson.id, lesson.title)}
                onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget, lesson.id, lesson.title)}
              >
                Your browser does not support the video tag.
              </video>
            </Card>
          )}

          {audioFile && audioFile.signedUrl && (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Music className="w-5 h-5 text-cyan-500" />
                <span className="font-medium text-foreground">Breath Audio</span>
              </div>
              <audio
                ref={audioRef}
                controls
                className="w-full"
                src={audioFile.signedUrl}
                data-testid="audio-player"
                onPlay={() => handlePlay(lesson.id, lesson.title)}
                onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget, lesson.id, lesson.title)}
              >
                Your browser does not support the audio tag.
              </audio>
            </Card>
          )}

          {scriptFile && (scriptFile.scriptHtml || scriptFile.extractedText) && (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-foreground">Instructions</span>
              </div>
              {scriptFile.scriptHtml ? (
                <div 
                  className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
                  data-testid="text-script-content"
                  dangerouslySetInnerHTML={{ __html: scriptFile.scriptHtml }}
                />
              ) : (
                <div 
                  className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap"
                  data-testid="text-script-content"
                >
                  {scriptFile.extractedText}
                </div>
              )}
            </Card>
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
