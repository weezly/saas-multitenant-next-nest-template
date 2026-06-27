import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects | SaaS Platform',
  description: 'Manage your projects',
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
