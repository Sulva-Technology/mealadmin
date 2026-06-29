'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Boxes, Package, Store, Bike, Users,
  Banknote, Star, AlertTriangle, BarChart3, ScrollText, ShieldCheck, Settings,
  MapPin, Bell,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from '@/lib/session';

type Item = { name: string; href: string; icon: LucideIcon; superAdmin?: boolean };
type Group = { label: string; items: Item[] };

const GROUPS: Group[] = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Orders', href: '/orders', icon: ShoppingCart },
      { name: 'Batches', href: '/batches', icon: Boxes },
      { name: 'Inventory', href: '/inventory', icon: Package },
    ],
  },
  {
    label: 'Network',
    items: [
      { name: 'Vendors', href: '/vendors', icon: Store },
      { name: 'Riders', href: '/riders', icon: Bike },
      { name: 'Users', href: '/users', icon: Users },
    ],
  },
  {
    label: 'Finance & Quality',
    items: [
      { name: 'Settlements', href: '/settlements', icon: Banknote },
      { name: 'Escalations', href: '/escalations', icon: AlertTriangle },
      { name: 'Reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Campuses', href: '/campuses', icon: MapPin },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Admins', href: '/admins', icon: ShieldCheck, superAdmin: true },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSuperAdmin } = useSession();

  return (
    <aside className="relative z-20 w-[260px] flex-shrink-0 border-r border-white/60 dark:border-white/10 glass-panel h-screen overflow-hidden hidden md:flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">M</div>
        <span className="font-space font-bold text-lg text-ink dark:text-white tracking-tight">Meal Direct</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 hide-scrollbar space-y-6">
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => !i.superAdmin || isSuperAdmin);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-2">{group.label}</div>
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
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
                      <item.icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted'}`} />
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
  );
}
