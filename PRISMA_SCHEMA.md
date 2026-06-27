# Prisma Multi-Tenant SaaS Schema

Vollständiges Datenmodell für ein skalierbares Multi-Tenant SaaS System.

## 🎯 Schema Übersicht

```
┌─────────────┐
│    User     │ (Eindeutig per Email)
│  (Global)   │
└──────┬──────┘
       │
       │ (viele zu viele)
       │
┌──────▼──────────────────┐
│    Membership           │
│  (userId, tenantId)     │ @@unique
└──────┬──────────────────┘
       │
       ├─► Tenant (gehört zu genau einem)
       │
       └─► Role (gehört zu genau einem)
                 │
                 └─► Permissions (JSON)

┌─────────────┐
│   Tenant    │
│ (Ein Org)   │
└──────┬──────┘
       │
       ├─► Membership[] (Benutzer in Tenant)
       ├─► Role[] (Rollen pro Tenant!)
       └─► Project[] (Projekte)
```

## 📊 Modelle

### User

Globale Benutzer, können in mehreren Tenants existieren.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?  // Optional für OAuth
  name      String?
  provider  String   @default("credentials")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  memberships Membership[]
}
```

**Besonderheiten:**
- Email ist global unique
- Password ist optional (für Google/GitHub OAuth)
- Provider Feld für Auth Strategie

### Tenant

Organisationen/Workspaces im System.

```prisma
model Tenant {
  id        String @id @default(cuid())
  name      String
  slug      String @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  memberships Membership[]
  roles       Role[]
  projects    Project[]
}
```

**Besonderheiten:**
- Slug für URL (unique)
- Hat mehrere Roles (pro Tenant individuell!)
- Hat mehrere Memberships

### Membership

Many-to-Many Beziehung zwischen User und Tenant mit zusätzlicher Role.

```prisma
model Membership {
  id       String @id @default(cuid())
  userId   String
  tenantId String
  roleId   String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Restrict)
  
  @@unique([userId, tenantId])  // Ein User nur einmal pro Tenant!
}
```

**Wichtig:**
- `@@unique([userId, tenantId])` - Verhindert doppelte Memberships
- Löschen von User/Tenant führt zu Cascade Delete
- Löschen von Role ist nicht möglich wenn Memberships existieren (Restrict)

### Role

Rollen pro Tenant mit flexiblen Permissions als JSON.

```prisma
model Role {
  id        String   @id @default(cuid())
  name      String   // "Owner", "Admin", "Member", etc.
  tenantId  String
  permissions Json  @default("{}")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  memberships Membership[]
  
  @@unique([tenantId, name])  // Rollenname pro Tenant eindeutig!
}
```

**Wichtig:**
- Rollen sind **pro Tenant**, nicht global!
- `@@unique([tenantId, name])` - Ein Rollenmäne nur einmal pro Tenant
- Permissions sind flexibel als JSON

### Project

Projekte gehören zu einem Tenant.

```prisma
model Project {
  id    String @id @default(cuid())
  name  String
  description String?
  tenantId String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, name])
}
```

## 🔐 Permissions System

Permissions sind JSON und extrem flexibel.

### Standard Struktur

```typescript
interface Permissions {
  projects?: ('create' | 'read' | 'update' | 'delete')[];
  users?: ('create' | 'read' | 'update' | 'delete')[];
  roles?: ('create' | 'read' | 'update' | 'delete')[];
  members?: ('create' | 'read' | 'update' | 'delete')[];
  settings?: ('create' | 'read' | 'update' | 'delete')[];
}
```

### Beispiel Rollen-Konfigurationen

#### Owner (Full Access)
```json
{
  "projects": ["create", "read", "update", "delete"],
  "users": ["create", "read", "update", "delete"],
  "roles": ["create", "read", "update", "delete"],
  "members": ["create", "read", "update", "delete"],
  "settings": ["create", "read", "update", "delete"]
}
```

#### Admin (No Role/Settings Change)
```json
{
  "projects": ["create", "read", "update", "delete"],
  "users": ["read", "update"],
  "roles": ["read"],
  "members": ["read", "update"],
  "settings": ["read", "update"]
}
```

#### Member (Read Only + Some Update)
```json
{
  "projects": ["read"],
  "users": ["read"],
  "members": ["read"]
}
```

#### Viewer (Read Only)
```json
{
  "projects": ["read"]
}
```

## 🛠️ Häufige Queries

### User mit allen Tenants und Rollen laden

```typescript
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    memberships: {
      include: {
        tenant: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    },
  },
});

