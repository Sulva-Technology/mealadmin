'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreHorizontal, User, Mail, Phone, MapPin, XCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DataState } from '@/components/DataState';

export function StudentsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCampus, setNewStudentCampus] = useState('UNILAG');
  
  const students = useAppStore(state => state.students);
  const addStudent = useAppStore(state => state.addStudent);
  const campuses = useAppStore(state => state.campuses);
  const fetchStudents = useAppStore(state => state.fetchStudents);
  const status = useAppStore(state => state.status.students);
  const error = useAppStore(state => state.errors.students);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName && newStudentEmail) {
      addStudent({
        id: `STU-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        name: newStudentName,
        email: newStudentEmail,
        campus: newStudentCampus,
        orders: 0,
        joined: new Date().toLocaleDateString()
      });
      setIsModalOpen(false);
      setNewStudentName('');
      setNewStudentEmail('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Students Directory</h1>
          <p className="text-muted dark:text-muted mt-1">Manage user accounts, subscriptions, and behavior.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
        >
          + Add Student
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
              <h2 className="text-xl font-bold text-ink dark:text-white">Add New Student</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-muted dark:text-muted">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Campus</label>
                <select 
                  value={newStudentCampus}
                  onChange={(e) => setNewStudentCampus(e.target.value)}
                  className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 bg-white dark:bg-ink dark:border-muted/50"
                >
                  {campuses.filter(c => c.status === 'Active').map((campus) => (
                    <option key={campus.id} value={campus.name}>{campus.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-muted dark:text-muted hover:bg-canvas rounded-xl font-medium transition-colors dark:bg-ink/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-colors">Add Student</button>
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
        <div className="p-4 md:p-6 border-b border-muted/20 dark:border-muted/50/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-ink/30">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search students..." 
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-ink/50 border border-muted/20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-muted/50/20 focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-muted/20 bg-white dark:bg-ink dark:border-muted/50/50 rounded-xl text-muted dark:text-muted hover:bg-canvas transition-colors dark:bg-ink">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataState
            status={status}
            error={error}
            isEmpty={filteredStudents.length === 0}
            onRetry={fetchStudents}
            emptyLabel="No students found. Try adjusting your search term or add a new student."
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/20 dark:border-muted/50/50 bg-canvas dark:bg-ink/50">
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Student Profile</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Contact</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Campus</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Orders</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider">Joined</th>
                  <th className="py-4 px-6 text-xs font-semibold text-muted dark:text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/20">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white dark:bg-ink/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-primary-strong font-bold shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-ink dark:text-white flex items-center gap-2">
                            {student.name}
                          </div>
                          <div className="text-xs text-muted font-mono mt-0.5">{student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-muted dark:text-muted flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted" /> {student.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-ink dark:text-muted flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> {student.campus}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-semibold text-ink dark:text-muted">{student.orders}</div>
                    </td>
                    <td className="py-4 px-6 text-muted dark:text-muted text-sm">
                      {student.joined}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-success/10 transition-colors opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-5 h-5" />
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
