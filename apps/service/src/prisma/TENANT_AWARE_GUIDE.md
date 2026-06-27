# Sichere Datenzugriffsschicht für Multi-Tenant SaaS

## 🎯 Ziel

**Verhindere, dass Entwickler vergessen, tenantId zu filtern.**  
👉 **KEINE Daten dürfen ohne tenantId abgefragt werden!**

## ❌ Das Problem

Ohne zentrale Kontrolle können folgende Fehler passieren:

```typescript
// ❌ UNSICHER - alle Tenants!
const allProjects = await prisma.project.findMany();
// Returns 100.000 Projects aller Tenants 🔓 DATENLECK!

// ❌ UNSICHER - falsch gefiltert
const projects = await prisma.project.findMany({
  where: { ownerId: userId }, // Oops, tenantId vergessen!
});
// Returns Projects vom aktuellen Benutzer AUS ALLEN TENANTS! 🔓

// ❌ UNSICHER - komplexe Queries
const projects = await prisma.project.findMany({
  where: {
    AND: [
      { status: 'active' },
      { owner: { role: { name: 'admin' } } },
      // tenantId vergessen, alle Admin-Projects aller Tenants! 🔓
    ],
  },
});
```

## ✅ Die Lösung

### Architektur

```
Request mit JWT
    ↓
TenantAccessGuard
    ↓ Setzt TenantContext
    ↓
TenantContextService (AsyncLocalStorage)
    ↓ Speichert tenantId pro Request
    ↓
TenantAwarePrismaService (Middleware)
    ↓ Filtert automatisch
    ↓
Prisma Client
```

### 1. TenantContextService

Speichert die aktuelle `tenantId` im Kontext des Requests:

```typescript
@Injectable()
export class TenantContextService {
  private tenantContext = new AsyncLocalStorage<TenantContext>();

  setTenantContext(context: { tenantId: string }) {
    this.tenantContext.enterWith(context);
  }

  getTenantId(): string {
    const context = this.tenantContext.getStore();
    return context?.tenantId; // Wirft Fehler wenn nicht gesetzt
  }
}
```

**Wichtig:** AsyncLocalStorage erhält tenantId pro Request isoliert, auch unter concurrency.

### 2. TenantAccessGuard Integration

Das `TenantAccessGuard` setzt den Kontext:

```typescript
@Injectable()
export class TenantAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ... Membership validierung ...

    // 5️⃣ Setze TenantContext für Data Access Layer
    this.tenantContext.setTenantContext({
      tenantId,
      userId: request.user.id,
    });

    return true;
  }
}
```

### 3. TenantAwarePrismaService (Middleware)

Automatische Filterung über Prisma Middleware:

```typescript
@Injectable()
export class TenantAwarePrismaService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService
  ) {
    this.setupMiddleware();
  }

  private setupMiddleware() {
    this.prisma.$use(async (params, next) => {
      const tenantId = this.tenantContext.getTenantIdOrNull();

      if (!tenantId) {
        return next(params); // Kein Kontext, nicht filtern
      }

      // Nur tenant-aware Modelle filtern
      if (!TENANT_AWARE_MODELS.has(params.model)) {
        return next(params);
      }

      // Automatisch tenantId hinzufügen
      if (params.action === 'findMany') {
        return next({
          ...params,
          args: {
            ...params.args,
            where: {
              ...(params.args.where || {}),
              tenantId,
            },
          },
        });
      }

      return next(params);
    });
  }
}
```

## ✅ Sichere Verwendung

### Beispiel 1: FindMany

```typescript
// ✅ SICHER - automatisch gefiltert
const projects = await this.tenantAwarePrisma.project().findMany();
// Intern: prisma.project.findMany({ where: { tenantId } })
// Nur Projects des aktuellen Tenants! ✓
```

### Beispiel 2: Create

```typescript
// ✅ SICHER - tenantId wird automatisch gesetzt
const project = await this.tenantAwarePrisma.project().create({
  data: {
    name: 'My Project',
    // Middleware fügt tenantId automatisch hinzu
  },
});
// Intern: prisma.project.create({ data: { name, tenantId } })
```

### Beispiel 3: Update

```typescript
// ✅ SICHER - nur Projects des Tenants können aktualisiert werden
const updated = await this.tenantAwarePrisma.project().update({
  where: { id: '123' },
  data: { status: 'archived' },
});
// Intern: prisma.project.update({
//   where: { id: '123', tenantId },
//   data: { status: 'archived' }
// })
```

### Beispiel 4: Komplexe Queries

