'use client';

import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardOverview } from '@/components/DashboardOverview';
import { OrdersContent } from '@/components/OrdersContent';
import { VendorsContent } from '@/components/VendorsContent';
import { StudentsContent } from '@/components/StudentsContent';
import { AnalyticsContent } from '@/components/AnalyticsContent';
import { CampusesContent } from '@/components/CampusesContent';
import { RidersContent } from '@/components/RidersContent';
import { SubscriptionsContent } from '@/components/SubscriptionsContent';
import { PaymentsContent } from '@/components/PaymentsContent';
import { CommissionsContent } from '@/components/CommissionsContent';
import { ComplaintsContent } from '@/components/ComplaintsContent';
import { SystemLogsContent } from '@/components/SystemLogsContent';
import { SettingsContent } from '@/components/SettingsContent';
import { SupportContent } from '@/components/SupportContent';

export default function Home() {
  const activeTab = useAppStore((state) => state.activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
      case 'Overview':
        return <DashboardOverview />;
      case 'Orders':
        return <OrdersContent />;
      case 'Vendors':
        return <VendorsContent />;
      case 'Students':
        return <StudentsContent />;
      case 'Campuses':
        return <CampusesContent />;
      case 'Analytics':
        return <AnalyticsContent />;
      case 'Riders':
        return <RidersContent />;
      case 'Subscriptions':
        return <SubscriptionsContent />;
      case 'Payments':
        return <PaymentsContent />;
      case 'Commissions':
        return <CommissionsContent />;
      case 'Complaints':
        return <ComplaintsContent />;
      case 'Settings':
        return <SettingsContent />;
      case 'System Logs':
        return <SystemLogsContent />;
      case 'Support':
        return <SupportContent />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-white/60 rounded-2xl shadow-sm border border-muted/10 flex items-center justify-center mb-6 text-primary">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-space font-bold text-ink dark:text-white">Module Optimization</h2>
            <p className="text-muted mt-2 max-w-md">The {activeTab} control module is currently being finalized for enterprise scaling.</p>
          </div>
        );
    }
  };

  return <DashboardLayout>{renderContent()}</DashboardLayout>;
}
