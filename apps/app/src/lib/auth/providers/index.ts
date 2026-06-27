/**
 * Dynamic Provider Factory
 *
 * Lädt Authentifizierungs-Provider basierend auf ENV-Variablen
 * Syntax: AUTH_PROVIDERS=credentials,google,github
 */

import { credentialsProvider } from './credentials';
import { googleProvider } from './google';
import { githubProvider } from './github';
import { microsoftProvider } from './microsoft';

type ProviderConfig = Record<string, any>;

/**
 * Alle verfügbaren Provider
 */
const AVAILABLE_PROVIDERS: Record<string, () => ProviderConfig> = {
  credentials: () => credentialsProvider,
  google: () => googleProvider,
  github: () => githubProvider,
  microsoft: () => microsoftProvider,
};

/**
 * Valide Provider-Namen
 */
export const VALID_PROVIDERS = Object.keys(AVAILABLE_PROVIDERS);

/**
 * Provider-Status für Debugging
 */
interface ProviderStatus {
  name: string;
  enabled: boolean;
  configured: boolean;
  reason?: string;
}

/**
 * Lade dynamisch aktivierte Provider
 * @returns Array von aktiven Provider-Konfigurationen
 */
export function loadProviders(): ProviderConfig[] {
  const enabledProviders =
    process.env.AUTH_PROVIDERS?.split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean) || [];

  if (enabledProviders.length === 0) {
    console.warn('[Auth] No providers configured. Set AUTH_PROVIDERS environment variable.');
    return [];
  }

  const providers: ProviderConfig[] = [];
  const status: ProviderStatus[] = [];

  for (const providerName of enabledProviders) {
    // Validiere Provider-Namen
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

    // Lade Provider
    try {
      const provider = AVAILABLE_PROVIDERS[providerName]();

      // Validiere Konfiguration
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

  // Log Status
  logProviderStatus(status);

  return providers;
}

/**
 * Prüfe, ob Provider vollständig konfiguriert ist
 */
function isProviderConfigured(name: string, provider: ProviderConfig): boolean {
  switch (name) {
    case 'credentials':
      // Credentials Provider benötigt keine Extra-Config
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
  const configuredCount = status.filter((s) => s.configured).length;

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
  const enabled =
    process.env.AUTH_PROVIDERS?.split(',')
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
