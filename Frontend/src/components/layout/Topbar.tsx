'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMobileNav } from '@/hooks/useMobileNav';
import { ShieldCheck, UserCheck, Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { admin, isAdmin } = useAuth();
  const { toggle } = useMobileNav();

  const displayName =
    !admin?.name || admin.name === 'System Administrator' || admin.name === 'Administrator'
      ? (isAdmin ? 'Admin' : 'Assistant')
      : admin.name;

  return (
    <header className="h-16 border-b border-[#A5ECEB]/15 flex items-center justify-between px-4 md:px-7 bg-[#070d14]/85 backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Drawer Button */}
        <button
          onClick={toggle}
          className="md:hidden p-2 rounded-xl bg-[#0b151f] border border-[#A5ECEB]/20 text-[#A5ECEB] hover:bg-[#A5ECEB]/10 active:scale-95 transition-all"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-[#f0fdfa] tracking-tight truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 font-normal truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 md:gap-2.5 px-2.5 md:px-3 py-1.5 rounded-xl bg-[#0b151f] border border-[#A5ECEB]/20">
          <div className="w-6 h-6 rounded-full bg-[#A5ECEB]/20 border border-[#A5ECEB]/40 flex items-center justify-center text-[11px] font-bold text-[#A5ECEB]">
            {displayName.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <span className="text-xs font-semibold text-[#f0fdfa] hidden sm:inline">
            {displayName}
          </span>
          {isAdmin ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#A5ECEB]" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-[#A5ECEB]" />
          )}
        </div>
      </div>
    </header>
  );
}

