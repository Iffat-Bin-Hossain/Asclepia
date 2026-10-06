'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMobileNav } from '@/hooks/useMobileNav';
import { useQuery } from '@tanstack/react-query';
import { assistantApi } from '@/lib/api';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  UserCheck,
  LogOut,
  ChevronRight,
  X,
  Shield,
  Clock,
} from 'lucide-react';
import AnimatedAsclepiaLogo from '@/components/AnimatedAsclepiaLogo';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout, isAdmin, isAssistant } = useAuth();
  const { isOpen, close } = useMobileNav();

  const displayName =
    !admin?.name || admin.name === 'System Administrator' || admin.name === 'Administrator'
      ? (isAdmin ? 'Admin' : 'Assistant')
      : admin.name;

  // For Admin: query assistants to show pending approval count badge
  const { data: assistantsData } = useQuery({
    queryKey: ['assistants-list-badge'],
    queryFn: async () => {
      const res = await assistantApi.getAll();
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 10 * 1000,
    refetchInterval: 10 * 1000,
  });

  const pendingCount =
    assistantsData?.meta?.pendingCount ??
    (Array.isArray(assistantsData?.data)
      ? assistantsData.data.filter((a: any) => a.status === 'pending').length
      : 0);

  // Build role-based navigation items
  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: isAssistant ? 'Assigned Overview' : 'Clinical Operations',
      badge: null,
    },
    ...(isAdmin
      ? [
          {
            href: '/doctors',
            icon: Stethoscope,
            label: 'Doctors',
            description: 'Doctors Directory',
            badge: null,
          },
        ]
      : []),
    {
      href: '/patients',
      icon: Users,
      label: 'Patients',
      description: isAssistant ? 'Assigned Patients' : 'Patient Registry',
      badge: null,
    },
    ...(isAdmin
      ? [
          {
            href: '/assistants',
            icon: UserCheck,
            label: 'Assistants',
            description: 'Approval & Doctor Assignment',
            badge: pendingCount > 0 ? `${pendingCount}` : null,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${
          isOpen ? 'mobile-open' : ''
        } w-[260px] bg-[#0b151f] border-r border-[#A5ECEB]/15 h-screen fixed left-0 top-0 flex flex-col z-40 select-none`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#A5ECEB]/15 flex items-center justify-between">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-3 group transition-transform hover:scale-[1.02]"
          >
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <AnimatedAsclepiaLogo compact={true} width={38} height={38} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-sm font-bold tracking-[0.2em] text-[#A5ECEB] group-hover:text-[#7DFDF0] transition-colors uppercase leading-none">
                Asclepia
              </div>
              <div className="text-[10px] tracking-[0.16em] text-[#A5ECEB]/50 font-medium mt-1 uppercase">
                Clinical Portal
              </div>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={close}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, description, badge }) => {
            const isActive =
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#A5ECEB]/12 border border-[#A5ECEB]/30 text-[#A5ECEB] shadow-[0_0_15px_rgba(165,236,235,0.08)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive ? 'bg-[#A5ECEB]/20 text-[#A5ECEB]' : 'bg-[#070d14] text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? 'text-[#f0fdfa]' : 'text-slate-300'
                      }`}
                    >
                      {label}
                    </span>
                    {badge && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#A5ECEB]/20 text-[#7DFDF0] border border-[#A5ECEB]/35 shadow-[0_0_8px_rgba(165,236,235,0.25)]">
                        <Clock size={10} />
                        <span>{badge}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {description}
                  </div>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#A5ECEB] flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-[#A5ECEB]/15 bg-[#070d14]/40">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-[#A5ECEB]/20 border border-[#A5ECEB]/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-[#A5ECEB]">
              {displayName.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {displayName}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-[#A5ECEB]/15 text-[#A5ECEB] border border-[#A5ECEB]/30"
                >
                  {isAdmin ? 'Admin' : 'Assistant'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {admin?.email || 'portal@asclepia.health'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-[#070d14] hover:bg-slate-800/80 hover:text-[#f0fdfa] border border-slate-700/50 hover:border-[#A5ECEB]/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
