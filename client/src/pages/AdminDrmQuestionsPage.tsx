import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageCircle, Mic, Play, Pause, Upload, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [selectedQuestion, setSelectedQuestion] = useState<DrmQuestionWithUser | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm");
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: questions = [], isLoading } = useQuery<DrmQuestionWithUser[]>({
    queryKey: ["/admin/api/drm/questions"],
    queryFn: async () => {
      const response = await fetch("/admin/api/drm/questions", {
        headers: {
          "Authorization": `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch questions");
      return response.json();
    },
  });

  const pendingQuestions = questions.filter(q => q.status === "PENDING");
  const answeredQuestions = questions.filter(q => q.status === "ANSWERED");

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      ""
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
        const blob = new Blob(audioChunksRef.current, { type: recordedMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioMimeType(recordedMimeType);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error("Recording error:", error);
      toast({
        title: "Recording failed",
        description: error.message || "Please allow microphone access to record your answer.",
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

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleUploadAndConfirm = async () => {
    if (!selectedQuestion || !audioBlob) return;

    setIsUploading(true);
    try {
      const uploadUrlResponse = await fetch(`/admin/api/drm/questions/${selectedQuestion.id}/answer`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });
      
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

      const confirmResponse = await fetch(`/admin/api/drm/questions/${selectedQuestion.id}/confirm-answer`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audioKey }),
      });

      if (!confirmResponse.ok) {
        throw new Error("Failed to confirm answer");
      }

      toast({
        title: "Answer submitted!",
        description: "The user has been notified.",
      });

      queryClient.invalidateQueries({ queryKey: ["/admin/api/drm/questions"] });
      setAnswerDialogOpen(false);
      resetRecordingState();
    } catch (error: any) {
      toast({
        title: "Failed to submit answer",
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
    setSelectedQuestion(null);
  };

  const openAnswerDialog = (question: DrmQuestionWithUser) => {
    setSelectedQuestion(question);
    resetRecordingState();
    setAnswerDialogOpen(true);
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-drm-title">Dr.M Questions</h1>
          <p className="text-muted-foreground">Manage user questions and voice answers</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {pendingQuestions.length} Pending
          </Badge>
          <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3" />
            {answeredQuestions.length} Answered
          </Badge>
        </div>
      </div>

      {pendingQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Questions
          </h2>
          <div className="grid gap-4">
            {pendingQuestions.map((question) => (
              <Card key={question.id} data-testid={`card-pending-question-${question.id}`}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{question.userName}</span>
                        <span>•</span>
                        <span>{formatMonthYear(question.monthYear)}</span>
                      </div>
                      <p className="text-base">{question.questionText}</p>
                      <p className="text-xs text-muted-foreground">
                        Asked {format(new Date(question.askedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Button
                      onClick={() => openAnswerDialog(question)}
                      data-testid={`button-answer-${question.id}`}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Record Answer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {answeredQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Answered Questions
          </h2>
          <div className="grid gap-4">
            {answeredQuestions.map((question) => (
              <Card key={question.id} className="bg-green-50/50" data-testid={`card-answered-question-${question.id}`}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{question.userName}</span>
                      <span>•</span>
                      <span>{formatMonthYear(question.monthYear)}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Answered
                      </Badge>
                    </div>
                    <p className="text-base">{question.questionText}</p>
                    <p className="text-xs text-muted-foreground">
                      Answered {question.answeredAt ? format(new Date(question.answeredAt), "MMM d, yyyy 'at' h:mm a") : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No questions yet</h3>
            <p className="text-muted-foreground">Questions from users will appear here.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={answerDialogOpen} onOpenChange={(open) => {
        if (!open) resetRecordingState();
        setAnswerDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Your Answer</DialogTitle>
            <DialogDescription>
              Record a voice response for {selectedQuestion?.userName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Question:</p>
                <p>{selectedQuestion.questionText}</p>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                {!audioUrl ? (
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    className="w-32 h-32 rounded-full"
                    data-testid="button-record"
                  >
                    <Mic className={`w-12 h-12 ${isRecording ? "animate-pulse" : ""}`} />
                  </Button>
                ) : (
                  <div className="w-full space-y-3">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePlayPause}
                        variant="outline"
                        className="flex-1"
                        data-testid="button-preview"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isPlaying ? "Pause" : "Preview"}
                      </Button>
                      <Button
                        onClick={() => {
                          setAudioBlob(null);
                          setAudioUrl(null);
                        }}
                        variant="outline"
                        data-testid="button-rerecord"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Re-record
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  {isRecording 
                    ? "Recording... Click to stop" 
                    : audioUrl 
                      ? "Preview your recording or re-record"
                      : "Click the microphone to start recording"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnswerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadAndConfirm}
              disabled={!audioBlob || isUploading}
              data-testid="button-submit-answer"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Submit Answer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
