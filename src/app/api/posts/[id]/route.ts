import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*),
      rsvps(
        id,
        user_id,
        pace_group,
        status,
        created_at,
        user:profiles(*)
      ),
      comments(
        id,
        content,
        created_at,
        author:profiles(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // Check if post author or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', id)
    .single();

  if (!post) {
    return NextResponse.json({ error: '게시글이 존재하지 않습니다.' }, { status: 404 });
  }

  const isAdmin = profile?.role === 'admin';
  const isAuthor = post.author_id === user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
