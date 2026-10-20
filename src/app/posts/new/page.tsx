'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, PostCategory } from '@/types/database';
import { Calendar, MapPin, TrendingUp, Timer, Image, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form State
  const [category, setCategory] = useState<PostCategory>('regular');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [runDate, setRunDate] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [elevationGain, setElevationGain] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요한 기능입니다.');
        router.push('/');
        return;
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!userProfile || (userProfile.status !== 'approved' && userProfile.role !== 'admin')) {
        alert('관리자 승인이 완료된 정회원만 글을 작성할 수 있습니다.');
        router.push('/');
        return;
      }

      setProfile(userProfile);
      setLoading(false);
    }

    checkAuth();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          content: content.trim(),
          location: location.trim() || null,
          run_date: runDate ? new Date(runDate).toISOString() : null,
          distance_km: distanceKm ? parseFloat(distanceKm) : null,
          target_pace: targetPace.trim() || null,
          elevation_gain: elevationGain ? parseInt(elevationGain) : null,
          image_url: imageUrl.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '게시글 등록에 실패했습니다.');
      }

      router.push(`/posts/${result.post.id}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 font-mono text-sm">
        사용자 권한 확인 중...
      </div>
    );
  }

  const isSessionCategory = category === 'regular' || category === 'flash';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        피드로 돌아가기
      </Link>

      <div className="border border-[#222733] bg-[#121620] rounded-xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-mono text-[#D4F932] tracking-wider uppercase">
            PACEMAKERS CREW POST
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">새 러닝 게시글 작성</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">카테고리</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'regular', label: '정기 러닝' },
                { id: 'flash', label: '번개런' },
                { id: 'review', label: '러닝 후기' },
                { id: 'lounge', label: '자유 수다' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id as PostCategory)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                    category === c.id
                      ? 'bg-[#D4F932] text-black border-[#D4F932]'
                      : 'bg-[#181D29] text-zinc-400 border-[#262F42] hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: [정기러닝] 남산 둘레길 야간 시티런 8.5km"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-sm focus:outline-none focus:border-[#D4F932] transition-colors"
              required
            />
          </div>

          {/* Running Session Specific Fields */}
          {isSessionCategory && (
            <div className="p-4 rounded-lg bg-[#161B26] border border-[#283247] space-y-4">
              <span className="text-xs font-mono font-bold text-[#D4F932] block">
                🏃 러닝 세션 상세 정보
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4F932]" />
                    러닝 일시
                  </label>
                  <input
                    type="datetime-local"
                    value={runDate}
                    onChange={(e) => setRunDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-xs focus:outline-none focus:border-[#D4F932]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#D4F932]" />
                    집결 장소
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="예: 남산 국립극장 해오름극장 앞"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-xs focus:outline-none focus:border-[#D4F932]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#D4F932]" />
                    코스 거리 (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    placeholder="예: 8.5"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-xs focus:outline-none focus:border-[#D4F932]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-1.5">
                    <Timer className="w-3.5 h-3.5 text-[#D4F932]" />
                    목표 페이스
                  </label>
                  <input
                    type="text"
                    value={targetPace}
                    onChange={(e) => setTargetPace(e.target.value)}
                    placeholder="예: 5:00 ~ 5:30 /km"
                    className="w-full px-3 py-2 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-xs focus:outline-none focus:border-[#D4F932]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2">상세 내용</label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="코스 경로, 짐 보관 정보, 준비물, 뒤풀이 안내 등을 자유롭게 적어주세요."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-sm focus:outline-none focus:border-[#D4F932] transition-colors resize-y"
              required
            />
          </div>

          {/* Optional Image URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mb-2">
              <Image className="w-3.5 h-3.5" />
              대표 이미지 URL (선택 사항)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-lg bg-[#0E1118] border border-[#262F42] text-white text-xs focus:outline-none focus:border-[#D4F932]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D4F932] text-black font-bold text-xs hover:bg-[#c3e827] transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? '게시 중...' : '게시하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
