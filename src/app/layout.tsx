import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import StatusBanner from '@/components/StatusBanner';
import { createClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export const metadata: Metadata = {
  title: 'PACEMAKERS | 러닝 크루 커뮤니티',
  description: '서울 러너들을 위한 정기 러닝 일정 공지, 코스 기록, 크루 승인제 커뮤니티 게시판',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-[#0B0E14] text-zinc-100 flex flex-col font-sans selection:bg-[#D4F932] selection:text-black">
        <Navbar initialProfile={profile} />
        <StatusBanner profile={profile} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-[#1C212D] py-8 text-center text-xs text-zinc-500 font-mono">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© 2026 PACEMAKERS CREW. RUN FAST, RUN TOGETHER.</p>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>SEOUL, KR</span>
              <span>•</span>
              <span>NEXT.JS + SUPABASE</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
