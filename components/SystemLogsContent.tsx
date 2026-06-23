'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Terminal, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useAppStore, SystemLog } from '@/store/useAppStore';
import { DataState } from '@/components/DataState';

export function SystemLogsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventAction, setNewEventAction] = useState('');
  const [newEventLevel, setNewEventLevel] = useState<'Info' | 'Warning' | 'Error'>('Info');

  const systemLogs = useAppStore(state => state.systemLogs);
  const addSystemLog = useAppStore(state => state.addSystemLog);
  const fetchSystemLogs = useAppStore(state => state.fetchSystemLogs);
  const status = useAppStore(state => state.status.systemLogs);
  const error = useAppStore(state => state.errors.systemLogs);

  useEffect(() => {
    fetchSystemLogs();
  }, [fetchSystemLogs]);
  
  const filteredLogs = systemLogs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEventAction) {
      addSystemLog({
        id: `LOG-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        action: newEventAction,
        user: 'admin_sys',
        level: newEventLevel,
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      setIsModalOpen(false);
      setNewEventAction('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">System Logs</h1>
          <p className="text-muted dark:text-muted mt-1">Audit trails and system events.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-ink hover:bg-ink text-white rounded-xl font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Terminal className="w-4 h-4" />
          Simulate Event
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-muted/10 dark:bg-ink"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink dark:text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-muted dark:text-muted" />
                Inject System Event
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Event Action / Description</label>
                <input 
                  type="text" 
                  value={newEventAction}
                  onChange={(e) => setNewEventAction(e.target.value)}
                  placeholder="e.g. CRON Backup Completed"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-muted focus:ring-1 focus:ring-muted/50 font-mono text-sm dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Severity Level</label>
                <select 
                  value={newEventLevel}
                  onChange={(e) => setNewEventLevel(e.target.value as any)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-muted focus:ring-1 focus:ring-muted/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Error">Error</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-ink hover:bg-ink text-white rounded-xl font-medium shadow-sm transition-colors cursor-pointer">Inject Event</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl overflow-hidden">
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-ink/50 border-b border-muted/20 dark:border-muted/50/50">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-ink dark:border-muted/50/20 focus:border-primary transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataState
            status={status}
            error={error}
            isEmpty={filteredLogs.length === 0}
            onRetry={fetchSystemLogs}
            emptyLabel="No system events recorded."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Level</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Action</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Actor / System</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white dark:bg-ink/40 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold w-fit flex gap-1 items-center ${
                        log.level === 'Info' ? 'bg-info/20 text-info' : 
                        log.level === 'Warning' ? 'bg-warning/20 text-warning' : 
                        'bg-danger/20 text-danger'
                      }`}>
                        {log.level === 'Info' && <Info className="w-3 h-3" />}
                        {log.level === 'Warning' && <AlertTriangle className="w-3 h-3" />}
                        {log.level === 'Error' && <XCircle className="w-3 h-3" />}
                        {log.level}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink dark:text-muted font-mono">{log.action}</td>
                    <td className="py-4 px-6 text-sm font-medium text-muted dark:text-muted">{log.user}</td>
                    <td className="py-4 px-6 text-sm text-muted dark:text-muted font-mono tracking-wide">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataState>
        </div>
      </motion.div>
    </div>
  );
}
