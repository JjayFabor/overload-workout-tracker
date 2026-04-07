import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('id, day_key, day_name, routine_id, completed_at, notes')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { dayKey, dayName, routineId, exercises } = body as {
    dayKey: string;
    dayName: string;
    routineId?: string;
    exercises: Record<string, Array<{ weight: string; reps: string }>>;
  };

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      day_key: dayKey,
      day_name: dayName,
      routine_id: routineId || null,
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // Create set logs
  const setLogs: Array<{
    session_id: string;
    exercise_name: string;
    set_number: number;
    weight_kg: number | null;
    reps: number | null;
  }> = [];

  for (const [exerciseName, sets] of Object.entries(exercises)) {
    sets.forEach((set, index) => {
      if (set.weight || set.reps) {
        setLogs.push({
          session_id: session.id,
          exercise_name: exerciseName,
          set_number: index + 1,
          weight_kg: set.weight ? parseFloat(set.weight) : null,
          reps: set.reps ? parseInt(set.reps, 10) : null,
        });
      }
    });
  }

  if (setLogs.length > 0) {
    const { error: logsError } = await supabase
      .from('set_logs')
      .insert(setLogs);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: session.id });
}
