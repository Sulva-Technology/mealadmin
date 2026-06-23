'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Bell, MapPin, Command, Menu, Moon, Sun, User
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function Navbar() {
  const { toggleSidebar, setCommandPaletteOpen, activeCampus, setActiveCampus, campuses } = useAppStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const activeCampuses = campuses.filter(c => c.status === 'Active').map(c => c.name);
  const campusOptions = ['All Campuses', ...activeCampuses];

  const notifications = [
    { id: 1, text: 'New vendor registration: Spice Hub', time: '5m ago' },
    { id: 2, text: 'Payment batch #4392 processed', time: '1h ago' },
    { id: 3, text: 'Rider John Doe is offline', time: '2h ago' },
  ];

  return (
    <header className="h-16 glass-nav shrink-0 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0 relative">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-canvas dark:hover:bg-ink rounded-lg text-muted dark:text-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-3 px-4 py-2 bg-white dark:bg-ink/40 dark:bg-black/40 hover:bg-white dark:bg-ink/60 border border-white dark:border-muted/50/60 dark:border-white dark:border-muted/50/10 rounded-xl text-sm text-muted w-64 transition-all shadow-sm group"
        >
          <Search className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
          <span>Search anything...</span>
          <div className="ml-auto flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span className="text-xs font-mono">K</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-ink/40 dark:bg-black/40 border border-white dark:border-muted/50/50 dark:border-white dark:border-muted/50/10 rounded-lg text-sm font-medium text-ink dark:text-muted">
          <MapPin className="w-4 h-4 text-primary" />
          <select 
            value={activeCampus}
            onChange={(e) => setActiveCampus(e.target.value)}
            className="bg-transparent border-none outline-none cursor-pointer appearance-none pr-4 font-space w-32 md:w-auto md:min-w-[150px] dark:text-muted"
          >
            {campusOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="w-px h-6 bg-canvas/50 dark:bg-muted mx-2 hidden md:block" />

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 relative hover:bg-canvas dark:hover:bg-ink rounded-lg text-muted dark:text-muted transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-white dark:border-ink dark:border-muted/50"></span>
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-ink border border-muted/20 dark:border-ink shadow-xl rounded-2xl py-2 z-50 dark:bg-ink dark:border-muted/50">
              <div className="px-4 py-2 border-b border-muted/10 dark:border-ink">
                <h4 className="font-bold text-ink dark:text-white">Notifications</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-canvas dark:hover:bg-ink dark:bg-ink/50 cursor-pointer border-b border-muted/5 dark:border-ink/50 last:border-0">
                    <p className="text-sm text-ink dark:text-muted">{n.text}</p>
                    <p className="text-xs text-muted mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 hover:bg-canvas dark:hover:bg-ink rounded-lg text-muted dark:text-muted transition-colors hidden md:block"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div onClick={useAppStore(state => state.logout)} className="flex items-center gap-3 ml-2 pl-2 md:pl-4 md:border-l border-muted/20 dark:border-muted/50/50 dark:border-muted/50 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-ink dark:text-white">Admin User</p>
            <p className="text-xs text-muted dark:text-muted hover:text-danger transition-colors">Click to Logout</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-success flex items-center justify-center text-white shadow-sm border-2 border-white dark:border-ink group-hover:scale-105 transition-transform dark:border-muted/50">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
