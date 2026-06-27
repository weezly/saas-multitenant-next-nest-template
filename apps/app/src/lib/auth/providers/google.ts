/**
 * Google OAuth Provider
 *
 * Authentifiziert Nutzer mit Google OAuth 2.0
 * Benötigt: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
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
