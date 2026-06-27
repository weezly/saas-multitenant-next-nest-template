# 🔐 Dynamic Authentication Provider System

Dieses System ermöglicht die **dynamische Konfiguration** von Authentifizierungs-Providern via Umgebungsvariablen ohne Code-Änderungen.

---

## 🚀 Quick Start

### 1. Provider aktivieren

```bash
# .env.local
AUTH_PROVIDERS=credentials,google,github
```

Nur diese Provider werden zur Laufzeit geladen.

### 2. OAuth Credentials eintragen

```bash
# Google
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# GitHub
GITHUB_CLIENT_ID=Ov23liXxx
GITHUB_CLIENT_SECRET=xxx
```

### 3. App starten

```bash
pnpm dev
```

Nur die konfigurierten Provider erscheinen auf der Login-Seite! 🎉

---

## 📋 Unterstützte Provider

| Provider | ENV-Name | Anforderung | Optional |
|----------|----------|------------|----------|
| **Credentials** | `credentials` | ✅ Default (keine Config) | - |
| **Google** | `google` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ |
| **GitHub** | `github` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | ✅ |
| **Microsoft** | `microsoft` | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT` | ✅ Vorbereitet |

---

## ⚙️ Konfiguration

### ENV-Variable: `AUTH_PROVIDERS`

**Syntax:** Komma-separierte Liste (keine Leerzeichen nach Komma!)

```bash
# Alle Provider
AUTH_PROVIDERS=credentials,google,github,microsoft

# Nur Email + Google
AUTH_PROVIDERS=credentials,google

# Nur Email (default)
AUTH_PROVIDERS=credentials
```

**Verhalten:**
- Provider in der Liste → werden geladen & auf Login-Seite angeboten
- Provider nicht in der Liste → ignoriert
- Ungültige Einträge → Warnung in Logs, wird übersprungen

---

## 🔧 Provider Setup

### 1️⃣ Credentials (Email + Passwort)

**Keine zusätzliche Konfiguration erforderlich!**

```bash
AUTH_PROVIDERS=credentials
```

Authentifiziert über Backend API:
```
POST /api/auth/login
{ "email": "user@example.com", "password": "..." }
```

---

### 2️⃣ Google OAuth

#### Setup:

1. **Gehe zu:** https://console.cloud.google.com
2. **Erstelle Projekt** (falls nicht vorhanden)
3. **Aktiviere:** Google+ API
4. **Erstelle:** OAuth 2.0 Client ID (Web Application)
5. **Setze Redirect URI:**
   ```
   http://localhost:3000/api/auth/callback/google
   Production: https://yourdomain.com/api/auth/callback/google
   ```
6. **Kopiere:** Client ID & Secret

#### Konfiguration:

```bash
# .env.local
AUTH_PROVIDERS=credentials,google
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx
```

---

### 3️⃣ GitHub OAuth

#### Setup:

1. **Gehe zu:** https://github.com/settings/developers
2. **Klick:** "New OAuth App"
3. **Fülle Formular:**
   - Application name: "My SaaS"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. **Kopiere:** Client ID & Secret (regenerieren falls nötig)

#### Konfiguration:

```bash
# .env.local
AUTH_PROVIDERS=credentials,github
GITHUB_CLIENT_ID=Ov23liXxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxx
```

---

### 4️⃣ Microsoft Azure AD

#### Setup:

1. **Gehe zu:** https://portal.azure.com
2. **Gehe zu:** Azure Active Directory → App registrations
3. **Klick:** "New registration"
4. **Konfiguriere:**
   - Name: "My SaaS"
   - Supported account types: "Accounts in this organizational directory only"
5. **Setze Redirect URI:**
   ```
   Web: http://localhost:3000/api/auth/callback/microsoft
   ```
6. **Gehe zu:** Certificates & secrets
7. **Erstelle:** Client secret (kopiere Value)

#### Konfiguration:

```bash
# .env.local
AUTH_PROVIDERS=credentials,google,github,microsoft
MICROSOFT_CLIENT_ID=12345678-1234-1234-1234-123456789012
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxx
MICROSOFT_TENANT=common  # oder spezifische Tenant ID
```

---

## 🔍 Debugging

### Provider Status anschauen

```bash
# In der App nach dem Starten:
# Siehe Konsolen-Output:
# [Auth] Provider Status:
#   Enabled: 2 of 3
#   ✓ credentials
#   ✓ google
#   ✗ github (Missing environment variables)
```

### Helper-Funktionen

```typescript
import { 
  isProviderEnabled, 
  getEnabledProviderNames 
} from '@/lib/auth/providers';

// Prüfe, ob Provider aktiv ist
if (isProviderEnabled('google')) {
  // Google-Button anzeigen
}

// Hole alle aktiven Provider
const enabledProviders = getEnabledProviderNames(); // ['credentials', 'google']
```

---

## 🎨 Frontend Integration

### Login-Seite mit dynamischen Providern

```typescript
// apps/app/src/app/auth/signin/page.tsx
import { getEnabledProviderNames } from '@/lib/auth/providers';
import { signIn } from 'next-auth/react';

