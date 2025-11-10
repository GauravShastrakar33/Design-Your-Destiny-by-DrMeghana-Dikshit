import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import drMAvatar from "@assets/DrM_1761365497901.webp";
import { Client } from "@gradio/client";

interface Message {
  id: string;
  type: "user" | "assistant";
  text?: string;
  videoUrl1?: string;
  videoUrl2?: string;
  youtubeEmbed?: string;
  timestamp: Date;
}

export default function DrMPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: "user",
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const client = await Client.connect("https://dr-meghana-video.wowlabz.com/");
      const result = await client.predict("/process_query", {
        question: question,
        user_name: "Gaurav",
      });

      // Gradio client returns { data: [...] }
      const responseData: any = result.data;
      
      // Extract URLs from Gradio file objects or use strings directly
      const video1 = responseData[0];
      const video2 = responseData[1];
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: "assistant",
        // Gradio returns file objects with .url property for videos, or strings
        videoUrl1: typeof video1 === 'object' && video1?.url ? video1.url : (typeof video1 === 'string' && video1.trim() ? video1 : undefined),
        videoUrl2: typeof video2 === 'object' && video2?.url ? video2.url : (typeof video2 === 'string' && video2.trim() ? video2 : undefined),
        youtubeEmbed: responseData[2] && typeof responseData[2] === 'string' && responseData[2].trim() ? responseData[2] : undefined,
        text: responseData[3] && typeof responseData[3] === 'string' && responseData[3].trim() ? responseData[3] : undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling Dr.M API:", error);
      toast({
        title: "Connection Error",
        description: "Unable to reach Dr.M. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 p-6 pb-8 flex-shrink-0">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                <img
                  src={drMAvatar}
                  alt="Dr.M"
                  className="w-full h-full object-cover object-top"
                  data-testid="img-drm-avatar"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-1">Dr.M</h1>
              <p className="text-sm opacity-90">Your AI Wellness Companion</p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-purple-600" fill="currentColor" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: "Montserrat" }}>
                    Welcome, Gaurav!
                  </h3>
                  <p className="text-sm text-gray-600 px-4">
                    Ask me anything about wellness, meditation, or personal growth.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.type}-${message.id}`}
                  >
                    {message.type === "user" ? (
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-500 text-white">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                      </div>
                    ) : (
                      <div className="max-w-[85%] space-y-3">
                        {/* Video 1 - Message from Dr. M */}
                        {message.videoUrl1 && (
                          <div className="rounded-xl overflow-hidden shadow-md">
                            <div className="bg-purple-50 px-3 py-2 border-b border-purple-100">
                              <p className="text-xs font-semibold text-purple-700" style={{ fontFamily: "Montserrat" }}>
                                🎬 Message from Dr. M
                              </p>
                            </div>
                            <video
                              controls
                              className="w-full"
                              data-testid="video-message-1"
                            >
                              <source src={message.videoUrl1} type="video/mp4" />
                              Your browser does not support video playback.
                            </video>
                          </div>
                        )}

                        {/* Video 2 - Personalized Answer */}
                        {message.videoUrl2 && (
                          <div className="rounded-xl overflow-hidden shadow-md">
                            <div className="bg-purple-50 px-3 py-2 border-b border-purple-100">
                              <p className="text-xs font-semibold text-purple-700" style={{ fontFamily: "Montserrat" }}>
                                🎬 Dr. M's Personalized Answer
                              </p>
                            </div>
                            <video
                              controls
                              className="w-full"
                              data-testid="video-message-2"
                            >
                              <source src={message.videoUrl2} type="video/mp4" />
                              Your browser does not support video playback.
                            </video>
                          </div>
                        )}

                        {/* YouTube Embed - Related Video */}
                        {message.youtubeEmbed && (
                          <div className="rounded-xl overflow-hidden shadow-md">
                            <div className="bg-purple-50 px-3 py-2 border-b border-purple-100">
                              <p className="text-xs font-semibold text-purple-700" style={{ fontFamily: "Montserrat" }}>
                                🎬 Related Video
                              </p>
                            </div>
                            <div
                              dangerouslySetInnerHTML={{ __html: message.youtubeEmbed }}
                              className="aspect-video"
                              data-testid="youtube-embed"
                            />
                          </div>
                        )}

                        {/* Text Response */}
                        {message.text && (
                          <div className="rounded-2xl px-4 py-3 bg-gray-100">
                            <div
                              dangerouslySetInnerHTML={{ __html: message.text }}
                              className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                              data-testid="text-response"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <p className="text-sm text-gray-600">Dr.M is thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                style={{ fontFamily: "Montserrat" }}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="h-11 w-11 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90"
                size="icon"
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
