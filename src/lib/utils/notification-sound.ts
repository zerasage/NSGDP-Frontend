/**
 * Short two-tone chime played when the unread notification count goes up.
 * Synthesised with the Web Audio API so no binary asset is needed. Safe to
 * call from anywhere — silently no-ops if audio is unavailable or blocked
 * (autoplay policies, unsupported browser, etc).
 */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.15, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };

    playTone(880, 0, 0.12);
    playTone(1320, 0.1, 0.16);

    window.setTimeout(() => {
      void ctx.close();
    }, 500);
  } catch {
    // Audio blocked or unsupported — notifications still work visually.
  }
}