export default function SignInPage() {
  const enabledProviders = getEnabledProviderNames();

  return (
    <div>
      {enabledProviders.includes('credentials') && (
        <form onSubmit={(e) => {
          e.preventDefault();
          signIn('credentials', {
            email: 'user@example.com',
            password: 'password',
          });
        }}>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button>Login</button>
        </form>
      )}

      {enabledProviders.includes('google') && (
        <button onClick={() => signIn('google')}>
          Sign in with Google
        </button>
      )}

      {enabledProviders.includes('github') && (
        <button onClick={() => signIn('github')}>
          Sign in with GitHub
        </button>
      )}
    </div>
  );
}
```

---

## 📁 Dateistruktur

```
apps/app/src/lib/auth/
├── auth.config.ts           # Zentrale NextAuth Config (nutzt Provider Factory)
├── auth.ts                  # Helper (permissions, tenants)
├── auth.types.ts            # TypeScript Typen
└── providers/
    ├── index.ts             # Provider Factory & loadProviders()
    ├── credentials.ts       # Credentials Provider
    ├── google.ts            # Google OAuth Provider
    ├── github.ts            # GitHub OAuth Provider
    └── microsoft.ts         # Microsoft Azure AD Provider (vorbereitet)
```

---

## 🧪 Testing

### Lokales Testing mit verschiedenen Konfigurationen

```bash
# Nur Credentials
AUTH_PROVIDERS=credentials pnpm dev

# Credentials + Google
AUTH_PROVIDERS=credentials,google pnpm dev

# Alle außer Microsoft
AUTH_PROVIDERS=credentials,google,github pnpm dev

# Alle
AUTH_PROVIDERS=credentials,google,github,microsoft pnpm dev
```

### Testen ohne echte OAuth Credentials

1. Setze `AUTH_PROVIDERS=credentials`
2. Verwende Credentials Login für Testing
3. Füge OAuth Provider einzeln hinzu, wenn konfiguriert

---

## 🔒 Sicherheit

### Best Practices:

1. **Secrets in Umgebungsvariablen**
   - Speichere nie Secrets in `.env.local`
   - Nutze `.env.production` für Production
   - In CI/CD: Secrets Manager verwenden (GitHub Secrets, AWS Secrets Manager, etc.)

2. **NEXTAUTH_SECRET**
   - Muss für Produktion gesetzt sein!
   - Generiere mit: `openssl rand -base64 32`
   - Mindestens 32 Zeichen

3. **NEXTAUTH_URL**
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

4. **OAuth Redirect URIs**
   - Exakt mit Provider konfigurieren
   - In Production: nur HTTPS URLs

---

## 📚 Ressourcen

- **NextAuth.js Docs:** https://next-auth.js.org
- **NextAuth v5 (Beta):** https://authjs.dev
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2
- **GitHub OAuth:** https://docs.github.com/en/apps/oauth-apps
- **Microsoft Azure AD:** https://learn.microsoft.com/en-us/entra/identity-platform/

---

## ⚠️ Häufige Probleme

### Problem: Provider lädt nicht

```
✗ google (Missing environment variables)
```

**Lösung:**
```bash
# Prüfe ENV-Variablen
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Sollte Werte zeigen, nicht leer sein!
```

### Problem: OAuth Callback schlägt fehl

```
Error: Callback URL mismatch
```

**Lösung:**
1. Prüfe in Provider-Settings (Google/GitHub/etc.) die Redirect URI
2. Muss exakt mit `http://localhost:3000/api/auth/callback/[provider]` übereinstimmen
3. In Production: Nutze domain.com statt localhost

### Problem: NEXTAUTH_SECRET nicht gesetzt

```
Error: [next-auth] 'NEXTAUTH_SECRET' env variable is required
```

**Lösung:**
```bash
# Generiere Secret
openssl rand -base64 32
# Setze in .env.local
NEXTAUTH_SECRET=generated_secret_here
```

---

## 🚀 Deployment

### Docker

```bash
# docker-compose.yml
services:
  app:
    environment:
      AUTH_PROVIDERS: credentials,google,github
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      NEXTAUTH_URL: https://yourdomain.com
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
env:
  AUTH_PROVIDERS: ${{ secrets.AUTH_PROVIDERS }}
  GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
  GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
  # ... etc
```

---

## 💡 Weitere Features

### Zukünftige Provider

Das System ist erweiterbar! Um einen neuen Provider hinzuzufügen:

1. Erstelle `apps/app/src/lib/auth/providers/[provider].ts`
2. Exportiere Provider-Konfiguration
3. Registriere in `apps/app/src/lib/auth/providers/index.ts` `AVAILABLE_PROVIDERS`
4. Dokumentiere Setup
5. Fertig! 🎉

---

**Version:** 1.0.0  
**Updated:** 2026-06-27
