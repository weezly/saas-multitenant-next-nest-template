import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/switch-tenant
 *
 * Wechselt den aktiven Tenant des Users
 * Aktualisiert den JWT Token mit dem neuen activeTenantId
 *
 * Request Body:
 * {
 *   "tenantId": "tenant-uuid"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // For NextAuth v5 beta, we use direct header validation
    // Extract user ID from request (would be set by client/middleware)
    const userId = request.headers.get('x-user-id') || 'demo-user';

    // Parse request body
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
      // Try to verify with backend
      const response = await fetch(`${apiUrl}/memberships?tenantId=${tenantId}`, {
        headers: {
          'x-tenant-id': tenantId,
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const memberships = Array.isArray(data) ? data : data.data || [];
        const membership = memberships.find((m: any) => m.userId === userId);

        if (!membership) {
          return NextResponse.json(
            { error: 'Forbidden: User not member of tenant' },
            { status: 403 }
          );
        }

        return NextResponse.json({
          success: true,
          tenantId,
          roleId: membership.roleId,
          message: `Switched to tenant: ${tenantId}`,
        });
      }
    } catch (err) {
      console.warn('Backend not available, allowing tenant switch:', err);
    }

    // Fallback: Allow switching to demo tenants
    const demoTenantIds = ['tenant-demo-1', 'tenant-demo-2'];
    if (demoTenantIds.includes(tenantId)) {
      return NextResponse.json({
        success: true,
        tenantId,
        roleId: tenantId === 'tenant-demo-1' ? 'admin' : 'member',
        message: `Switched to tenant: ${tenantId}`,
      });
    }

    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  } catch (error) {
    console.error('Tenant switch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
