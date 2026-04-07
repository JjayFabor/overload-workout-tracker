'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProgramWithRoutines, Routine, Exercise } from '@/lib/types';

export function useActiveProgram() {
  const [program, setProgram] = useState<ProgramWithRoutines | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgram = useCallback(async () => {
    try {
      const res = await fetch('/api/programs');
      if (res.ok) {
        const programs: ProgramWithRoutines[] = await res.json();
        const active = programs.find((p) => p.is_active) || programs[0] || null;
        setProgram(active);
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  return { program, loading, refetch: fetchProgram };
}

// Convert a Routine's exercises to the Exercise interface used by workout components
export function routineToExercises(routine: Routine): Exercise[] {
  return routine.exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    restSeconds: ex.rest_seconds,
  }));
}
