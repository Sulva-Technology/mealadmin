'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Wallet, ArrowRightLeft, XCircle } from 'lucide-react';
import { useAppStore, Commission } from '@/store/useAppStore';
import { DataState } from '@/components/DataState';

export function CommissionsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCommVendor, setNewCommVendor] = useState('');
  const [newCommAmount, setNewCommAmount] = useState('');
  const [newCommRate, setNewCommRate] = useState('10%');

  const commissions = useAppStore(state => state.commissions);
  const addCommission = useAppStore(state => state.addCommission);
  const vendors = useAppStore(state => state.vendors);
  const fetchCommissions = useAppStore(state => state.fetchCommissions);
  const status = useAppStore(state => state.status.commissions);
  const error = useAppStore(state => state.errors.commissions);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);
  
  const filteredComms = commissions.filter(c => 
    c.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommVendor && newCommAmount && !isNaN(Number(newCommAmount))) {
      addCommission({
        id: `COM-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        vendor: newCommVendor,
        amount: Number(newCommAmount),
        rate: newCommRate,
        status: 'Pending',
        date: new Date().toLocaleDateString('en-GB'),
      });
      setIsModalOpen(false);
      setNewCommVendor('');
      setNewCommAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Commissions</h1>
          <p className="text-muted dark:text-muted mt-1">Manage vendor payouts and system commissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
        >
          + Record Commission
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
              <h2 className="text-xl font-bold text-ink dark:text-white">Record Commission</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddCommission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Vendor</label>
                <select 
                  value={newCommVendor}
                  onChange={(e) => setNewCommVendor(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                  required
                >
                  <option value="" disabled>Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Amount (₦)</label>
                <input 
                  type="number" 
                  value={newCommAmount}
                  onChange={(e) => setNewCommAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Rate</label>
                <select 
                  value={newCommRate}
                  onChange={(e) => setNewCommRate(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  <option>5%</option>
                  <option>10%</option>
                  <option>15%</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Record Commission</button>
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
              placeholder="Search by vendor..." 
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
            isEmpty={filteredComms.length === 0}
            onRetry={fetchCommissions}
            emptyLabel="No commissions pending or paid yet."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Vendor</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Rate</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredComms.map((comm) => (
                  <tr key={comm.id} className="hover:bg-white dark:bg-ink/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><Wallet className="w-5 h-5" /></div>
                        <div>
                          <div className="text-sm font-semibold text-ink dark:text-white">{comm.vendor}</div>
                          <div className="text-xs text-muted font-mono mt-0.5">{comm.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink dark:text-muted">{comm.date}</td>
                    <td className="py-4 px-6 text-sm font-medium text-muted dark:text-muted">{comm.rate}</td>
                    <td className="py-4 px-6 text-sm font-bold text-ink dark:text-white">₦{comm.amount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${comm.status === 'Paid' ? 'bg-success/20 text-primary-strong' : 'bg-warning/20 text-warning'}`}>{comm.status}</span>
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
