/**
 * Authentication Providers Configuration
 * 
 * Alle Provider-Definitionen in einer einzigen Datei für bessere Modulauflösung
 */

/**
 * Credentials Provider - Email + Passwort Authentifizierung
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
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Email and password are required');
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

/**
 * Google OAuth Provider
 */
export const googleProvider = {
  id: 'google' as const,
  name: 'Google',
  type: 'oauth' as const,
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
  profile: async (profile: any) => {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
};

/**
 * GitHub OAuth Provider
 */
export const githubProvider = {
  id: 'github' as const,
  name: 'GitHub',
  type: 'oauth' as const,
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  wellKnown: 'https://github.com/.well-known/openid-configuration',
  authorization: {
    params: {
      scope: 'read:user user:email',
    },
  },
  profile: async (profile: any) => {
    return {
      id: profile.sub,
      name: profile.name || profile.login,
      email: profile.email,
      image: profile.avatar_url,
    };
  },
};

/**
 * Microsoft Azure AD OAuth Provider (vorbereitet)
 */
export const microsoftProvider = {
  id: 'microsoft' as const,
  name: 'Microsoft',
  type: 'oauth' as const,
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  wellKnown: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT}/v2.0/.well-known/openid-configuration`,
  authorization: {
    params: {
      scope: 'openid profile email',
    },
  },
  profile: async (profile: any) => {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
};

// --- Provider Factory ---

type ProviderConfig = Record<string, any>;

const AVAILABLE_PROVIDERS: Record<string, () => ProviderConfig> = {
  credentials: () => credentialsProvider,
  google: () => googleProvider,
  github: () => githubProvider,
  microsoft: () => microsoftProvider,
};

export const VALID_PROVIDERS = Object.keys(AVAILABLE_PROVIDERS);

interface ProviderStatus {
  name: string;
  enabled: boolean;
  configured: boolean;
  reason?: string;
}

/**
 * Lade dynamisch aktivierte Provider
 */
export function loadProviders(): ProviderConfig[] {
  const enabledProviders = process.env.AUTH_PROVIDERS?.split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean) || [];

  if (enabledProviders.length === 0) {
    console.warn('[Auth] No providers configured. Set AUTH_PROVIDERS environment variable.');
    return [];
  }

  const providers: ProviderConfig[] = [];
  const status: ProviderStatus[] = [];

  for (const providerName of enabledProviders) {
    if (!AVAILABLE_PROVIDERS[providerName]) {
      console.warn(
        `[Auth] Unknown provider: ${providerName}. Valid: ${VALID_PROVIDERS.join(', ')}`
      );
      status.push({
        name: providerName,
        enabled: false,
        configured: false,
        reason: 'Unknown provider',
      });
      continue;
    }

    try {
      const provider = AVAILABLE_PROVIDERS[providerName]();

      if (!isProviderConfigured(providerName, provider)) {
        console.warn(
          `[Auth] Provider "${providerName}" is enabled but not properly configured. Check environment variables.`
        );
        status.push({
          name: providerName,
          enabled: true,
          configured: false,
          reason: 'Missing environment variables',
        });
        continue;
      }

      providers.push(provider);
      status.push({
        name: providerName,
        enabled: true,
        configured: true,
      });
    } catch (error) {
      console.error(`[Auth] Failed to load provider "${providerName}":`, error);
      status.push({
        name: providerName,
        enabled: false,
        configured: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logProviderStatus(status);

  return providers;
}

/**
 * Prüfe, ob Provider vollständig konfiguriert ist
 */
function isProviderConfigured(name: string, provider: ProviderConfig): boolean {
  switch (name) {
    case 'credentials':
      return true;
    case 'google':
      return !!(provider.clientId && provider.clientSecret);
    case 'github':
      return !!(provider.clientId && provider.clientSecret);
    case 'microsoft':
      return !!(provider.clientId && provider.clientSecret && process.env.MICROSOFT_TENANT);
    default:
      return false;
  }
}

/**
 * Logge Provider-Status
 */
function logProviderStatus(status: ProviderStatus[]): void {
  const enabledCount = status.filter((s) => s.enabled && s.configured).length;
  console.log(`[Auth] Provider Status:`);
  console.log(`  Enabled: ${enabledCount} of ${status.length}`);

  for (const s of status) {
    const icon = s.configured ? '✓' : '✗';
    const reason = s.reason ? ` (${s.reason})` : '';
    console.log(`  ${icon} ${s.name}${reason}`);
  }
}

/**
 * Hilfsfunktion: Prüfe, ob ein bestimmter Provider aktiv ist
 */
export function isProviderEnabled(providerName: string): boolean {
  const enabled = process.env.AUTH_PROVIDERS?.split(',')
    .map((p) => p.trim().toLowerCase())
    .includes(providerName.toLowerCase()) || false;

  return enabled;
}

/**
 * Hilfsfunktion: Hole aktivierte Provider-Namen
 */
export function getEnabledProviderNames(): string[] {
  return (
    process.env.AUTH_PROVIDERS?.split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean) || []
  );
}
