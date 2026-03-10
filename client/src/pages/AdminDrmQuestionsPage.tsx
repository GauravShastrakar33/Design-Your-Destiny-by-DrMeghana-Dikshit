import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  Mic,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  User,
  Calendar,
  Square,
  RotateCcw,
  AlertTriangle,
  Volume2,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type RecordingPhase = "idle" | "recording" | "recorded";
type ActiveTab = "pending" | "answered";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonthYear(monthYear: string) {
  const [year, month] = monthYear.split("-");
  return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy");
}

// ─── Custom Audio Player ──────────────────────────────────────────────────────

function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "--:--";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full" data-testid="audio-preview">
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (isFinite(a.duration)) setDuration(a.duration);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />
      <div className="flex items-center gap-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-5 py-5 shadow-inner">
        <div className="relative shrink-0">
          {!isPlaying && (
            <span className="absolute inset-0 rounded-full bg-brand/30" />
          )}
          <button
            onClick={toggle}
            className="relative w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/25 hover:bg-brand/90 active:scale-95 transition-all z-10"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div
            ref={progressRef}
            onClick={handleBarClick}
            className="relative h-2.5 bg-brand/5 overflow-hidden rounded-full cursor-pointer group border border-brand/10"
          >
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand to-[#9A7DFF] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-brand/70 tracking-tight">
            <span className="bg-brand/10 px-1.5 py-0.5 rounded tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="tracking-wider">Your Response</span>
            <span className="bg-brand/10 px-1.5 py-0.5 rounded tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recording Timer ──────────────────────────────────────────────────────────

function RecordingTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    if (!active) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="text-sm font-bold tabular-nums text-red-500">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}

// ─── Record Guidance Dialog ───────────────────────────────────────────────────

interface RecordGuidanceDialogProps {
  open: boolean;
  question: DrmQuestionWithUser | null;
  onClose: () => void;
  adminToken: string;
}

