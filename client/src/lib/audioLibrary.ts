export interface AudioItem {
  id: number | string;
  title: string;
  file: string;
}

export const audioLibrary = {
  practices: [
    { id: 2, title: "Vibration Elevation", file: "/audios/VibrationElevation.mp3" },
    { id: 3, title: "Neurolinking", file: "/audios/Neurolinking.mp3" },
    { id: 10, title: "Wealth Code Activation 1", file: "/audios/WealthCodeActivation1.mp3" },
    { id: 11, title: "Wealth Code Activation 2", file: "/audios/WealthCodeActivation2.mp3" },
  ] as AudioItem[],
  affirmations: [
    { id: "aff1", title: "Memory Development Breath", file: "/audios/MemoryDevelopmentBreath.mp3" }
  ] as AudioItem[],
  journalingAudios : [
     { id: 1, title: "Deep Theta Music", file: "/audios/ThetaMusic1.mp3" },
   ] as AudioItem[],
};

export function findAudioByTitle(title: string): AudioItem | undefined {
  const allAudios = [...audioLibrary.practices, ...audioLibrary.affirmations];
  return allAudios.find(audio => audio.title === title);
}
