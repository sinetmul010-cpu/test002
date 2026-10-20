'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { User, LogIn, LogOut, ShieldCheck, Plus, Flame } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  initialProfile: Profile | null;
}

export default function Navbar({ initialProfile }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoggingIn(true);
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(`로그인 오류: ${err.message}`);
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.refresh();
  };

  const isApproved = profile?.status === 'approved' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-[#222733] bg-[#0B0E14]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-[#D4F932] flex items-center justify-center font-black text-black text-lg tracking-tighter group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-black text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-white uppercase">PACEMAKERS</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1A202E] text-[#D4F932] border border-[#262D3D]">
                SEOUL
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider -mt-1">RUNNING CREW</p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              {/* Write Post Button */}
              {isApproved ? (
                <Link
                  href="/posts/new"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#D4F932] text-black hover:bg-[#c3e827] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  글쓰기
                </Link>
              ) : (
                <button
                  onClick={() => alert('관리자 승인 후 글쓰기가 가능합니다. 현재 승인 대기 중입니다.')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#161A23] text-zinc-400 border border-[#222733] hover:text-zinc-200"
                >
                  <Plus className="w-4 h-4 opacity-40" />
                  글쓰기 (승인 대기)
                </button>
              )}

              {/* Admin Page Link */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#1E2538] text-[#D4F932] border border-[#2C3652] hover:bg-[#252F47] transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">회원 승인 관리</span>
                  <span className="md:hidden">관리</span>
                </Link>
              )}

              {/* User Avatar & Status Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#222733]">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-8 h-8 rounded-full border border-[#2C3652] object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1A202E] border border-[#2C3652] flex items-center justify-center text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-200 leading-none">
                      {profile.full_name || profile.email?.split('@')[0]}
                    </span>
                    {isAdmin ? (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#D4F932]/10 text-[#D4F932] border border-[#D4F932]/30">
                        ADMIN
                      </span>
                    ) : profile.status === 'approved' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        정회원
                      </span>
                    ) : profile.status === 'rejected' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                        미승인
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        승인 대기
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {profile.pace || "Pace 5'30\""}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="로그아웃"
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1A202E] rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Google Login Button */
            <button
              onClick={handleGoogleLogin}
              disabled={loggingIn}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>{loggingIn ? '로그인 중...' : 'Google 로그인'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
