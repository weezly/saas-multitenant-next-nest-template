/**
 * Authentication Utilities
 *
 * NextAuth Konfiguration befindet sich in: auth.config.ts
 * Diese Datei enthält Hilfsfunktionen.
 */

/**
 * Get Current Tenant from Session
 */
export async function getCurrentTenant() {
  // Wird über useSession() Hook im Client erreicht
  // oder via getServerSession() im Server
}

/**
 * Check User Permission in Tenant
 */
export function hasPermission(
  permissions: Record<string, string[]> | null,
  resource: string,
  action: string
): boolean {
  if (!permissions) return false;
  return permissions[resource]?.includes(action) ?? false;
}

/**
 * Get Available Tenants from Session
 */
export async function getAvailableTenants(userId: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  try {
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch tenants');

    const user = await response.json();
    return user.memberships || [];
  } catch (error) {
    console.error('Failed to fetch available tenants:', error);
    return [];
  }
}
