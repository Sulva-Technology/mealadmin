'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreHorizontal, Star, CheckCircle, XCircle, Clock, Download, Edit2, Trash2 } from 'lucide-react';
import { useAppStore, Vendor } from '@/store/useAppStore';
import { exportCSV } from '@/lib/utils';
import { DataState } from '@/components/DataState';

const statusStyles: Record<string, string> = {
  'Active': 'bg-success/20 text-primary-strong',
  'Pending': 'bg-warning/20 text-warning',
  'Suspended': 'bg-danger/20 text-danger',
};

export function VendorsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCampus, setNewVendorCampus] = useState('UNILAG');
  
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  const vendors = useAppStore(state => state.vendors);
  const campuses = useAppStore(state => state.campuses);
  const updateVendorStatus = useAppStore(state => state.updateVendorStatus);
  const addVendor = useAppStore(state => state.addVendor);
  const updateVendor = useAppStore(state => state.updateVendor);
  const deleteVendor = useAppStore(state => state.deleteVendor);
  const fetchVendors = useAppStore(state => state.fetchVendors);
  const status = useAppStore(state => state.status.vendors);
  const error = useAppStore(state => state.errors.vendors);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendorName) {
      addVendor({
        id: `VND-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name: newVendorName,
        campus: newVendorCampus,
        status: 'Pending',
        rating: 0,
        totalOrders: 0
      });
      setIsModalOpen(false);
      setNewVendorName('');
    }
  };

  const handleEditVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      updateVendor(editingVendor.id, {
        name: editingVendor.name,
        campus: editingVendor.campus,
      });
      setEditingVendor(null);
    }
  };

  const confirmDelete = () => {
    if (deletingVendorId) {
      deleteVendor(deletingVendorId);
      setDeletingVendorId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Vendors & Kitchens</h1>
          <p className="text-muted dark:text-muted mt-1">Manage vendor approvals, performance, and payouts.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportCSV(filteredVendors, 'vendors_report')}
            className="px-4 py-2.5 bg-canvas hover:bg-canvas text-ink dark:text-muted rounded-xl font-medium transition-colors flex items-center gap-2 dark:bg-ink/80"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
          >
            + Onboard Vendor
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
              <h2 className="text-xl font-bold text-ink dark:text-white">Onboard New Vendor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Vendor Name</label>
                <input 
                  type="text" 
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Campus</label>
                <select 
                  value={newVendorCampus}
                  onChange={(e) => setNewVendorCampus(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  {campuses.filter(c => c.status === 'Active').map((campus) => (
                    <option key={campus.id} value={campus.name}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Add Vendor</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Vendors', value: vendors.length.toString(), change: 'Across campuses' },
          { label: 'Pending Approvals', value: vendors.filter(v => v.status === 'Pending').length.toString(), change: 'Action Required', highlight: true },
          { label: 'Avg Satisfaction', value: '4.6/5.0', change: '+0.2' },
          { label: 'Vendor Revenue', value: '₦0', change: 'New System' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${stat.highlight ? 'bg-warning/10 border-amber-200' : 'glass-card'}`}>
            <h3 className={`text-sm font-medium ${stat.highlight ? 'text-amber-800' : 'text-muted dark:text-muted'}`}>{stat.label}</h3>
            <p className={`text-2xl font-space font-bold mt-1 ${stat.highlight ? 'text-warning' : 'text-ink dark:text-white'}`}>{stat.value}</p>
            <p className={`text-xs mt-1 font-medium ${stat.highlight ? 'text-warning' : 'text-primary'}`}>{stat.change}</p>
          </div>
        ))}
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
                placeholder="Search vendors..." 
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
            {['All', 'Active', 'Pending', 'Suspended'].map(status => (
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
            isEmpty={filteredVendors.length === 0}
            onRetry={fetchVendors}
            emptyLabel="No vendors found. Try adjusting your filters or search term."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Vendor Info</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Campus</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Rating</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Total Orders</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-white dark:bg-ink/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-ink dark:text-white">{vendor.name}</div>
                      <div className="text-xs text-muted font-mono mt-0.5">{vendor.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-ink dark:text-muted">{vendor.campus}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 bg-canvas w-fit px-2 py-0.5 rounded-md dark:bg-ink/80">
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                        <span className="text-sm font-bold text-ink dark:text-muted">{vendor.rating > 0 ? vendor.rating : '--'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-ink dark:text-muted">{vendor.totalOrders}</div>
                    </td>
                    <td className="py-4 px-6">
                      <select 
                        value={vendor.status}
                        onChange={(e) => updateVendorStatus(vendor.id, e.target.value as Vendor['status'])}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer appearance-none ${statusStyles[vendor.status] || 'bg-canvas text-ink dark:text-muted'}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateVendorStatus(vendor.id, vendor.status === 'Active' ? 'Suspended' : 'Active')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-ink hover:bg-muted transition-colors"
                      >
                        Toggle Status
                      </button>
                      <button 
                        onClick={() => setEditingVendor(vendor)}
                        className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                        title="Edit Vendor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingVendorId(vendor.id)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Delete Vendor"
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
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-muted/10 dark:bg-ink"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink dark:text-white">Edit Vendor</h2>
              <button onClick={() => setEditingVendor(null)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditVendor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Vendor Name</label>
                <input 
                  type="text" 
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Campus</label>
                <select 
                  value={editingVendor.campus}
                  onChange={(e) => setEditingVendor({ ...editingVendor, campus: e.target.value })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  {campuses.filter(c => c.status === 'Active').map((campus) => (
                    <option key={campus.id} value={campus.name}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingVendor(null)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-info hover:bg-info/80 text-white rounded-xl font-medium shadow-sm transition-colors">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVendorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-muted/10 text-center dark:bg-ink"
          >
            <div className="w-16 h-16 bg-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-ink dark:text-white mb-2">Delete Vendor?</h2>
            <p className="text-muted dark:text-muted mb-6 text-sm">Are you sure you want to delete this vendor? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingVendorId(null)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors w-full dark:bg-ink/80">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-xl font-medium shadow-sm transition-colors w-full">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
