'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, CreditCard, ArrowDownRight, ArrowUpRight, XCircle, Download, Edit2, Trash2 } from 'lucide-react';
import { useAppStore, Payment } from '@/store/useAppStore';
import { exportCSV } from '@/lib/utils';
import { DataState } from '@/components/DataState';

export function PaymentsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('Card');

  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const payments = useAppStore(state => state.payments);
  const addPayment = useAppStore(state => state.addPayment);
  const updatePayment = useAppStore(state => state.updatePayment);
  const deletePayment = useAppStore(state => state.deletePayment);
  const fetchPayments = useAppStore(state => state.fetchPayments);
  const status = useAppStore(state => state.status.payments);
  const error = useAppStore(state => state.errors.payments);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  
  const filteredPayments = payments.filter(p => 
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPaymentAmount && !isNaN(Number(newPaymentAmount))) {
      addPayment({
        id: `PAY-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        amount: Number(newPaymentAmount),
        status: 'Completed',
        date: new Date().toLocaleDateString('en-GB'),
        method: newPaymentMethod,
        reference: `REF-${Math.floor(Math.random() * 100000000)}`,
      });
      setIsModalOpen(false);
      setNewPaymentAmount('');
    }
  };

  const handleEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      updatePayment(editingPayment.id, {
        amount: Number(editingPayment.amount),
        method: editingPayment.method,
      });
      setEditingPayment(null);
    }
  };

  const confirmDelete = () => {
    if (deletingPaymentId) {
      deletePayment(deletingPaymentId);
      setDeletingPaymentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Payments</h1>
          <p className="text-muted dark:text-muted mt-1">Review student payments and wallet top-ups.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportCSV(filteredPayments, 'payments_report')}
            className="px-4 py-2.5 bg-canvas hover:bg-canvas text-ink dark:text-muted rounded-xl font-medium transition-colors flex items-center gap-2 dark:bg-ink/80"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-muted/10 dark:bg-ink"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink dark:text-white">Record Manual Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Amount (₦)</label>
                <input 
                  type="number" 
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Payment Method</label>
                <select 
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>USSD</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Record Payment</button>
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
              placeholder="Search by reference ID..." 
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
            isEmpty={filteredPayments.length === 0}
            onRetry={fetchPayments}
            emptyLabel="No recent payments."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Transaction</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Date & Time</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Method</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Amount</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white dark:bg-ink/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-info/20 text-info"><CreditCard className="w-5 h-5" /></div>
                        <div>
                          <div className="text-sm font-semibold text-ink dark:text-white tracking-wide">Ref: {payment.reference}</div>
                          <div className="text-xs text-muted font-mono mt-0.5">{payment.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-ink dark:text-muted">{payment.date}</td>
                    <td className="py-4 px-6 text-sm font-medium text-muted dark:text-muted">{payment.method}</td>
                    <td className="py-4 px-6 text-sm font-bold text-ink dark:text-white">₦{payment.amount.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${payment.status === 'Completed' ? 'bg-success/20 text-primary-strong' : payment.status === 'Pending' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'}`}>{payment.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingPayment(payment)}
                        className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                        title="Edit Payment"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingPaymentId(payment.id)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataState>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-muted/10 dark:bg-ink"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink dark:text-white">Edit Payment</h2>
              <button onClick={() => setEditingPayment(null)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Amount (₦)</label>
                <input 
                  type="number" 
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Payment Method</label>
                <select 
                  value={editingPayment.method}
                  onChange={(e) => setEditingPayment({ ...editingPayment, method: e.target.value })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>USSD</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingPayment(null)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-info hover:bg-info/80 text-white rounded-xl font-medium shadow-sm transition-colors">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-muted/10 text-center dark:bg-ink"
          >
            <div className="w-16 h-16 bg-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-ink dark:text-white mb-2">Delete Payment?</h2>
            <p className="text-muted dark:text-muted mb-6 text-sm">Are you sure you want to delete this payment record? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingPaymentId(null)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors w-full dark:bg-ink/80">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-xl font-medium shadow-sm transition-colors w-full">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
