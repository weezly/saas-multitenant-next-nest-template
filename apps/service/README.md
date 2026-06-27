# NestJS Service

NestJS Backend Service mit modularer Struktur und Prisma ORM Integration.

## Setup

```bash
pnpm install
pnpm dev
```

Die Service läuft auf `http://localhost:3001`

## Struktur

- `src/modules` - Feature Module (z.B. Users, Projects)
- `src/common` - Guards, Interceptors, Decorators
- `src/config` - Konfigurationen
- `src/prisma` - Prisma Service & Module
- `prisma/` - Prisma ORM Schema und Migrationen

## Features

- ✅ NestJS Framework
- ✅ CORS aktiviert
- ✅ Validation Pipe
- ✅ Tenant Guard für Multi-Tenancy
- ✅ Response Interceptor
- ✅ Prisma ORM Integration
- ✅ Multi-Tenant Datenmodell

## 🚀 Prisma Setup

Siehe [PRISMA.md](./PRISMA.md) für vollständige Dokumentation.

### Quick Start

1. **Database URL setzen**

   ```bash
   cp .env.example .env.local
   ```

   Konfiguriere deine PostgreSQL Connection in `.env.local`:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
   ```

2. **Erste Migration erstellen**

   ```bash
   pnpm exec prisma migrate dev --name init
   ```

   Dies erstellt:
   - Alle Tabellen in der Datenbank
   - Prisma Client Types
   - Eine Migration Datei

3. **Datenbank Schema anzeigen**

   ```bash
   pnpm exec prisma studio
   ```

   Öffnet eine Web UI für die Datenbank.

## 📊 Datenmodell

Das Prisma Schema definiert folgende Modelle:

- **User** - Benutzer (Multi-Provider Support)
- **Tenant** - Organization/Workspace
- **Membership** - User ↔ Tenant Beziehung mit Role
- **Role** - Permissions pro Tenant (JSON)
- **Project** - Projekte unter einem Tenant

Siehe `prisma/schema.prisma` für Details.

## 🔐 Multi-Tenancy

### TenantGuard

Schützt Endpoints und benötigt `x-tenant-id` Header:

```typescript
@UseGuards(TenantGuard)
@Get()
getData(@TenantId() tenantId: string) {
  // ...
}
```

### Permission Check

UserService bietet `hasPermission` Helper:

```typescript
const canCreate = await userService.hasPermission(userId, tenantId, 'projects', 'create');
```

## Environment Variablen

```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
```

## Module erstellen

```bash
# Mit NestJS CLI
nest g mo modules/feature-name      # Module
nest g co modules/feature-name      # Controller
nest g s modules/feature-name       # Service

# Dann Module in app.module.ts importieren
```

## Testing

```bash
pnpm test              # Run tests
pnpm test:watch        # Watch mode
pnpm test:cov          # Coverage report
```

## Production

```bash
pnpm build             # Bauen
node dist/main         # Starten
```

## Helpful Commands

```bash
# Prisma
pnpm exec prisma migrate dev --name <name>    # Create migration
pnpm exec prisma migrate deploy                # Apply migrations
pnpm exec prisma db seed                       # Run seed script
pnpm exec prisma studio                        # Web UI

# NestJS
nest g <schematic> <name>     # Schematics erstellen
pnpm lint                     # ESLint
pnpm format                   # Prettier
pnpm type-check               # TypeScript
```

## Weitere Dokumentation

- [Prisma Setup Guide](./PRISMA.md)
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
