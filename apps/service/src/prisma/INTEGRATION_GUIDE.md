# Integration Guide: TenantAwarePrismaService

## 1. Module Registration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule, // ✅ Exportiert TenantAwarePrismaService
    UsersModule,
    // ... andere modules
  ],
})
export class AppModule {}
```

## 2. Service Injection

```typescript
import { Injectable } from '@nestjs/common';
import { TenantAwarePrismaService } from '@service/prisma/tenant-aware-prisma.service';

@Injectable()
export class ProjectService {
  // ✅ Injiziere TenantAwarePrismaService statt PrismaService
  constructor(private readonly tenantAwarePrisma: TenantAwarePrismaService) {}

  // ✅ SAFE: Automatisch gefiltert nach Tenant
  async findAll() {
    return this.tenantAwarePrisma.project().findMany({
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

## 3. Query Patterns

### Pattern 1: Simple FindMany

```typescript
// ✅ SAFE - automatisch gefiltert
const projects = await this.tenantAwarePrisma.project().findMany();
// Middleware fügt automatisch hinzu: where: { tenantId: <current-tenant> }
```

### Pattern 2: FindMany mit zusätzlichen Filtern

```typescript
// ✅ SAFE - Middleware ergänzt tenantId
const projects = await this.tenantAwarePrisma.project().findMany({
  where: {
    status: 'active', // Middleware fügt tenantId automatisch hinzu
  },
});
// Wird zu: where: { status: 'active', tenantId: <current-tenant> }
```

### Pattern 3: Create mit automatischer tenantId

```typescript
// ✅ SAFE - tenantId wird automatisch gesetzt
const project = await this.tenantAwarePrisma.project().create({
  data: {
    name: 'My Project',
    // Middleware fügt tenantId automatisch hinzu
  },
});
// Wird zu: data: { ...data, tenantId: <current-tenant> }
```

### Pattern 4: Update

```typescript
// ✅ SAFE - nur Projects des Tenants können aktualisiert werden
const updated = await this.tenantAwarePrisma.project().update({
  where: { id: '123' },
  data: { status: 'archived' },
});
// Middleware stellt sicher dass nur Tenant's Projects aktualisiert werden
```

### Pattern 5: Delete

```typescript
// ✅ SAFE - nur Projects des Tenants können gelöscht werden
await this.tenantAwarePrisma.project().delete({
  where: { id: '123' },
});
```

### Pattern 6: Count

```typescript
// ✅ SAFE - zählt automatisch nur Projects des Tenants
const count = await this.tenantAwarePrisma.project().count();
```

### Pattern 7: Batch Update

```typescript
// ✅ SAFE - aktualisiert nur Projects des Tenants
const result = await this.tenantAwarePrisma.project().updateMany({
  where: { id: { in: ids } },
  data: { status: 'archived' },
});
```

### Pattern 8: Complex Where Clause

```typescript
// ✅ SAFE - selbst komplexe Queries sind automatisch gefiltert
const projects = await this.tenantAwarePrisma.project().findMany({
  where: {
    AND: [
      { status: 'active' },
      { owner: { id: userId } },
      // Middleware fügt automatisch tenantId hinzu
    ],
  },
});
```

## 4. Controller Integration

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard, TenantAccessGuard } from '@service/common/guards';
import { ActiveTenant } from '@service/common/decorators';
import { ProjectService } from './project.service';

@Controller('api/projects')
@UseGuards(AuthGuard, TenantAccessGuard) // ✅ Guards setzen Kontext
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll(@ActiveTenant() tenantId: string) {
    // ✅ Service hat automatisch Zugriff auf TenantContext vom Guard
    return this.projectService.findAll();
  }

  @Post()
  async create(@Body() data: { name: string }) {
    return this.projectService.create(data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }
}
```

## 5. Error Handling

### Szenario 1: Fehlender Guard

```typescript
// ❌ Wenn Guard vergessen wurde:
@Controller('api/projects')
// Guard vergessen!
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async findAll() {
    return this.projectService.findAll();
    // Error: Cannot access project() without tenant context
    // ✅ Fehler ist offensichtlich statt stillschweigend falsch!
  }
}
```

### Szenario 2: Public Routes

```typescript
// ✅ Public Routes ohne Guard sind okay
@Controller('api/public')
export class PublicController {
  @Get()
  @Public() // Diese Route hat keinen TenantAccessGuard
  async getPublicData() {
    // Kontext ist null, Middleware filtert nicht
    return { message: 'Public data' };
  }
}
```

## 6. Migration Checklist

Beim Migrieren eines bestehenden Services:

### Schritt 1: Ändere Injection

```typescript
// Vorher:
constructor(private readonly prisma: PrismaService) {}

// Nachher:
constructor(private readonly tenantAwarePrisma: TenantAwarePrismaService) {}
```

### Schritt 2: Entferne manuelle tenantId Filter

```typescript
// Vorher:
await this.prisma.project.findMany({
  where: { tenantId, status: 'active' },
});

// Nachher:
await this.tenantAwarePrisma.project().findMany({
  where: { status: 'active' }, // tenantId wird automatisch hinzugefügt
});
```

### Schritt 3: Globale Queries bleiben bei PrismaService

```typescript
// Bleibe bei PrismaService für globale Models:
await this.prisma.user.findMany();
await this.prisma.tenant.findMany();
```

### Schritt 4: Teste dass Kontext korrekt gesetzt wird

- AuthGuard setzt User
- TenantAccessGuard setzt TenantContext
- Service kann problemlos Queries ausführen

### Schritt 5: Update Unit Tests

```typescript
// Mock Kontext für Tests
const mockTenantAwarePrisma = {
  project: () => ({
    findMany: jest.fn().mockResolvedValue([...]),
  }),
};

const module = await Test.createTestingModule({
  providers: [
    {
      provide: TenantAwarePrismaService,
      useValue: mockTenantAwarePrisma,
    },
  ],
}).compile();
```

## 7. Globale vs. Tenant-Aware Modelle

### Tenant-Aware (automatisch gefiltert)

- `role` (pro Tenant)
- `membership` (M2M mit Tenant)
- `project` (gehört zu Tenant)
- (weitere hinzufügen nach Bedarf)

### Global (KEINE Filterung)

- `user` (global über Tenants)
- `tenant` (selbst)

```typescript
// ✅ Tenant-Aware Model - wird gefiltert
await this.tenantAwarePrisma.project().findMany();

// ✅ Globales Model - wird NICHT gefiltert
await this.tenantAwarePrisma.user().findMany();
```

## 8. Admin-Modus (für spezielle Cases)

Falls du ohne Tenant-Filterung querien musst:

```typescript
// ⚠️ NUR für Admin-Operationen verwenden!
await this.tenantAwarePrisma.runAsAdmin(async (prisma) => {
  return prisma.project.findMany(); // Alle Projects aller Tenants
});

// Oder direkter Zugriff:
const allProjects = await this.tenantAwarePrisma.raw().project.findMany();
```

---

Siehe auch:

- [TENANT_AWARE_GUIDE.md](./TENANT_AWARE_GUIDE.md) - Sicherheits-Konzept
- [SECURITY_TESTING_GUIDE.md](./SECURITY_TESTING_GUIDE.md) - Test-Strategien
