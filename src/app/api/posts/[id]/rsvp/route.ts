import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: postId } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // Check if approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.status !== 'approved' && profile.role !== 'admin')) {
    return NextResponse.json({ error: '승인된 정회원만 러닝 참석 신청을 할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json();
  const { pace_group } = body;

  // Check if already RSVP'd
  const { data: existingRSVP } = await supabase
    .from('rsvps')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRSVP) {
    // Cancel RSVP (toggle off)
    const { error } = await supabase
      .from('rsvps')
      .delete()
      .eq('id', existingRSVP.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: 'cancelled' });
  } else {
    // Add RSVP
    const { data: newRsvp, error } = await supabase
      .from('rsvps')
      .insert({
        post_id: postId,
        user_id: user.id,
        pace_group: pace_group || 'Group B (5:00~5:30)',
        status: 'attending',
      })
      .select('*, user:profiles(*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ status: 'attending', rsvp: newRsvp });
  }
}
