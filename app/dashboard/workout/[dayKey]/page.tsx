'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { SetInput, Routine, Exercise } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { CircleProgress } from '@/components/ui/CircleProgress';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimer } from '@/components/workout/RestTimer';
import { useTimer, DEFAULT_REST_SECONDS } from '@/hooks/useTimer';
import { useWorkoutLog } from '@/hooks/useWorkoutLog';
import { routineToExercises, useActiveProgram } from '@/hooks/useActiveProgram';
import { WeightUnit, inputToKg, kgToDisplay } from '@/hooks/useWeightUnit';

interface PageProps {
  params: Promise<{ dayKey: string }>;
}

export default function WorkoutPage({ params }: PageProps) {
  const { dayKey: routineId } = use(params);
  const router = useRouter();
  const { program } = useActiveProgram();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  // Per-exercise unit state: defaults to kg, persisted in localStorage
  const [exerciseUnits, setExerciseUnits] = useState<Record<string, WeightUnit>>({} as Record<string, WeightUnit>);

  const timer = useTimer();
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

  // Find routine from active program
  useEffect(() => {
    if (program) {
      const found = program.routines.find((r) => r.id === routineId);
      if (found) {
        setRoutine(found);
        setExercises(routineToExercises(found));
      }
    }
  }, [program, routineId]);

  // Fetch last weights for pre-fill
  useEffect(() => {
    async function fetchLastWeights() {
      if (!routine || exercises.length === 0) return;

      try {
        const res = await fetch(`/api/last-weights/${routineId}`);
        if (res.ok) {
          const lastWeights: Record<string, SetInput[]> = await res.json();
          if (Object.keys(lastWeights).length > 0) {
            // Convert kg values to each exercise's display unit
            const converted: Record<string, SetInput[]> = {};
            for (const [name, sets] of Object.entries(lastWeights)) {
              const exUnit = exerciseUnits[name] || 'kg';
              converted[name] = sets.map((s) => ({
                weight: kgToDisplay(s.weight, exUnit),
                reps: '',
              }));
            }
            workoutLog.initializeFromLastSession(exercises, converted);
          }
        }
      } catch (err) {
        console.error('Failed to fetch last weights:', err);
      }
    }

    fetchLastWeights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine?.id, exercises.length]);

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