// Access:
user.memberships.forEach(m => {
  console.log(`User ist ${m.role.name} in Tenant ${m.tenant.name}`);
  console.log(`Permissions:`, m.role.permissions);
});
```

### Alle Members eines Tenants

```typescript
const members = await prisma.membership.findMany({
  where: { tenantId: 'tenant-id' },
  include: {
    user: {
      select: { id: true, email: true, name: true },
    },
    role: {
      select: { name: true, permissions: true },
    },
  },
  orderBy: { createdAt: 'desc' },
});
```

### User zu Tenant mit neuer Role hinzufügen

```typescript
const membership = await prisma.membership.create({
  data: {
    userId: 'user-id',
    tenantId: 'tenant-id',
    roleId: 'role-id', // Admin Role z.B.
  },
  include: {
    user: true,
    tenant: true,
    role: true,
  },
});
```

### Role einer Membership ändern

```typescript
const updated = await prisma.membership.update({
  where: {
    userId_tenantId: {
      userId: 'user-id',
      tenantId: 'tenant-id',
    },
  },
  data: {
    roleId: 'new-role-id',
  },
  include: {
    role: true,
  },
});
```

### Permission Check

```typescript
const membership = await prisma.membership.findUnique({
  where: {
    userId_tenantId: {
      userId: 'user-id',
      tenantId: 'tenant-id',
    },
  },
  include: {
    role: {
      select: { permissions: true },
    },
  },
});

if (!membership) throw new Error('User not in Tenant');

const permissions = membership.role.permissions as Record<string, string[]>;
const canCreateProjects = permissions.projects?.includes('create') ?? false;

if (!canCreateProjects) {
  throw new ForbiddenException('No permission to create projects');
}
```

## 🔄 Cascading & Constraints

### Delete Verhalten

- **User → Membership**: CASCADE
  - Wenn User gelöscht → alle seine Memberships weg
  
- **Tenant → Membership**: CASCADE
  - Wenn Tenant gelöscht → alle Memberships weg
  
- **Role → Membership**: RESTRICT
  - Role kann nicht gelöscht werden wenn Memberships existieren
  - Muss erst Memberships löschen
  
- **Tenant → Role**: CASCADE
  - Wenn Tenant gelöscht → alle Roles weg (und Memberships durch CASCADE)
  
- **Tenant → Project**: CASCADE
  - Wenn Tenant gelöscht → alle Projekte weg

### Unique Constraints

- `User.email` - UNIQUE
  - Ein Email nur einmal im System
  
- `Membership(userId, tenantId)` - UNIQUE
  - User kann nur einmal pro Tenant Mitglied sein
  
- `Tenant.slug` - UNIQUE
  - Slug eindeutig für Subdomains etc.
  
- `Role(tenantId, name)` - UNIQUE
  - Rollenname eindeutig pro Tenant
  
- `Project(tenantId, name)` - UNIQUE
  - Projektname eindeutig pro Tenant

## 🚀 Migration erstellen

```bash
# Neue Migration nach Schema Änderung
pnpm exec prisma migrate dev --name <descriptive-name>

# In Production anwenden
pnpm exec prisma migrate deploy

# Schema ohne Änderung synchronisieren
pnpm exec prisma db push
```

## 📚 Weitere Ressourcen

- [Prisma Relations](https://www.prisma.io/docs/concepts/relations)
- [Prisma Constraints](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma JSON Support](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-json-fields)
