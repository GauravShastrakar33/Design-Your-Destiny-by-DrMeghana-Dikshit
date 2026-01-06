import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageCircle, CheckCircle2, Clock, Play, Pause, Volume2 } from "lucide-react";
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
  const params = useParams<{ id?: string }>();
  const urlQuestionId = params.id ? parseInt(params.id) : null;
  
  const [questionText, setQuestionText] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(urlQuestionId);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-select question from URL param
  useEffect(() => {
    if (urlQuestionId) {
      setSelectedQuestionId(urlQuestionId);
    }
  }, [urlQuestionId]);

  const { data, isLoading, error } = useQuery<DrmQuestionsResponse>({
    queryKey: ["/api/v1/drm/questions"],
  });

  const { data: questionDetails, isLoading: isLoadingDetails } = useQuery<QuestionWithAudio>({
    queryKey: ["/api/v1/drm/questions", selectedQuestionId],
    enabled: selectedQuestionId !== null,
  });

  const submitMutation = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest("POST", "/api/v1/drm/questions", { questionText: text });
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

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM yyyy");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-drm">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center" data-testid="error-drm">
        <p className="text-destructive">Failed to load. Please try again.</p>
      </div>
    );
  }

  const { questions, hasSubmittedThisMonth, currentMonthYear } = data || {
    questions: [],
    hasSubmittedThisMonth: false,
    currentMonthYear: "",
  };

  const currentMonthQuestion = questions.find((q) => q.monthYear === currentMonthYear);
  const pastQuestions = questions.filter((q) => q.monthYear !== currentMonthYear);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-semibold" data-testid="text-drm-title">
            Ask Dr. M
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-drm-subtitle">
            One question per month, answered personally
          </p>
        </div>

        {/* Question Form or Status */}
        <Card data-testid="card-question-form">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              {formatMonthYear(currentMonthYear)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasSubmittedThisMonth ? (
              <div className="space-y-4">
                {currentMonthQuestion?.status === "ANSWERED" ? (
                  <>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium" data-testid="text-question-answered">
                        Dr. M has answered!
                      </span>
                    </div>
                    <div className="bg-muted rounded-lg p-3" data-testid="text-my-question">
                      <p className="text-sm text-muted-foreground mb-1">Your question:</p>
                      <p>{currentMonthQuestion.questionText}</p>
                    </div>
                    {selectedQuestionId === currentMonthQuestion.id && questionDetails?.audioUrl ? (
                      <div className="space-y-3">
                        <audio
                          ref={audioRef}
                          src={questionDetails.audioUrl}
                          onEnded={handleAudioEnded}
                        />
                        <Button
                          onClick={handlePlayPause}
                          className="w-full"
                          data-testid="button-play-audio"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Response
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Listen to Response
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedQuestionId(currentMonthQuestion.id)}
                        className="w-full"
                        data-testid="button-load-audio"
                        disabled={isLoadingDetails}
                      >
                        {isLoadingDetails ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4 mr-2" />
                        )}
                        Load Audio Response
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium" data-testid="text-question-pending">
                        Awaiting Dr. M's response
                      </span>
                    </div>
                    <div className="bg-muted rounded-lg p-3" data-testid="text-pending-question">
                      <p className="text-sm text-muted-foreground mb-1">Your question:</p>
                      <p>{currentMonthQuestion?.questionText}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a notification when Dr. M responds.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="What would you like to ask Dr. M?"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    maxLength={240}
                    rows={4}
                    className="resize-none"
                    data-testid="input-question"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {questionText.length}/240
                  </p>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!questionText.trim() || submitMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-question"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Send Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Questions */}
        {pastQuestions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium" data-testid="text-past-questions-title">
              Past Questions
            </h2>
            {pastQuestions.map((question) => (
              <Card key={question.id} data-testid={`card-question-${question.id}`}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatMonthYear(question.monthYear)}
                      </span>
                      {question.status === "ANSWERED" ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Answered
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{question.questionText}</p>
                    {question.status === "ANSWERED" && (
                      <>
                        {selectedQuestionId === question.id && questionDetails?.audioUrl ? (
                          <div className="space-y-2">
                            <audio
                              ref={audioRef}
                              src={questionDetails.audioUrl}
                              onEnded={handleAudioEnded}
                            />
                            <Button
                              onClick={handlePlayPause}
                              size="sm"
                              variant="outline"
                              className="w-full"
                              data-testid={`button-play-${question.id}`}
                            >
                              {isPlaying ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Listen
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setSelectedQuestionId(question.id)}
                            size="sm"
                            variant="outline"
                            className="w-full"
                            data-testid={`button-load-${question.id}`}
                            disabled={isLoadingDetails && selectedQuestionId === question.id}
                          >
                            {isLoadingDetails && selectedQuestionId === question.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4 mr-2" />
                            )}
                            Load Response
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
