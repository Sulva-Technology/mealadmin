'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Bike, MapPin, Star, XCircle, Download, Edit2, Trash2 } from 'lucide-react';
import { useAppStore, Rider } from '@/store/useAppStore';
import { exportCSV } from '@/lib/utils';
import { DataState } from '@/components/DataState';

export function RidersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRiderName, setNewRiderName] = useState('');
  const [newRiderPhone, setNewRiderPhone] = useState('');
  const [newRiderCampus, setNewRiderCampus] = useState('');

  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [deletingRiderId, setDeletingRiderId] = useState<string | null>(null);

  const riders = useAppStore(state => state.riders);
  const addRider = useAppStore(state => state.addRider);
  const updateRider = useAppStore(state => state.updateRider);
  const deleteRider = useAppStore(state => state.deleteRider);
  const campuses = useAppStore(state => state.campuses);
  const fetchRiders = useAppStore(state => state.fetchRiders);
  const status = useAppStore(state => state.status.riders);
  const error = useAppStore(state => state.errors.riders);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);
  
  const filteredRiders = riders.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRiderName && newRiderPhone) {
      addRider({
        id: `RID-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name: newRiderName,
        phone: newRiderPhone,
        campus: newRiderCampus || (campuses[0]?.name ?? 'UNILAG'),
        status: 'Offline',
        deliveries: 0,
        rating: 5.0,
      });
      setIsModalOpen(false);
      setNewRiderName('');
      setNewRiderPhone('');
    }
  };

  const handleEditRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRider) {
      updateRider(editingRider.id, {
        name: editingRider.name,
        phone: editingRider.phone,
        campus: editingRider.campus,
      });
      setEditingRider(null);
    }
  };

  const confirmDelete = () => {
    if (deletingRiderId) {
      deleteRider(deletingRiderId);
      setDeletingRiderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Riders</h1>
          <p className="text-muted dark:text-muted mt-1">Manage delivery personnel across campuses.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportCSV(filteredRiders, 'riders_report')}
            className="px-4 py-2.5 bg-canvas hover:bg-canvas text-ink dark:text-muted rounded-xl font-medium transition-colors flex items-center gap-2 dark:bg-ink/80"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
          >
            + Add Rider
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
              <h2 className="text-xl font-bold text-ink dark:text-white">Register New Rider</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddRider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Rider Name</label>
                <input 
                  type="text" 
                  value={newRiderName}
                  onChange={(e) => setNewRiderName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={newRiderPhone}
                  onChange={(e) => setNewRiderPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Assigned Campus</label>
                <select 
                  value={newRiderCampus}
                  onChange={(e) => setNewRiderCampus(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  {campuses.filter(c => c.status === 'Active').map((campus) => (
                    <option key={campus.id} value={campus.name}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Register Rider</button>
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
              placeholder="Search riders..." 
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
            isEmpty={filteredRiders.length === 0}
            onRetry={fetchRiders}
            emptyLabel="No riders found."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Rider Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Campus</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Deliveries</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Rating</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-white dark:bg-ink/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Bike className="w-5 h-5" /></div>
                        <div>
                          <div className="text-sm font-semibold text-ink dark:text-white">{rider.name}</div>
                          <div className="text-xs text-muted font-mono mt-0.5">{rider.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="text-sm text-ink dark:text-muted flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-muted" />{rider.campus}</div></td>
                    <td className="py-4 px-6 text-sm text-ink dark:text-white">{rider.deliveries}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-warning fill-warning" /><span className="text-sm font-medium">{rider.rating.toFixed(1)}</span></div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${rider.status === 'Active' ? 'bg-success/20 text-primary-strong' : 'bg-canvas dark:bg-ink text-muted dark:text-muted'}`}>{rider.status}</span>
                    </td>
                    <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingRider(rider)}
                        className="p-1.5 text-muted hover:text-info hover:bg-info/10 rounded-lg transition-colors"
                        title="Edit Rider"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingRiderId(rider.id)}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Delete Rider"
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
      {editingRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-muted/10 dark:bg-ink"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-ink dark:text-white">Edit Rider</h2>
              <button onClick={() => setEditingRider(null)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditRider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Rider Name</label>
                <input 
                  type="text" 
                  value={editingRider.name}
                  onChange={(e) => setEditingRider({ ...editingRider, name: e.target.value })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editingRider.phone}
                  onChange={(e) => setEditingRider({ ...editingRider, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Assigned Campus</label>
                <select 
                  value={editingRider.campus}
                  onChange={(e) => setEditingRider({ ...editingRider, campus: e.target.value })}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  {campuses.filter(c => c.status === 'Active').map((campus) => (
                    <option key={campus.id} value={campus.name}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingRider(null)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-info hover:bg-info/80 text-white rounded-xl font-medium shadow-sm transition-colors">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRiderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-muted/10 text-center dark:bg-ink"
          >
            <div className="w-16 h-16 bg-danger/20 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-ink dark:text-white mb-2">Delete Rider?</h2>
            <p className="text-muted dark:text-muted mb-6 text-sm">Are you sure you want to delete this rider? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingRiderId(null)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors w-full dark:bg-ink/80">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-xl font-medium shadow-sm transition-colors w-full">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
