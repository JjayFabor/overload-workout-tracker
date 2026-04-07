# Workout Tracker PWA — Claude Code Context

## Project overview

A Progressive Web App (PWA) workout tracker for **jjayfabor**, built to track a science-based V-taper training program. The app must be installable on iPhone and Android via "Add to Home Screen", work offline in the gym, and persist all data in Supabase.

## Tech stack

| Layer                 | Technology              |
| --------------------- | ----------------------- |
| Frontend + API routes | Next.js 14 (App Router) |
| PWA                   | `next-pwa`              |
| Database + Auth       | Supabase (Postgres)     |
| Styling               | Tailwind CSS            |
| Deployment            | Vercel                  |
| Language              | TypeScript              |

## Core features

1. **Auth** — Email/password login via Supabase Auth. Protect all routes.
2. **Workout logging** — Select a training day, log weight (kg) and reps per set, finish and save session.
3. **Rest timer** — Auto-starts after each set is completed. Shown as a modal with a circular countdown. Science-based rest times per exercise type (compounds 3min, semi-compounds 2.5min, isolations 90sec). Has "Skip" and "Done early" buttons.
4. **Progress tracking** — Per exercise, per day: show every session's Set 1 and Set 2 with weight/reps, trend arrows (↑ ↓ →), PR badges, and an "Improving / Plateau" status.
5. **History** — List of all past sessions. Tap to see full detail with total volume (kg).
6. **Last weights pre-fill** — When opening a workout, pre-fill inputs with weights from the last session for that day.
7. **PWA** — Offline support via service worker. Installable. Full-screen, no browser chrome.
8. **"Done this week" badge** — Home screen shows if a day has been completed in the past 7 days.

## Training program

User: jjayfabor. Program: V-taper. Schedule: Mon / Tue / Thu / Fri / Sat.

### Monday — Upper (accent: #7F77DD)

| Exercise                  | Sets | Reps  | Rest   |
| ------------------------- | ---- | ----- | ------ |
| Incline DB bench press    | 2    | 8–10  | 3min   |
| Wide grip lat pulldown    | 2    | 8–12  | 3min   |
| Seated cable row          | 2    | 8–12  | 3min   |
| DB shoulder press         | 2    | 8–12  | 2.5min |
| Cable lateral raise       | 2    | 12–15 | 90sec  |
| Face pull                 | 2    | 12–15 | 90sec  |
| Hammer curl               | 2    | 10–12 | 90sec  |
| Overhead tricep extension | 2    | 10–12 | 90sec  |

### Tuesday — Lower (accent: #1D9E75)

| Exercise              | Sets | Reps      | Rest   |
| --------------------- | ---- | --------- | ------ |
| Hack squat            | 2    | 8–10      | 3min   |
| Bulgarian split squat | 2    | 8–12 each | 3min   |
| Leg press             | 2    | 10–12     | 3min   |
| Hip thrust            | 2    | 10–12     | 2.5min |
| Romanian deadlift     | 2    | 10–12     | 2.5min |
| Seated leg curl       | 2    | 10–15     | 90sec  |
| Walking lunges        | 2    | 12 each   | 90sec  |

### Thursday — Push (accent: #D85A30)

| Exercise                        | Sets | Reps  | Rest   |
| ------------------------------- | ---- | ----- | ------ |
| Incline DB press                | 2    | 6–10  | 3min   |
| Pec deck / chest fly machine    | 2    | 10–12 | 2min   |
| Seated machine shoulder press   | 2    | 8–12  | 2.5min |
| Cable lateral raise             | 2    | 12–15 | 90sec  |
| Behind-body cable lateral raise | 2    | 12–15 | 90sec  |
| Incline DB fly                  | 2    | 12–15 | 90sec  |
| Tricep rope pushdown            | 2    | 10–12 | 90sec  |
| Overhead tricep extension       | 2    | 10–12 | 90sec  |

### Friday — Pull (accent: #185FA5)

| Exercise                | Sets | Reps       | Rest   |
| ----------------------- | ---- | ---------- | ------ |
| Wide grip lat pulldown  | 2    | 6–10       | 3min   |
| Underhand lat pulldown  | 2    | 8–12       | 2.5min |
| Single arm lat pulldown | 2    | 10–12 each | 2.5min |
| Seated row (machine)    | 2    | 8–12       | 2.5min |
| Face pull               | 2    | 12–15      | 90sec  |
| Single arm reverse fly  | 2    | 12–15 each | 90sec  |
| Preacher curl           | 2    | 8–12       | 90sec  |
| Incline DB curl         | 2    | 10–12      | 90sec  |

