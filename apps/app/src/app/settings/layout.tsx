import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | SaaS Platform',
  description: 'Manage your tenant and team settings',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
