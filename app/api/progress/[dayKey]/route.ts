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

  let query = supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', user.id);

  if (isUuid) {
    query = query.eq('routine_id', dayKey);
  } else {
    query = query.eq('day_key', dayKey);
  }

  const { data: sessions, error: sessionsError } = await query
    .order('completed_at', { ascending: true });

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
