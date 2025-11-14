export interface PracticeMedia {
  id: number;
  videoUrl?: string;
  audioUrl?: string;
  script?: string;
}

export const practiceMediaLibrary: PracticeMedia[] = [
  {
    id: 20,
    videoUrl: "https://drmeghana-app.s3.ap-south-1.amazonaws.com/dyd/videos/Anxiety_Relief_Code/Anxiety_Relief_Code_1_Coach_Rashmi.mp4",
  },
];

export function getPracticeMedia(practiceId: number): PracticeMedia | undefined {
  return practiceMediaLibrary.find((media) => media.id === practiceId);
}
