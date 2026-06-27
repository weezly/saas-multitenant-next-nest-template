# API Modules Documentation

## 📁 Module Structure

```
src/modules/
├── tenants/                    # Tenant Management
│   ├── tenants.controller.ts
│   ├── tenants.service.ts
│   ├── tenants.module.ts
│   └── dto/
│       ├── create-tenant.dto.ts
│       └── update-tenant.dto.ts
│
├── projects/                   # Project Management
│   ├── projects.controller.ts
│   ├── projects.service.ts
│   ├── projects.module.ts
│   └── dto/
│       ├── create-project.dto.ts
│       └── update-project.dto.ts
│
├── roles/                      # Role Management (per Tenant)
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   ├── roles.module.ts
│   └── dto/
│       ├── create-role.dto.ts
│       └── update-role.dto.ts
│
└── memberships/                # Tenant Memberships
    ├── memberships.controller.ts
    ├── memberships.service.ts
    ├── memberships.module.ts
    └── dto/
        ├── invite-member.dto.ts
        └── update-membership.dto.ts
```

## 🔐 Security

**Alle Module sind durch folgende Guards geschützt:**

```typescript
@UseGuards(AuthGuard, TenantAccessGuard)
```

- ✅ **AuthGuard**: Validiert JWT Token
- ✅ **TenantAccessGuard**: Prüft Tenant-Membership
- ✅ **TenantAwarePrismaService**: Automatische tenantId-Filterung auf Datenbankebene

**Exceptions bei Zugriffsverletzungen:**

- `UnauthorizedException` - Kein/ungültiger Token
- `ForbiddenException` - Kein Zugriff auf Tenant oder zu wenig Permissions
- `NotFoundException` - Resource nicht found

## 📋 Endpoints

### Tenants Module

```
POST   /api/tenants             # Erstelle Tenant (mit User als Admin)
GET    /api/tenants             # Meine Tenants (all of user's memberships)
GET    /api/tenants/:id         # Tenant Details
PATCH  /api/tenants/:id         # Update Tenant (Admin only)
DELETE /api/tenants/:id         # Delete Tenant (Admin only)
```

**Besonderheiten:**

- Beim Create wird User automatisch Admin + Admin-Role wird erstellt
- GET zeigt nur Tenants bei denen User Mitglied ist
- Update/Delete nur für Admins

### Projects Module

```
POST   /api/projects            # Erstelle Project
GET    /api/projects            # Alle Projects des Tenants
GET    /api/projects/:id        # Project Details
PATCH  /api/projects/:id        # Update (Owner oder Admin)
DELETE /api/projects/:id        # Delete (Owner oder Admin)
```

**Besonderheiten:**

- ✅ Automatisch tenantId-gefiltert (TenantAwarePrismaService)
- Owner kann sein eigenes Project editieren
- Admins können alle Projects editieren
- Filter verfügbar: `?status=active&ownerId=uuid`

### Roles Module

```
POST   /api/roles              # Erstelle Role (Admin only)
GET    /api/roles              # Alle Roles des Tenants
GET    /api/roles/:id          # Role Details + Members
PATCH  /api/roles/:id          # Update Permissions (Admin only)
DELETE /api/roles/:id          # Delete Role (Admin only)
```

**Besonderheiten:**

- Jeder Tenant hat seine eigenen Roles
- Role-Namen müssen einmalig sein (pro Tenant)
- Permissions als JSON: `{ "resource": ["action1", "action2"], "*": ["*"] }`
- Cannot delete role wenn User damit verbunden sind
- Cannot delete 'admin' role

### Memberships Module

```
GET    /api/memberships         # Alle Members des Tenants
GET    /api/memberships/:id     # Member Details
POST   /api/memberships/invite  # Invite neuen Member (Admin only)
PATCH  /api/memberships/:id     # Update Role (Admin only)
DELETE /api/memberships/:id     # Remove Member (Admin only)
```

**Besonderheiten:**

- Invite erstellt User falls nicht existiert
- Cannot remove letzen Admin
- Cannot change eigene Role
- Cannot remove sich selbst

## 🔍 Data Access Layer Integration

Alle Services nutzen **TenantAwarePrismaService** für Multi-Tenant Sicherheit:

### ✅ Saubere Queries (automatisch gefiltert)

```typescript
// Projects Service - automatisch tenantId gefiltert
await this.tenantAwarePrisma.project().findMany();

// Roles Service - automatisch tenantId gefiltert
await this.tenantAwarePrisma.role().findFirst({
  where: { name: data.name },
});

// Memberships Service - automatisch tenantId gefiltert
await this.tenantAwarePrisma.membership().findMany({
  where: { userId },
});
```

### ❌ Was NICHT möglich ist

