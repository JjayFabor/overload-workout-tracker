export type DayKey = 'mon' | 'tue' | 'thu' | 'fri' | 'sat';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

export interface Day {
  label: string;
  short: string;
  name: string;
  accent: string;
  exercises: Exercise[];
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_name: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  logged_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  day_key: DayKey;
  day_name: string;
  completed_at: string;
  notes: string | null;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  set_logs: SetLog[];
}

export interface SetInput {
  weight: string;
  reps: string;
}

export interface ExerciseLog {
  [exerciseName: string]: SetInput[];
}
