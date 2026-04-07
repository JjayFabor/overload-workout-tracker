import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SetInput } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dayKey: string }> }
) {
  const { dayKey } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try routine_id first (UUID), fall back to day_key (legacy)
  const isUuid = dayKey.includes('-') && dayKey.length > 10;

  let session: { id: string } | null = null;

  if (isUuid) {
    // Try by routine_id
    const { data } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('routine_id', dayKey)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    session = data;

    // Fall back to legacy sessions by day_name
    if (!session) {
      const { data: routine } = await supabase
        .from('routines')
        .select('name')
        .eq('id', dayKey)
        .single();

      if (routine) {
        const { data: legacySession } = await supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('day_name', routine.name)
          .is('routine_id', null)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        session = legacySession;
      }
    }
  } else {
    const { data } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .eq('day_key', dayKey)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    session = data;
  }

  if (!session) {
    return NextResponse.json({});
  }

  // Get set logs for this session
  const { data: setLogs, error: logsError } = await supabase
    .from('set_logs')
    .select('exercise_name, set_number, weight_kg, reps')
    .eq('session_id', session.id)
    .order('exercise_name')
    .order('set_number');

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  // Group by exercise name
  const weightsByExercise: Record<string, SetInput[]> = {};

  setLogs?.forEach((log) => {
    if (!weightsByExercise[log.exercise_name]) {
      weightsByExercise[log.exercise_name] = [];
    }
    weightsByExercise[log.exercise_name][log.set_number - 1] = {
      weight: log.weight_kg?.toString() || '',
      reps: log.reps?.toString() || '',
    };
  });

  return NextResponse.json(weightsByExercise);
}