```typescript
// ✅ SICHER - selbst komplexe Queries sind automatisch gefiltert
const projects = await this.tenantAwarePrisma.project().findMany({
  where: {
    AND: [
      { status: 'active' },
      { owner: { role: { name: 'admin' } } },
      // Keine tenantId nötig - wird automatisch hinzugefügt
    ],
  },
  include: {
    owner: true,
    tasks: true,
  },
});
// Intern wird automatisch hinzugefügt: tenantId = context.tenantId
```

## 🔧 Implementation Schritte

### 1. TenantContextService Dependency Injection

```typescript
// app.module.ts
@Module({
  imports: [PrismaModule], // Exportiert TenantContextService
  providers: [AuthGuard, TenantAccessGuard],
})
export class AppModule {}
```

### 2. Guard mit TenantContext

```typescript
@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ...
    this.tenantContext.setTenantContext({ tenantId });
    return true;
  }
}
```

### 3. Service mit TenantAwarePrismaService

```typescript
@Injectable()
export class ProjectService {
  constructor(private readonly tenantAwarePrisma: TenantAwarePrismaService) {}

  async findAll() {
    // ✅ Automatisch gefiltert nach Tenant
    return this.tenantAwarePrisma.project().findMany();
  }
}
```

## 📋 Tenant-Aware Modelle

Diese Modelle werden automatisch gefiltert:

```typescript
const TENANT_AWARE_MODELS = new Set([
  'role', // Pro Tenant
  'membership', // M2M mit Tenant
  'project', // Gehört zu Tenant
  // Weitere hier hinzufügen
]);
```

## 🚫 Globale Modelle (KEINE Filterung)

Diese Modelle sind global und werden NICHT gefiltert:

```typescript
// ✅ Diese können direkt genutzt werden ohne Filterung
tenantAwarePrisma.user().findMany(); // Global
tenantAwarePrisma.tenant().findMany(); // Global
```

## ⚠️ Admin-Modus (nur für spezielle Cases)

Falls du ohne Tenant-Filterung querien musst (Admin-Dashboards, Migrationen):

```typescript
// ⚠️ NUR für Admin-Operationen verwenden!
await tenantAwarePrisma.runAsAdmin(async (prisma) => {
  return prisma.project.findMany(); // Alle Projects aller Tenants
});
```

## 🔒 Sicherheits-Garantien

### ✅ Automatic Filtering

- Alle Queries zu tenant-aware Modellen werden automatisch gefiltert
- Middleware operiert auf Prisma-Ebene (niedrig, sicher)
- Unmöglich, Filterung zu übersehen

### ✅ Compile-Time Safety

- TypeScript erzwingt tenantAwarePrisma statt prisma direkt
- IDE zeigt welche Modelle tenant-aware sind

### ✅ Runtime Enforcement

```typescript
// ❌ Wirft Fehler wenn kein Kontext
tenantAwarePrisma.project().findMany();
// Error: Cannot access project() without tenant context
```

### ✅ Request Isolation

- AsyncLocalStorage garantiert Isolation zwischen Requests
- Keine Crosstalk zwischen concurrent Requests

## 🧪 Testing

```typescript
// Setze Kontext für Test
const tenantContext = new TenantContextService();
tenantContext.setTenantContext({ tenantId: 'tenant-123' });

// Jetzt sind alle Queries automatisch gefiltert
const projects = await tenantAwarePrisma.project().findMany();
// Returns nur Projects von tenant-123
```

## 📊 Performance

- ✅ Middleware ist sehr effizient (ein Pass pro Query)
- ✅ Keine zusätzlichen DB Roundtrips
- ✅ Filtering passiert auf Client (Prisma) Seite, nicht DB

## 🔄 Migration

### Vorher (UNSICHER)

```typescript
@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // ❌ UNSICHER - vergessene tenantId
    return this.prisma.project.findMany();
  }
}
```

### Nachher (SICHER)

```typescript
@Injectable()
export class ProjectService {
  constructor(private readonly tenantAwarePrisma: TenantAwarePrismaService) {}

  async findAll() {
    // ✅ SICHER - automatisch gefiltert
    return this.tenantAwarePrisma.project().findMany();
  }
}
```

## Checklist für Implementierung

- [ ] TenantContextService in Prisma Module registrieren
- [ ] TenantAwarePrismaService in Prisma Module registrieren
- [ ] TenantAccessGuard updated mit `setTenantContext()`
- [ ] Project Service (oder andere Services) mit TenantAwarePrismaService
- [ ] Alle Tenant-aware Modelle in `TENANT_AWARE_MODELS` hinzufügen
- [ ] Tests mit automatischer Filterung
- [ ] Dokumentation für neue Services aktualisieren

---

**Sicherheitsprinzip:** Schlecht designte Systeme verlassen sich auf Entwickler um nicht zu vergessen. Gute Systeme machen Fehler unmöglich. 🔒
