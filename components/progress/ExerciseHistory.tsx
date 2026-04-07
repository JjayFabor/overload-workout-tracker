'use client';

import { SetLog, WorkoutSessionWithSets } from '@/lib/types';
import { formatDate, bestWeight, bestRepsAtWeight, getTrendArrow } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ExerciseHistoryProps {
  exerciseName: string;
  sessions: WorkoutSessionWithSets[];
  accentColor: string;
}

export function ExerciseHistory({
  exerciseName,
  sessions,
  accentColor,
}: ExerciseHistoryProps) {
  const exerciseSessions = sessions
    .map((session) => ({
      session,
      sets: session.set_logs.filter((s) => s.exercise_name === exerciseName),
    }))
    .filter((item) => item.sets.length > 0);

  if (exerciseSessions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="font-medium text-gray-900">{exerciseName}</h3>
        <p className="mt-2 text-sm text-gray-500">No data yet</p>
      </div>
    );
  }

  const allTimeBestWeight = Math.max(
    ...exerciseSessions.flatMap((es) => es.sets.map((s) => s.weight_kg ?? 0))
  );

  const firstBestWeight = bestWeight(exerciseSessions[0].sets);
  const lastBestWeight = bestWeight(
    exerciseSessions[exerciseSessions.length - 1].sets
  );
  const isImproving = lastBestWeight > firstBestWeight;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-medium text-gray-900">{exerciseName}</h3>
        <Badge variant={isImproving ? 'success' : 'default'}>
          {isImproving ? 'Improving' : 'Plateau'}
        </Badge>
      </div>

      <div className="space-y-3">
        {exerciseSessions.map((item, idx) => {
          const currentBestWeight = bestWeight(item.sets);
          const currentBestReps = bestRepsAtWeight(item.sets, currentBestWeight);

          const previousItem = exerciseSessions[idx - 1];
          const previousBestWeight = previousItem
            ? bestWeight(previousItem.sets)
            : currentBestWeight;
          const previousBestReps = previousItem
            ? bestRepsAtWeight(previousItem.sets, previousBestWeight)
            : currentBestReps;

          const trend = getTrendArrow(
            currentBestWeight,
            currentBestReps,
            previousBestWeight,
            previousBestReps
          );

          const isPR = currentBestWeight === allTimeBestWeight && idx > 0;
          const diff = currentBestWeight - previousBestWeight;

          return (
            <div
              key={item.session.id}
              className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm text-gray-600">
                  {formatDate(item.session.completed_at)}
                </p>
                <div className="mt-1 flex gap-2 text-sm">
                  {item.sets.map((set, setIdx) => (
                    <span key={set.id} className="text-gray-900">
                      {setIdx > 0 && <span className="text-gray-400"> / </span>}
                      {set.weight_kg}kg × {set.reps}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {diff !== 0 && idx > 0 && (
                  <span
                    className={`text-xs ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {diff > 0 ? '+' : ''}
                    {diff}kg
                  </span>
                )}
                {isPR && <Badge variant="pr">PR</Badge>}
                <span
                  className={`text-lg ${
                    trend === '↑'
                      ? 'text-green-600'
                      : trend === '↓'
                        ? 'text-red-600'
                        : 'text-gray-400'
                  }`}
                >
                  {trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
