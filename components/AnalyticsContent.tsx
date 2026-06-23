'use client';

import { 
  TrendingUp, Activity, BarChart3, PieChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore';

export function AnalyticsContent() {
  const vendors = useAppStore(state => state.vendors);
  const orders = useAppStore(state => state.orders);
  const students = useAppStore(state => state.students);

  const totalRevenue = orders.reduce((acc, curr) => acc + curr.amount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Executive Analytics</h1>
          <p className="text-muted dark:text-muted mt-1">Deep dive into platform performance and growth metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white dark:bg-ink/60 border border-muted/20 rounded-xl px-4 py-2 text-sm font-medium text-ink dark:text-muted outline-none shadow-sm cursor-pointer hover:bg-white transition-colors dark:bg-ink dark:border-muted/50">
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>Year to Date</option>
            <option>All Time</option>
          </select>
          <button 
            onClick={() => window.print()}
            className="px-5 py-2 bg-primary hover:bg-primary-strong text-white rounded-xl font-medium shadow-sm shadow-primary/20 transition-all active:scale-95"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, change: 'Total', icon: TrendingUp },
          { label: 'Active Students', value: students.length.toString(), change: 'Total', icon: Activity },
          { label: 'Average Order Value', value: `₦${avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`, change: 'Average', icon: BarChart3 },
          { label: 'Platform Growth', value: '0%', change: 'New Platform', icon: PieChart },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-2xl glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:transform group-hover:scale-125 transition-transform duration-500">
              <stat.icon className="w-24 h-24 text-primary -mt-4 -mr-4" />
            </div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="text-sm font-medium text-muted dark:text-muted">{stat.label}</h3>
              <span className="text-xs font-medium px-2 py-1 rounded-md text-ink dark:text-muted bg-canvas dark:bg-ink/80">
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-space font-bold text-ink dark:text-white relative z-10">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-space font-bold text-ink dark:text-white">Growth Trajectory</h2>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-muted/20 rounded-xl dark:border-muted/50">
             <div className="text-center">
              <Activity className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted dark:text-muted font-medium">Insufficient data for chart</p>
              <p className="text-sm text-muted mt-1">Accumulate history to display growth over time</p>
            </div>
          </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-3xl flex flex-col"
        >
          <h2 className="text-lg font-space font-bold text-ink dark:text-white mb-6">Delivery Success Rate</h2>
          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-muted/20 rounded-xl dark:border-muted/50">
             <div className="text-center">
              <BarChart3 className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted dark:text-muted font-medium">No order activity</p>
              <p className="text-sm text-muted mt-1">Status trends will appear here</p>
             </div>
          </div>
          <div className="mt-4 flex justify-between items-end border-t border-muted/20 dark:border-muted/50/50 pt-4">
              <div>
                  <p className="text-3xl font-space font-bold text-ink dark:text-white">0%</p>
                  <p className="text-xs font-semibold text-primary">On-Time Deliveries</p>
              </div>
              <div>
                  <p className="text-xl font-space font-bold text-ink dark:text-white text-right">0%</p>
                  <p className="text-xs font-medium text-muted dark:text-muted text-right">Delayed/Failed</p>
              </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
