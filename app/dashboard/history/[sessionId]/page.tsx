'use client';

import { use } from 'react';
import useSWR from 'swr';
import { WorkoutSessionWithSets } from '@/lib/types';
import { formatDate, calculateVolume, groupSetsByExercise } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { useWeightUnit, displayWeight } from '@/hooks/useWeightUnit';
import { useActiveProgram } from '@/hooks/useActiveProgram';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function SessionDetailPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const { data: session, isLoading: loading } = useSWR<WorkoutSessionWithSets>(
    `/api/sessions/${sessionId}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const { unit } = useWeightUnit();
  const { program } = useActiveProgram();

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

  const routine = program?.routines.find((r) => r.id === session.routine_id);
  const accent = routine?.accent || '#7F77DD';
  const short = routine?.short || session.day_name?.charAt(0) || '?';
  const setsByExercise = groupSetsByExercise(session.set_logs);
  const totalVolumeKg = calculateVolume(session.set_logs);
  const totalVolumeDisplay = unit === 'lbs'
    ? (totalVolumeKg * 2.20462).toFixed(0)
    : totalVolumeKg.toLocaleString();

  return (
    <>
      <PageHeader
        title={`${session.day_name}`}
        showBack
        accentColor={accent}
      />

      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {formatDate(session.completed_at)}
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalVolumeDisplay} {unit}
              </p>
              <p className="text-sm text-gray-500">Total Volume</p>
            </div>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {short}
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-gray-900">Exercises</h2>

        <div className="space-y-4">
          {Object.entries(setsByExercise).map(([exerciseName, sets]) => {
            const exerciseVolumeKg = calculateVolume(sets);
            const exerciseVolumeDisplay = unit === 'lbs'
              ? (exerciseVolumeKg * 2.20462).toFixed(0)
              : exerciseVolumeKg.toLocaleString();

            return (
              <div
                key={exerciseName}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-medium text-gray-900">{exerciseName}</h3>
                  <span className="text-sm text-gray-500">
                    {exerciseVolumeDisplay} {unit}
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
                        {displayWeight(set.weight_kg, unit)} {unit} × {set.reps} reps
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
