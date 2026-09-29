/**
 * Short two-tone chime played when the unread notification count goes up.
 * Synthesised with the Web Audio API so no binary asset is needed.
 *
 * Chrome (and most browsers) refuse to start an AudioContext until the page
 * has had a real user gesture — creating one from a background event (a
 * notification poll ticking over) throws the "AudioContext was not allowed
 * to start" warning and the context stays suspended forever. The fix: wait
 * for the first genuine gesture anywhere on the page, create/resume ONE
 * shared context right then (inside the gesture handler, which browsers
 * allow), and reuse that same unlocked context for every later chime. If no
 * gesture has happened yet when a chime is requested, it's silently
 * skipped — the notification is still visible, just without sound for that
 * one instance.
 */

const SOUND_PREF_KEY = "nsgdp:notification-sound-enabled";

let audioContext: AudioContext | null = null;
let unlockAttempted = false;

function unlockAudioContext() {
  if (unlockAttempted || typeof window === "undefined") return;
  unlockAttempted = true;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioContext = new Ctx();
    void audioContext.resume().catch(() => {
      // Some browsers still refuse — later playNotificationSound() calls
      // will just no-op via the `.state !== "running"` check.
    });
  } catch {
    // Audio unsupported — chimes stay silently disabled.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudioContext, { once: true });
  window.addEventListener("keydown", unlockAudioContext, { once: true });
}

const soundPrefListeners = new Set<() => void>();

/** For useSyncExternalStore — the React-correct way to read this external,
 * mutable (localStorage-backed) preference without a setState-in-effect
 * hydration mismatch. */
export function subscribeNotificationSoundPref(callback: () => void): () => void {
  soundPrefListeners.add(callback);
  return () => soundPrefListeners.delete(callback);
}

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  } catch {
    // Storage blocked (private mode, etc) — preference just won't persist.
  }
  soundPrefListeners.forEach((callback) => callback());
}

export function playNotificationSound() {
  if (typeof window === "undefined") return;
  if (!isNotificationSoundEnabled()) return;
  if (!audioContext || audioContext.state !== "running") return;

  try {
    const ctx = audioContext;
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
  } catch {
    // Playback failed — notifications still work visually.
  }
}
