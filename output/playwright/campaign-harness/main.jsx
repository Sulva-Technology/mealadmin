import React from 'react';
import { createRoot } from 'react-dom/client';
import { CampaignStudio } from '@/components/admin/campaign/CampaignStudio';
import { QueryProvider } from '@/lib/query';
import { ToastProvider } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import '@/app/globals.css';
import './preview.css';

api.getCampuses = async () => ({ data: [
  { id: 'qa-unilag', name: 'University of Lagos', slug: 'unilag', active: true },
  { id: 'qa-long', name: 'Federal University of Agriculture, Science and Technology', slug: 'long-campus', active: false },
] });

createRoot(document.getElementById('root')).render(<QueryProvider><ToastProvider><main className="mx-auto max-w-[1560px] p-5 md:p-8"><CampaignStudio /></main></ToastProvider></QueryProvider>);
