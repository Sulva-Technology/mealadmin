'use client';

import { motion } from 'motion/react';
import { Mail, MessageSquare, Phone, ExternalLink } from 'lucide-react';

export function SupportContent() {
  return (
    <div className="space-y-6 max-w-4xl max-w-full">
      <div>
        <h1 className="text-3xl font-space font-bold tracking-tight text-ink dark:text-white">Support</h1>
        <p className="text-muted dark:text-muted mt-1">Get help and resources for managing the platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Mail, title: 'Email Support', desc: 'Usually replies within 2 hours', contact: 'admin@mealdirect.com', link: 'mailto:admin@mealdirect.com' },
          { icon: Phone, title: 'Live Agent', desc: 'Available Mon-Fri, 9am-6pm', contact: '+234 800 MEAL DIR', link: 'tel:+2348006325347' },
          { icon: MessageSquare, title: 'Community Slack', desc: 'Connect with other admins', contact: 'Join Channel', link: '#' },
        ].map((item, i) => (
          <motion.a 
            key={i}
            href={item.link}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-3xl p-6 hover:bg-white dark:bg-ink/60 transition-colors border border-transparent hover:border-muted/20 group block dark:border-muted/50"
          >
            <div className="w-12 h-12 bg-success/20 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-ink dark:text-white">{item.title}</h3>
            <p className="text-sm text-muted dark:text-muted mt-1 mb-4">{item.desc}</p>
            <div className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
              {item.contact}
              <ExternalLink className="w-4 h-4" />
            </div>
          </motion.a>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-3xl p-6 md:p-8 mt-6">
        <h2 className="text-xl font-bold text-ink dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How do I onboard a new campus?', a: 'Navigate to "Campuses" and click the "+ Add Campus" button to initiate the setup wizard.' },
            { q: 'When are vendor payouts processed?', a: 'Payouts are computed automatically every Friday at 23:59 WAT.' },
            { q: 'How do I handle a disputed student order?', a: 'Check the "Complaints" tab, verify the system log for delivery states, and issue refunds directly inside the complaint ticket.' }
          ].map((faq, i) => (
            <div key={i} className="p-4 border border-muted/20 dark:border-muted/50/80 rounded-2xl bg-white dark:bg-ink/30">
              <h4 className="font-semibold text-ink dark:text-white">{faq.q}</h4>
              <p className="text-sm text-muted dark:text-muted mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
