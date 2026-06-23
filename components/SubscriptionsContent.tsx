'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppStore, Subscription } from '@/store/useAppStore';

export function SubscriptionsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubStudent, setNewSubStudent] = useState('');
  const [newSubPlan, setNewSubPlan] = useState('Standard Plan');
  const [newSubDuration, setNewSubDuration] = useState('1 Month');

  const subscriptions = useAppStore(state => state.subscriptions);
  const addSubscription = useAppStore(state => state.addSubscription);
  const students = useAppStore(state => state.students);
  
  const filteredSubs = subscriptions.filter(s => 
    s.student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubStudent) {
      const start = new Date();
      const end = new Date();
      end.setMonth(start.getMonth() + parseInt(newSubDuration));

      addSubscription({
        id: `SUB-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        student: newSubStudent,
        plan: newSubPlan,
        status: 'Active',
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
      setIsModalOpen(false);
      setNewSubStudent('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Subscriptions</h1>
          <p className="text-muted dark:text-muted mt-1">Manage meal plans and recurring subscriptions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
        >
          + Add Subscription
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
              <h2 className="text-xl font-bold text-ink dark:text-white">New Subscription</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Student</label>
                <select 
                  value={newSubStudent}
                  onChange={(e) => setNewSubStudent(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                  required
                >
                  <option value="" disabled>Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Plan Configuration</label>
                <select 
                  value={newSubPlan}
                  onChange={(e) => setNewSubPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white mb-3 dark:bg-ink dark:border-muted/50"
                >
                  <option>Standard Plan</option>
                  <option>Premium Plan</option>
                  <option>Breakfast Only</option>
                </select>
                <select 
                  value={newSubDuration}
                  onChange={(e) => setNewSubDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Create Subscription</button>
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
              placeholder="Search by student name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-muted/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-ink dark:border-muted/50/20 focus:border-primary transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredSubs.length === 0 ? (
            <div className="p-12 text-center text-muted dark:text-muted">No subscriptions found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Student</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Plan</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Duration</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white dark:bg-ink/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-ink dark:text-white">{sub.student}</div>
                      <div className="text-xs text-muted font-mono mt-0.5">{sub.id}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink dark:text-muted">{sub.plan}</td>
                    <td className="py-4 px-6">
                      <div className="text-xs text-muted dark:text-muted">{sub.startDate} to {sub.endDate}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 ${sub.status === 'Active' ? 'bg-success/20 text-primary-strong' : 'bg-canvas dark:bg-ink text-muted dark:text-muted'}`}>
                        {sub.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </div>
  );
}
