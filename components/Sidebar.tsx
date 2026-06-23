'use client';

import { 
  LayoutDashboard, ShoppingCart, Users, Store, Bike, 
  MapPin, Clock, CreditCard, Banknote, AlertCircle, 
  BarChart3, Settings, ScrollText, HeadphonesIcon, X, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '@/store/useAppStore';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Orders', icon: ShoppingCart },
  { name: 'Students', icon: Users },
  { name: 'Vendors', icon: Store },
  { name: 'Riders', icon: Bike },
  { name: 'Campuses', icon: MapPin },
  { name: 'Subscriptions', icon: Clock },
  { name: 'Payments', icon: CreditCard },
  { name: 'Commissions', icon: Wallet },
  { name: 'Complaints', icon: AlertCircle },
  { name: 'Analytics', icon: BarChart3 },
];

const bottomItems = [
  { name: 'Settings', icon: Settings },
  { name: 'System Logs', icon: ScrollText },
  { name: 'Support', icon: HeadphonesIcon },
];

export function Sidebar() {
  const { isSidebarOpen, activeTab, setActiveTab, toggleSidebar } = useAppStore();

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative z-20 flex-shrink-0 border-r border-white dark:border-muted/50/40 glass-panel h-screen overflow-hidden hidden md:flex flex-col"
        >
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-600/30">
                M
              </div>
              <span className="font-space font-bold text-lg text-ink dark:text-white tracking-tight">Meal Direct</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 hide-scrollbar space-y-1">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-2">Platform</div>
            {menuItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive ? 'text-primary-strong bg-white dark:bg-ink/60 shadow-sm border border-white' : 'text-muted dark:text-muted hover:text-primary-strong hover:bg-white dark:bg-ink dark:border-muted/50/40'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator" 
                      className="absolute inset-0 bg-white dark:bg-ink/60 border border-white dark:border-muted/50/80 rounded-xl shadow-[0_2px_10px_rgba(22,163,74,0.05)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-primary' : 'text-muted group-hover:text-primary transition-colors'}`} />
                  <span className="text-sm font-medium relative z-10">{item.name}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md z-10" />
                  )}
                </button>
              );
            })}

            <div className="mt-8 mb-2">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 ml-2">System</div>
              {bottomItems.map((item) => {
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => setActiveTab(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                      isActive ? 'text-primary-strong bg-white dark:bg-ink/60 shadow-sm border border-white' : 'text-muted dark:text-muted hover:text-primary-strong hover:bg-white dark:bg-ink dark:border-muted/50/40'
                    }`}
                  >
                    <item.icon className="w-5 h-5 relative z-10 text-muted group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium relative z-10">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-white dark:border-muted/50/40 mt-auto">
            <div className="bg-gradient-to-br from-success/5 to-success/10 p-4 rounded-xl border border-success/30/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white dark:bg-ink/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <p className="text-xs font-medium text-primary-strong mb-1">Weekly target</p>
                <div className="w-full bg-white dark:bg-ink/60 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <p className="text-[10px] text-primary-strong font-medium">78% of 10,000 orders</p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
