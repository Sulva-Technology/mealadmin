'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Boxes, Package, Store, Bike, Users,
  Banknote, Star, AlertTriangle, BarChart3, ScrollText, ShieldCheck, Settings,
  MapPin, Bell, Ruler, CreditCard, Undo2, Activity, ListChecks,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from '@/lib/session';
import { visibleNavGroups } from '@/lib/rbac';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, ShoppingCart, Boxes, Package, Store, Bike, Users,
  Banknote, Star, AlertTriangle, BarChart3, ScrollText, ShieldCheck, Settings,
  MapPin, Bell, Ruler, CreditCard, Undo2, Activity, ListChecks,
};

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { session } = useSession();
  const groups = visibleNavGroups(session);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm md:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 border-r border-white/60 dark:border-white/10 glass-panel h-[100dvh] md:h-screen overflow-hidden flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-6 flex items-center gap-3">
        <Image src="/logo.png" alt="Meal Direct" width={32} height={32} priority className="w-8 h-8 rounded-xl shadow-lg shadow-primary/30" />
        <span className="font-space font-bold text-lg text-ink dark:text-white tracking-tight">Meal Direct</span>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 hide-scrollbar space-y-6">
        {groups.map((group) => {
          return (
            <div key={group.label}>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-2">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = ICONS[item.icon] ?? LayoutDashboard;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                        active
                          ? 'text-primary-strong bg-surface dark:bg-ink/60 shadow-sm border border-white/70 dark:border-white/10'
                          : 'text-muted hover:text-primary-strong hover:bg-surface/70 dark:hover:bg-ink/40'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted'}`} />
                      <span className="text-sm font-medium">{item.name}</span>
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
    </>
  );
}
