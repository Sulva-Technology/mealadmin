'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreHorizontal, CheckCircle2, Clock, Truck, PlayCircle, MapPin } from 'lucide-react';
import { useAppStore, Order } from '@/store/useAppStore';
import { DataState } from '@/components/DataState';

const statusStyles: Record<string, string> = {
  'Pending': 'bg-canvas text-muted dark:text-muted',
  'Preparing': 'bg-info/20 text-info',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  'Delivered': 'bg-success/20 text-primary-strong',
  'Cancelled': 'bg-danger/20 text-danger',
};

export function OrdersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  const orders = useAppStore(state => state.orders);
  const updateOrderStatus = useAppStore(state => state.updateOrderStatus);
  const fetchOrders = useAppStore(state => state.fetchOrders);
  const status = useAppStore(state => state.status.orders);
  const error = useAppStore(state => state.errors.orders);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.student.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Order Management</h1>
          <p className="text-muted dark:text-muted mt-1">Track and manage all campus food deliveries.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-muted/20 dark:border-muted/50/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-ink/30">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-ink/50 border border-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-muted/50/20 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-muted/20 bg-white dark:bg-ink dark:border-muted/50/50 rounded-xl text-muted dark:text-muted hover:bg-canvas transition-colors dark:bg-ink">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {['All', 'Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map(status => (
              <button 
                key={status} 
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterStatus === status ? 'bg-ink text-white shadow-sm' : 'bg-white dark:bg-ink/50 text-muted dark:text-muted hover:bg-white dark:hover:bg-ink border border-muted/20 dark:border-muted/50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataState
            status={status}
            error={error}
            isEmpty={filteredOrders.length === 0}
            onRetry={fetchOrders}
            emptyLabel="No orders found. Try adjusting your filters or search term."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Order ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Student</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Vendor & Campus</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white dark:bg-ink/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm font-medium text-ink dark:text-white">{order.id}</div>
                      <div className="text-xs text-muted mt-0.5">{order.date}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-ink dark:text-white">{order.student}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-ink dark:text-white">{order.vendor}</div>
                      <div className="text-xs text-muted dark:text-muted mt-0.5">{order.campus}</div>
                    </td>
                    <td className="py-4 px-6">
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer appearance-none ${statusStyles[order.status] || 'bg-canvas text-ink dark:text-muted'}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="text-sm font-bold text-ink dark:text-white">₦{order.amount.toFixed(2)}</div>
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
