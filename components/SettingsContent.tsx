'use client';

import { motion } from 'motion/react';
import { Save, Bell, Shield, Globe } from 'lucide-react';

export function SettingsContent() {
  return (
    <div className="space-y-6 max-w-4xl max-w-full">
      <div>
        <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Settings</h1>
        <p className="text-muted dark:text-muted mt-1">Configure global platform preferences.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            General Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Platform Name</label>
              <input type="text" defaultValue="Meal Direct" className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink dark:text-muted mb-1">Support Email</label>
              <input type="email" defaultValue="support@mealdirect.com" className="w-full px-4 py-2 border border-muted/20 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 dark:border-muted/50" />
            </div>
          </div>
        </div>

        <hr className="border-muted/20 dark:border-muted/50/50" />

        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h2>
          <div className="space-y-3">
            {[
              { title: 'New Vendor Registrations', desc: 'Alert when a vendor applies' },
              { title: 'Failed Payments', desc: 'Email alerts for transaction failures' },
              { title: 'High Volume Alerts', desc: 'Warn when campus capacities reach 90%' }
            ].map((pref, i) => (
              <label key={i} className="flex items-center justify-between p-3 border border-muted/20 rounded-xl cursor-pointer hover:bg-canvas transition-colors dark:bg-ink dark:border-muted/50">
                <div>
                  <div className="font-semibold text-ink dark:text-white text-sm">{pref.title}</div>
                  <div className="text-xs text-muted dark:text-muted">{pref.desc}</div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-primary rounded focus:ring-primary/50" />
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button className="px-6 py-2.5 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm transition-all flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