function RecordGuidanceDialog({
  open,
  question,
  onClose,
  adminToken,
}: RecordGuidanceDialogProps) {
  const { toast } = useToast();

  const [phase, setPhase] = useState<RecordingPhase>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState("audio/webm");
  const [isUploading, setIsUploading] = useState(false);
  const [rerecordConfirmOpen, setRerecordConfirmOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  const resetState = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setPhase("idle");
    setAudioBlob(null);
    setAudioUrl(null);
    setAudioMimeType("audio/webm");
    setIsUploading(false);
  };

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
      audioStreamRef.current = stream;
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const recMimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: recMimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setAudioMimeType(recMimeType);
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((t) => t.stop());
          audioStreamRef.current = null;
        }
        setPhase("recorded");
      };
      recorder.start();
      setPhase("recording");
    } catch (err: any) {
      toast({
        title: "Microphone access denied",
        description:
          err.message || "Please allow microphone access and try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRerecordConfirm = () => {
    setRerecordConfirmOpen(false);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setPhase("idle");
  };

  const handleSubmit = async () => {
    if (!question || !audioBlob) return;
    setIsUploading(true);
    try {
      const res1 = await fetch(
        `/admin/api/drm/questions/${question.id}/answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mimeType: audioMimeType }),
        }
      );
      if (!res1.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, audioKey } = await res1.json();

      const res2 = await fetch(uploadUrl, {
        method: "PUT",
        body: audioBlob,
        headers: { "Content-Type": audioMimeType },
      });
      if (!res2.ok) throw new Error("Failed to upload audio");

      const res3 = await fetch(
        `/admin/api/drm/questions/${question.id}/confirm-answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ audioKey }),
        }
      );
      if (!res3.ok) throw new Error("Failed to confirm answer");

      toast({
        title: "Guidance submitted!",
        description: "The user has been notified of your response.",
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/api/drm/questions"] });
      onClose();
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* ── Main Record Dialog ── */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !isUploading) onClose();
        }}
      >
        <DialogContent className="sm:max-w-2xl p-0 border-none shadow-2xl rounded-2xl overflow-hidden [&>button]:text-black [&>button]:opacity-100 [&>button]:hover:opacity-100 [&>button]:bg-white [&>button]:top-4 [&>button]:right-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand/80 to-brand/50 px-6 pt-5 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white leading-none">
                Record Guidance
              </h2>
            </div>
            <p className="text-sm text-white/70 ml-10">
              Voice response for{" "}
              <span className="font-semibold text-white">
                {question?.userName}
              </span>
            </p>
          </div>

          <div className="p-4 space-y-5">
            {/* Question block */}
            {question && (
              <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-[#F3F0FF] to-white px-5 space-y-3 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand" />
                <div className="absolute top-3 right-3 opacity-[0.03] text-brand">
                  <MessageCircle className="w-16 h-16" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-brand" />
                    </div>
                    <span className="text-base font-bold text-gray-900 leading-none">
                      {question.userName}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-white/80 text-brand border-indigo-100 text-xs font-bold tracking-wide px-2 py-0.5 rounded-full"
                  >
                    {formatMonthYear(question.monthYear)}
                  </Badge>
                </div>

                <div className="relative">
                  <span className="absolute -top-0 -left-0 text-2xl text-brand/50 font-serif leading-none italic">
                    "
                  </span>
                  <p className="pl-4 text-[15px] font-medium text-gray-800 leading-relaxed">
                    {question.questionText}
                  </p>
                  <div className="flex justify-end mt-1">
                    <span className="text-2xl text-brand/50 font-serif leading-none italic">
                      "
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recording UI */}
            <div className="flex flex-col items-center gap-5">
              {/* Idle */}
              {phase === "idle" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <button
                    onClick={startRecording}
                    data-testid="button-record"
                    className="group relative w-24 h-24 rounded-full bg-brand text-white shadow-xl shadow-brand/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-brand/30"
                  >
                    <span className="absolute inset-0 rounded-full bg-brand/20 scale-110 group-hover:scale-125 transition-transform" />
                    <Mic className="w-10 h-10 relative z-10" />
                  </button>
                  <p className="text-sm font-semibold text-gray-500">
                    Tap to start recording
                  </p>
                </div>
              )}

              {/* Recording */}
              {phase === "recording" && (
                <div className="flex flex-col items-center gap-4 py-2 w-full">
                  <div className="flex items-center gap-1.5 h-10">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-red-500"
                        style={{
                          height: `${20 + Math.sin(i * 0.8) * 14}px`,
                          animation: `drm-bounce ${
                            0.5 + i * 0.07
                          }s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-100 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
                      Recording
                    </span>
                    <RecordingTimer active={true} />
                  </div>
                  <button
                    onClick={stopRecording}
                    data-testid="button-stop-record"
                    className="w-16 h-16 rounded-full bg-red-500 text-white shadow-lg shadow-red-300 flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-red-200"
                  >
                    <Square className="w-6 h-6 fill-white" />
                  </button>
                  <p className="text-xs font-semibold text-gray-400">
                    Tap to stop
                  </p>
                </div>
              )}

              {/* Recorded */}
              {phase === "recorded" && audioUrl && (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-gray-700">
                      Recording captured
                    </span>
                    <span className="text-xs text-gray-400 italic">
                      — review before submitting
                    </span>
                  </div>
                  <CustomAudioPlayer src={audioUrl} />

                  <div className="flex justify-start my-14">
                    <Button
                      variant="outline"
                      onClick={() => setRerecordConfirmOpen(true)}
                      data-testid="button-rerecord"
                      className="px-6 font-bold shadow-sm border-2 border-amber-300 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-300 gap-2 transition-all rounded-lg"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Re-record
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isUploading}
              className="text-gray-500 font-semibold rounded-lg border border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={phase !== "recorded" || !audioBlob || isUploading}
              data-testid="button-submit-answer"
              className="bg-brand hover:bg-brand/90 text-white px-6 font-bold shadow-sm shadow-brand/20 gap-2 transition-all disabled:opacity-40 rounded-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit Response
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Re-record Confirmation ── */}
      <Dialog
        open={rerecordConfirmOpen}
        onOpenChange={(o) => !o && setRerecordConfirmOpen(false)}
      >
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="px-6 py-6 bg-amber-50/60 border-b border-amber-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-base font-bold text-gray-900">
              Discard this recording?
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Your previously recorded answer will be{" "}
              <strong className="text-gray-700">permanently lost</strong> if you
              continue. This cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="p-5 bg-white flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setRerecordConfirmOpen(false)}
              className="flex-1 font-semibold border border-gray-300 text-gray-500 hover:text-gray-700 rounded-lg"
            >
              Keep Recording
            </Button>
            <Button
              onClick={handleRerecordConfirm}
              data-testid="button-confirm-rerecord"
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-200 gap-2 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Yes, Re-record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waveform keyframes */}
      <style>{`
        @keyframes drm-bounce {
          0%   { transform: scaleY(0.5); opacity: 0.7; }
          100% { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
        active
          ? "bg-white text-gray-900 shadow-sm shadow-gray-200/50"
          : "text-gray-500 hover:text-gray-700 hover:bg-white/40"
      )}
    >
      {icon}
      {label}
      <Badge
        variant="secondary"
        className={cn(
          "ml-1 text-[10px] font-extrabold px-1.5 py-0 rounded-full tabular-nums border-none shadow-none",
          active ? "bg-brand/10 text-brand" : "bg-gray-200/60 text-gray-500"
        )}
      >
        {count}
      </Badge>
    </button>
  );
}

// ─── Pending Question Row ─────────────────────────────────────────────────────

function PendingQuestionRow({
  question,
  onAnswer,
}: {
  question: DrmQuestionWithUser;
  onAnswer: (q: DrmQuestionWithUser) => void;
}) {
  return (
    <div
      className="group grid grid-cols-[200px_1fr_160px] gap-4 items-center px-5 pl-8 py-3.5 hover:bg-amber-50/40 transition-colors"
      data-testid={`row-pending-question-${question.id}`}
    >
      {/* User column */}
      <div className="flex flex-col gap-0 min-w-0">
        <span className="text-[15px] font-bold text-gray-900 truncate tracking-tight">
          {question.userName}
        </span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {format(new Date(question.askedAt), "MMMM d, yyyy")}
        </span>
      </div>

      {/* Question column */}
      <div>
        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-[13px] font-medium text-gray-700 leading-relaxed">
            "{question.questionText}"
          </p>
        </div>
      </div>

      {/* Action column */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => onAnswer(question)}
          data-testid={`button-answer-${question.id}`}
          className="bg-brand hover:bg-brand/90 text-white font-bold text-xs h-9 px-4 rounded-lg shadow-sm shadow-brand/20 gap-1.5 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
        >
          <Mic className="w-3.5 h-3.5" />
          Record Answer
        </Button>
      </div>
    </div>
  );
}

// ─── Pending Tab ──────────────────────────────────────────────────────────────

function PendingTab({
  questions,
  onAnswer,
}: {
  questions: DrmQuestionWithUser[];
  onAnswer: (q: DrmQuestionWithUser) => void;
}) {
  if (questions.length === 0) {
    return (
      <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden">
        <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-40">
          <MessageCircle className="w-9 h-9 text-gray-400" />
          <p className="text-sm font-bold text-gray-600">
            No pending questions
          </p>
          <p className="text-xs text-gray-500 italic">
            All caught up! New questions will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden relative"
      data-testid="table-pending-questions"
    >
      {/* Amber left accent stripe */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 z-10" />

      {/* Column headers */}
      <div className="grid grid-cols-[200px_1fr_160px] gap-4 px-5 pl-8 py-2.5 border-b border-gray-100 bg-gray-50/70">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
          User
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
          Question
        </span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 text-right">
          Action
        </span>
      </div>

      <div className="divide-y divide-gray-50">
        {questions.map((question) => (
          <PendingQuestionRow
            key={question.id}
            question={question}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </Card>
  );
}

// ─── Answered Tab ─────────────────────────────────────────────────────────────

function AnsweredTab({ questions }: { questions: DrmQuestionWithUser[] }) {
  if (questions.length === 0) {
    return (
      <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden">
        <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-40">
          <CheckCircle2 className="w-9 h-9 text-gray-400" />
          <p className="text-sm font-bold text-gray-600">
            No answered questions yet
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-xl overflow-hidden relative">
      {/* Green left accent stripe */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 z-10" />
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse"
          data-testid="table-answered-questions"
        >
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="py-3 px-5 pl-8 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 w-48">
                User & Period
              </th>
              <th className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                Question
              </th>
              <th className="py-3 px-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 text-right w-40">
                Answered On
              </th>
              <th className="py-3 px-5 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 text-right w-32">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {questions.map((question) => (
              <tr
                key={question.id}
                className="group transition-colors hover:bg-gray-50/60"
                data-testid={`row-answered-question-${question.id}`}
              >
                {/* User */}
                <td className="py-4 px-5 pl-8">
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[15px] font-bold text-gray-900 truncate tracking-tight">
                      {question.userName}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {format(new Date(question.askedAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                </td>

                {/* Question */}
                <td className="py-3 px-4">
                  <p className="text-[13px] font-medium text-gray-500 leading-relaxed italic max-w-lg">
                    "{question.questionText}"
                  </p>
                </td>

                {/* Answered on */}
                <td className="py-3 px-5 text-right">
                  {question.answeredAt ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs font-bold text-gray-600">
                        {format(new Date(question.answeredAt), "MMM d, yyyy")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(question.answeredAt), "h:mm a")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 px-5 text-right">
                  <span className="inline-flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-widest bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDrmQuestionsPage() {
  const { toast } = useToast();
  const [selectedQuestion, setSelectedQuestion] =
    useState<DrmQuestionWithUser | null>(null);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");

  const adminToken = localStorage.getItem("@app:admin_token") || "";

  const { data: questions = [], isLoading } = useQuery<DrmQuestionWithUser[]>({
    queryKey: ["/admin/api/drm/questions"],
    queryFn: async () => {
      const res = await fetch("/admin/api/drm/questions", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const pendingQuestions = questions.filter((q) => q.status === "PENDING");
  const answeredQuestions = questions.filter((q) => q.status === "ANSWERED");

  const openAnswerDialog = (q: DrmQuestionWithUser) => {
    setSelectedQuestion(q);
    setAnswerDialogOpen(true);
  };

  const closeAnswerDialog = () => {
    setAnswerDialogOpen(false);
    setSelectedQuestion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6">
      {/* ── Header ── */}
      <header className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MessageCircle className="w-5 h-5 text-brand shrink-0" />
            <h1
              className="text-xl font-bold text-gray-900 leading-none"
              data-testid="text-admin-drm-title"
            >
              Dr.M Questions
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-500 ml-7">
            Manage user inquiries and provide personalized voice guidance.
          </p>
        </div>
      </header>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 bg-gray-100/60 border border-gray-200/40 p-1 rounded-xl w-fit mb-6">
        <TabButton
          active={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          icon={<Clock className="w-4 h-4" />}
          label="Pending Inquiries"
          count={pendingQuestions.length}
        />
        <TabButton
          active={activeTab === "answered"}
          onClick={() => setActiveTab("answered")}
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Completed Guidance"
          count={answeredQuestions.length}
        />
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "pending" ? (
        <PendingTab questions={pendingQuestions} onAnswer={openAnswerDialog} />
      ) : (
        <AnsweredTab questions={answeredQuestions} />
      )}

      {/* ── Record Dialog ── */}
      <RecordGuidanceDialog
        open={answerDialogOpen}
        question={selectedQuestion}
        onClose={closeAnswerDialog}
        adminToken={adminToken}
      />
    </div>
  );
}
