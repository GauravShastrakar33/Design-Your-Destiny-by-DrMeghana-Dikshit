import { useState } from "react";
import { Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@gradio/client";

type ViewState = "welcome" | "loading" | "video" | "error";

export default function DrMPage() {
  const { toast } = useToast();
  const [userName, setUserName] = useState("Gaurav");
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("welcome");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading || !userName.trim()) return;

    setIsLoading(true);
    setViewState("loading");
    setVideoUrl(null);
    setErrorMessage("");

    try {
      const client = await Client.connect("https://dr-meghana-video.wowlabz.com/");
      const result = await client.predict("/process_query", {
        question: question.trim(),
        user_name: userName.trim(),
      });

      const responseData: any = result.data;

      if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
        throw new Error("No response from Dr.M");
      }

      const video1 = responseData[0];

      // Extract video URL from various possible formats
      let extractedVideoUrl: string | null = null;

      if (video1) {
        // Check for Gradio file object with .url
        if (typeof video1 === 'object' && video1.url) {
          extractedVideoUrl = video1.url;
        }
        // Check for Gradio file object with .path
        else if (typeof video1 === 'object' && video1.path) {
          extractedVideoUrl = `https://dr-meghana-video.wowlabz.com${video1.path}`;
        }
        // Check if it's a plain string URL
        else if (typeof video1 === 'string' && video1.trim()) {
          extractedVideoUrl = video1;
        }
        // Check for Gradio update object with null value
        else if (typeof video1 === 'object' && video1.__type__ === 'update' && video1.value === null) {
          // Gradio returned an "update" with no video
          setErrorMessage("Dr.M is still processing your question. This usually means the video is being generated. Please try asking your question directly in the Gradio interface.");
          setViewState("error");
          setIsLoading(false);
          return;
        }
      }

      if (extractedVideoUrl) {
        setVideoUrl(extractedVideoUrl);
        setViewState("video");
        setQuestion(""); // Clear for next question
      } else {
        setErrorMessage("No video response available. Please try using the Gradio interface directly at https://dr-meghana-video.wowlabz.com/");
        setViewState("error");
      }
    } catch (error) {
      console.error("Error calling Dr.M API:", error);
      setErrorMessage("Unable to connect to Dr.M. Please try again or visit https://dr-meghana-video.wowlabz.com/ directly.");
      setViewState("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setViewState("welcome");
    setVideoUrl(null);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#F3F3F3" }}>
      <div className="max-w-md mx-auto h-screen flex flex-col">
        
        {/* Video Display Area - Top 65% */}
        <div className="flex-[0.65] bg-black flex items-center justify-center relative">
          {viewState === "welcome" && (
            <div className="text-center px-6">
              <div className="w-20 h-20 rounded-full bg-purple-600/20 mx-auto mb-6 flex items-center justify-center">
                <Heart className="w-10 h-10 text-purple-400" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "Montserrat" }}>
                Welcome, {userName}!
              </h2>
              <p className="text-purple-200 text-sm">
                Ask me anything about wellness, meditation, or personal growth.
              </p>
            </div>
          )}

          {viewState === "loading" && (
            <div className="text-center px-6">
              <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2" style={{ fontFamily: "Montserrat" }}>
                Dr.M is preparing your response...
              </p>
              <p className="text-purple-200 text-sm">
                This may take a moment
              </p>
            </div>
          )}

          {viewState === "video" && videoUrl && (
            <video
              controls
              autoPlay
              className="w-full h-full object-contain"
              data-testid="video-drm-response"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support video playback.
            </video>
          )}

          {viewState === "error" && (
            <div className="text-center px-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: "Montserrat" }}>
                Response Not Available
              </h3>
              <p className="text-sm text-purple-200 mb-4">
                {errorMessage}
              </p>
              <Button
                onClick={handleReset}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2"
                data-testid="button-try-again"
              >
                Try Again
              </Button>
              <div className="mt-4">
                <a
                  href="https://dr-meghana-video.wowlabz.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-300 hover:text-purple-100 underline"
                  data-testid="link-gradio-direct"
                >
                  Open Gradio Interface Directly
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Form Area - Bottom 35% */}
        <div className="flex-[0.35] bg-white p-6 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label 
                htmlFor="userName" 
                className="block text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "Montserrat" }}
              >
                Your Name
              </label>
              <Input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                style={{ fontFamily: "Montserrat" }}
                data-testid="input-user-name"
              />
            </div>

            {/* Question Textarea */}
            <div>
              <label 
                htmlFor="question" 
                className="block text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "Montserrat" }}
              >
                Your Question
              </label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading}
                placeholder="Ask me anything about wellness, meditation, or personal growth..."
                className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
                rows={3}
                style={{ fontFamily: "Montserrat" }}
                data-testid="input-question"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!question.trim() || !userName.trim() || isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 font-semibold text-base py-6"
              style={{ fontFamily: "Montserrat" }}
              data-testid="button-ask-drm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Ask Dr.M"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
