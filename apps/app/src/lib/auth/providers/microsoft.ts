/**
 * Microsoft Azure AD OAuth Provider (vorbereitet)
 *
 * Authentifiziert Nutzer mit Microsoft Azure AD
 * Benötigt: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT
 *
 * Optional: https://learn.microsoft.com/en-us/entra/identity-platform/
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
