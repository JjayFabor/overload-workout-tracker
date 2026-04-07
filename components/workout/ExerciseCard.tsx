'use client';

import { Exercise, SetInput } from '@/lib/types';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  exercise: Exercise;
  sets: SetInput[];
  completedSets: boolean[];
  onSetChange: (setIndex: number, field: 'weight' | 'reps', value: string) => void;
  onSetComplete: (setIndex: number) => void;
  onStartTimer: () => void;
  accentColor: string;
}

export function ExerciseCard({
  exercise,
  sets,
  completedSets,
  onSetChange,
  onSetComplete,
  onStartTimer,
  accentColor,
}: ExerciseCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{exercise.name}</h3>
          <p className="text-sm text-gray-500">
            {exercise.sets} sets × {exercise.reps}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: exercise.sets }).map((_, idx) => (
          <SetRow
            key={idx}
            setNumber={idx + 1}
            weight={sets[idx]?.weight || ''}
            reps={sets[idx]?.reps || ''}
            targetReps={exercise.reps}
            onWeightChange={(value) => onSetChange(idx, 'weight', value)}
            onRepsChange={(value) => onSetChange(idx, 'reps', value)}
            onComplete={() => onSetComplete(idx)}
            isComplete={completedSets[idx] || false}
            accentColor={accentColor}
          />
        ))}
      </div>

      <button
        onClick={onStartTimer}
        className="mt-3 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        Start 3min timer
      </button>
    </div>
  );
}
