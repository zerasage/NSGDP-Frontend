"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LearningProgressState } from "./types";

const STORAGE_KEY = "nsgdp-learning-progress-v1";

const EMPTY: LearningProgressState = {
  completed: [],
  bookmarks: [],
  checklist: {},
  feedback: {},
};

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: LearningProgressState = EMPTY;

function read(): LearningProgressState {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedState;
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  if (!raw) {
    cachedState = EMPTY;
    return cachedState;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LearningProgressState>;
    cachedState = {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      checklist: parsed.checklist && typeof parsed.checklist === "object" ? parsed.checklist : {},
      feedback: parsed.feedback && typeof parsed.feedback === "object" ? parsed.feedback : {},
    };
  } catch {
    cachedState = EMPTY;
  }
  return cachedState;
}

function write(next: LearningProgressState) {
  try {
    const raw = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
  } catch {
    // Storage unavailable (private mode / quota) — keep the change in memory
    // for this session so the UI still responds.
    cachedRaw = undefined;
  }
  cachedState = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cachedRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function useLearningProgress() {
  const state = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggleCompleted = useCallback((slug: string) => {
    const s = read();
    write({ ...s, completed: toggle(s.completed, slug) });
  }, []);

  const markCompleted = useCallback((slug: string) => {
    const s = read();
    if (!s.completed.includes(slug)) write({ ...s, completed: [...s.completed, slug] });
  }, []);

  const toggleBookmark = useCallback((slug: string) => {
    const s = read();
    write({ ...s, bookmarks: toggle(s.bookmarks, slug) });
  }, []);

  const setChecked = useCallback((id: string, value: boolean) => {
    const s = read();
    write({ ...s, checklist: { ...s.checklist, [id]: value } });
  }, []);

  const resetChecklist = useCallback(() => {
    const s = read();
    write({ ...s, checklist: {} });
  }, []);

  const setFeedback = useCallback((slug: string, value: "up" | "down") => {
    const s = read();
    write({ ...s, feedback: { ...s.feedback, [slug]: value } });
  }, []);

  return {
    completed: state.completed,
    bookmarks: state.bookmarks,
    checklist: state.checklist,
    feedback: state.feedback,
    toggleCompleted,
    markCompleted,
    toggleBookmark,
    setChecked,
    resetChecklist,
    setFeedback,
  };
}
