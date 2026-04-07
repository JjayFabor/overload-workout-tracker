'use client';

import { useEffect, useState, useCallback } from 'react';
import { WorkoutSessionWithSets, Routine } from '@/lib/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { ExerciseHistory } from '@/components/progress/ExerciseHistory';
import { useActiveProgram } from '@/hooks/useActiveProgram';

export default function ProgressPage() {
  const { program, loading: programLoading } = useActiveProgram();
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WorkoutSessionWithSets[]>([]);
  const [loading, setLoading] = useState(false);

  // Select first routine by default
  useEffect(() => {
    if (program && program.routines.length > 0 && !selectedRoutineId) {
      setSelectedRoutineId(program.routines[0].id);
    }
  }, [program, selectedRoutineId]);

  const selectedRoutine: Routine | undefined = program?.routines.find(
    (r) => r.id === selectedRoutineId
  );

  const fetchProgress = useCallback(async () => {
    if (!selectedRoutineId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/progress/${selectedRoutineId}`);
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRoutineId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return (
    <>
      <PageHeader title="Progress" />

      <div className="mx-auto max-w-lg px-4 py-4">
        {programLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : !program ? (
          <p className="text-center text-gray-500">No active program</p>
        ) : (
          <>
            {/* Routine selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {program.routines.map((routine) => {
                const isSelected = selectedRoutineId === routine.id;
                return (
                  <button
                    key={routine.id}
                    onClick={() => setSelectedRoutineId(routine.id)}
                    className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isSelected ? { backgroundColor: routine.accent } : undefined}
                  >
                    {routine.short} - {routine.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-center text-gray-500">
                  No sessions for {selectedRoutine?.name || 'this routine'} yet
                </p>
              ) : (
                selectedRoutine?.exercises.map((exercise) => (
                  <ExerciseHistory
                    key={exercise.name}
                    exerciseName={exercise.name}
                    sessions={sessions}
                    accentColor={selectedRoutine.accent}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
