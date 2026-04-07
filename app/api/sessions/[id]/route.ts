import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Single query with nested select
  const { data: session, error } = await supabase
    .from('workout_sessions')
    .select('*, set_logs(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Sort set_logs by exercise_name then set_number
  const setLogs = (session.set_logs || []).sort((a: { exercise_name: string; set_number: number }, b: { exercise_name: string; set_number: number }) =>
    a.exercise_name === b.exercise_name
      ? a.set_number - b.set_number
      : a.exercise_name.localeCompare(b.exercise_name)
  );

  return NextResponse.json({
    ...session,
    set_logs: setLogs,
  });
}
