import { NextResponse } from 'next/server';

/**
 * GET /api/user/tenants
 *
 * Gibt alle Tenants des aktuellen Users zurück
 * mit Informationen über Role in jedem Tenant
 */
export async function GET(request: Request) {
  try {
    // For NextAuth v5 beta, we'll use a simpler approach
    // Get user info from headers or environment
    // In production, you'd use getServerSession from next-auth/next

    // Extract user ID from headers (would be set by middleware/client)
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      // Try to fetch from backend
      const response = await fetch(`${apiUrl}/tenants`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const tenants = (Array.isArray(data) ? data : data.data || []).map((tenant: any) => ({
          id: tenant.id,
          name: tenant.name || 'Unknown Tenant',
          role: tenant.role?.name || 'Member',
          description: tenant.description,
        }));

        return NextResponse.json({
          success: true,
          tenants,
        });
      }
    } catch (err) {
      console.warn('Backend not available, using demo tenants:', err);
    }

    // Fallback: Demo tenants
    const demoTenants = [
      {
        id: 'tenant-demo-1',
        name: 'Acme Corporation',
        role: 'Admin',
        description: 'Your main organization',
      },
      {
        id: 'tenant-demo-2',
        name: 'Side Project Inc',
        role: 'Member',
        description: 'Secondary organization',
      },
    ];

    return NextResponse.json({
      success: true,
      tenants: demoTenants,
    });
  } catch (error) {
    console.error('Tenants fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
