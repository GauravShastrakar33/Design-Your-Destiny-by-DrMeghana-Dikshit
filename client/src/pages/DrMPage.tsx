import { useState, useEffect, useRef } from "react";
import drMAvatar from "@assets/DrM_1761365497901.webp";
import { askDrM } from "@/lib/gradioClient";
import { DrmMessage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Send, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "@app:drm_conversations";
const MAX_CONVERSATIONS = 3;

const isQuotaMessage = (text: string): boolean => {
  if (!text) return false;
  const quotaPatterns = [
    /\d+\s+questions?\s+remaining/i,
    /📊.*questions?\s+remaining/i,
  ];
  return quotaPatterns.some((pattern) => pattern.test(text));
};

export default function DrMPage() {
  const [messages, setMessages] = useState<DrmMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [currentSubtitlesUrl, setCurrentSubtitlesUrl] = useState<string>("");
  const [currentVideoId, setCurrentVideoId] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
        if (parsed.length > 0) {
          const lastMessage = parsed[parsed.length - 1];
          setCurrentVideoUrl(lastMessage.videoUrl);
          setCurrentSubtitlesUrl(lastMessage.subtitlesUrl || "");
          setCurrentVideoId(lastMessage.id);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentVideoUrl && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch((error) => {
        console.error("Error auto-playing video:", error);
      });
    }
  }, [currentVideoUrl]);

  const saveMessages = (newMessages: DrmMessage[]) => {
    const toSave = newMessages.slice(-MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    setMessages(toSave);
  };

  const handlePlayVideo = (message: DrmMessage) => {
    if (message.videoUrl) {
      setCurrentVideoUrl(message.videoUrl);
      setCurrentSubtitlesUrl(message.subtitlesUrl || "");
      setCurrentVideoId(message.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast({
        title: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await askDrM(question, "");

      console.log("Dr.M Response:", response);
      console.log("Answer Video:", response.answerVideo);
      console.log("Video URL:", response.answerVideo.video);
      console.log("Text Response:", response.textResponse);

      const newMessage: DrmMessage = {
        id: Date.now().toString(),
        question: question,
        userName: "",
        videoUrl: response.answerVideo.video || "",
        subtitlesUrl: response.answerVideo.subtitles || "",
        textResponse: response.textResponse,
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, newMessage];
      saveMessages(updatedMessages);

      setCurrentVideoUrl(response.answerVideo.video || "");
      setCurrentSubtitlesUrl(response.answerVideo.subtitles || "");
      setCurrentVideoId(newMessage.id);

      setQuestion("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to get response from Dr.M",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative ml-2">
              <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
                <img
                  src={drMAvatar}
                  alt="Dr.M"
                  className="w-full h-full object-cover object-top"
                  data-testid="img-drm-avatar"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-white rounded-full" />
            </div>
            <div className="text-white">
              <h1 className="text-base font-bold">Dr.M</h1>
              <p className="text-xs opacity-90">Your AI Wellness Companion</p>
            </div>
          </div>
        </div>

        {/* Loading Progress Bar */}
        {isLoading && (
          <div className="w-full">
            <Progress
              value={undefined}
              className="h-1 rounded-none"
              data-testid="progress-loading"
            />
          </div>
        )}

        {/* Video Player Section */}
        <div className="flex-shrink-0 bg-black aspect-video relative mt-1">
          {currentVideoUrl ? (
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              data-testid="video-drm-response"
            >
              <source src={currentVideoUrl} type="video/mp4" />
              {currentSubtitlesUrl && (
                <track
                  kind="subtitles"
                  src={currentSubtitlesUrl}
                  srcLang="en"
                  label="English"
                  default
                />
              )}
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/60">
              <p className="text-sm" data-testid="text-no-video">
                Ask Dr.M a question to get started
              </p>
            </div>
          )}
        </div>

        {/* Chat History */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 pb-2"
          data-testid="chat-history"
        >
          {messages.slice(-MAX_CONVERSATIONS).map((message) => (
            <div key={message.id} className="space-y-2">
              {/* User Question */}
              <div className="flex justify-end">
                <div
                  className="text-white rounded-lg px-4 py-2 max-w-[80%]"
                  style={{ backgroundColor: "#703DFA" }}
                  data-testid={`text-user-question-${message.id}`}
                >
                  <p className="text-sm">{message.question}</p>
                </div>
              </div>

              {/* Dr.M Response */}
              <div className="flex justify-start gap-2">
                {/* Video Thumbnail */}
                {message.videoUrl && (
                  <button
                    onClick={() => handlePlayVideo(message)}
                    className={`relative flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                      currentVideoId === message.id
                        ? "ring-2 ring-purple-300"
                        : "border-gray-300 hover:border-purple-400"
                    }`}
                    style={{
                      backgroundColor: "#703DFA",
                      borderColor:
                        currentVideoId === message.id ? "#703DFA" : undefined,
                    }}
                    data-testid={`button-video-thumbnail-${message.id}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play
                        className="w-6 h-6 text-white drop-shadow-lg"
                        fill="white"
                      />
                    </div>
                  </button>
                )}

                {/* Text Response - hide if it's just a quota message */}
                {!isQuotaMessage(message.textResponse) && (
                  <div
                    className="rounded-lg px-4 py-2 max-w-[70%] text-gray-900"
                    style={{ backgroundColor: "#F3F0FF" }}
                    data-testid={`text-drm-response-${message.id}`}
                  >
                    <p className="text-sm">
                      {message.textResponse ||
                        "Dr.M has responded with a video message"}
                    </p>
                  </div>
                )}

                {/* Show fallback message only if there's a video but quota message */}
                {isQuotaMessage(message.textResponse) && message.videoUrl && (
                  <div
                    className="rounded-lg px-4 py-2 max-w-[70%] text-gray-900"
                    style={{ backgroundColor: "#F3F0FF" }}
                    data-testid={`text-drm-response-${message.id}`}
                  >
                    <p className="text-sm text-gray-600">Video response</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm" data-testid="text-empty-chat">
                Start a conversation with Dr.M
              </p>
            </div>
          )}
        </div>

        {/* Input Field */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t flex-shrink-0 bg-background mb-16"
        >
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
              className="flex-1 focus-visible:ring-[#703DFA]"
              data-testid="input-question"
            />
            <Button
              type="submit"
              disabled={isLoading || !question.trim()}
              size="icon"
              data-testid="button-send"
              style={{ backgroundColor: "#703DFA" }}
              className="hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
