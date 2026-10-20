import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
  }

  const { data: users, error } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId, action, role } = body;

  if (!targetUserId || !action) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  let updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (action === 'approve') {
    updateData.status = 'approved';
  } else if (action === 'reject') {
    updateData.status = 'rejected';
  } else if (action === 'pending') {
    updateData.status = 'pending';
  } else if (action === 'setRole' && role) {
    updateData.role = role;
    if (role === 'admin') {
      updateData.status = 'approved';
      updateData.crew_title = 'Crew Master (Admin)';
    } else {
      updateData.crew_title = 'Crew Member';
    }
  }

  const { data, error } = await adminClient
    .from('profiles')
    .update(updateData)
    .eq('id', targetUserId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user: data });
}
