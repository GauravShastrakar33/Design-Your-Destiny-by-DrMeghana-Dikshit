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

    return {
      introVideo: data[0] || { video: "" },
      answerVideo: data[1] || { video: "" },
      relatedVideoHtml: data[2] || "",
      textResponse: data[3] || "",
    };
  } catch (error) {
    console.error("Error calling Dr.M API:", error);
    throw new Error("Failed to get response from Dr.M. Please try again.");
  }
}
