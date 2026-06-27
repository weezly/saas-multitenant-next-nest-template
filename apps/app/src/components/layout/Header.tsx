'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            SaaS Platform
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
              Projects
            </Link>
            <Link href="/settings" className="text-gray-700 hover:text-blue-600 transition-colors">
              Settings
            </Link>
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            {session?.user && (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session.user.email}</p>
                  {session.user.activeTenantId && (
                    <p className="text-xs text-gray-500">Tenant: {session.user.activeTenantId}</p>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
