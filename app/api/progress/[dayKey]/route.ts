import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  let sessions: Record<string, unknown>[] | null = null;
  let sessionsError: { message: string } | null = null;

  if (isUuid) {
    // First try by routine_id
    const result = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('routine_id', dayKey)
      .order('completed_at', { ascending: true });

    sessions = result.data;
    sessionsError = result.error;

    // If no results, also look for legacy sessions by day_name
    // (sessions created before the programs feature)
    if (!sessions || sessions.length === 0) {
      // Get the routine's name to match legacy sessions
      const { data: routine } = await supabase
        .from('routines')
        .select('name')
        .eq('id', dayKey)
        .single();

      if (routine) {
        const legacyResult = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('day_name', routine.name)
          .is('routine_id', null)
          .order('completed_at', { ascending: true });

        sessions = legacyResult.data;
        sessionsError = legacyResult.error;
      }
    }
  } else {
    const result = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('day_key', dayKey)
      .order('completed_at', { ascending: true });

    sessions = result.data;
    sessionsError = result.error;
  }

  if (sessionsError) {
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json([]);
  }

  // Get all set logs for these sessions
  const sessionIds = sessions.map((s) => s.id);
  const { data: setLogs, error: logsError } = await supabase
    .from('set_logs')
    .select('*')
    .in('session_id', sessionIds)
    .order('set_number');

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  // Combine sessions with their set logs
  const sessionsWithSets = sessions.map((session) => ({
    ...session,
    set_logs: setLogs?.filter((log) => log.session_id === session.id) || [],
  }));

  return NextResponse.json(sessionsWithSets);
}
