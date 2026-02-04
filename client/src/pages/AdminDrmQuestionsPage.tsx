import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MessageCircle,
  Mic,
  Play,
  Pause,
  Upload,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DrmQuestionWithUser {
  id: number;
  userId: number;
  questionText: string;
  askedAt: string;
  monthYear: string;
  status: string;
  audioR2Key: string | null;
  answeredAt: string | null;
  userName: string;
}

export default function AdminDrmQuestionsPage() {
  const { toast } = useToast();
  const [selectedQuestion, setSelectedQuestion] =
    useState<DrmQuestionWithUser | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm");
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: questions = [], isLoading } = useQuery<DrmQuestionWithUser[]>({
    queryKey: ["/admin/api/drm/questions"],
    queryFn: async () => {
      const response = await fetch("/admin/api/drm/questions", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
  });

  const pendingQuestions = questions.filter((q) => q.status === "PENDING");
  const answeredQuestions = questions.filter((q) => q.status === "ANSWERED");

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "",
    ];
    for (const type of types) {
      if (type === "" || MediaRecorder.isTypeSupported(type)) {
        return type || undefined;
      }
    }
    return undefined;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedMimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, {
          type: recordedMimeType,
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioMimeType(recordedMimeType);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error("Recording error:", error);
      toast({
        title: "Recording failed",
        description:
          error.message ||
          "Please allow microphone access to record your answer.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUploadAndConfirm = async () => {
    if (!selectedQuestion || !audioBlob) return;

    setIsUploading(true);
    try {
      const uploadUrlResponse = await fetch(
        `/admin/api/drm/questions/${selectedQuestion.id}/answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mimeType: audioMimeType }),
        }
      );

      if (!uploadUrlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, audioKey } = await uploadUrlResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: {
          "Content-Type": audioMimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload audio");
      }

      const confirmResponse = await fetch(
        `/admin/api/drm/questions/${selectedQuestion.id}/confirm-answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ audioKey }),
        }
      );

      if (!confirmResponse.ok) {
        throw new Error("Failed to confirm answer");
      }

      toast({
        title: "Success",
        description:
          "Answer submitted successfully! The user has been notified.",
      });

      queryClient.invalidateQueries({ queryKey: ["/admin/api/drm/questions"] });
      setAnswerDialogOpen(false);
      resetRecordingState();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecordingState = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioMimeType("audio/webm");
    setIsRecording(false);
    setIsPlaying(false);
    setAudioDuration(0);
  };

  const openAnswerDialog = (question: DrmQuestionWithUser) => {
    resetRecordingState();
    setSelectedQuestion(question);
    setAnswerDialogOpen(true);
  };

  const closeAnswerDialog = () => {
    setAnswerDialogOpen(false);
    resetRecordingState();
    setSelectedQuestion(null);
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8">
      <div>
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-xl font-bold text-gray-900 leading-none"
                data-testid="text-admin-drm-title"
              >
                Dr.M Questions
              </h1>
            </div>
            <p className="text-sm font-semibold text-gray-600">
              Manage user inquiries and provide personalized voice guidance.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-700">
                {pendingQuestions.length} Pending
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-bold text-green-700">
                {answeredQuestions.length} Answered
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-8">
          {/* Pending Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Pending Inquiries
              </h2>
            </div>
            <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-left border-collapse"
                    data-testid="table-pending-questions"
                  >
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600">
                          User & Timeline
                        </th>
                        <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600">
                          Question Text
                        </th>
                        <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-44 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pendingQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center opacity-40">
                              <MessageCircle className="w-8 h-8 mb-3 text-gray-600" />
                              <p className="text-sm font-bold text-gray-600">
                                No pending questions
                              </p>
                              <p className="text-xs text-gray-600 mt-1 italic">
                                All caught up! New questions will appear here.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        pendingQuestions.map((question) => (
                          <tr
                            key={question.id}
                            className="group transition-colors hover:bg-gray-50/50"
                            data-testid={`row-pending-question-${question.id}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-bold text-gray-900">
                                    {question.userName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold uppercase text-[9px] tracking-tight px-1.5 py-0"
                                  >
                                    {formatMonthYear(question.monthYear)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs font-semibold text-gray-500 tracking-tight">
                                    {format(
                                      new Date(question.askedAt),
                                      "MMM d, yyyy"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="max-w-xl">
                                <p className="text-sm font-medium text-gray-700 leading-relaxed italic line-clamp-2">
                                  "{question.questionText}"
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Button
                                onClick={() => openAnswerDialog(question)}
                                className="bg-brand hover:bg-brand/90 font-bold text-xs h-9 px-4 rounded-lg shadow-sm gap-2"
                                data-testid={`button-answer-${question.id}`}
                              >
                                <Mic className="w-3.5 h-3.5" />
                                Record Answer
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          {/* Answered Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold text-green-600">
                Completed Guidance
              </h2>
            </div>
            <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-lg relative opacity-90 overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-left border-collapse"
                    data-testid="table-answered-questions"
                  >
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600">
                          User & Timeline
                        </th>
                        <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600">
                          Question Text
                        </th>
                        <th className="py-4 px-6 text-sm font-bold tracking-wide text-gray-600 w-44 text-right">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {answeredQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center opacity-40">
                              <CheckCircle2 className="w-8 h-8 mb-3 text-gray-600" />
                              <p className="text-sm font-bold text-gray-600">
                                No answered questions
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        answeredQuestions.map((question) => (
                          <tr
                            key={question.id}
                            className="group transition-colors hover:bg-gray-50/50"
                            data-testid={`row-answered-question-${question.id}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm font-bold text-gray-900">
                                    {question.userName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-100 font-bold uppercase text-[9px] tracking-tight px-1.5 py-0"
                                  >
                                    {formatMonthYear(question.monthYear)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs font-semibold text-gray-500 tracking-tight">
                                    {question.answeredAt
                                      ? format(
                                          new Date(question.answeredAt),
                                          "MMM d, yyyy"
                                        )
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="max-w-xl">
                                <p className="text-sm font-medium text-gray-600 leading-relaxed italic line-clamp-2">
                                  "{question.questionText}"
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                                <CheckCircle2 className="w-4 h-4" />
                                Completed
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={answerDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeAnswerDialog();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-brand" />
              Record Guidance
            </DialogTitle>
            <DialogDescription>
              Voice response for {selectedQuestion?.userName}
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-6 py-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 italic text-sm text-gray-600">
                "{selectedQuestion.questionText}"
              </div>

              <div className="flex flex-col items-center gap-4">
                {!audioUrl ? (
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "w-24 h-24 rounded-full shadow-lg transition-all",
                      isRecording && "animate-pulse"
                    )}
                    data-testid="button-record"
                  >
                    <Mic className="w-12 h-12" />
                  </Button>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5" />
                          Preview
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          {audioDuration > 0
                            ? formatDuration(audioDuration)
                            : "--:--"}
                        </span>
                      </div>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        controlsList="nodownload noplaybackrate"
                        controls
                        className="w-full h-12"
                        onLoadedMetadata={(e) => {
                          const audio = e.target as HTMLAudioElement;
                          if (audio.duration && isFinite(audio.duration)) {
                            setAudioDuration(audio.duration);
                          }
                        }}
                        onEnded={() => setIsPlaying(false)}
                        data-testid="audio-preview"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setAudioBlob(null);
                        setAudioUrl(null);
                        setAudioDuration(0);
                      }}
                      variant="outline"
                      className="w-full text-gray-500 gap-3 h-12"
                      data-testid="button-rerecord"
                    >
                      <Mic className="w-7 h-7" />
                      <span className="text-md font-bold">
                        Re-record
                      </span>
                    </Button>
                  </div>
                )}
                <p className="text-md text-gray-600">
                  {isRecording
                    ? "Recording... Tap to stop"
                    : audioUrl
                    ? "Check your recording before submitting"
                    : "Tap to start recording"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={closeAnswerDialog}
              className="text-gray-600 hover:text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadAndConfirm}
              disabled={!audioBlob || isUploading}
              className="bg-brand hover:bg-brand/90 px-6 shadow-sm gap-2"
              data-testid="button-submit-answer"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
