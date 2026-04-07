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

  // Get most recent session for this day
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_key', dayKey)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !session) {
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