```typescript
// Direkter Zugriff auf Prisma würde leaken:
await this.prisma.project.findMany();  // ❌ ALLE Projects!

// Service Forces TenantAwarePrismaService:
constructor(
  private readonly tenantAwarePrisma: TenantAwarePrismaService
) {}
```

## 💡 Permission Model

### JSON Permission Structure

```typescript
{
  "project": ["create", "read", "update", "delete"],
  "role": ["create", "read", "update"],
  "membership": ["create", "update", "delete"],
  "*": ["*"]  // Admin: all resources, all actions
}
```

### Default Roles

1. **admin**
   - Permissions: `{ "*": ["*"] }`
   - Kann alles machen
   - Automatisch bei Tenant-Creation

2. **editor** (optional, custom)
   - Permissions: `{ "project": ["*"], "role": ["read"], "membership": ["read"] }`
   - Kann Projects verwalten, Roles/Members nur sehen

3. **viewer** (optional, custom)
   - Permissions: `{ "project": ["read"], "role": ["read"], "membership": ["read"] }`
   - Read-only Zugriff

## 🔗 Service Dependencies

### Tenants Service

- `PrismaService` - direkter Zugriff (User/Tenant sind global)

### Projects Service

- `TenantAwarePrismaService` - automatische tenantId Filterung
- `TenantContextService` - Liest aktuellen Tenant aus Request

### Roles Service

- `TenantAwarePrismaService` - automatische tenantId Filterung
- `TenantContextService` - Liest aktuellen Tenant aus Request

### Memberships Service

- `PrismaService` - für User (global)
- `TenantAwarePrismaService` - für Membership/Role (tenant-aware)
- `TenantContextService` - Liest aktuellen Tenant aus Request

## 📊 Entity Relationships

```
User (global)
  ↓
  └─ Membership (M2M)
      ├─ tenantId → Tenant
      ├─ roleId → Role
      └─ userId → User

Tenant
  ├─ Role (per Tenant)
  │   └─ permissions (JSON)
  ├─ Membership (M2M)
  └─ Project
      ├─ tenantId
      └─ ownerId → User
```

## 🧪 Testing

### Example: Projects Service

```typescript
// Test dass nur Tenant's Projects zurückgegeben werden
const projects = await projectsService.findAll();
expect(projects.every((p) => p.tenantId === currentTenant)).toBe(true);

// Test dass Nicht-Owner nicht editieren kann
expect(() => projectsService.update(projectId, differentUserId, data)).toThrow(
  'You can only edit your own projects'
);
```

### Example: Memberships Service

```typescript
// Test dass Admin nicht sich selbst entfernen kann
expect(() => membershipsService.remove(adminMembershipId, adminUserId)).toThrow(
  'You cannot remove yourself'
);

// Test dass doppel-Invite fehlschlägt
expect(() => membershipsService.invite({ email, roleId }, adminUserId)).toThrow(
  'User is already member'
);
```

## 🚀 Usage Example

### Complete Flow

```typescript
// 1. User erstellt Tenant
POST /api/tenants
{
  "name": "My Company",
  "description": "Our organization"
}
// → User wird automatisch Admin

// 2. Admin erstellt Role
POST /api/roles
{
  "name": "Editor",
  "permissions": {
    "project": ["create", "read", "update", "delete"],
    "role": ["read"],
    "membership": ["read"]
  }
}

// 3. Admin invited Member
POST /api/memberships/invite
{
  "email": "john@company.com",
  "roleId": "role-uuid"
}

// 4. Admin erstellt Project
POST /api/projects
{
  "name": "Website Redesign",
  "description": "2024 Q1 Project"
}

// 5. Projects sind automatisch dem Tenant zugeordnet
GET /api/projects
// Returns nur dieser Tenant's Projects
```

## 🔐 Multi-Tenant Guarantees

✅ **Garantierte Tenant-Isolation:**

- Guards prüfen Tenant-Membership vor jedem Request
- TenantAwarePrismaService filtert automatisch auf Datenbankebene
- Middleware garantiert dass `tenantId` zu jedem Query hinzugefügt wird

✅ **Keine Data Leaks:**

- Unmöglich dass Daten eines anderen Tenants returned werden
- Fehler bei Zugriffsverletzung (nicht silent failure)

✅ **Permission Control:**

- JSON-basierte Permissions sind flexibel
- Wildcard-Support für umfassende/granulare Controls
- Runtime Enforcement durch Guards

---

## 📚 Weitere Ressourcen

- [Data Access Layer Guide](../prisma/TENANT_AWARE_GUIDE.md)
- [Security Testing](../prisma/SECURITY_TESTING_GUIDE.md)
- [Integration Guide](../prisma/INTEGRATION_GUIDE.md)
