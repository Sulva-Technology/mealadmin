'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/store/useAppStore';
import { AnimatePresence, motion } from 'motion/react';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas dark:bg-ink selection:bg-success/20 selection:text-primary-strong">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-300">
        <Navbar />
        <main className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
