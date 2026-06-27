# SaaS Multi-Tenant Monorepo

Vollständiges Template für ein skalierbares SaaS-System mit Next.js Frontend und NestJS Backend in einem Monorepo.

## 🏗️ Struktur

```
/apps
  /app          → Next.js Frontend (App Router, TailwindCSS)
  /service      → NestJS Backend (modulare Struktur)

/packages
  /shared       → Gemeinsame Types und Utils
```

## 🛠️ Tech Stack

- **Monorepo Management**: pnpm Workspaces
- **Frontend**: Next.js 14+ mit App Router
- **Backend**: NestJS mit modularer Architektur
- **Styling**: TailwindCSS
- **Database**: Prisma (vorbereitet)
- **Auth**: NextAuth (vorbereitet)
- **Language**: TypeScript (strict mode)
- **Code Quality**: ESLint + Prettier

## 🚀 Quick Start

### 1. Abhängigkeiten installieren

```bash
pnpm install
```

### 2. Development Server starten

```bash
# Terminal 1: Backend
cd apps/service
pnpm dev

# Terminal 2: Frontend
cd apps/app
pnpm dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

### 3. Workspace-weite Commands

```bash
pnpm dev          # Alle Apps parallel starten
pnpm build        # Alle Apps bauen
pnpm lint         # Alle Apps linten
pnpm format       # Code formatieren
pnpm type-check   # TypeScript Check
```

## 📁 App-spezifische Dokumentation

- [Frontend Setup](./apps/app/README.md)
- [Backend Setup](./apps/service/README.md)
- [Shared Package](./packages/shared/README.md)

## 🔧 Konfiguration

### ESLint

Zentrale Konfiguration: [`.eslintrc.json`](.eslintrc.json)

```bash
pnpm lint
```

### Prettier

Zentrale Konfiguration: [`.prettierrc.json`](.prettierrc.json)

```bash
pnpm format
```

### TypeScript

Zentrale Konfiguration: [`tsconfig.json`](tsconfig.json)

```bash
pnpm type-check
```

## 🔐 Environment Variablen

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend (.env.local)

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
```

## 📦 Shared Package verwenden

```typescript
import { User, ApiResponse } from '@saas/shared';
import { generateSlug, isValidEmail } from '@saas/shared/utils';
```

## 🗂️ Best Practices

### Monorepo Navigation

```bash
# Spezifisches Package bauen
pnpm --filter=@saas/shared build

# Spezifisches Package in App starten
pnpm --filter=saas-app dev
```

### Module in NestJS erstellen

```bash
cd apps/service
nest g mo modules/users
nest g co modules/users
nest g s modules/users
```

## 📊 Datenbank & Prisma

Das Projekt nutzt Prisma ORM mit vollständigem Multi-Tenant Datenmodell.

### Modelle

- **User** - Globale Benutzer (Multi-Provider)
- **Tenant** - Organizations/Workspaces
- **Membership** - User ↔ Tenant Beziehung mit Role
- **Role** - Permissions pro Tenant (JSON-basiert, flexibel)
- **Project** - Projekte unter Tenants

### Setup

```bash
# 1. Database URL in .env.local setzen
cp apps/service/.env.example apps/service/.env.local

# 2. Erste Migration erstellen
cd apps/service
pnpm exec prisma migrate dev --name init

# 3. Optionel: Seed Daten hinzufügen
pnpm prisma:seed

# 4. Studio öffnen (Web UI)
pnpm exec prisma studio
```

### Dokumentation

- [Prisma Schema Details](./PRISMA_SCHEMA.md) - Vollständige Schema Dokumentation
- [Backend Setup Guide](./apps/service/PRISMA.md) - Prisma Integration Guide

## 🔐 Multi-Tenancy Features

### User Management

- Ein User kann in mehreren Tenants Mitglied sein
- Jede Membership hat eine spezifische Role
- Rollen sind pro Tenant individuell definierbar

### Tenant Switching (Frontend)

NextAuth Integration mit automatischem Tenant Switching:

```typescript
import { TenantSwitcher } from '@/components/TenantSwitcher';
import { useTenantContext } from '@/context/TenantContext';

// Im Header
<TenantSwitcher />

// In Komponenten
const { activeTenantId, switchTenant } = useTenantContext();
```

Setup:

```bash
cd apps/app
cp .env.example .env.local
# Konfiguriere: NEXTAUTH_SECRET, NEXTAUTH_URL
pnpm install
pnpm dev
```

Siehe [Tenant Switching Dokumentation](./apps/app/TENANT_SWITCHING.md)

### Permissions System

Flexibles JSON-basiertes Permissions System:

```typescript
interface Permissions {
  projects?: ('create' | 'read' | 'update' | 'delete')[];
  users?: ('create' | 'read' | 'update' | 'delete')[];
  roles?: ('create' | 'read' | 'update' | 'delete')[];
  members?: ('create' | 'read' | 'update' | 'delete')[];
  settings?: ('create' | 'read' | 'update' | 'delete')[];
}
```

### Beispiel Rollen

```json
{
  "Owner": {
    "projects": ["create", "read", "update", "delete"],
    "users": ["create", "read", "update", "delete"]
  },
  "Admin": {
    "projects": ["read", "update"],
    "users": ["read"]
  },
  "Member": {
    "projects": ["read"]
  }
}
```

---

## 🔐 NextAuth Integration

Vorbereitet in `apps/app/src/lib/auth.ts`

```typescript
import { authConfig } from '@/lib/auth';
```

## 📊 Prisma Setup

1. Schema definieren in `apps/service/prisma/schema.prisma`
2. Migration erstellen: `pnpm exec prisma migrate dev --name init`
3. Prisma Client in Services verwenden

## 🧪 Testing

```bash
# Backend Tests
pnpm --filter=saas-service test

# Watch Mode
pnpm --filter=saas-service test:watch
```

## 📝 Lizenz

MIT

## 🤝 Contributing

Alle Apps und Packages folgen demselben ESLint und Prettier Setup.

---

**Ready to build your SaaS! 🎉**
