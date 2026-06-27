import 'next-auth';
import type { DefaultSession } from 'next-auth';

/**
 * NextAuth Session und User Type Extensions
 * für Multi-Tenant Support
 */

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    activeTenantId?: string;
    activeRoleId?: string;
  }

  interface Session extends DefaultSession {
    user: User;
  }

  interface JWT {
    id: string;
    email: string;
    activeTenantId?: string;
    activeRoleId?: string;
  }
}

export {};
