'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post, Profile, RSVP, Comment } from '@/types/database';
import {
  Calendar,
  MapPin,
  TrendingUp,
  Timer,
  Users,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Send,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  post: Post;
  currentProfile: Profile | null;
  currentUserId: string | null;
}

export default function PostDetailClient({ post, currentProfile, currentUserId }: Props) {
  const router = useRouter();
  const [rsvps, setRsvps] = useState<RSVP[]>(post.rsvps || []);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [selectedPaceGroup, setSelectedPaceGroup] = useState('Group B (5:00~5:30)');
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const isApproved = currentProfile?.status === 'approved' || currentProfile?.role === 'admin';
  const isAdmin = currentProfile?.role === 'admin';
  const isAuthor = currentUserId === post.author_id;
  const isSession = post.category === 'regular' || post.category === 'flash';

  const myRsvp = rsvps.find((r) => r.user_id === currentUserId);
  const isAttending = !!myRsvp;

  // Handle RSVP toggle
  const handleToggleRSVP = async () => {
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!isApproved) {
      alert('관리자 승인을 받은 정회원만 참석 신청을 할 수 있습니다.');
      return;
    }

    setRsvpLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pace_group: selectedPaceGroup }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.status === 'cancelled') {
        setRsvps(rsvps.filter((r) => r.user_id !== currentUserId));
      } else if (data.status === 'attending' && data.rsvp) {
        setRsvps([...rsvps.filter((r) => r.user_id !== currentUserId), data.rsvp]);
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle Post Deletion
  const handleDeletePost = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    setDeletingPost(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('게시글이 삭제되었습니다.');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setDeletingPost(false);
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!isApproved) {
      alert('승인된 정회원만 댓글을 작성할 수 있습니다.');
      return;
    }
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setComments([...comments, data.comment]);
      setCommentText('');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  // Handle Comment Deletion
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(comments.filter((c) => c.id !== commentId));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const categoryBadge = {
    regular: { label: '정기 러닝', bg: 'bg-[#D4F932]/10 text-[#D4F932] border-[#D4F932]/30' },
    flash: { label: '번개런', bg: 'bg-[#FF5500]/15 text-[#FF6B22] border-[#FF5500]/30' },
    review: { label: '러닝 후기', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    lounge: { label: '자유게시판', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  }[post.category] || { label: '기타', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };

  return (
    <div className="space-y-6">
      {/* Main Post Card */}
      <article className="border border-[#222733] bg-[#121620] rounded-xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${categoryBadge.bg}`}>
              {categoryBadge.label}
            </span>

            {(isAuthor || isAdmin) && (
              <button
                onClick={handleDeletePost}
                disabled={deletingPost}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-mono hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>

          {/* Author metadata */}
          <div className="flex items-center gap-3 pt-1 border-b border-[#1E2432] pb-4 text-xs text-zinc-400">
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-[#2C3652]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1A202E] flex items-center justify-center font-bold text-zinc-300">
                {post.author?.full_name?.[0] || 'R'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                <span>{post.author?.full_name || '크루원'}</span>
                {post.author?.role === 'admin' && (
                  <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-[#D4F932]/10 text-[#D4F932] border border-[#D4F932]/30">
                    CREW ADMIN
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                작성일 {format(new Date(post.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
              </span>
            </div>
          </div>
        </div>

        {/* Athletic Running Highlights (If Session) */}
        {isSession && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg bg-[#161B26] border border-[#283247]">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 block">RUN DATE</span>
              <span className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#D4F932]" />
                {post.run_date ? format(new Date(post.run_date), 'M.d (EEE) HH:mm', { locale: ko }) : '미정'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-500 block">LOCATION</span>
              <span className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4F932]" />
                {post.location || '상세 본문 참조'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-500 block">DISTANCE</span>
              <span className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4F932]" />
                {post.distance_km ? `${post.distance_km} km` : '-'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-500 block">TARGET PACE</span>
              <span className="text-xs font-mono font-bold text-zinc-100 flex items-center gap-1 mt-0.5">
                <Timer className="w-3.5 h-3.5 text-[#D4F932]" />
                {post.target_pace || '-'}
              </span>
            </div>
          </div>
        )}

        {/* Image if available */}
        {post.image_url && (
          <div className="rounded-lg overflow-hidden border border-[#222733] bg-black max-h-[420px]">
            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content Body */}
        <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line py-2">
          {post.content}
        </div>
      </article>

      {/* RSVP Section (If Session) */}
      {isSession && (
        <section className="border border-[#222733] bg-[#121620] rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D4F932]" />
                러닝 세션 참석 명단 ({rsvps.length}명)
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                승인된 정회원만 참석 투표가 가능합니다.
              </p>
            </div>

            {/* Attendance Toggle Button */}
            {isApproved ? (
              <div className="flex items-center gap-2">
                {!isAttending && (
                  <select
                    value={selectedPaceGroup}
                    onChange={(e) => setSelectedPaceGroup(e.target.value)}
                    className="px-2.5 py-2 rounded-lg bg-[#181D29] border border-[#293245] text-xs text-white focus:outline-none"
                  >
                    <option value="Group A (Sub 4:30)">Group A (Sub 4:30)</option>
                    <option value="Group B (5:00~5:30)">Group B (5:00~5:30)</option>
                    <option value="Group C (6:00~6:30)">Group C (6:00~6:30)</option>
                  </select>
                )}

                <button
                  onClick={handleToggleRSVP}
                  disabled={rsvpLoading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm ${
                    isAttending
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-[#D4F932] text-black hover:bg-[#c3e827]'
                  }`}
                >
                  {isAttending ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      참석 취소하기
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      러닝 참석하기
                    </>
                  )}
                </button>
              </div>
            ) : currentUserId ? (
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20">
                관리자 승인 대기 중 (참석 불가)
              </span>
            ) : (
              <span className="text-xs font-mono text-zinc-500">
                로그인 후 참석 투표 가능
              </span>
            )}
          </div>

          {/* Attendees List */}
          {rsvps.length === 0 ? (
            <div className="p-4 rounded-lg bg-[#161B26] border border-[#242C3D] text-center text-xs text-zinc-500">
              아직 참석 신청자가 없습니다. 첫 번째로 참가해 보세요!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
              {rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#161B26] border border-[#262F42]"
                >
                  {rsvp.user?.avatar_url ? (
                    <img
                      src={rsvp.user.avatar_url}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-[#2C3652]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#1A202E] flex items-center justify-center font-bold text-xs text-zinc-300">
                      {rsvp.user?.full_name?.[0] || 'R'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {rsvp.user?.full_name || '크루원'}
                    </p>
                    <p className="text-[10px] font-mono text-[#D4F932] truncate">
                      {rsvp.pace_group}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Comments Section */}
      <section className="border border-[#222733] bg-[#121620] rounded-xl p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#D4F932]" />
          크루 댓글 ({comments.length})
        </h2>

        {/* Comment Form */}
        {isApproved ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 작성해 주세요 (질문, 응원, 장비 팁 등)"
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#0E1118] border border-[#262F42] text-sm text-white focus:outline-none focus:border-[#D4F932]"
              required
            />
            <button
              type="submit"
              disabled={commentLoading}
              className="px-4 py-2.5 rounded-lg bg-[#D4F932] text-black font-bold text-xs hover:bg-[#c3e827] flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              등록
            </button>
          </form>
        ) : currentUserId ? (
          <div className="p-3 rounded-lg bg-[#181D29] border border-[#262F42] text-xs text-zinc-400">
            관리자 승인 완료 후 댓글 작성이 가능합니다.
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-[#181D29] border border-[#262F42] text-xs text-zinc-400">
            댓글 작성을 위해 상단에서 Google 로그인을 진행해 주세요.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3 pt-2">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono text-center py-4">
              등록된 댓글이 없습니다.
            </p>
          ) : (
            comments.map((comment) => {
              const canDelete =
                isAdmin || (currentUserId && comment.author_id === currentUserId);
              return (
                <div
                  key={comment.id}
                  className="p-3.5 rounded-lg bg-[#151924] border border-[#222733] flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {comment.author?.avatar_url ? (
                      <img
                        src={comment.author.avatar_url}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-[#2C3652] shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#1A202E] flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0 mt-0.5">
                        {comment.author?.full_name?.[0] || 'C'}
                      </div>
                    )}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">
                          {comment.author?.full_name || '크루원'}
                        </span>
                        {comment.author?.role === 'admin' && (
                          <span className="text-[9px] font-mono px-1 py-0.2 bg-[#D4F932]/10 text-[#D4F932] border border-[#D4F932]/30 rounded">
                            ADMIN
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-zinc-500">
                          {format(new Date(comment.created_at), 'M.d HH:mm', { locale: ko })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      title="댓글 삭제"
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
