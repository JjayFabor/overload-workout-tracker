import { ExerciseLog } from "@/lib/types";

export const WORKOUT_DRAFT_VERSION = 1;
export const WORKOUT_DRAFT_TTL_MS = 48 * 60 * 60 * 1000;

export interface WorkoutDraftPayload {
  v: typeof WORKOUT_DRAFT_VERSION;
  updatedAt: number;
  exerciseLogs: ExerciseLog;
  completedSets: Record<string, boolean[]>;
  timerEndMs: number | null;
  timerTotalSeconds: number;
}

function storageKey(routineId: string): string {
  return `workout_draft:${routineId}`;
}

export function loadDraft(routineId: string): WorkoutDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(routineId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkoutDraftPayload>;
    if (
      parsed.v !== WORKOUT_DRAFT_VERSION ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.updatedAt > WORKOUT_DRAFT_TTL_MS) {
      localStorage.removeItem(storageKey(routineId));
      return null;
    }
    return {
      v: WORKOUT_DRAFT_VERSION,
      updatedAt: parsed.updatedAt,
      exerciseLogs: parsed.exerciseLogs ?? {},
      completedSets: parsed.completedSets ?? {},
      timerEndMs:
        typeof parsed.timerEndMs === "number" || parsed.timerEndMs === null
          ? parsed.timerEndMs
          : null,
      timerTotalSeconds:
        typeof parsed.timerTotalSeconds === "number"
          ? parsed.timerTotalSeconds
          : 0,
    };
  } catch {
    return null;
  }
}

export function saveDraft(
  routineId: string,
  payload: Omit<WorkoutDraftPayload, "v" | "updatedAt"> & {
    updatedAt?: number;
  },
): void {
  if (typeof window === "undefined") return;
  const full: WorkoutDraftPayload = {
    v: WORKOUT_DRAFT_VERSION,
    updatedAt: payload.updatedAt ?? Date.now(),
    exerciseLogs: payload.exerciseLogs,
    completedSets: payload.completedSets,
    timerEndMs: payload.timerEndMs,
    timerTotalSeconds: payload.timerTotalSeconds,
  };
  try {
    localStorage.setItem(storageKey(routineId), JSON.stringify(full));
  } catch {
    /* quota / private mode */
  }
}

export function clearDraft(routineId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(routineId));
  } catch {
    /* ignore */
  }
}

export function draftHasProgress(p: WorkoutDraftPayload): boolean {
  if (p.timerEndMs !== null && p.timerEndMs > Date.now()) return true;
  for (const sets of Object.values(p.completedSets)) {
    if (sets.some(Boolean)) return true;
  }
  for (const sets of Object.values(p.exerciseLogs)) {
    for (const s of sets) {
      if ((s.weight?.trim() ?? "") !== "" || (s.reps?.trim() ?? "") !== "")
        return true;
    }
  }
  return false;
}

export function clearTimerFieldsInDraft(
  routineId: string,
  payload: WorkoutDraftPayload,
): void {
  saveDraft(routineId, {
    exerciseLogs: payload.exerciseLogs,
    completedSets: payload.completedSets,
    timerEndMs: null,
    timerTotalSeconds: 0,
  });
}

/** Scan keys for active rest timers that ended while user was elsewhere (for optional global notify). */
export function findExpiredTimerDrafts(
  nowMs: number = Date.now(),
): { routineId: string; payload: WorkoutDraftPayload }[] {
  if (typeof window === "undefined") return [];
  const expired: { routineId: string; payload: WorkoutDraftPayload }[] = [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("workout_draft:")) keys.push(key);
    }
    for (const key of keys) {
      const routineId = key.slice("workout_draft:".length);
      const payload = loadDraft(routineId);
      if (
        payload &&
        payload.timerEndMs !== null &&
        payload.timerEndMs <= nowMs &&
        Date.now() - payload.updatedAt <= WORKOUT_DRAFT_TTL_MS
      ) {
        expired.push({ routineId, payload });
      }
    }
  } catch {
    /* ignore */
  }
  return expired;
}
