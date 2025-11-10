import { Client } from "@gradio/client";

const GRADIO_API_URL = "https://dr-meghana-video.wowlabz.com/";

export interface GradioVideoResponse {
  video: string;
  subtitles?: string;
}

export interface DrMApiResponse {
  introVideo: GradioVideoResponse;
  answerVideo: GradioVideoResponse;
  relatedVideoHtml: string;
  textResponse: string;
}

function extractVideoUrl(videoData: any): string {
  if (!videoData) return "";
  
  if (typeof videoData === "string") {
    return videoData;
  }
  
  if (typeof videoData === "object") {
    return videoData.video || videoData.url || videoData.path || "";
  }
  
  return "";
}

function extractSubtitlesUrl(videoData: any): string | undefined {
  if (!videoData || typeof videoData !== "object") return undefined;
  return videoData.subtitles || videoData.subtitle || undefined;
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}

export async function askDrM(
  question: string,
  userName: string = ""
): Promise<DrMApiResponse> {
  try {
    const client = await Client.connect(GRADIO_API_URL);
    
    const result = await client.predict("/process_query", {
      user_name: userName,
      question: question,
    });

    const data = result.data as any[];
    
    console.log("Raw Gradio API response:", JSON.stringify(data, null, 2));
    console.log("Video data[0]:", data[0]);
    console.log("Video data[1]:", data[1]);

    const introVideoUrl = extractVideoUrl(data[0]);
    const answerVideoUrl = extractVideoUrl(data[1]);
    const introSubtitles = extractSubtitlesUrl(data[0]);
    const answerSubtitles = extractSubtitlesUrl(data[1]);

    return {
      introVideo: { 
        video: introVideoUrl, 
        subtitles: introSubtitles 
      },
      answerVideo: { 
        video: answerVideoUrl, 
        subtitles: answerSubtitles 
      },
      relatedVideoHtml: data[2] || "",
      textResponse: stripHtmlTags(data[3] || ""),
    };
  } catch (error) {
    console.error("Error calling Dr.M API:", error);
    throw new Error("Failed to get response from Dr.M. Please try again.");
  }
}
