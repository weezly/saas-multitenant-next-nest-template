# Prisma ORM Setup

Vollständiges Multi-Tenant SaaS Datenmodell mit Prisma.

## 📦 Installation

Abhängigkeiten sind bereits im `package.json` konfiguriert:

- `@prisma/client` - Prisma Client
- `prisma` - CLI Tool

```bash
pnpm install
```

## 🔧 Konfiguration

### 1. Database URL setzen

Erstelle `.env.local` Datei:

```bash
cp .env.example .env.local
```

Konfiguriere deine PostgreSQL Connection:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/saas_db
```

### 2. Erste Migration erstellen

```bash
pnpm exec prisma migrate dev --name init
```

Dies wird:

- Das Schema zur Datenbank pushen
- Prisma Client generieren
- Eine `prisma/migrations` Datei erstellen

## 📊 Datenmodell

### Modelle

#### **User**

- Ein User kann in mehreren Tenants Mitglied sein
- Provider Support (credentials, Google, GitHub, etc.)

```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed_password',
    provider: 'credentials',
  },
});
```

#### **Tenant**

- Multi-Tenant Container
- User sind über Memberships verbunden

```typescript
const tenant = await prisma.tenant.create({
  data: {
    name: 'Acme Corp',
    slug: 'acme-corp',
  },
});
```

#### **Membership** (Many-to-Many)

- Verbindet User mit Tenants
- Jede Membership hat genau eine Role
- @@unique([userId, tenantId]) - verhindert Duplikate

```typescript
const membership = await prisma.membership.create({
  data: {
    userId: 'user_id',
    tenantId: 'tenant_id',
    roleId: 'role_id',
  },
});
```

#### **Role**

- Pro Tenant individuell definierbar (NICHT global!)
- Permissions als JSON
- @@unique([tenantId, name])

```typescript
const role = await prisma.role.create({
  data: {
    name: 'Editor',
    tenantId: 'tenant_id',
    permissions: {
      projects: ['create', 'read', 'update', 'delete'],
      users: ['read', 'update'],
      roles: ['read'],
    },
  },
});
```

#### **Project**

- Gehört zu einem Tenant
- @@unique([tenantId, name])

```typescript
const project = await prisma.project.create({
  data: {
    name: 'My Project',
    tenantId: 'tenant_id',
  },
});
```

## 🔐 Permissions System

Permissions sind als JSON gespeichert.

### Struktur

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
    "users": ["create", "read", "update", "delete"],
    "roles": ["create", "read", "update", "delete"],
    "members": ["create", "read", "update", "delete"],
    "settings": ["create", "read", "update", "delete"]
  },
  "Admin": {
    "projects": ["create", "read", "update", "delete"],
    "users": ["read"],
    "roles": ["read"],
    "members": ["read", "update"]
  },
  "Member": {
    "projects": ["read"],
    "users": ["read"]
  },
  "Viewer": {
    "projects": ["read"]
  }
}
```

## 🔗 Häufige Queries

### User mit all seinen Tenants laden

```typescript
const user = await prisma.user.findUnique({
  where: { id: 'user_id' },
  include: {
    memberships: {
      include: {
        tenant: true,
        role: true,
      },
    },
  },
});
```

### Alle Members eines Tenants

```typescript
const members = await prisma.membership.findMany({
  where: { tenantId: 'tenant_id' },
  include: {
    user: true,
    role: true,
  },
});
```

### Role mit Permissions

```typescript
const role = await prisma.role.findUnique({
  where: { id: 'role_id' },
});

// Permissions Zugriff
const permissions = role.permissions as Permissions;
const canCreateProjects = permissions.projects?.includes('create');
```

### Alle Projekte eines Tenants

```typescript
const projects = await prisma.project.findMany({
  where: { tenantId: 'tenant_id' },
  orderBy: { createdAt: 'desc' },
});
```

## 🛠️ Prisma Commands

```bash
# Migration erstellen
pnpm exec prisma migrate dev --name <name>

# Migration produktion pushen
pnpm exec prisma migrate deploy

# Datenbank zurücksetzen (Vorsicht!)
pnpm exec prisma migrate reset

# Prisma Studio öffnen (Web UI)
pnpm exec prisma studio

# Seed Daten hinzufügen
pnpm exec prisma db seed

# Type Generation
pnpm exec prisma generate
```

## 📝 Seed Script

Erstelle `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Test Tenant',
      slug: 'test-tenant',
    },
  });

  // Create roles
  const ownerRole = await prisma.role.create({
    data: {
      name: 'Owner',
      tenantId: tenant.id,
      permissions: {
        projects: ['create', 'read', 'update', 'delete'],
        users: ['create', 'read', 'update', 'delete'],
      },
    },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: 'hashed_password',
    },
  });

  // Create membership
  await prisma.membership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      roleId: ownerRole.id,
    },
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Füge in `package.json` ein:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Führe aus:

```bash
pnpm exec prisma db seed
```

## 🔄 Relationen & Cascading

Die Schema ist so konfiguriert:

- **User ← (Cascade) → Membership** - Löschen eines Users löscht alle seine Memberships
- **Tenant ← (Cascade) → Membership** - Löschen eines Tenants löscht alle Memberships
- **Membership → Role (Restrict)** - Role kann nicht gelöscht werden, wenn Memberships sie nutzen
- **Tenant ← (Cascade) → Role** - Löschen eines Tenants löscht alle Roles
- **Tenant ← (Cascade) → Project** - Löschen eines Tenants löscht alle Projekte

## 📚 Weitere Ressourcen

- [Prisma Docs](https://www.prisma.io/docs/)
- [Prisma Relations](https://www.prisma.io/docs/concepts/relations)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
