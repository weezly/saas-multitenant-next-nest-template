# Next.js App

Next.js Frontend Application mit App Router, TailwindCSS und NextAuth Integration für Multi-Tenant Switching.

## Setup

```bash
pnpm install
pnpm dev
```

Die App läuft auf `http://localhost:3000`

## Struktur

- `src/app` - Next.js App Router Pages
- `src/components` - React Komponenten (inkl. TenantSwitcher)
- `src/lib` - Utility Funktionen und Auth Konfiguration
- `src/styles` - CSS und TailwindCSS
- `src/hooks` - Custom Hooks (useTenant, etc.)
- `src/context` - React Context (TenantContext)
- `public` - Statische Assets

## 🔐 NextAuth Integration

### Quick Start

1. **Environment Variablen setzen**

   ```bash
   cp .env.example .env.local
   ```

   Konfiguriere in `.env.local`:

   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

   Generate Secret:

   ```bash
   openssl rand -base64 32
   ```

2. **NextAuth ist vorkonfiguriert**

   - Provider: Credentials, Google, GitHub
   - JWT Strategy mit `activeTenantId`
   - Session Handler im RootLayout

### Verwendung

```typescript
import { useSession, signIn, signOut } from 'next-auth/react';

export function Component() {
  const { data: session } = useSession();

  return (
    <div>
      {session?.user?.name}
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

## 🏢 Multi-Tenant Switching

Siehe [TENANT_SWITCHING.md](./TENANT_SWITCHING.md) für vollständige Dokumentation.

### Quick Usage

```typescript
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { useTenantContext } from '@/context/TenantContext';

export function Header() {
  const { activeTenantId } = useTenantContext();

  return (
    <nav>
      <TenantSwitcher />
      <p>Current Tenant: {activeTenantId}</p>
    </nav>
  );
}
```

## 🎨 Styling

TailwindCSS ist bereits konfiguriert. Siehe `tailwind.config.ts`

```typescript
import { TenantSwitcher } from '@/components/TenantSwitcher';

// Komponenten verwenden bereits TailwindCSS Klassen
```

## 📦 Dependencies

- `next` - Framework
- `next-auth` - Authentication & Tenant Switching
- `react` - UI Library
- `tailwindcss` - CSS Framework
- `@saas/shared` - Types und Utils

## Konfiguration

### TailwindCSS

Konfiguration: `tailwind.config.ts`

```bash
pnpm dev
```

### NextAuth

Konfiguration: `src/lib/auth.config.ts`

- JWT Strategy
- Credentials, Google, GitHub Provider
- Tenant-Kontext im JWT

### Environment Variablen

```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

## 🧰 Build & Deployment

```bash
# Build
pnpm build

# Start production
pnpm start

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format
```

## 📚 Weitere Dokumentation

- [Tenant Switching Guide](./TENANT_SWITCHING.md)
- [NextAuth Docs](https://next-auth.js.org/)
- [Root README](../../README.md)
