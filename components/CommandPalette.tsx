'use client';

import { useEffect, useState } from 'react';
import { Search, Store, Users, ShoppingCart, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore';

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setActiveTab } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex py-20 items-start justify-center p-4 bg-ink/20 backdrop-blur-sm"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-white dark:bg-ink/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white dark:border-muted/50/40 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center px-4 py-3 border-b border-muted/20 dark:border-muted/50/50 bg-white dark:bg-ink/50">
            <Search className="w-5 h-5 text-muted mr-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search orders, students, vendors..."
              className="w-full bg-transparent border-none outline-none text-ink dark:text-white placeholder:text-muted text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="text-xs bg-canvas text-muted dark:text-muted px-2 py-1 rounded font-mono dark:bg-ink/80">ESC</div>
          </div>
          
          <div className="p-2 space-y-1 overflow-y-auto max-h-80">
            <div className="px-3 py-2 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Quick Actions</div>
            <button onClick={() => { setActiveTab('Orders'); setCommandPaletteOpen(false); }} className="w-full flex items-center px-3 py-2.5 hover:bg-success/10 rounded-xl text-ink dark:text-muted transition-colors group">
              <ShoppingCart className="w-4 h-4 mr-3 text-muted group-hover:text-primary" />
              <span>View all pending orders</span>
            </button>
            <button onClick={() => { setActiveTab('Vendors'); setCommandPaletteOpen(false); }} className="w-full flex items-center px-3 py-2.5 hover:bg-success/10 rounded-xl text-ink dark:text-muted transition-colors group">
              <Store className="w-4 h-4 mr-3 text-muted group-hover:text-primary" />
              <span>Approve new vendors</span>
            </button>
            <button onClick={() => { setActiveTab('Students'); setCommandPaletteOpen(false); }} className="w-full flex items-center px-3 py-2.5 hover:bg-success/10 rounded-xl text-ink dark:text-muted transition-colors group">
              <Users className="w-4 h-4 mr-3 text-muted group-hover:text-primary" />
              <span>Manage student accounts</span>
            </button>
            <div className="px-3 py-2 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider mt-4">Reports</div>
            <button onClick={() => { setActiveTab('Analytics'); setCommandPaletteOpen(false); }} className="w-full flex items-center px-3 py-2.5 hover:bg-success/10 rounded-xl text-ink dark:text-muted transition-colors group">
              <Activity className="w-4 h-4 mr-3 text-muted group-hover:text-primary" />
              <span>View revenue analytics</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
