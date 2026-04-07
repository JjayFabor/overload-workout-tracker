'use client';

import { createContext, useContext } from 'react';
import useSWR from 'swr';
import { ProgramWithRoutines, Routine, Exercise } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Context for sharing program data across all dashboard pages
interface ProgramContextValue {
  program: ProgramWithRoutines | null;
  loading: boolean;
  refetch: () => void;
}

export const ProgramContext = createContext<ProgramContextValue>({
  program: null,
  loading: true,
  refetch: () => {},
});

// Provider hook - used ONLY in dashboard layout
export function useProgramProvider(): ProgramContextValue {
  const { data, isLoading, mutate } = useSWR<ProgramWithRoutines[]>(
    '/api/programs',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Dedupe requests within 60s
    }
  );

  const program = data
    ? data.find((p) => p.is_active) || data[0] || null
    : null;

  return {
    program,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

// Consumer hook - used in all dashboard pages
export function useActiveProgram(): ProgramContextValue {
  return useContext(ProgramContext);
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
