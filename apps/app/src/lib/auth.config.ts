import './auth.types';
import { loadProviders } from './providers';

/**
 * NextAuth Konfiguration mit Multi-Tenant & Dynamic Provider Support
 *
 * Provider werden dynamisch via AUTH_PROVIDERS ENV-Variable geladen
 * Syntax: AUTH_PROVIDERS=credentials,google,github
 *
 * Für NextAuth v5 beta - minimale Type Annotations
 */

export const authOptions = {
  providers: loadProviders(),

  callbacks: {
    jwt: async (params: any) => {
      const { token, user, trigger, session } = params;

      // Initial Sign In
      if (user) {
        token.id = user.id;
        token.email = user.email;

        // Fetch User mit Tenants vom Backend
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiUrl}/users/me`, {
            headers: {
              'x-user-id': user.id,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            // Ersten Tenant als aktiv setzen
            if (userData.memberships?.length > 0) {
              const firstMembership = userData.memberships[0];
              token.activeTenantId = firstMembership.tenantId;
              token.activeRoleId = firstMembership.roleId;
            }
          }
        } catch {
          // Backend nicht verfügbar - Continue ohne Tenant
          console.warn('Could not fetch user tenants');
        }
      }

      // JWT Update via trigger (z.B. Tenant Switch)
      if (trigger === 'update' && session?.activeTenantId) {
        token.activeTenantId = session.activeTenantId;
        token.activeRoleId = session.activeRoleId;
      }

      return token;
    },

    session: async (params: any) => {
      const { session, token } = params;

      if (session.user) {
        session.user.id = token.id;
        session.user.activeTenantId = token.activeTenantId;
        session.user.activeRoleId = token.activeRoleId;
      }

      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  events: {
    signOut: async () => {
      // Optional: Cleanup bei Logout
    },
  },

  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update every 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
