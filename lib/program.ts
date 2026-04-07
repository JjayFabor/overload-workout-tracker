import { Day, DayKey } from './types';

// Legacy hardcoded data - kept for backward compat with old sessions
export const DAYS: Record<DayKey, Day> = {
  mon: { label: 'Monday', short: 'Mon', name: 'Upper', accent: '#7F77DD', exercises: [] },
  tue: { label: 'Tuesday', short: 'Tue', name: 'Lower', accent: '#1D9E75', exercises: [] },
  thu: { label: 'Thursday', short: 'Thu', name: 'Push', accent: '#D85A30', exercises: [] },
  fri: { label: 'Friday', short: 'Fri', name: 'Pull', accent: '#185FA5', exercises: [] },
  sat: { label: 'Saturday', short: 'Sat', name: 'Legs', accent: '#BA7517', exercises: [] },
};

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'thu', 'fri', 'sat'];

// V-Taper template for seeding new users
export const V_TAPER_TEMPLATE = {
  name: 'V-Taper Hypertrophy',
  description: 'Science-based V-taper program. Mon/Tue/Thu/Fri/Sat.',
  routines: [
    {
      label: 'Monday', short: 'Mon', name: 'Upper', accent: '#7F77DD',
      exercises: [
        { name: 'Incline DB bench press', sets: 2, reps: '8–10', rest_seconds: 180 },
        { name: 'Wide grip lat pulldown', sets: 2, reps: '8–12', rest_seconds: 180 },
        { name: 'Seated cable row', sets: 2, reps: '8–12', rest_seconds: 180 },
        { name: 'DB shoulder press', sets: 2, reps: '8–12', rest_seconds: 150 },
        { name: 'Cable lateral raise', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Face pull', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Hammer curl', sets: 2, reps: '10–12', rest_seconds: 90 },
        { name: 'Overhead tricep extension', sets: 2, reps: '10–12', rest_seconds: 90 },
      ],
    },
    {
      label: 'Tuesday', short: 'Tue', name: 'Lower', accent: '#1D9E75',
      exercises: [
        { name: 'Hack squat', sets: 2, reps: '8–10', rest_seconds: 180 },
        { name: 'Bulgarian split squat', sets: 2, reps: '8–12 each', rest_seconds: 180 },
        { name: 'Leg press', sets: 2, reps: '10–12', rest_seconds: 180 },
        { name: 'Hip thrust', sets: 2, reps: '10–12', rest_seconds: 150 },
        { name: 'Romanian deadlift', sets: 2, reps: '10–12', rest_seconds: 150 },
        { name: 'Seated leg curl', sets: 2, reps: '10–15', rest_seconds: 90 },
        { name: 'Walking lunges', sets: 2, reps: '12 each', rest_seconds: 90 },
      ],
    },
    {
      label: 'Thursday', short: 'Thu', name: 'Push', accent: '#D85A30',
      exercises: [
        { name: 'Incline DB press', sets: 2, reps: '6–10', rest_seconds: 180 },
        { name: 'Pec deck / chest fly machine', sets: 2, reps: '10–12', rest_seconds: 120 },
        { name: 'Seated machine shoulder press', sets: 2, reps: '8–12', rest_seconds: 150 },
        { name: 'Cable lateral raise', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Behind-body cable lateral raise', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Incline DB fly', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Tricep rope pushdown', sets: 2, reps: '10–12', rest_seconds: 90 },
        { name: 'Overhead tricep extension', sets: 2, reps: '10–12', rest_seconds: 90 },
      ],
    },
    {
      label: 'Friday', short: 'Fri', name: 'Pull', accent: '#185FA5',
      exercises: [
        { name: 'Wide grip lat pulldown', sets: 2, reps: '6–10', rest_seconds: 180 },
        { name: 'Underhand lat pulldown', sets: 2, reps: '8–12', rest_seconds: 150 },
        { name: 'Single arm lat pulldown', sets: 2, reps: '10–12 each', rest_seconds: 150 },
        { name: 'Seated row (machine)', sets: 2, reps: '8–12', rest_seconds: 150 },
        { name: 'Face pull', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Single arm reverse fly', sets: 2, reps: '12–15 each', rest_seconds: 90 },
        { name: 'Preacher curl', sets: 2, reps: '8–12', rest_seconds: 90 },
        { name: 'Incline DB curl', sets: 2, reps: '10–12', rest_seconds: 90 },
      ],
    },
    {
      label: 'Saturday', short: 'Sat', name: 'Legs', accent: '#BA7517',
      exercises: [
        { name: 'Barbell squat', sets: 2, reps: '8–10', rest_seconds: 180 },
        { name: 'Romanian deadlift', sets: 2, reps: '8–10', rest_seconds: 180 },
        { name: 'Leg press (high foot)', sets: 2, reps: '10–12', rest_seconds: 180 },
        { name: 'Lying / seated leg curl', sets: 2, reps: '10–15', rest_seconds: 120 },
        { name: 'Leg extension', sets: 2, reps: '12–15', rest_seconds: 90 },
        { name: 'Hip thrust', sets: 2, reps: '12–15', rest_seconds: 90 },
      ],
    },
  ],
};

// Preset accent colors for color picker
export const ACCENT_COLORS = [
  '#7F77DD', '#1D9E75', '#D85A30', '#185FA5', '#BA7517',
  '#E24B4A', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16',
];

// Day options for dropdown
export const DAY_OPTIONS: { label: string; short: string }[] = [
  { label: 'Monday', short: 'Mon' },
  { label: 'Tuesday', short: 'Tue' },
  { label: 'Wednesday', short: 'Wed' },
  { label: 'Thursday', short: 'Thu' },
  { label: 'Friday', short: 'Fri' },
  { label: 'Saturday', short: 'Sat' },
  { label: 'Sunday', short: 'Sun' },
];
