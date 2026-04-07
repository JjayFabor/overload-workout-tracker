'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { DAYS } from '@/lib/program';
import { DayKey, SetInput } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { CircleProgress } from '@/components/ui/CircleProgress';
import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { RestTimer } from '@/components/workout/RestTimer';
import { useTimer, DEFAULT_REST_SECONDS } from '@/hooks/useTimer';
import { useWorkoutLog } from '@/hooks/useWorkoutLog';

interface PageProps {
  params: Promise<{ dayKey: string }>;
}

export default function WorkoutPage({ params }: PageProps) {
  const { dayKey } = use(params);
  const router = useRouter();
  const day = DAYS[dayKey as DayKey];

  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const timer = useTimer();
  const workoutLog = useWorkoutLog(day?.exercises || []);

  useEffect(() => {
    async function fetchLastWeights() {
      if (!day) return;

      try {
        const res = await fetch(`/api/last-weights/${dayKey}`);
        if (res.ok) {
          const lastWeights: Record<string, SetInput[]> = await res.json();
          if (Object.keys(lastWeights).length > 0) {
            workoutLog.initializeFromLastSession(day.exercises, lastWeights);
          }
        }
      } catch (err) {
        console.error('Failed to fetch last weights:', err);
      }
    }

    fetchLastWeights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  if (!day) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Invalid workout day</p>
      </div>
    );
  }

  const handleSetComplete = (exerciseName: string, setIndex: number) => {
    workoutLog.markSetComplete(exerciseName, setIndex);
    // Auto-start timer with default 3 minutes
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
          dayKey,
          dayName: day.name,
          exercises: workoutLog.exerciseLogs,
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
        title={`${day.label} - ${day.name}`}
        showBack
        accentColor={day.accent}
        rightElement={
          <CircleProgress
            progress={progress}
            size={40}
            strokeWidth={4}
            color={day.accent}
          >
            <span className="text-xs font-medium">{progress}%</span>
          </CircleProgress>
        }
      />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {day.exercises.map((exercise) => (
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
            accentColor={day.accent}
          />
        ))}

        <button
          onClick={handleFinishWorkout}
          disabled={saving || workoutLog.getCompletedSetsCount() === 0}
          className="w-full rounded-xl py-4 text-lg font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: day.accent }}
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
          accentColor={day.accent}
        />
      )}
    </>
  );
}
