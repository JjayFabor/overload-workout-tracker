'use client';

import { useEffect, useState, use } from 'react';
import { DAYS } from '@/lib/program';
import { DayKey, WorkoutSessionWithSets } from '@/lib/types';
import { formatDate, calculateVolume, groupSetsByExercise } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<WorkoutSessionWithSets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <>
        <PageHeader title="Loading..." showBack />
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Loading session...</p>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <PageHeader title="Not Found" showBack />
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Session not found</p>
        </div>
      </>
    );
  }

  const day = DAYS[session.day_key as DayKey];
  const setsByExercise = groupSetsByExercise(session.set_logs);
  const totalVolume = calculateVolume(session.set_logs);

  return (
    <>
      <PageHeader
        title={`${session.day_name}`}
        showBack
        accentColor={day?.accent}
      />

      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {formatDate(session.completed_at)}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalVolume.toLocaleString()} kg
              </p>
              <p className="text-sm text-gray-500">Total Volume</p>
            </div>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundColor: day?.accent || '#7F77DD' }}
            >
              {day?.short}
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-gray-900">Exercises</h2>

        <div className="space-y-4">
          {Object.entries(setsByExercise).map(([exerciseName, sets]) => {
            const exerciseVolume = calculateVolume(sets);

            return (
              <div
                key={exerciseName}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-medium text-gray-900">{exerciseName}</h3>
                  <span className="text-sm text-gray-500">
                    {exerciseVolume.toLocaleString()} kg
                  </span>
                </div>

                <div className="space-y-2">
                  {sets.map((set) => (
                    <div
                      key={set.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        {set.set_number}
                      </span>
                      <span className="text-gray-900">
                        {set.weight_kg} kg × {set.reps} reps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {session.notes && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-medium text-gray-900">Notes</h3>
            <p className="text-gray-600">{session.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}
