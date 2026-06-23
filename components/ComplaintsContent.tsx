'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, AlertCircle, MessageSquare, XCircle } from 'lucide-react';
import { useAppStore, Complaint } from '@/store/useAppStore';
import { DataState } from '@/components/DataState';

export function ComplaintsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComplaintUser, setNewComplaintUser] = useState('');
  const [newComplaintSubject, setNewComplaintSubject] = useState('');

  const complaints = useAppStore(state => state.complaints);
  const addComplaint = useAppStore(state => state.addComplaint);
  const students = useAppStore(state => state.students);
  const fetchComplaints = useAppStore(state => state.fetchComplaints);
  const status = useAppStore(state => state.status.complaints);
  const error = useAppStore(state => state.errors.complaints);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);
  
  const filteredComplaints = complaints.filter(c => 
    c.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComplaintUser && newComplaintSubject) {
      addComplaint({
        id: `TKT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        user: newComplaintUser,
        subject: newComplaintSubject,
        status: 'Open',
        date: new Date().toLocaleDateString('en-GB'),
      });
      setIsModalOpen(false);
      setNewComplaintUser('');
      setNewComplaintSubject('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Complaints</h1>
          <p className="text-muted dark:text-muted mt-1">Review user feedback, disputes, and issues.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
        >
          + Create Ticket
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
              <h2 className="text-xl font-bold text-ink dark:text-white">Create Support Ticket</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">User (Student Name)</label>
                <input 
                  type="text" 
                  value={newComplaintUser}
                  onChange={(e) => setNewComplaintUser(e.target.value)}
                  placeholder="e.g. Samuel Doe"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Subject / Issue</label>
                <input 
                  type="text" 
                  value={newComplaintSubject}
                  onChange={(e) => setNewComplaintSubject(e.target.value)}
                  placeholder="e.g. Order #5931 not delivered"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Create Ticket</button>
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
              placeholder="Search by user or subject..." 
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
            isEmpty={filteredComplaints.length === 0}
            onRetry={fetchComplaints}
            emptyLabel="No complaints registered yet."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">User</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Subject</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-white dark:bg-ink/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-danger/20 text-danger"><AlertCircle className="w-5 h-5" /></div>
                        <div>
                          <div className="text-sm font-semibold text-ink dark:text-white">{complaint.user}</div>
                          <div className="text-xs text-muted font-mono mt-0.5">{complaint.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink dark:text-muted font-medium">{complaint.subject}</td>
                    <td className="py-4 px-6 text-sm text-muted dark:text-muted">{complaint.date}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold w-fit flex gap-1 items-center ${
                        complaint.status === 'Resolved' ? 'bg-success/20 text-primary-strong' : 
                        complaint.status === 'In Progress' ? 'bg-info/20 text-info' : 
                        'bg-danger/20 text-danger'
                      }`}>
                        <MessageSquare className="w-3 h-3" />
                        {complaint.status}
                      </span>
                    </td>
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
