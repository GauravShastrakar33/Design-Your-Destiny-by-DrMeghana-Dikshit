import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { AudioPlayer } from "@/components/MediaPlayers";
import {
  Loader2,
  MessageCircle,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Volume2,
  Sparkles,
  Zap,
  Quote,
  Mic,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import type { DrmQuestion } from "@shared/schema";

interface DrmQuestionsResponse {
  questions: DrmQuestion[];
  currentMonthYear: string;
  hasSubmittedThisMonth: boolean;
}

interface QuestionWithAudio extends DrmQuestion {
  audioUrl?: string;
}

export default function DrMPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const urlQuestionId = params.id ? parseInt(params.id) : null;

  const [questionText, setQuestionText] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    urlQuestionId
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-select question from URL param
  useEffect(() => {
    if (urlQuestionId) {
      setSelectedQuestionId(urlQuestionId);
    }
  }, [urlQuestionId]);

  const { data, isLoading, error } = useQuery<DrmQuestionsResponse>({
    queryKey: ["/api/v1/drm/questions"],
  });

  const { data: questionDetails, isLoading: isLoadingDetails } =
    useQuery<QuestionWithAudio>({
      queryKey: ["/api/v1/drm/questions", selectedQuestionId],
      enabled: selectedQuestionId !== null,
    });

  const submitMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", "/api/v1/drm/questions", {
        questionText: text,
      });
    },
    onSuccess: () => {
      toast({
        title: "Question sent!",
        description: "Dr. M will respond to you soon.",
      });
      setQuestionText("");
      queryClient.invalidateQueries({ queryKey: ["/api/v1/drm/questions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send question",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!questionText.trim()) return;
    submitMutation.mutate(questionText);
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-gray-400 mt-2 font-bold text-sm tracking-wide">
          Opening Consultation Room...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <Card className="max-w-sm w-full border-0 shadow-lg rounded-2xl p-8 text-center bg-white">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 opacity-50" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-sm font-semibold text-gray-500 mb-6">
            We couldn't reach the consultation room right now.
          </p>
          <Button
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["/api/v1/drm/questions"],
              })
            }
            className="w-full h-12 rounded-lg bg-brand hover:shadow-lg"
          >
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const { questions, hasSubmittedThisMonth, currentMonthYear } = data || {
    questions: [],
    hasSubmittedThisMonth: false,
    currentMonthYear: "",
  };

  const currentMonthQuestion = questions.find(
    (q) => q.monthYear === currentMonthYear
  );
  const pastQuestions = questions.filter(
    (q) => q.monthYear !== currentMonthYear
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <Header title="Ask Dr. M" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-6 space-y-6">
        {/* Intro Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-brand border border-indigo-100 shadow-sm">
            <Mic className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Personal Guidance</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
            Dr. M personally answers one core question every month to help guide
            your transformation.
          </p>
        </motion.div>

        {/* Current Month Consultation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md rounded-2xl overflow-hidden bg-white">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand flex items-center justify-center border border-indigo-100">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-gray-500 leading-none">
                      Current Consultation
                    </p>
                    <h2 className="text-sm font-bold text-gray-900 leading-none">
                      {formatMonthYear(currentMonthYear)}
                    </h2>
                  </div>
                </div>
                {hasSubmittedThisMonth && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                      currentMonthQuestion?.status === "ANSWERED"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {currentMonthQuestion?.status === "ANSWERED"
                      ? "Complete"
                      : "Pending"}
                  </div>
                )}
              </div>

              {hasSubmittedThisMonth ? (
                <div className="space-y-6">
                  {currentMonthQuestion?.status === "ANSWERED" ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {/* User's Question Block */}
                      <div className="relative p-5 rounded-2xl bg-gray-50 border border-gray-100 group">
                        <Quote className="absolute -top-3 left-4 w-7 h-7 text-gray-200 rotate-180 transition-colors group-hover:text-brand/20" />
                        <div className="pl-4">
                          <p className="text-xs font-bold text-gray-400 tracking-widest mb-2">
                            Your Question
                          </p>
                          <p className="text-gray-700 text-sm font-medium leading-relaxed">
                            {currentMonthQuestion.questionText}
                          </p>
                        </div>
                      </div>

                      {/* Response Player */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <Sparkles className="w-4 h-4 text-brand fill-brand/20" />
                          <p className="text-xs font-bold text-gray-900 tracking-widest">
                            Personal Response
                          </p>
                        </div>

                        {selectedQuestionId === currentMonthQuestion.id &&
                        questionDetails?.audioUrl ? (
                          <div className="p-0 border-0 bg-transparent">
                            <AudioPlayer
                              ref={audioRef}
                              src={questionDetails.audioUrl}
                              title="Voice Guidance"
                              onPlay={() => {}}
                            />
                          </div>
                        ) : (
                          <Button
                            onClick={() =>
                              setSelectedQuestionId(currentMonthQuestion.id)
                            }
                            disabled={isLoadingDetails}
                            className="w-full h-16 rounded-2xl bg-white border-2 border-dashed border-indigo-200 text-brand font-bold hover:bg-indigo-50 hover:border-brand/30 transition-all flex items-center justify-center gap-3 group"
                          >
                            {isLoadingDetails ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <>
                                <Volume2 className="w-6 h-6 transition-transform group-hover:scale-110" />
                                <span>Reveal Audio Guidance</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 text-center">
                        <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3 animate-pulse" />
                        <h3 className="text-amber-700 font-bold mb-1">
                          Awaiting Guidance
                        </h3>
                        <p className="text-amber-600/70 text-sm max-w-[200px] mx-auto leading-relaxed font-medium">
                          Dr. M personally reviews every question. You'll be
                          notified when your response is ready.
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-gray-50 border border-gray-100 italic">
                        <p className="text-xs font-bold text-gray-400 tracking-wide mb-2">
                          Subject
                        </p>
                        <p className="text-gray-600 text-sm">
                          "{currentMonthQuestion?.questionText}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="What would you like to ask Dr. M?"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    maxLength={240}
                    className="min-h-[160px] rounded-lg border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-brand/20 focus:border-brand/30 resize-none p-5 text-gray-700 placeholder:text-gray-400 leading-relaxed transition-all"
                  />
                  <div className="flex justify-end items-center text-xs font-semibold text-gray-400">
                    {questionText.length}/240
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!questionText.trim() || submitMutation.isPending}
                    className="w-full rounded-lg bg-brand hover:bg-brand/90 text-md font-bold shadow-lg shadow-brand/20 active:scale-[0.98] transition-all group"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Question</span>
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-gray-400 font-semibold leading-relaxed">
                    Personal response will be delivered via audio
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Past Consultations */}
        {pastQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 px-2">
              <div className="h-4 w-1 bg-primary rounded-full" />
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                Past Consultations
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              {pastQuestions.map((question, idx) => (
                <Card
                  key={question.id}
                  className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand tracking-wide whitespace-nowrap">
                        {formatMonthYear(question.monthYear)}
                      </span>
                      {question.status === "ANSWERED" ? (
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 font-medium line-clamp-2 italic">
                      "{question.questionText}"
                    </p>

                    {question.status === "ANSWERED" && (
                      <div className="pt-2">
                        {selectedQuestionId === question.id &&
                        questionDetails?.audioUrl ? (
                          <div className="p-0 border-0 bg-transparent animate-in fade-in slide-in-from-top-2 duration-300">
                            <AudioPlayer
                              ref={audioRef}
                              src={questionDetails.audioUrl}
                              title={`Response for ${formatMonthYear(
                                question.monthYear
                              )}`}
                            />
                          </div>
                        ) : (
                          <Button
                            onClick={() => setSelectedQuestionId(question.id)}
                            disabled={
                              isLoadingDetails &&
                              selectedQuestionId === question.id
                            }
                            variant="default"
                            className="w-full h-10 rounded-lg bg-primary text-white text-xs font-bold hover:bg-brand hover:text-white transition-all gap-2"
                          >
                            {isLoadingDetails &&
                            selectedQuestionId === question.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                            Load Response
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Branding Footer */}
        <div className="flex flex-col items-center gap-2 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black tracking-[0.2em] text-gray-500">
              Design Your Destiny
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