### Saturday — Legs (accent: #BA7517)

| Exercise                | Sets | Reps  | Rest  |
| ----------------------- | ---- | ----- | ----- |
| Barbell squat           | 2    | 8–10  | 3min  |
| Romanian deadlift       | 2    | 8–10  | 3min  |
| Leg press (high foot)   | 2    | 10–12 | 3min  |
| Lying / seated leg curl | 2    | 10–15 | 2min  |
| Leg extension           | 2    | 12–15 | 90sec |
| Hip thrust              | 2    | 12–15 | 90sec |

## Database schema (Supabase / Postgres)

```sql
-- Users are managed by Supabase Auth (auth.users)
-- This table extends it with profile data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz default now()
);

-- One row per completed workout session
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_key text not null, -- 'mon' | 'tue' | 'thu' | 'fri' | 'sat'
  day_name text not null, -- 'Upper' | 'Lower' | 'Push' | 'Pull' | 'Legs'
  completed_at timestamptz default now(),
  notes text
);

-- One row per set logged within a session
create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  set_number int not null, -- 1 or 2
  weight_kg numeric(5,2),
  reps int,
  logged_at timestamptz default now()
);

-- Row Level Security: users can only see their own data
alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "own sessions" on public.workout_sessions
  for all using (auth.uid() = user_id);

create policy "own set logs" on public.set_logs
  for all using (
    session_id in (
      select id from public.workout_sessions where user_id = auth.uid()
    )
  );
```

## Project structure

```
/
├── app/
│   ├── layout.tsx              # Root layout, PWA meta tags, font
│   ├── page.tsx                # Redirect to /dashboard or /login
│   ├── login/
│   │   └── page.tsx            # Email/password login form
│   ├── dashboard/
│   │   ├── layout.tsx          # Bottom nav (Workout / Progress / History)
│   │   ├── page.tsx            # Home — day selector grid + recent sessions
│   │   ├── workout/
│   │   │   └── [dayKey]/
│   │   │       └── page.tsx    # Active workout — exercise cards + set inputs + timer
│   │   ├── progress/
│   │   │   └── page.tsx        # Progress — day tabs + per-exercise history tables
│   │   └── history/
│   │       ├── page.tsx        # History list
│   │       └── [sessionId]/
│   │           └── page.tsx    # Session detail — volume + all sets
│   └── api/
│       ├── sessions/
│       │   └── route.ts        # GET (list), POST (create session + sets)
│       ├── sessions/[id]/
│       │   └── route.ts        # GET (detail with all set_logs)
│       ├── progress/[dayKey]/
│       │   └── route.ts        # GET all sessions for a day with set data
│       └── last-weights/[dayKey]/
│           └── route.ts        # GET last session's weights for pre-fill
├── components/
│   ├── workout/
│   │   ├── ExerciseCard.tsx    # Exercise name, target reps, set rows
│   │   ├── SetRow.tsx          # Weight + reps inputs + checkmark
│   │   └── RestTimer.tsx       # Modal with circular countdown ring
│   ├── progress/
│   │   ├── DaySelector.tsx     # Scrollable pill tabs for day selection
│   │   └── ExerciseHistory.tsx # Per-exercise session history table
│   ├── layout/
│   │   ├── BottomNav.tsx       # Workout / Progress / History nav
│   │   └── PageHeader.tsx      # Back button + title + optional right element
│   └── ui/
│       ├── CircleProgress.tsx  # SVG circular progress ring
│       └── Badge.tsx           # Pill badge (Done this week, PR, Done, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client (for API routes)
│   ├── program.ts              # DAYS constant with all exercises, sets, reps, rest times
│   └── utils.ts                # bestWeight(), formatTime(), uid(), etc.
├── hooks/
│   ├── useTimer.ts             # Rest timer countdown logic
│   └── useWorkoutLog.ts        # Local state for active workout session
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (generated by next-pwa)
│   └── icons/                  # PWA icons (192x192, 512x512)
├── next.config.js              # next-pwa config
├── tailwind.config.ts
├── CLAUDE.md                   # This file
└── .env.local                  # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Environment variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # server-side only
```

## PWA config (next.config.js)

```js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  // next config here
});
```

## PWA manifest (public/manifest.json)

