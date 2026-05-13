"use client";

import { useEffect, useState, useCallback, useMemo, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { pushThenRefresh } from "@/lib/clientNavigate";
import useSWR from "swr";
import { SetInput, Routine, Exercise, ExerciseLog } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { CircleProgress } from "@/components/ui/CircleProgress";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { RestTimer } from "@/components/workout/RestTimer";
import {
  useTimer,
  DEFAULT_REST_SECONDS,
  requestNotificationPermission,
} from "@/hooks/useTimer";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { routineToExercises, useActiveProgram } from "@/hooks/useActiveProgram";
import { WeightUnit, inputToKg, kgToDisplay } from "@/hooks/useWeightUnit";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  draftHasProgress,
  clearTimerFieldsInDraft,
} from "@/lib/workoutDraft";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PageProps {
  params: Promise<{ dayKey: string }>;
}

export default function WorkoutPage({ params }: PageProps) {
  const { dayKey: routineId } = use(params);
  const router = useRouter();
  const { program } = useActiveProgram();

  // Fetch last weights in parallel with program (no waterfall!)
  const { data: lastWeightsData } = useSWR<Record<string, SetInput[]>>(
    `/api/last-weights/${routineId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [exerciseUnits, setExerciseUnits] = useState<
    Record<string, WeightUnit>
  >({} as Record<string, WeightUnit>);
  const [prefilled, setPrefilled] = useState(false);

  const timer = useTimer();
  const draftCheckedRef = useRef(false);

  useEffect(() => {
    draftCheckedRef.current = false;
    setPrefilled(false);
  }, [routineId]);

  const draftFlushRef = useRef({
    routineId,
    exerciseLogs: {} as ExerciseLog,
    completedSets: {} as Record<string, boolean[]>,
    timerEndMs: null as number | null,
    timerTotalSeconds: 0,
    isRunning: false,
  });

  // Ask for notification permission so the timer can alert when backgrounded
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Derive routine and exercises from program context (no extra fetch)
  const routine: Routine | null = useMemo(() => {
    if (!program) return null;
    return program.routines.find((r) => r.id === routineId) || null;
  }, [program, routineId]);

  const exercises: Exercise[] = useMemo(() => {
    if (!routine) return [];
    return routineToExercises(routine);
  }, [routine]);

  const workoutLog = useWorkoutLog(exercises);

  // Keep latest snapshot for pagehide / visibility flush
  useEffect(() => {
    draftFlushRef.current = {
      routineId,
      exerciseLogs: workoutLog.exerciseLogs,
      completedSets: workoutLog.completedSets,
      timerEndMs: timer.getEndTimeMs(),
      timerTotalSeconds: timer.isRunning ? timer.totalSeconds : 0,
      isRunning: timer.isRunning,
    };
  }, [
    routineId,
    workoutLog.exerciseLogs,
    workoutLog.completedSets,
    timer.isRunning,
    timer.totalSeconds,
    timer.seconds,
    timer.getEndTimeMs,
  ]);

  // Load per-exercise unit preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("exercise_units");
    if (saved) {
      try {
        setExerciseUnits(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Restore local draft (takes priority over last-weights pre-fill)
  useEffect(() => {
    if (exercises.length === 0 || draftCheckedRef.current) return;
    draftCheckedRef.current = true;

    const draft = loadDraft(routineId);
    if (draft && draftHasProgress(draft)) {
      workoutLog.hydrateFromDraft(
        exercises,
        draft.exerciseLogs,
        draft.completedSets,
      );
      if (
        draft.timerEndMs !== null &&
        draft.timerEndMs > Date.now() &&
        draft.timerTotalSeconds > 0
      ) {
        timer.resumeFromDeadline(draft.timerEndMs, draft.timerTotalSeconds);
        setShowTimer(true);
      } else if (draft.timerEndMs !== null && draft.timerEndMs <= Date.now()) {
        clearTimerFieldsInDraft(routineId, draft);
      }
      setPrefilled(true);
      return;
    }
    if (draft && !draftHasProgress(draft)) {
      clearDraft(routineId);
    }
  }, [
    exercises,
    routineId,
    workoutLog.hydrateFromDraft,
    timer.resumeFromDeadline,
  ]);

  // Pre-fill from last session when no draft was restored
  useEffect(() => {
    if (prefilled || !lastWeightsData || exercises.length === 0) return;
    if (Object.keys(lastWeightsData).length > 0) {
      const converted: Record<string, SetInput[]> = {};
      for (const [name, sets] of Object.entries(lastWeightsData)) {
        const exUnit = exerciseUnits[name] || "kg";
        converted[name] = sets.map((s) => ({
          weight: kgToDisplay(s.weight, exUnit),
          reps: s.reps ?? "",
        }));
      }
      workoutLog.initializeFromLastSession(exercises, converted);
    }
    setPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWeightsData, exercises.length, prefilled]);

  // Debounced persist while user edits or timer runs
  useEffect(() => {
    if (!prefilled || exercises.length === 0) return;
    const id = window.setTimeout(() => {
      saveDraft(routineId, {
        exerciseLogs: workoutLog.exerciseLogs,
        completedSets: workoutLog.completedSets,
        timerEndMs: timer.getEndTimeMs(),
        timerTotalSeconds: timer.isRunning ? timer.totalSeconds : 0,
      });
    }, 400);
    return () => window.clearTimeout(id);
  }, [
    prefilled,
    routineId,
    exercises.length,
    workoutLog.exerciseLogs,
    workoutLog.completedSets,
    timer.isRunning,
    timer.seconds,
    timer.totalSeconds,
    timer.getEndTimeMs,
  ]);

  // Flush draft when leaving the page or hiding the app
  useEffect(() => {
    const flush = () => {
      const s = draftFlushRef.current;
      if (s.routineId !== routineId || exercises.length === 0) return;
      saveDraft(s.routineId, {
        exerciseLogs: s.exerciseLogs,
        completedSets: s.completedSets,
        timerEndMs: s.isRunning ? s.timerEndMs : null,
        timerTotalSeconds: s.isRunning ? s.timerTotalSeconds : 0,
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [routineId, exercises.length]);

  const getExerciseUnit = useCallback(
    (name: string): WeightUnit => exerciseUnits[name] || "kg",
    [exerciseUnits],
  );

  const toggleExerciseUnit = useCallback((name: string) => {
    setExerciseUnits((prev) => {
      const current: WeightUnit = prev[name] || "kg";
      const next: WeightUnit = current === "kg" ? "lbs" : "kg";
      const updated: Record<string, WeightUnit> = { ...prev, [name]: next };
      localStorage.setItem("exercise_units", JSON.stringify(updated));
      return updated;
    });
  }, []);

  if (!program) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Routine not found</p>
      </div>
    );
  }

  const handleSetComplete = (exerciseName: string, setIndex: number) => {
    workoutLog.markSetComplete(exerciseName, setIndex);
    const restSec =
      exercises.find((e) => e.name === exerciseName)?.restSeconds ??
      DEFAULT_REST_SECONDS;
    timer.start(restSec);
    setShowTimer(true);
  };

  const handleStartTimer = (restSeconds: number = DEFAULT_REST_SECONDS) => {
    timer.start(restSeconds);
    setShowTimer(true);
  };

  const handleTimerEnd = () => {
    timer.stop();
    setShowTimer(false);
  };

  const handleAdjustTime = (delta: number) => {
    timer.adjustTime(delta);
  };

  const handleFinishWorkout = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routineId: routine.id,
          dayKey: routine.short.toLowerCase(),
          dayName: routine.name,
          exercises: Object.fromEntries(
            Object.entries(workoutLog.exerciseLogs).map(([name, sets]) => [
              name,
              sets.map((s) => ({
                weight: inputToKg(s.weight, getExerciseUnit(name)),
                reps: s.reps,
              })),
            ]),
          ),
        }),
      });

      if (res.ok) {
        clearDraft(routineId);
        pushThenRefresh(router, "/dashboard");
      } else {
        console.error("Failed to save workout");
      }
    } catch (err) {
      console.error("Failed to save workout:", err);
    } finally {
      setSaving(false);
    }
  };

  const progress = workoutLog.getProgressPercent();

  return (
    <>
      <PageHeader
        title={`${routine.label} - ${routine.name}`}
        showBack
        accentColor={routine.accent}
        rightElement={
          <CircleProgress
            progress={progress}
            size={40}
            strokeWidth={4}
            color={routine.accent}
          >
            <span className="text-xs font-medium">{progress}%</span>
          </CircleProgress>
        }
      />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.name}
            exercise={exercise}
            sets={workoutLog.exerciseLogs[exercise.name] || []}
            completedSets={workoutLog.completedSets[exercise.name] || []}
            onSetChange={(setIndex, field, value) =>
              workoutLog.setExerciseSet(exercise.name, setIndex, field, value)
            }
            onSetComplete={(setIndex) =>
              handleSetComplete(exercise.name, setIndex)
            }
            onStartTimer={() => handleStartTimer(exercise.restSeconds)}
            accentColor={routine.accent}
            exerciseUnit={getExerciseUnit(exercise.name)}
            onToggleUnit={() => toggleExerciseUnit(exercise.name)}
          />
        ))}

        <button
          onClick={handleFinishWorkout}
          disabled={saving || workoutLog.getCompletedSetsCount() === 0}
          className="w-full rounded-xl py-4 text-lg font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: routine.accent }}
        >
          {saving ? "Saving..." : "Finish Workout"}
        </button>
      </div>

      {showTimer && timer.isRunning && (
        <RestTimer
          seconds={timer.seconds}
          totalSeconds={timer.totalSeconds}
          onSkip={handleTimerEnd}
          onDone={handleTimerEnd}
          onAdjustTime={handleAdjustTime}
          accentColor={routine.accent}
        />
      )}
    </>
  );
}
