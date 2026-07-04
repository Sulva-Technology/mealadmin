'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, CreditCard, Menu } from 'lucide-react';
import { useSession } from '@/lib/session';
import { hasRole } from '@/lib/rbac';

export function BottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { session } = useSession();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['super_admin', 'finance_admin', 'support_admin', 'operations_admin', 'read_only_admin'] as const },
  ].filter((item) => hasRole(session, item.roles ? [...item.roles] : undefined));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/90 dark:bg-ink/90 border-t border-white/60 dark:border-white/10 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                active ? 'text-primary' : 'text-muted hover:text-primary-strong'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'fill-primary/20 text-primary' : ''}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted hover:text-primary-strong transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
