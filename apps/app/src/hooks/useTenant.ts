import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

/**
 * Custom Hook für Tenant Management
 * - Aktuelle Tenant auslesen
 * - Zwischen Tenants wechseln
 * - Verfügbare Tenants laden
 */
export function useTenant() {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Wechsel zu einem anderen Tenant
   */
  const switchTenant = useCallback(
    async (tenantId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/switch-tenant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tenantId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to switch tenant');
        }

        const result = await response.json();

        // Update session auf Client-Seite
        await updateSession({
          activeTenantId: tenantId,
          activeRoleId: result.roleId,
        });

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [updateSession]
  );

  /**
   * Aktuelle Tenant auslesen
   */
  const activeTenant = session?.user?.activeTenantId;

  /**
   * User ist Mitglied von mehreren Tenants?
   */
  const isMultiTenant = session?.user?.id && session?.user;

  /**
   * Liste verfügbarer Tenants aus Session
   * (würde vom Backend als vollständige Liste kommen)
   */
  const availableTenants = session?.user?.activeTenantId
    ? [{ id: session.user.activeTenantId }]
    : [];

  return {
    activeTenant,
    isMultiTenant,
    availableTenants,
    switchTenant,
    isLoading,
    error,
    activeRoleId: session?.user?.activeRoleId,
  };
}

/**
 * Hook zum Auslesen der Tenant-Memberships
 */
export function useTenantMemberships() {
  const { data: session } = useSession();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch memberships wenn User loaded
  const fetchMemberships = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/memberships');
      if (response.ok) {
        const data = await response.json();
        setMemberships(data.memberships || []);
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  return {
    memberships,
    isLoading,
    refetch: fetchMemberships,
  };
}
