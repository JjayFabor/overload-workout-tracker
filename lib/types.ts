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

// New program types
export interface Program {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  program_id: string;
  sort_order: number;
  label: string;
  short: string;
  name: string;
  accent: string;
  exercises: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  sort_order: number;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
}

export interface ProgramWithRoutines extends Program {
  routines: Routine[];
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
  day_key: string;
  day_name: string;
  routine_id: string | null;
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