```json
{
  "name": "Workout Tracker",
  "short_name": "Workout",
  "description": "jjayfabor V-taper program tracker",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7F77DD",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/overload-logo.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Design system

### Colors

Each training day has an accent color used for headers, badges, progress rings, and borders.

```ts
// lib/program.ts
export const DAYS = {
  mon: { label: 'Monday',   short: 'Mon', name: 'Upper', accent: '#7F77DD', exercises: [...] },
  tue: { label: 'Tuesday',  short: 'Tue', name: 'Lower', accent: '#1D9E75', exercises: [...] },
  thu: { label: 'Thursday', short: 'Thu', name: 'Push',  accent: '#D85A30', exercises: [...] },
  fri: { label: 'Friday',   short: 'Fri', name: 'Pull',  accent: '#185FA5', exercises: [...] },
  sat: { label: 'Saturday', short: 'Sat', name: 'Legs',  accent: '#BA7517', exercises: [...] },
}
```

### UI principles

- Mobile-first, max-width 480px centered on desktop
- Bottom navigation bar (fixed, 3 tabs: Workout / Progress / History)
- Cards with 1px #ebebeb border, 12px border-radius
- Completed sets turn green (#1D9E75) with a checkmark
- Progress ring in the workout header shows % of sets logged
- All weights in kg

### Rest timer behavior

- Triggers automatically when both weight AND reps are filled for a set (on blur)
- Also has a manual "Start Xmin timer" button at the bottom of each exercise card
- Full-screen modal with circular SVG countdown ring matching the day's accent color
- Ring turns red (#E24B4A) when ≤10 seconds remain
- Two buttons: "Skip" (dismiss immediately) and "Done early" (dismiss immediately)
- Rest times per exercise are defined in `lib/program.ts` alongside each exercise

### Progress tracking logic

- **Trend arrow**: Compare best weight of current session vs previous session. If same weight, compare max reps. ↑ up, ↓ down, → same.
- **PR badge**: Show "PR" if the current session's best weight is higher than ALL previous sessions for that exercise.
- **Improving / Plateau**: Compare first session's best weight to latest session's best weight.
- **diff label**: Show "+X kg vs last" or "−X kg vs last" when there's a difference.

## API routes

### POST /api/sessions

Save a completed workout. Body:

```ts
{
  dayKey: string,
  dayName: string,
  exercises: {
    [exerciseName: string]: Array<{ weight: string, reps: string }>
  }
}
```

Creates one `workout_sessions` row and N `set_logs` rows. Returns the session id.

### GET /api/sessions

Returns the user's session index (id, date, dayKey, dayName, completed_at) ordered by most recent. Used for Home (recent list) and History page.

### GET /api/sessions/[id]

Returns full session detail: session metadata + all set_logs grouped by exercise_name.

### GET /api/progress/[dayKey]

Returns all sessions for a given day key, with set data, ordered by completed_at ascending. Used by the Progress page to build exercise history tables.

### GET /api/last-weights/[dayKey]

Returns the most recent session for the given day key with its set_logs. Used to pre-fill the workout form with last session's weights.

## Key implementation notes

- **Offline support**: Use SWR or React Query with optimistic updates. Queue writes when offline and sync on reconnect using the service worker's background sync.
- **Auth middleware**: Use Next.js middleware (`middleware.ts`) to protect all `/dashboard` routes. Redirect unauthenticated users to `/login`.
- **Supabase client vs server**: Use the browser client (`lib/supabase/client.ts`) in Client Components and the server client (`lib/supabase/server.ts`) in API routes and Server Components.
- **Date formatting**: Use `en-PH` locale for dates (e.g. "Apr 7, 2026").
- **No external component libraries**: Build all UI from scratch with Tailwind. Keep it lean.
- **TypeScript strict mode**: Enable in `tsconfig.json`.

## Commands

```bash
# Install dependencies
npm install next react react-dom typescript @types/node @types/react
npm install @supabase/supabase-js @supabase/ssr
npm install next-pwa
npm install tailwindcss postcss autoprefixer
npm install swr

# Dev server
npm run dev

# Build
npm run build

# Deploy (auto-deploys on git push to main via Vercel)
```

## What has already been designed

All UI screens, the full workout program, the progressive overload tracking logic, and the database schema have been finalized in a prior conversation. Do not change the training program data, the accent colors per day, or the core UI structure without explicit instruction. The logic for rest times, trend arrows, PR detection, and "Done this week" detection is documented above and must be implemented exactly as described.
