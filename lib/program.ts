import { Day, DayKey } from './types';

export const DAYS: Record<DayKey, Day> = {
  mon: {
    label: 'Monday',
    short: 'Mon',
    name: 'Upper',
    accent: '#7F77DD',
    exercises: [
      { name: 'Incline DB bench press', sets: 2, reps: '8–10', restSeconds: 180 },
      { name: 'Wide grip lat pulldown', sets: 2, reps: '8–12', restSeconds: 180 },
      { name: 'Seated cable row', sets: 2, reps: '8–12', restSeconds: 180 },
      { name: 'DB shoulder press', sets: 2, reps: '8–12', restSeconds: 150 },
      { name: 'Cable lateral raise', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Face pull', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Hammer curl', sets: 2, reps: '10–12', restSeconds: 90 },
      { name: 'Overhead tricep extension', sets: 2, reps: '10–12', restSeconds: 90 },
    ],
  },
  tue: {
    label: 'Tuesday',
    short: 'Tue',
    name: 'Lower',
    accent: '#1D9E75',
    exercises: [
      { name: 'Hack squat', sets: 2, reps: '8–10', restSeconds: 180 },
      { name: 'Bulgarian split squat', sets: 2, reps: '8–12 each', restSeconds: 180 },
      { name: 'Leg press', sets: 2, reps: '10–12', restSeconds: 180 },
      { name: 'Hip thrust', sets: 2, reps: '10–12', restSeconds: 150 },
      { name: 'Romanian deadlift', sets: 2, reps: '10–12', restSeconds: 150 },
      { name: 'Seated leg curl', sets: 2, reps: '10–15', restSeconds: 90 },
      { name: 'Walking lunges', sets: 2, reps: '12 each', restSeconds: 90 },
    ],
  },
  thu: {
    label: 'Thursday',
    short: 'Thu',
    name: 'Push',
    accent: '#D85A30',
    exercises: [
      { name: 'Incline DB press', sets: 2, reps: '6–10', restSeconds: 180 },
      { name: 'Pec deck / chest fly machine', sets: 2, reps: '10–12', restSeconds: 120 },
      { name: 'Seated machine shoulder press', sets: 2, reps: '8–12', restSeconds: 150 },
      { name: 'Cable lateral raise', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Behind-body cable lateral raise', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Incline DB fly', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Tricep rope pushdown', sets: 2, reps: '10–12', restSeconds: 90 },
      { name: 'Overhead tricep extension', sets: 2, reps: '10–12', restSeconds: 90 },
    ],
  },
  fri: {
    label: 'Friday',
    short: 'Fri',
    name: 'Pull',
    accent: '#185FA5',
    exercises: [
      { name: 'Wide grip lat pulldown', sets: 2, reps: '6–10', restSeconds: 180 },
      { name: 'Underhand lat pulldown', sets: 2, reps: '8–12', restSeconds: 150 },
      { name: 'Single arm lat pulldown', sets: 2, reps: '10–12 each', restSeconds: 150 },
      { name: 'Seated row (machine)', sets: 2, reps: '8–12', restSeconds: 150 },
      { name: 'Face pull', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Single arm reverse fly', sets: 2, reps: '12–15 each', restSeconds: 90 },
      { name: 'Preacher curl', sets: 2, reps: '8–12', restSeconds: 90 },
      { name: 'Incline DB curl', sets: 2, reps: '10–12', restSeconds: 90 },
    ],
  },
  sat: {
    label: 'Saturday',
    short: 'Sat',
    name: 'Legs',
    accent: '#BA7517',
    exercises: [
      { name: 'Barbell squat', sets: 2, reps: '8–10', restSeconds: 180 },
      { name: 'Romanian deadlift', sets: 2, reps: '8–10', restSeconds: 180 },
      { name: 'Leg press (high foot)', sets: 2, reps: '10–12', restSeconds: 180 },
      { name: 'Lying / seated leg curl', sets: 2, reps: '10–15', restSeconds: 120 },
      { name: 'Leg extension', sets: 2, reps: '12–15', restSeconds: 90 },
      { name: 'Hip thrust', sets: 2, reps: '12–15', restSeconds: 90 },
    ],
  },
};

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'thu', 'fri', 'sat'];
