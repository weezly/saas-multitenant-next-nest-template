/**
 * GitHub OAuth Provider
 *
 * Authentifiziert Nutzer mit GitHub OAuth 2.0
 * Benötigt: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
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
