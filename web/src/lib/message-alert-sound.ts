let audioContext: AudioContext | null = null;
let primed = false;
let fallbackAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function createBeepDataUri(): string {
  const sampleRate = 22050;
  const duration = 0.32;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, i / 400);
    const release = Math.max(0, 1 - Math.max(0, i - numSamples * 0.55) / (numSamples * 0.45));
    const env = attack * release;
    const sample =
      Math.sin(2 * Math.PI * 880 * t) * 0.38 * env +
      (t > 0.09 ? Math.sin(2 * Math.PI * 1174 * (t - 0.09)) * 0.28 * env : 0);
    view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, sample * 32767)), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function getFallbackAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!fallbackAudio) {
    fallbackAudio = new Audio(createBeepDataUri());
    fallbackAudio.volume = 0.75;
  }
  return fallbackAudio;
}

/** Call once after a user gesture so browsers allow notification sounds. */
export function primeMessageAudio() {
  if (typeof window === "undefined" || primed) return;
  primed = true;

  const ctx = getAudioContext();
  if (ctx) {
    void ctx.resume().catch(() => {});
  }

  const audio = getFallbackAudio();
  if (audio) {
    audio.muted = true;
    void audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    }).catch(() => {
      audio.muted = false;
    });
  }
}

function playWebAudioChime() {
  const ctx = getAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  const tones = [
    { freq: 880, start: 0, dur: 0.12 },
    { freq: 1174.66, start: 0.1, dur: 0.14 },
    { freq: 1318.51, start: 0.22, dur: 0.18 },
  ];

  for (const tone of tones) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = tone.freq;
    osc.connect(gain);
    const start = now + tone.start;
    osc.start(start);
    osc.stop(start + tone.dur);
  }

  return true;
}

/** Professional three-tone chime for incoming chat messages. */
export function playMessageReceivedSound() {
  if (typeof window === "undefined") return;

  const ctx = getAudioContext();
  const tryWebAudio = () => {
    if (!ctx) return false;
    if (ctx.state === "suspended") return false;
    playWebAudioChime();
    return true;
  };

  if (tryWebAudio()) return;

  void ctx?.resume().then(() => {
    if (tryWebAudio()) return;
    const audio = getFallbackAudio();
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  }).catch(() => {
    const audio = getFallbackAudio();
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  });
}
