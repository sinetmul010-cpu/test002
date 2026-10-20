import { createClient } from '@/lib/supabase/server';
import { Post, Profile } from '@/types/database';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Timer,
  Users,
  MessageSquare,
  Flame,
  ArrowRight,
  TrendingUp,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: {
    category?: string;
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const currentCategory = searchParams.category || 'all';
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

  // Fetch posts with author, rsvps, and comments
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*),
      rsvps(id, user_id, pace_group, status, user:profiles(*)),
      comments(id)
    `)
    .order('created_at', { ascending: false });

  if (currentCategory !== 'all') {
    query = query.eq('category', currentCategory);
  }

  const { data: posts } = await query;

  // Upcoming regular run notice for highlight
  const upcomingRun = posts?.find(
    (p) => (p.category === 'regular' || p.category === 'flash') && p.run_date && new Date(p.run_date) > new Date()
  ) || posts?.find((p) => p.category === 'regular' || p.category === 'flash');

  const categories = [
    { id: 'all', label: '전체 피드' },
    { id: 'regular', label: '정기 러닝' },
    { id: 'flash', label: '번개런' },
    { id: 'review', label: '러닝 후기' },
    { id: 'lounge', label: '자유 수다' },
  ];

  const isApproved = currentProfile?.status === 'approved' || currentProfile?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Athletic Hero / Highlight Board */}
      <section className="relative overflow-hidden rounded-xl border border-[#222733] bg-[#121620] p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#1A2130] border border-[#2D384D] text-[#D4F932] text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#D4F932] animate-pulse" />
              SEOUL DISTRICT RUNNERS
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase leading-none">
              PACEMAKERS <span className="text-[#D4F932]">CREW</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              도심을 질주하는 러닝 크루 게시판입니다. 정기 세션 공지, 번개 모집, 코스 기록을 공유하며
              가입 승인된 정회원끼리 신뢰 있는 러닝 네트워크를 만듭니다.
            </p>
          </div>

          {/* Quick Action or Highlight Stats */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-3">
            {isApproved ? (
              <Link
                href="/posts/new"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#D4F932] text-black font-bold text-sm hover:bg-[#c4ea28] transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                새 러닝 공지 / 글 작성
              </Link>
            ) : user ? (
              <div className="p-3.5 rounded-lg bg-[#181D29] border border-[#293245] text-xs text-zinc-300">
                <span className="text-amber-400 font-bold block mb-1">⏳ 승인 대기 중</span>
                관리자의 승인 완료 후 글 작성 권한이 부여됩니다.
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-[#181D29] border border-[#293245] text-xs text-zinc-400">
                <span className="text-white font-semibold block mb-1">크루원이신가요?</span>
                상단 Google 로그인 후 정회원 승인을 신청하세요.
              </div>
            )}
          </div>
        </div>

        {/* Featured Upcoming Session Callout */}
        {upcomingRun && (
          <div className="mt-6 pt-6 border-t border-[#1F2533] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#D4F932]/10 border border-[#D4F932]/20 text-[#D4F932]">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                  FEATURED RUN SESSION
                </span>
                <Link
                  href={`/posts/${upcomingRun.id}`}
                  className="font-bold text-sm sm:text-base text-zinc-100 hover:text-[#D4F932] transition-colors"
                >
                  {upcomingRun.title}
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-300">
              {upcomingRun.run_date && (
                <span className="flex items-center gap-1.5 bg-[#171C26] px-2.5 py-1 rounded border border-[#262F42]">
                  <Calendar className="w-3.5 h-3.5 text-[#D4F932]" />
                  {format(new Date(upcomingRun.run_date), 'M월 d일 (EEE) HH:mm', { locale: ko })}
                </span>
              )}
              {upcomingRun.distance_km && (
                <span className="flex items-center gap-1.5 bg-[#171C26] px-2.5 py-1 rounded border border-[#262F42]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4F932]" />
                  {upcomingRun.distance_km} km
                </span>
              )}
              {upcomingRun.location && (
                <span className="flex items-center gap-1.5 bg-[#171C26] px-2.5 py-1 rounded border border-[#262F42]">
                  <MapPin className="w-3.5 h-3.5 text-[#D4F932]" />
                  {upcomingRun.location}
                </span>
              )}
              <Link
                href={`/posts/${upcomingRun.id}`}
                className="text-xs font-bold text-[#D4F932] flex items-center gap-1 hover:underline ml-auto"
              >
                자세히 보기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Category Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#222733] pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={cat.id === 'all' ? '/' : `/?category=${cat.id}`}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#D4F932] text-black shadow-sm'
                    : 'bg-[#131722] text-zinc-400 hover:text-zinc-200 hover:bg-[#1A202E] border border-[#222733]'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        <span className="text-xs font-mono text-zinc-500 hidden sm:block">
          TOTAL {posts?.length || 0} POSTS
        </span>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {(!posts || posts.length === 0) ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-[#222733] bg-[#10131A] text-zinc-500">
            <Flame className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#D4F932]" />
            <p className="text-sm font-medium text-zinc-400">등록된 게시글이 없습니다.</p>
            <p className="text-xs text-zinc-600 mt-1">
              첫 번째 러닝 공지 또는 러닝 후기를 작성해 보세요!
            </p>
            {isApproved && (
              <Link
                href="/posts/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-bold rounded-md bg-[#D4F932] text-black hover:bg-[#c4ea28] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                게시글 작성하기
              </Link>
            )}
          </div>
        ) : (
          posts.map((post: Post) => {
            const isSession = post.category === 'regular' || post.category === 'flash';
            const attendeesCount = post.rsvps?.length || 0;
            const commentsCount = post.comments?.length || 0;

            const categoryBadge = {
              regular: { label: '정기 러닝', bg: 'bg-[#D4F932]/10 text-[#D4F932] border-[#D4F932]/30' },
              flash: { label: '번개런', bg: 'bg-[#FF5500]/15 text-[#FF6B22] border-[#FF5500]/30' },
              review: { label: '러닝 후기', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
              lounge: { label: '자유게시판', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
            }[post.category] || { label: '기타', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };

            return (
              <article
                key={post.id}
                className="group p-5 rounded-xl border border-[#222733] bg-[#121620] hover:border-[#353E52] transition-all hover:bg-[#141824]"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${categoryBadge.bg}`}>
                        {categoryBadge.label}
                      </span>
                      {post.run_date && (
                        <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#D4F932]" />
                          {format(new Date(post.run_date), 'yyyy.MM.dd (EEE) HH:mm', { locale: ko })}
                        </span>
                      )}
                    </div>

                    <Link href={`/posts/${post.id}`} className="block">
                      <h2 className="text-lg font-bold text-zinc-100 group-hover:text-[#D4F932] transition-colors leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Athletic metrics tags if present */}
                    {isSession && (
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-zinc-300">
                        {post.location && (
                          <div className="flex items-center gap-1 text-zinc-400">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{post.location}</span>
                          </div>
                        )}
                        {post.distance_km && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181E2B] border border-[#262F42] text-zinc-200">
                            <TrendingUp className="w-3.5 h-3.5 text-[#D4F932]" />
                            <span>{post.distance_km} km</span>
                          </div>
                        )}
                        {post.target_pace && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181E2B] border border-[#262F42] text-zinc-200">
                            <Timer className="w-3.5 h-3.5 text-[#D4F932]" />
                            <span>{post.target_pace}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Image Thumbnail if available */}
                  {post.image_url && (
                    <div className="shrink-0 w-full md:w-32 h-24 rounded-lg overflow-hidden border border-[#222733] bg-black">
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Info: Author, Attendees, Comments */}
                <div className="mt-4 pt-3 border-t border-[#1E2432] flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    {post.author?.avatar_url ? (
                      <img
                        src={post.author.avatar_url}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover border border-[#2C3652]"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#1A202E] flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                        {post.author?.full_name?.[0] || 'R'}
                      </div>
                    )}
                    <span className="text-zinc-300 font-medium">
                      {post.author?.full_name || '크루원'}
                    </span>
                    {post.author?.role === 'admin' && (
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-[#D4F932]/10 text-[#D4F932] border border-[#D4F932]/30 rounded">
                        ADMIN
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-mono">{format(new Date(post.created_at), 'M.d')}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    {isSession && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Users className="w-3.5 h-3.5 text-[#D4F932]" />
                        <span>참석 {attendeesCount}명</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-zinc-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{commentsCount}</span>
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
