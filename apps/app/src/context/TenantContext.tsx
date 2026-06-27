'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface TenantContextType {
  activeTenantId: string | undefined;
  activeRoleId: string | undefined;
  tenants: Array<{
    id: string;
    name: string;
    role?: string;
    description?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refetchTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export interface TenantProviderProps {
  children: React.ReactNode;
}

/**
 * TenantProvider - Global Tenant State Management
 * Sollte in RootLayout verwendet werden
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const { data: session } = useSession();
  const [tenants, setTenants] = useState<
    Array<{ id: string; name: string; role?: string; description?: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all tenants for current user
   */
  const refetchTenants = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      } else {
        throw new Error('Failed to fetch tenants');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Switch to different tenant
   */
  const switchTenant = async (tenantId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to switch tenant');
      }

      // Update session via NextAuth
      // This will trigger a revalidation of the JWT token
      if (typeof window !== 'undefined') {
        // Force window reload to get new session
        // Alternative: Use NextAuth's update session
        window.location.href = '/dashboard';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tenants on mount
  useEffect(() => {
    refetchTenants();
  }, [session?.user?.id]);

  const value: TenantContextType = {
    activeTenantId: session?.user?.activeTenantId,
    activeRoleId: session?.user?.activeRoleId,
    tenants,
    isLoading,
    error,
    switchTenant,
    refetchTenants,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

/**
 * Hook zum Zugriff auf TenantContext
 */
export function useTenantContext() {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }

  return context;
}
