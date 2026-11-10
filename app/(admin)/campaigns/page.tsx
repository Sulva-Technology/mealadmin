import { CampaignStudio } from '@/components/admin/campaign/CampaignStudio';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export default function CampaignsPage() {
  return <div className={outfit.variable}><CampaignStudio /></div>;
}
