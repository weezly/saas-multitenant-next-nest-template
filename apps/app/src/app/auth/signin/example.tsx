/**
 * Beispiel: Dynamic Sign In Page
 *
 * Dieses ist ein Beispiel, wie man die Provider Factory nutzt
 * um eine dynamische Login-Seite zu erstellen.
 *
 * Datei: apps/app/src/app/auth/signin/example.tsx
 */

'use client';

import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';
import { getEnabledProviderNames } from '@/lib/auth/providers';

/**
 * Beispiel Sign-In Seite mit dynamischen Providern
 */
export function ExampleSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const enabledProviders = getEnabledProviderNames();
  const hasCredentials = enabledProviders.includes('credentials');
  const hasGoogle = enabledProviders.includes('google');
  const hasGithub = enabledProviders.includes('github');
  const hasMultiple = [hasCredentials, hasGoogle, hasGithub].filter(Boolean).length > 1;

  async function handleCredentialsSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuthSignIn(provider: string) {
    setError('');
    setIsLoading(true);

    try {
      await signIn(provider);
    } catch (err) {
      setError(`Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* OAuth Buttons (if multiple providers) */}
        {hasMultiple && (
          <div className="space-y-3">
            {hasGoogle && (
              <button
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  {/* Google Icon SVG */}
                </svg>
                <span className="ml-2">Sign in with Google</span>
              </button>
            )}

            {hasGithub && (
              <button
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  {/* GitHub Icon SVG */}
                </svg>
                <span className="ml-2">Sign in with GitHub</span>
              </button>
            )}

            {hasCredentials && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credentials Form */}
        {hasCredentials && (
          <form onSubmit={handleCredentialsSignIn} className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Nur OAuth, keine Credentials */}
        {!hasCredentials && hasMultiple && (
          <p className="text-center text-sm text-gray-600">Choose a provider above to sign in</p>
        )}
      </div>
    </div>
  );
}

/**
 * Hinweise:
 *
 * 1. Ersetze die Placeholder-SVG Icons mit echten Google/GitHub Icons
 * 2. Passe die Styling-Klassen an dein Design an
 * 3. Nutze deine UI-Komponenten-Bibliothek (Button, Input, etc.)
 * 4. Handlere Error-States und Loading-States
 * 5. Redirect nach erfolgreicher Authentifizierung
 *
 * Beispiel mit UI-Components:
 *
 * import { Button } from '@/components/ui/Button';
 * import { Input } from '@/components/ui/Input';
 * import { Card } from '@/components/ui/Card';
 *
 * export function SignInPage() {
 *   return (
 *     <Card>
 *       <h1>Sign In</h1>
 *       {hasGoogle && (
 *         <Button onClick={() => signIn('google')}>
 *           Google
 *         </Button>
 *       )}
 *     </Card>
 *   );
 * }
 */
