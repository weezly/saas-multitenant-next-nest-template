import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { TenantProvider } from '@/context/TenantContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SaaS App',
  description: 'Multi-tenant SaaS Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <TenantProvider>{children}</TenantProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
