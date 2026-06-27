/**
 * useAuthProviders Hook
 *
 * Hilfsfunktion zum Arbeiten mit dynamischen Auth-Providern in React-Komponenten
 */

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Information über einen aktivierten Auth-Provider
 */
export interface ProviderInfo {
  id: string;
  name: string;
  icon?: string;
  enabled: boolean;
}

/**
 * Hook zum Abrufen aktivierter Provider
 *
 * @returns {Object} Provider-Informationen und Hilfsfunktionen
 */
export function useAuthProviders() {
  const { data: session } = useSession();

  // Diese Informationen sollten vom Server kommen via API
  // Hier nur Client-seitige Hilfs-Funktionen
  const providers: ProviderInfo[] = useMemo(() => {
    // TODO: Diese könnten vom Server via API kommen
    return [
      {
        id: 'credentials',
        name: 'Email & Password',
        icon: 'mail',
        enabled: true, // Würde vom Server kommen
      },
      {
        id: 'google',
        name: 'Google',
        icon: 'google',
        enabled: false, // Würde vom Server kommen
      },
      {
        id: 'github',
        name: 'GitHub',
        icon: 'github',
        enabled: false, // Würde vom Server kommen
      },
    ];
  }, []);

  return {
    providers,
    enabledProviders: providers.filter((p) => p.enabled),
    hasMultipleProviders: providers.filter((p) => p.enabled).length > 1,
  };
}

/**
 * Beispiel: Nutze den Hook in einer Komponente
 *
 * export function LoginPage() {
 *   const { enabledProviders } = useAuthProviders();
 *
 *   return (
 *     <div>
 *       {enabledProviders.map(provider => (
 *         <button key={provider.id}>
 *           Sign in with {provider.name}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 */
