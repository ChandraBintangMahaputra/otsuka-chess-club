/** Efek suara kecil lewat WebAudio (PB-09), tanpa file audio tambahan. */
const KEY = "otsuka-sound";
let context: AudioContext | null = null;

export function soundEnabled() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* storage tidak tersedia */
  }
}

export function playMoveSound(san: string) {
  if (!soundEnabled() || typeof AudioContext === "undefined") return;
  context ??= new AudioContext();
  const check = /[+#]/.test(san);
  const capture = san.includes("x");
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "triangle";
  osc.frequency.value = check ? 660 : capture ? 240 : 320;
  gain.gain.setValueAtTime(0.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (check ? 0.2 : 0.09));
  osc.connect(gain).connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.22);
}
