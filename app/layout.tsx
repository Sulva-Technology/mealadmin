import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: 'Meal Direct | Admin Control Center',
  description: 'Enterprise Operational Dashboard for Meal Direct',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${space.variable} font-sans antialiased text-ink dark:text-muted min-h-screen bg-canvas dark:bg-ink selection:bg-success/20 selection:text-primary-strong`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
