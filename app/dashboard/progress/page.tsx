'use client';

import { useEffect, useState, useCallback } from 'react';
import { DAYS } from '@/lib/program';
import { DayKey, WorkoutSessionWithSets } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { DaySelector } from '@/components/progress/DaySelector';
import { ExerciseHistory } from '@/components/progress/ExerciseHistory';

export default function ProgressPage() {
  const [selectedDay, setSelectedDay] = useState<DayKey>('mon');
  const [sessions, setSessions] = useState<WorkoutSessionWithSets[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progress/${selectedDay}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const day = DAYS[selectedDay];

  return (
    <>
      <PageHeader title="Progress" />

      <div className="mx-auto max-w-lg px-4 py-4">
        <DaySelector selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-500">
              No sessions for {day.name} yet
            </p>
          ) : (
            day.exercises.map((exercise) => (
              <ExerciseHistory
                key={exercise.name}
                exerciseName={exercise.name}
                sessions={sessions}
                accentColor={day.accent}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
