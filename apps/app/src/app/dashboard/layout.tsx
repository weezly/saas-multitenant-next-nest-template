import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | SaaS Platform',
  description: 'Your dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
