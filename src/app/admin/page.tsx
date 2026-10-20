'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowLeft,
  Search,
  Clock,
  Shield,
  User,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load Admin status & users
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401 || res.status === 403) {
        alert('관리자 권한이 필요합니다.');
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Action (Approve, Reject, Toggle Role)
  const handleUserAction = async (
    targetUserId: string,
    action: 'approve' | 'reject' | 'pending' | 'setRole',
    role?: 'admin' | 'member'
  ) => {
    setActionLoading(targetUserId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? data.user : u))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500 font-mono text-sm">
        관리자 데이터 로딩 중...
      </div>
    );
  }

  // Filter & Search
  const filteredUsers = users.filter((u) => {
    if (filter === 'pending' && u.status !== 'pending') return false;
    if (filter === 'approved' && u.status !== 'approved') return false;
    if (filter === 'rejected' && u.status !== 'rejected') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          피드로 돌아가기
        </Link>
        <span className="text-xs font-mono text-[#D4F932] bg-[#D4F932]/10 px-2.5 py-1 rounded border border-[#D4F932]/20">
          ADMIN CONSOLE
        </span>
      </div>

      {/* Admin Header */}
      <div className="border border-[#222733] bg-[#121620] rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#D4F932] text-black font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              크루원 가입 승인 및 권한 관리
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Google 로그인으로 가입한 사용자의 정회원 자격을 심사하고, 게시판 작성 및 관리 권한을 설정합니다.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1F2533]">
          <div className="p-3 rounded-lg bg-[#161B26] border border-[#262F42]">
            <span className="text-[11px] font-mono text-zinc-500 block">승인 대기자</span>
            <span className="text-xl font-mono font-bold text-amber-400 mt-1 block">
              {pendingCount}명
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#161B26] border border-[#262F42]">
            <span className="text-[11px] font-mono text-zinc-500 block">활동 정회원</span>
            <span className="text-xl font-mono font-bold text-[#D4F932] mt-1 block">
              {approvedCount}명
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#161B26] border border-[#262F42]">
            <span className="text-[11px] font-mono text-zinc-500 block">총 가입 계정</span>
            <span className="text-xl font-mono font-bold text-zinc-200 mt-1 block">
              {users.length}명
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#161B26] border border-[#262F42]">
            <span className="text-[11px] font-mono text-zinc-500 block">운영진 (Admin)</span>
            <span className="text-xl font-mono font-bold text-cyan-400 mt-1 block">
              {users.filter((u) => u.role === 'admin').length}명
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'pending', label: `승인 대기 (${pendingCount})` },
            { id: 'approved', label: '승인 정회원' },
            { id: 'rejected', label: '미승인/보류' },
            { id: 'all', label: '전체 목록' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-[#D4F932] text-black'
                  : 'bg-[#131722] text-zinc-400 hover:text-white border border-[#222733]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일 검색..."
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 rounded-md bg-[#121620] border border-[#222733] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4F932]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-[#222733] bg-[#121620] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161B26] text-zinc-400 font-mono border-b border-[#222733]">
              <tr>
                <th className="py-3 px-4">사용자</th>
                <th className="py-3 px-4">이메일</th>
                <th className="py-3 px-4">상태</th>
                <th className="py-3 px-4">권한</th>
                <th className="py-3 px-4">가입일</th>
                <th className="py-3 px-4 text-right">권한 승인 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D2330]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                    조건에 해당하는 사용자가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isBusy = actionLoading === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#151924] transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-[#2C3652]"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#1A202E] flex items-center justify-center font-bold text-zinc-300">
                              {u.full_name?.[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-zinc-200 block">
                              {u.full_name || '이름 없음'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {u.pace || "5'30\""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {u.email || '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            승인됨 (정회원)
                          </span>
                        ) : u.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                            <UserX className="w-3 h-3" />
                            미승인
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            심사 대기중
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {u.role === 'admin' ? (
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-[#D4F932]/10 text-[#D4F932] border border-[#D4F932]/30">
                            CREW ADMIN
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-zinc-400">
                            MEMBER
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 font-mono text-zinc-500 text-[11px]">
                        {format(new Date(u.created_at), 'yyyy-MM-dd', { locale: ko })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Button */}
                          {u.status !== 'approved' && (
                            <button
                              onClick={() => handleUserAction(u.id, 'approve')}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded bg-[#D4F932] text-black font-bold text-[11px] hover:bg-[#c3e827] transition-colors"
                            >
                              가입 승인
                            </button>
                          )}

                          {/* Reject / Revoke Button */}
                          {u.status === 'approved' && u.role !== 'admin' && (
                            <button
                              onClick={() => handleUserAction(u.id, 'reject')}
                              disabled={isBusy}
                              className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[11px] hover:bg-red-500/30 transition-colors"
                            >
                              승인 취소
                            </button>
                          )}

                          {/* Role Toggle Button */}
                          {u.role === 'admin' ? (
                            <button
                              onClick={() => handleUserAction(u.id, 'setRole', 'member')}
                              disabled={isBusy}
                              title="일반 회원으로 변경"
                              className="px-2 py-1 rounded bg-[#1C2230] text-zinc-400 border border-[#2D384D] text-[11px] hover:text-white"
                            >
                              관리자 해제
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(u.id, 'setRole', 'admin')}
                              disabled={isBusy}
                              title="관리자 권한 부여"
                              className="px-2 py-1 rounded bg-[#1C2230] text-[#D4F932] border border-[#2D384D] text-[11px] hover:bg-[#252E42]"
                            >
                              + 관리자 임명
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
