# Copilot Instructions für SaaS Monorepo

## Projekt-Übersicht

Dies ist ein Multi-Tenant SaaS Template mit pnpm Workspaces, bestehend aus:
- **Next.js Frontend** (`/apps/app`) - App Router, TailwindCSS
- **NestJS Backend** (`/apps/service`) - Modulare Architektur, Prisma-Vorbereitung
- **Shared Package** (`/packages/shared`) - Types und Utils

## Wichtige Befehle

```bash
pnpm install          # Dependencies installieren
pnpm dev              # Alle Apps parallel starten
pnpm build            # Build für Produktion
pnpm lint             # ESLint Check
pnpm format           # Code formatieren
pnpm type-check       # TypeScript Check
```

## Projekt-Struktur

```
apps/
  app/                # Next.js Frontend
    src/
      app/            # App Router Pages
      components/     # React Components
      lib/            # Utils, Auth Config
      styles/         # CSS, TailwindCSS
  service/            # NestJS Backend
    src/
      modules/        # Feature Modules
      common/         # Guards, Interceptors, Decorators
      config/         # Configuration
    prisma/           # Prisma ORM

packages/
  shared/             # Types und Utils
    src/
      types.ts        # Common Types
      utils.ts        # Utility Functions
```

## Entwicklungs-Richtlinien

### TypeScript
- Strict Mode ist aktiviert
- Path Aliases: `@/*` (app), `@service/*` (service), `@shared/*` (shared)

### Styling
- TailwindCSS für Styling
- Gemeinsame Prettier & ESLint Config

### Multi-Tenancy
- Backend: `TenantGuard` und `TenantId` Decorator verfügbar
- Header: `x-tenant-id` erforderlich

### Module erstellen (NestJS)
```bash
cd apps/service
nest g mo modules/feature-name
nest g co modules/feature-name
nest g s modules/feature-name
```

## Wichtige Dateien

- `pnpm-workspace.yaml` - Workspace Konfiguration
- `tsconfig.json` - Root TypeScript Config
- `.eslintrc.json` - ESLint Rules
- `.prettierrc.json` - Code Formatting

## Testing

```bash
pnpm --filter=saas-service test
pnpm --filter=saas-service test:watch
```

## Production Build

```bash
pnpm build      # Baut alle Apps
pnpm start      # Startet die Produktion (Next.js)
```

## Häufige Aufgaben

### Neue Dependencies hinzufügen
```bash
# Im Package-Root
pnpm add next@latest --filter=saas-app
pnpm add express --filter=saas-service
```

### Prisma Setup (Backend)
```bash
cd apps/service
npx prisma init
# Schema definieren
npx prisma migrate dev --name init
```

### NextAuth Integration (Frontend)
Siehe `apps/app/src/lib/auth.ts`

## Umgebungsvariablen

- Frontend: `.env.local` in `/apps/app`
- Backend: `.env.local` in `/apps/service`
- Siehe `.env.example` Dateien für Template

## Weitere Dokumentation

- [Frontend README](./apps/app/README.md)
- [Backend README](./apps/service/README.md)
- [Shared Package README](./packages/shared/README.md)
- [Root README](./README.md)

---

**Version:** 0.1.0  
**Created:** 2026-06-26
