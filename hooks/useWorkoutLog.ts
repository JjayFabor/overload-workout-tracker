'use client';

import { useState, useCallback, useMemo } from 'react';
import { Exercise, SetInput, ExerciseLog } from '@/lib/types';

interface UseWorkoutLogReturn {
  exerciseLogs: ExerciseLog;
  completedSets: Record<string, boolean[]>;
  setExerciseSet: (
    exerciseName: string,
    setIndex: number,
    field: 'weight' | 'reps',
    value: string
  ) => void;
  markSetComplete: (exerciseName: string, setIndex: number) => void;
  initializeFromLastSession: (
    exercises: Exercise[],
    lastWeights: Record<string, SetInput[]>
  ) => void;
  getTotalSets: () => number;
  getCompletedSetsCount: () => number;
  getProgressPercent: () => number;
  reset: () => void;
}

export function useWorkoutLog(exercises: Exercise[]): UseWorkoutLogReturn {
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog>(() => {
    const initial: ExerciseLog = {};
    exercises.forEach((ex) => {
      initial[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight: '',
        reps: '',
      }));
    });
    return initial;
  });

  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>(
    () => {
      const initial: Record<string, boolean[]> = {};
      exercises.forEach((ex) => {
        initial[ex.name] = Array.from({ length: ex.sets }, () => false);
      });
      return initial;
    }
  );

  const setExerciseSet = useCallback(
    (
      exerciseName: string,
      setIndex: number,
      field: 'weight' | 'reps',
      value: string
    ) => {
      setExerciseLogs((prev) => {
        const exerciseSets = [...(prev[exerciseName] || [])];
        if (!exerciseSets[setIndex]) {
          exerciseSets[setIndex] = { weight: '', reps: '' };
        }
        exerciseSets[setIndex] = {
          ...exerciseSets[setIndex],
          [field]: value,
        };
        return {
          ...prev,
          [exerciseName]: exerciseSets,
        };
      });
    },
    []
  );

  const markSetComplete = useCallback(
    (exerciseName: string, setIndex: number) => {
      setCompletedSets((prev) => {
        const exerciseCompleted = [...(prev[exerciseName] || [])];
        exerciseCompleted[setIndex] = true;
        return {
          ...prev,
          [exerciseName]: exerciseCompleted,
        };
      });
    },
    []
  );

  const initializeFromLastSession = useCallback(
    (exerciseList: Exercise[], lastWeights: Record<string, SetInput[]>) => {
      const logs: ExerciseLog = {};
      exerciseList.forEach((ex) => {
        if (lastWeights[ex.name]) {
          logs[ex.name] = lastWeights[ex.name].map((set) => ({
            weight: set.weight,
            reps: '',
          }));
        } else {
          logs[ex.name] = Array.from({ length: ex.sets }, () => ({
            weight: '',
            reps: '',
          }));
        }
      });
      setExerciseLogs(logs);
    },
    []
  );

  const getTotalSets = useCallback(() => {
    return exercises.reduce((total, ex) => total + ex.sets, 0);
  }, [exercises]);

  const getCompletedSetsCount = useCallback(() => {
    return Object.values(completedSets).reduce(
      (total, sets) => total + sets.filter(Boolean).length,
      0
    );
  }, [completedSets]);

  const getProgressPercent = useMemo(() => {
    return () => {
      const total = getTotalSets();
      const completed = getCompletedSetsCount();
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    };
  }, [getTotalSets, getCompletedSetsCount]);

  const reset = useCallback(() => {
    const initialLogs: ExerciseLog = {};
    const initialCompleted: Record<string, boolean[]> = {};
    exercises.forEach((ex) => {
      initialLogs[ex.name] = Array.from({ length: ex.sets }, () => ({
        weight: '',
        reps: '',
      }));
      initialCompleted[ex.name] = Array.from({ length: ex.sets }, () => false);
    });
    setExerciseLogs(initialLogs);
    setCompletedSets(initialCompleted);
  }, [exercises]);

  return {
    exerciseLogs,
    completedSets,
    setExerciseSet,
    markSetComplete,
    initializeFromLastSession,
    getTotalSets,
    getCompletedSetsCount,
    getProgressPercent,
    reset,
  };
}
