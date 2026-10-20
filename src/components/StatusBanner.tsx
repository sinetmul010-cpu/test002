import { Profile } from '@/types/database';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface StatusBannerProps {
  profile: Profile | null;
}

export default function StatusBanner({ profile }: StatusBannerProps) {
  if (!profile) return null;

  if (profile.role === 'admin') return null;

  if (profile.status === 'pending') {
    return (
      <div className="bg-[#181C26] border-b border-[#2C3652] py-2.5 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>[승인 대기중]</strong> 크루 관리자의 가입 승인 심사가 진행 중입니다. 승인 완료 후 글쓰기 및 정기 러닝 참석 투표가 가능합니다.
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 hidden md:inline">
            Status: PENDING_APPROVAL
          </span>
        </div>
      </div>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <div className="bg-red-950/40 border-b border-red-900/50 py-2.5 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>[승인 미승인]</strong> 현재 크루 가입이 보류되었습니다. 크루 운영진에게 문의해 주세요.
          </span>
        </div>
      </div>
    );
  }

  return null;
}
