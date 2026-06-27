/**
 * Credentials Provider - Email + Passwort Authentifizierung
 *
 * Authentifiziert Nutzer mit Email und Passwort.
 * Validiert über Backend-API
 */

export const credentialsProvider = {
  id: 'credentials' as const,
  name: 'Email & Password',
  type: 'credentials' as const,
  credentials: {
    email: {
      label: 'Email',
      type: 'email',
      placeholder: 'user@example.com',
    },
    password: {
      label: 'Password',
      type: 'password',
    },
  },

  authorize: async (credentials: any) => {
    // Validierung
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Email and password are required');
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // Authentifizierung über Backend
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const user = await response.json();

      return {
        id: user.id,
        email: user.email,
        name: user.name || 'User',
        image: user.image || null,
      };
    } catch (error) {
      console.error('Credentials auth error:', error);
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  },
};
