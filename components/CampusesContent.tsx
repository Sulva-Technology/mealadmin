'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, XCircle, MoreHorizontal } from 'lucide-react';
import { useAppStore, Campus } from '@/store/useAppStore';
import { DataState } from '@/components/DataState';

export function CampusesContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampusName, setNewCampusName] = useState('');
  
  const campuses = useAppStore(state => state.campuses);
  const addCampus = useAppStore(state => state.addCampus);
  const updateCampusStatus = useAppStore(state => state.updateCampusStatus);
  const fetchCampuses = useAppStore(state => state.fetchCampuses);
  const status = useAppStore(state => state.status.campuses);
  const error = useAppStore(state => state.errors.campuses);

  useEffect(() => {
    fetchCampuses();
  }, [fetchCampuses]);

  const filteredCampuses = campuses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCampusName) {
      addCampus({
        id: `CMP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        name: newCampusName,
        status: 'Active',
      });
      setIsModalOpen(false);
      setNewCampusName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Campuses</h1>
          <p className="text-muted dark:text-muted mt-1">Manage campuses and operational zones.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
        >
          + Add Campus
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
              <h2 className="text-xl font-bold text-ink dark:text-white">Onboard New Campus</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddCampus} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Campus Name</label>
                <input 
                  type="text" 
                  value={newCampusName}
                  onChange={(e) => setNewCampusName(e.target.value)}
                  placeholder="e.g. Venite University, Iloro Ekiti"
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Add Campus</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl overflow-hidden"
      >
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-ink/50 border-b border-muted/20 dark:border-muted/50/50">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search campuses..." 
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
            isEmpty={filteredCampuses.length === 0}
            onRetry={fetchCampuses}
            emptyLabel="No campuses found."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Campus Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredCampuses.map((campus) => (
                  <tr key={campus.id} className="hover:bg-white dark:bg-ink/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/20 text-primary-strong">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-ink dark:text-white">{campus.name}</div>
                          <div className="text-xs text-muted font-mono mt-0.5">{campus.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <select 
                        value={campus.status}
                        onChange={(e) => updateCampusStatus(campus.id, e.target.value as Campus['status'])}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer appearance-none ${campus.status === 'Active' ? 'bg-success/20 text-primary-strong' : 'bg-danger/20 text-danger'}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => updateCampusStatus(campus.id, campus.status === 'Active' ? 'Inactive' : 'Active')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-ink hover:bg-muted transition-colors"
                      >
                        Toggle Status
                      </button>
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
