import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  const supabase = createClient();
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*),
      rsvps(id, user_id, pace_group, status, user:profiles(*)),
      comments(id)
    `)
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // Check if user is approved
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.status !== 'approved' && profile.role !== 'admin')) {
    return NextResponse.json({
      error: '관리자 승인이 완료된 정회원만 글을 작성할 수 있습니다. 관리자 승인을 기다려 주세요.'
    }, { status: 403 });
  }

  const body = await request.json();
  const {
    category,
    title,
    content,
    location,
    run_date,
    distance_km,
    target_pace,
    elevation_gain,
    image_url,
  } = body;

  if (!title || !content || !category) {
    return NextResponse.json({ error: '제목, 내용, 카테고리는 필수 항목입니다.' }, { status: 400 });
  }

  const { data: newPost, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      category,
      title,
      content,
      location: location || null,
      run_date: run_date || null,
      distance_km: distance_km ? parseFloat(distance_km) : null,
      target_pace: target_pace || null,
      elevation_gain: elevation_gain ? parseInt(elevation_gain) : null,
      image_url: image_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: newPost }, { status: 201 });
}
