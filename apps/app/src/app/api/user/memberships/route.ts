import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/user/memberships
 *
 * Gibt alle Memberships des aktuellen Users zurück
 * (alle Tenants in denen der User Mitglied ist)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Fetch user mit memberships vom Backend
    const response = await fetch(`${apiUrl}/users/me`, {
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch memberships' },
        { status: 500 }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      memberships: userData.memberships || [],
    });
  } catch (error) {
    console.error('Memberships fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
