"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Exercise, SetInput, ExerciseLog } from "@/lib/types";

interface UseWorkoutLogReturn {
  exerciseLogs: ExerciseLog;
  completedSets: Record<string, boolean[]>;
  setExerciseSet: (
    exerciseName: string,
    setIndex: number,
    field: "weight" | "reps",
    value: string,
  ) => void;
  markSetComplete: (exerciseName: string, setIndex: number) => void;
  initializeFromLastSession: (
    exercises: Exercise[],
    lastWeights: Record<string, SetInput[]>,
  ) => void;
  hydrateFromDraft: (
    exerciseList: Exercise[],
    draftLogs: ExerciseLog,
    draftCompleted: Record<string, boolean[]>,
  ) => void;
  getTotalSets: () => number;
  getCompletedSetsCount: () => number;
  getProgressPercent: () => number;
  reset: () => void;
}

export function useWorkoutLog(exercises: Exercise[]): UseWorkoutLogReturn {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog>(() => {
    const initial: ExerciseLog = {};
    exercises.forEach((ex) => {
      initial[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight: "",
        reps: "",
      }));
    });
    return initial;
  });

  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>(
    () => {
      const initial: Record<string, boolean[]> = {};
      exercises.forEach((ex) => {
        initial[ex.name] = Array.from({ length: ex.sets }, () => false);
      });
      return initial;
    },
  );

  // First render may have exercises=[] before program loads; expand skeleton when list appears.
  // Drop exercises removed when switching routines.
  useEffect(() => {
    if (exercises.length === 0) return;
    const allowed = new Set(exercises.map((e) => e.name));

    setExerciseLogs((prev) => {
      const hadStale = Object.keys(prev).some((k) => !allowed.has(k));
      const next: ExerciseLog = {};
      let changed = hadStale;
      for (const ex of exercises) {
        const prevSets = prev[ex.name];
        const aligned = Array.from({ length: ex.sets }, (_, i) => ({
          weight: prevSets?.[i]?.weight ?? "",
          reps: prevSets?.[i]?.reps ?? "",
        }));
        next[ex.name] = aligned;
        if (!prevSets || prevSets.length !== ex.sets) changed = true;
        else {
          for (let i = 0; i < ex.sets; i++) {
            if (
              prevSets[i]?.weight !== aligned[i].weight ||
              prevSets[i]?.reps !== aligned[i].reps
            ) {
              changed = true;
              break;
            }
          }
        }
      }
      return changed ? next : prev;
    });

    setCompletedSets((prev) => {
      const hadStale = Object.keys(prev).some((k) => !allowed.has(k));
      const next: Record<string, boolean[]> = {};
      let changed = hadStale;
      for (const ex of exercises) {
        const prevRow = prev[ex.name];
        const aligned = Array.from({ length: ex.sets }, (_, i) =>
          Boolean(prevRow?.[i]),
        );
        next[ex.name] = aligned;
        if (!prevRow || prevRow.length !== ex.sets) changed = true;
        else {
          for (let i = 0; i < ex.sets; i++) {
            if (Boolean(prevRow[i]) !== aligned[i]) {
              changed = true;
              break;
            }
          }
        }
      }
      return changed ? next : prev;
    });
  }, [exercises]);

  const setExerciseSet = useCallback(
    (
      exerciseName: string,
      setIndex: number,
      field: "weight" | "reps",
      value: string,
    ) => {
      setExerciseLogs((prev) => {
        const exerciseSets = [...(prev[exerciseName] || [])];
        if (!exerciseSets[setIndex]) {
          exerciseSets[setIndex] = { weight: "", reps: "" };
        }
        exerciseSets[setIndex] = {
          ...exerciseSets[setIndex],
          [field]: value,
        };
        return {
          ...prev,
          [exerciseName]: exerciseSets,
        };
      });
    },
    [],
  );

  const markSetComplete = useCallback(
    (exerciseName: string, setIndex: number) => {
      setCompletedSets((prev) => {
        const exerciseCompleted = [...(prev[exerciseName] || [])];
        exerciseCompleted[setIndex] = true;
        return {
          ...prev,
          [exerciseName]: exerciseCompleted,
        };
      });
    },
    [],
  );

  const initializeFromLastSession = useCallback(
    (exerciseList: Exercise[], lastWeights: Record<string, SetInput[]>) => {
      const logs: ExerciseLog = {};
      const completed: Record<string, boolean[]> = {};
      exerciseList.forEach((ex) => {
        if (lastWeights[ex.name]) {
          logs[ex.name] = lastWeights[ex.name].map((set) => ({
            weight: set.weight,
            reps: set.reps ?? "",
          }));
          // Pad if API returned fewer sets than program
          while (logs[ex.name].length < ex.sets) {
            logs[ex.name].push({ weight: "", reps: "" });
          }
          logs[ex.name] = logs[ex.name].slice(0, ex.sets);
        } else {
          logs[ex.name] = Array.from({ length: ex.sets }, () => ({
            weight: "",
            reps: "",
          }));
        }
        completed[ex.name] = Array.from({ length: ex.sets }, () => false);
      });
      setExerciseLogs(logs);
      setCompletedSets(completed);
    },
    [],
  );

  const hydrateFromDraft = useCallback(
    (
      exerciseList: Exercise[],
      draftLogs: ExerciseLog,
      draftCompleted: Record<string, boolean[]>,
    ) => {
      const logs: ExerciseLog = {};
      const completed: Record<string, boolean[]> = {};
      exerciseList.forEach((ex) => {
        const fromDraft = draftLogs[ex.name];
        const fromCompleted = draftCompleted[ex.name];
        logs[ex.name] = Array.from({ length: ex.sets }, (_, i) => ({
          weight: fromDraft?.[i]?.weight ?? "",
          reps: fromDraft?.[i]?.reps ?? "",
        }));
        completed[ex.name] = Array.from({ length: ex.sets }, (_, i) =>
          Boolean(fromCompleted?.[i]),
        );
      });
      setExerciseLogs(logs);
      setCompletedSets(completed);
    },
    [],
  );

  const getTotalSets = useCallback(() => {
    return exercises.reduce((total, ex) => total + ex.sets, 0);
  }, [exercises]);

  const getCompletedSetsCount = useCallback(() => {
    return Object.values(completedSets).reduce(
      (total, sets) => total + sets.filter(Boolean).length,
      0,
    );
  }, [completedSets]);

  const getProgressPercent = useMemo(() => {
    return () => {
      const total = getTotalSets();
      const completed = getCompletedSetsCount();
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    };
  }, [getTotalSets, getCompletedSetsCount]);

  const reset = useCallback(() => {
    const initialLogs: ExerciseLog = {};
    const initialCompleted: Record<string, boolean[]> = {};
    exercises.forEach((ex) => {
      initialLogs[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight: "",
        reps: "",
      }));
      initialCompleted[ex.name] = Array.from({ length: ex.sets }, () => false);
    });
    setExerciseLogs(initialLogs);
    setCompletedSets(initialCompleted);
  }, [exercises]);

  return {
    exerciseLogs,
    completedSets,
    setExerciseSet,
    markSetComplete,
    initializeFromLastSession,
    hydrateFromDraft,
    getTotalSets,
    getCompletedSetsCount,
    getProgressPercent,
    reset,
  };
}
