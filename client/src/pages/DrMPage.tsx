import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import drMAvatar from "@assets/DrM_1761365497901.webp";

interface Message {
  id: string;
  text: string;
  sender: "user" | "drm";
  timestamp: Date;
}

export default function DrMPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Simulate Dr.M response
    setTimeout(() => {
      const drMResponse: Message = {
        id: crypto.randomUUID(),
        text: "Thank you for reaching out. I'm here to support you on your wellness journey. How can I help you today?",
        sender: "drm",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, drMResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {/* Header with Avatar */}
        <div className="bg-gradient-wellness p-6 pb-8">
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

        {/* Main Content */}
        <div className="px-4 py-6 space-y-4">
          {!isChatOpen ? (
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Welcome to Dr.M's Space
                </h2>
                <p className="text-muted-foreground mb-4">
                  I'm here to guide you through your wellness journey with personalized insights,
                  practice recommendations, and support whenever you need it.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                    <p className="text-sm text-foreground">Personalized wellness guidance</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                    <p className="text-sm text-foreground">Practice recommendations</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                    <p className="text-sm text-foreground">24/7 support and motivation</p>
                  </div>
                </div>
              </Card>

              <Button
                onClick={() => setIsChatOpen(true)}
                className="w-full h-12 text-base font-semibold"
                data-testid="button-talk-to-drm"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Talk to Dr.M
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chat Interface */}
              <Card className="overflow-hidden">
                <div className="bg-primary/5 p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Chat with Dr.M</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Start a conversation with Dr.M
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                          data-testid={`message-${message.sender}-${message.id}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.sender === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      size="icon"
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
