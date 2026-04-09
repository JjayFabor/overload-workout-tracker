'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { SetInput, Routine, Exercise } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { CircleProgress } from '@/components/ui/CircleProgress';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimer } from '@/components/workout/RestTimer';
import { useTimer, DEFAULT_REST_SECONDS, requestNotificationPermission } from '@/hooks/useTimer';
import { useWorkoutLog } from '@/hooks/useWorkoutLog';
import { routineToExercises, useActiveProgram } from '@/hooks/useActiveProgram';
import { WeightUnit, inputToKg, kgToDisplay } from '@/hooks/useWeightUnit';

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
    { revalidateOnFocus: false }
  );

  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [exerciseUnits, setExerciseUnits] = useState<Record<string, WeightUnit>>({} as Record<string, WeightUnit>);
  const [prefilled, setPrefilled] = useState(false);

  const timer = useTimer();

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

  // Load per-exercise unit preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('exercise_units');
    if (saved) {
      try {
        setExerciseUnits(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  // Pre-fill when both exercises and lastWeights are ready (runs once)
  useEffect(() => {
    if (prefilled || !lastWeightsData || exercises.length === 0) return;
    if (Object.keys(lastWeightsData).length > 0) {
      const converted: Record<string, SetInput[]> = {};
      for (const [name, sets] of Object.entries(lastWeightsData)) {
        const exUnit = exerciseUnits[name] || 'kg';
        converted[name] = sets.map((s) => ({
          weight: kgToDisplay(s.weight, exUnit),
          reps: '',
        }));
      }
      workoutLog.initializeFromLastSession(exercises, converted);
    }
    setPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWeightsData, exercises.length, prefilled]);

  const getExerciseUnit = useCallback(
    (name: string): WeightUnit => exerciseUnits[name] || 'kg',
    [exerciseUnits]
  );

  const toggleExerciseUnit = useCallback((name: string) => {
    setExerciseUnits((prev) => {
      const current: WeightUnit = prev[name] || 'kg';
      const next: WeightUnit = current === 'kg' ? 'lbs' : 'kg';
      const updated: Record<string, WeightUnit> = { ...prev, [name]: next };
      localStorage.setItem('exercise_units', JSON.stringify(updated));
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
    timer.start(DEFAULT_REST_SECONDS);
    setShowTimer(true);
  };

  const handleStartTimer = () => {
    timer.start(DEFAULT_REST_SECONDS);
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
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            ])
          ),
        }),
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        console.error('Failed to save workout');
      }
    } catch (err) {
      console.error('Failed to save workout:', err);
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
            onStartTimer={handleStartTimer}
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
          {saving ? 'Saving...' : 'Finish Workout'}
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
