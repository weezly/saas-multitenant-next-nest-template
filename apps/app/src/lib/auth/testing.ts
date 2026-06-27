/**
 * Auth Provider Testing Utility
 *
 * Kleine Hilfsfunktionen zum Testen und Debuggen der Provider-Konfiguration
 */

import {
  loadProviders,
  getEnabledProviderNames,
  isProviderEnabled,
  VALID_PROVIDERS,
} from './providers';

/**
 * Teste die Provider-Konfiguration
 */
export function testProviderConfiguration(): void {
  console.log('\n========== AUTH PROVIDER TEST ==========\n');

  console.log('📋 Configuration:');
  console.log(`  AUTH_PROVIDERS=${process.env.AUTH_PROVIDERS || 'not set'}`);
  console.log(`  NEXTAUTH_URL=${process.env.NEXTAUTH_URL || 'not set'}`);
  console.log(`  NEXTAUTH_SECRET=${process.env.NEXTAUTH_SECRET ? '***set***' : 'not set'}\n`);

  console.log('✅ Valid Providers:', VALID_PROVIDERS.join(', '));
  console.log('📌 Enabled Providers:', getEnabledProviderNames().join(', ') || 'none\n');

  console.log('🔍 Provider Status:');
  for (const provider of VALID_PROVIDERS) {
    const enabled = isProviderEnabled(provider);
    const icon = enabled ? '✓' : '✗';
    console.log(`  ${icon} ${provider}`);

    // Show required env vars
    if (enabled) {
      const requiredVars = getRequiredEnvVars(provider);
      if (requiredVars.length > 0) {
        const configured = requiredVars.every((v) => process.env[v]);
        console.log(
          `    └─ ${configured ? '✓ Configured' : '✗ Missing'}: ${requiredVars.join(', ')}`
        );
      }
    }
  }

  console.log('\n🚀 Loaded Providers Count:', loadProviders().length);
  console.log('\n========== END TEST ==========\n');
}

/**
 * Hole erforderliche ENV-Variablen für einen Provider
 */
function getRequiredEnvVars(provider: string): string[] {
  const requiredVars: Record<string, string[]> = {
    credentials: [],
    google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    github: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
    microsoft: ['MICROSOFT_CLIENT_ID', 'MICROSOFT_CLIENT_SECRET', 'MICROSOFT_TENANT'],
  };

  return requiredVars[provider] || [];
}

/**
 * Hilfreicher Debug-Output für Development
 */
export function debugAuthConfig(): {
  enabled: string[];
  missing: string[];
  misconfigured: string[];
  summary: string;
} {
  const enabled: string[] = [];
  const missing: string[] = [];
  const misconfigured: string[] = [];

  for (const provider of VALID_PROVIDERS) {
    if (isProviderEnabled(provider)) {
      const requiredVars = getRequiredEnvVars(provider);
      const allConfigured = requiredVars.every((v) => process.env[v]);

      if (allConfigured) {
        enabled.push(provider);
      } else {
        const missing_vars = requiredVars.filter((v) => !process.env[v]);
        misconfigured.push(`${provider} (missing: ${missing_vars.join(', ')})`);
      }
    }
  }

  // Alle nicht eingeschalteten Provider
  for (const provider of VALID_PROVIDERS) {
    if (!isProviderEnabled(provider)) {
      missing.push(provider);
    }
  }

  const summary =
    enabled.length > 0 ? `✓ ${enabled.length} provider(s) configured` : '✗ No providers configured';

  return { enabled, missing, misconfigured, summary };
}

/**
 * Exportiere für CLI/Testing
 */
if (require.main === module) {
  testProviderConfiguration();
  const debug = debugAuthConfig();
  console.log('\nDebug Info:', debug);
}
