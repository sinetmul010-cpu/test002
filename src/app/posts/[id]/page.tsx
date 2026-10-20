import { createClient } from '@/lib/supabase/server';
import { Post, Profile } from '@/types/database';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  TrendingUp,
  Timer,
  ArrowLeft,
  Users,
  MessageSquare,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import PostDetailClient from './PostDetailClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentProfile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    currentProfile = data;
  }

  // Fetch post details
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
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        피드로 돌아가기
      </Link>

      <PostDetailClient
        post={post as unknown as Post}
        currentProfile={currentProfile}
        currentUserId={user?.id || null}
      />
    </div>
  );
}
