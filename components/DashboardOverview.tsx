'use client';

import { useEffect } from 'react';
import { 
  TrendingUp, ShoppingCart, Users, Store, Bike, AlertCircle, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'motion/react';
import { useAppStore } from '@/store/useAppStore';

export function DashboardOverview() {
  const vendors = useAppStore((state) => state.vendors);
  const orders = useAppStore((state) => state.orders);
  const students = useAppStore((state) => state.students);
  const fetchOrders = useAppStore((state) => state.fetchOrders);
  const fetchVendors = useAppStore((state) => state.fetchVendors);
  const fetchStudents = useAppStore((state) => state.fetchStudents);

  useEffect(() => {
    fetchOrders();
    fetchVendors();
    fetchStudents();
  }, [fetchOrders, fetchVendors, fetchStudents]);

  const stats = [
    { title: 'Total Orders', value: orders.length.toString(), change: 'Across all time', icon: ShoppingCart, color: 'text-info', bg: 'bg-info/20' },
    { title: 'Active Vendors', value: vendors.filter(v => v.status === 'Active').length.toString(), change: `Total: ${vendors.length}`, icon: Store, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Students', value: students.length.toString(), change: 'Registered', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Revenue', value: `₦ ${orders.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, change: 'Total volume', icon: TrendingUp, color: 'text-primary', bg: 'bg-success/20' },
  ];

  // Generate chart data based on loaded orders
  const chartData = [
    { name: 'Mon', revenue: 12000, orders: 40 },
    { name: 'Tue', revenue: 15000, orders: 50 },
    { name: 'Wed', revenue: 11000, orders: 35 },
    { name: 'Thu', revenue: 18000, orders: 60 },
    { name: 'Fri', revenue: 22000, orders: 75 },
    { name: 'Sat', revenue: 28000, orders: 90 },
    { name: 'Sun', revenue: orders.reduce((acc, curr) => acc + curr.amount, 0), orders: orders.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Mission Control</h1>
          <p className="text-muted dark:text-muted mt-1">Here&apos;s what&apos;s happening today across all campuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-full text-xs font-medium text-muted dark:text-muted">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Live Updates
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:transform group-hover:scale-110 transition-transform duration-500">
              <stat.icon className={`w-24 h-24 ${stat.color} -mt-4 -mr-4`} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} shadow-sm`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-md text-ink dark:text-muted bg-canvas dark:bg-ink">
                {stat.change}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-muted dark:text-muted text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-space font-bold text-ink dark:text-white mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-space font-bold text-ink dark:text-white">Revenue Trend</h2>
            <select className="bg-white dark:bg-ink/50 border border-muted/20 rounded-lg px-3 py-1.5 text-sm text-muted dark:text-muted outline-none dark:border-muted/50">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value}`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-3xl flex flex-col"
        >
          <h2 className="text-lg font-space font-bold text-ink dark:text-white mb-6">Order Volume by Slot</h2>
          <div className="flex-1 min-h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="orders" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-space font-bold text-ink dark:text-white">Operational Alerts</h2>
            <button className="text-sm font-medium text-primary hover:text-primary-strong">View All</button>
          </div>
          <div className="space-y-4">
             {orders.filter(o => o.status === 'Cancelled').map((alert, i) => (
               <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-danger/10 dark:bg-danger/10 border border-danger/20 dark:border-danger/20">
                 <AlertCircle className="w-5 h-5 text-danger mt-0.5" />
                 <div>
                   <h4 className="text-sm font-bold text-danger dark:text-danger">Order Cancelled</h4>
                   <p className="text-xs text-danger dark:text-danger mt-1">Order {alert.id} cancelled by {alert.student}</p>
                 </div>
               </div>
             ))}
             {orders.filter(o => o.status === 'Pending').map((alert, i) => (
               <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-warning/10 dark:bg-warning/10 border border-warning/20 dark:border-warning/20">
                 <Clock className="w-5 h-5 text-warning mt-0.5" />
                 <div>
                   <h4 className="text-sm font-bold text-warning dark:text-warning">High Volume Pending</h4>
                   <p className="text-xs text-warning dark:text-warning mt-1">Order {alert.id} has been pending for over 15 minutes</p>
                 </div>
               </div>
             ))}
          </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-space font-bold text-ink dark:text-white">Recent Transactions</h2>
            <button className="text-sm font-medium text-primary hover:text-primary-strong">View All</button>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 4).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-canvas dark:bg-ink/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-info/20 text-info flex items-center justify-center font-bold text-sm">
                    {order.student.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink dark:text-white">{order.student}</p>
                    <p className="text-xs text-muted">{order.vendor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-ink dark:text-white">₦{order.amount.toLocaleString()}</p>
                  <p className={`text-xs font-medium mt-0.5 ${order.status === 'Delivered' ? 'text-primary' : 'text-warning'}`}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
