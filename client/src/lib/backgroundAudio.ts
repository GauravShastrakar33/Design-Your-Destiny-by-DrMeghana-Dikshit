import { Capacitor } from "@capacitor/core";

export function enableBackgroundAudio() {
    if (!Capacitor.isNativePlatform()) return;

    // This keeps WebView audio alive in background
    (window as any).AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;

    const ctx = new AudioContext();
    ctx.resume();
}
