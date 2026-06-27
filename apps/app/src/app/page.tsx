'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    } else {
      // Redirect unauthenticated users to login
      router.push('/login');
    }
  }, [session, status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">SaaS Platform</h1>
        <p className="mt-4 text-lg text-gray-600">Redirecting...</p>
      </div>
    </main>
  );
}
