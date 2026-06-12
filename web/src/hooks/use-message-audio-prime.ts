"use client";

import { useEffect } from "react";
import { primeMessageAudio } from "@/lib/message-alert-sound";

/** Unlocks message sounds after the first click or keypress in the dashboard. */
export function useMessageAudioPrime() {
  useEffect(() => {
    const prime = () => primeMessageAudio();
    window.addEventListener("pointerdown", prime, { once: true, passive: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, []);
}
