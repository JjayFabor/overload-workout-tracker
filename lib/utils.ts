import { SetLog } from './types';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRestTime(seconds: number): string {
  if (seconds >= 60) {
    const mins = seconds / 60;
    return mins % 1 === 0 ? `${mins}min` : `${mins.toFixed(1)}min`;
  }
  return `${seconds}sec`;
}

export function uid(): string {
  return crypto.randomUUID();
}

export function bestWeight(sets: SetLog[]): number {
  return Math.max(...sets.map((s) => s.weight_kg ?? 0), 0);
}

export function bestRepsAtWeight(sets: SetLog[], weight: number): number {
  return Math.max(
    ...sets.filter((s) => s.weight_kg === weight).map((s) => s.reps ?? 0),
    0
  );
}

export function calculateVolume(sets: SetLog[]): number {
  return sets.reduce((total, set) => {
    const weight = set.weight_kg ?? 0;
    const reps = set.reps ?? 0;
    return total + weight * reps;
  }, 0);
}

export function getTrendArrow(
  currentBestWeight: number,
  currentBestReps: number,
  previousBestWeight: number,
  previousBestReps: number
): '↑' | '↓' | '→' {
  if (currentBestWeight > previousBestWeight) return '↑';
  if (currentBestWeight < previousBestWeight) return '↓';
  if (currentBestReps > previousBestReps) return '↑';
  if (currentBestReps < previousBestReps) return '↓';
  return '→';
}

export function isWithinLastWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return d >= weekAgo;
}

export function groupSetsByExercise(
  sets: SetLog[]
): Record<string, SetLog[]> {
  return sets.reduce(
    (acc, set) => {
      if (!acc[set.exercise_name]) {
        acc[set.exercise_name] = [];
      }
      acc[set.exercise_name].push(set);
      return acc;
    },
    {} as Record<string, SetLog[]>
  );
}
