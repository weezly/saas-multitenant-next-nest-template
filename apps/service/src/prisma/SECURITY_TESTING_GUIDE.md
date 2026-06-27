# Sicherheits-Testing für TenantAwarePrismaService

## 🧪 Test-Strategie

### 1. Unit Tests: Tenant-Filterung wird korrekt angewendet

```typescript
// ✅ Test: findMany wird mit tenantId gefiltert
it('should add tenantId to findMany query', async () => {
  const middleware = createMockMiddleware();
  const tenantId = 'tenant-123';

  // Setup Kontext
  tenantContext.setTenantContext({ tenantId });

  // Rufe Query auf
  await tenantAwarePrisma.project().findMany({
    where: { status: 'active' },
  });

  // ✅ Verify dass Middleware aufgerufen wurde mit tenantId
  expect(middleware).toHaveBeenCalledWith(
    expect.objectContaining({
      args: {
        where: {
          status: 'active',
          tenantId: 'tenant-123', // ✅ Automatisch hinzugefügt
        },
      },
    }),
    expect.any(Function)
  );
});

// ✅ Test: create setzt tenantId
it('should set tenantId on create', async () => {
  const middleware = createMockMiddleware();
  const tenantId = 'tenant-123';

  tenantContext.setTenantContext({ tenantId });

  await tenantAwarePrisma.project().create({
    data: { name: 'New Project' },
  });

  expect(middleware).toHaveBeenCalledWith(
    expect.objectContaining({
      args: {
        data: {
          name: 'New Project',
          tenantId: 'tenant-123', // ✅ Automatisch gesetzt
        },
      },
    }),
    expect.any(Function)
  );
});

// ✅ Test: updateMany mit tenantId Filter
it('should filter updateMany by tenantId', async () => {
  const middleware = createMockMiddleware();
  const tenantId = 'tenant-123';

  tenantContext.setTenantContext({ tenantId });

  await tenantAwarePrisma.project().updateMany({
    where: { status: 'draft' },
    data: { status: 'published' },
  });

  expect(middleware).toHaveBeenCalledWith(
    expect.objectContaining({
      args: {
        where: {
          status: 'draft',
          tenantId: 'tenant-123', // ✅ Filter hinzugefügt
        },
        data: { status: 'published' },
      },
    }),
    expect.any(Function)
  );
});
```

### 2. Integration Tests: Cross-Tenant Data Leaks verhindern

```typescript
// ✅ Test: User von Tenant A kann Tenant B's Daten nicht sehen
describe('Cross-Tenant Data Isolation', () => {
  beforeEach(async () => {
    // Setup: Erstelle 2 Tenants mit je 1 Project
    tenantA = await createTenant({ name: 'Tenant A' });
    tenantB = await createTenant({ name: 'Tenant B' });

    projectA = await createProject({ tenantId: tenantA.id, name: 'Project A' });
    projectB = await createProject({ tenantId: tenantB.id, name: 'Project B' });
  });

  it('should not leak Tenant B data to Tenant A user', async () => {
    // ✅ Setze Kontext zu Tenant A
    tenantContext.setTenantContext({ tenantId: tenantA.id });

    // Rufe findMany auf
    const projects = await tenantAwarePrisma.project().findMany();

    // ✅ Verify dass NUR Project A zurückgegeben wird
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe(projectA.id);
    expect(projects[0].tenantId).toBe(tenantA.id);

    // ✅ Verify dass Project B NICHT dabei ist
    expect(projects.find((p) => p.id === projectB.id)).toBeUndefined();
  });

  it('should enforce tenantId filter on update', async () => {
    tenantContext.setTenantContext({ tenantId: tenantA.id });

    // Versuche Project B zu aktualisieren (sollte fehlschlagen)
    const result = await tenantAwarePrisma.project().updateMany({
      where: { id: projectB.id },
      data: { status: 'archived' },
    });

    // ✅ Verify dass 0 Records aktualisiert wurden (nicht Tenant A's Records)
    expect(result.count).toBe(0);

    // ✅ Verify dass Project B unverändert ist
    const projectBAfter = await prisma.project.findUnique({
      where: { id: projectB.id },
    });
    expect(projectBAfter.status).not.toBe('archived');
  });

  it('should prevent delete of other tenant records', async () => {
    tenantContext.setTenantContext({ tenantId: tenantA.id });

    // Versuche Project B zu löschen
    const result = await tenantAwarePrisma.project().deleteMany({
      where: { id: projectB.id },
    });

    // ✅ Verify dass 0 Records gelöscht wurden
    expect(result.count).toBe(0);

    // ✅ Verify dass Project B noch existiert
    const projectBAfter = await prisma.project.findUnique({
      where: { id: projectB.id },
    });
    expect(projectBAfter).toBeDefined();
  });
});
```

### 3. Security Tests: Context Validation

```typescript
// ✅ Test: Fehlende TenantContext wirft Fehler
describe('TenantContext Enforcement', () => {
  it('should throw error when accessing tenant-aware model without context', async () => {
    // ✅ Clearе Context
    tenantContext.clearContext();

    // Versuche zu querien
    expect(() => {
      tenantAwarePrisma.project().findMany();
    }).toThrow('Cannot access project() without tenant context');
  });

  it('should allow querying global models without context', async () => {
    tenantContext.clearContext();

    // ✅ Global Models sollten funktionieren
    expect(() => {
      tenantAwarePrisma.user().findMany();
    }).not.toThrow();

    expect(() => {
      tenantAwarePrisma.tenant().findMany();
    }).not.toThrow();
  });

  it('should enforce context per request', async () => {
    const tenantId1 = 'tenant-1';
    const tenantId2 = 'tenant-2';

    // Request 1: Tenant 1
    tenantContext.setTenantContext({ tenantId: tenantId1 });
    const query1 = buildQueryWithContext(() => tenantAwarePrisma.project().findMany());

    // Request 2: Tenant 2 (simulated mit neuer Context)
    tenantContext.setTenantContext({ tenantId: tenantId2 });
    const query2 = buildQueryWithContext(() => tenantAwarePrisma.project().findMany());

    // ✅ Verify dass Queries unterschiedliche tenantIds haben
    expect(query1.where.tenantId).toBe(tenantId1);
    expect(query2.where.tenantId).toBe(tenantId2);
  });
});
```

### 4. Regression Tests: Verhindere versehentliche Unsicherheit

```typescript
// ✅ Test: Stelle sicher dass alte unsichere Patterns nicht arbeiten
describe('Security Regression Tests', () => {
  it('should never leak data via findMany without tenantId', async () => {
    // Setup: Multiple Tenants mit Daten
    const tenants = await createMultipleTenants(5);
    const allProjects = await Promise.all(tenants.map((t) => createProject({ tenantId: t.id })));

    // Setze Context zu Tenant 1
    tenantContext.setTenantContext({ tenantId: tenants[0].id });

    // Query ohne explizite tenantId Filter
    const projects = await tenantAwarePrisma.project().findMany();

    // ✅ MUST PASS: Nur Tenant 1's Projekte sollten zurückgegeben werden
    expect(projects).toHaveLength(1);
    expect(projects[0].tenantId).toBe(tenants[0].id);

    // ✅ MUST FAIL: Wenn mehr als 1 Projekt zurückgegeben wird = DATA LEAK
    expect(projects.length).not.toBeGreaterThan(1);
  });

  it('should never allow unscoped count', async () => {
    // Setup: 100 Projects in Tenant A, 50 in Tenant B
    await createProjectsForTenant('tenant-a', 100);
    await createProjectsForTenant('tenant-b', 50);

    // Setze Context zu Tenant A
    tenantContext.setTenantContext({ tenantId: 'tenant-a' });

    const count = await tenantAwarePrisma.project().count();

    // ✅ MUST PASS: Count sollte nur Tenant A's Projects zählen
    expect(count).toBe(100);

    // ✅ MUST FAIL: Wenn 150 zurückgegeben wird (alle) = count leak
    expect(count).not.toBe(150);
  });
});
```

### 5. Concurrency Tests: AsyncLocalStorage Isolation

```typescript
// ✅ Test: Verschiedene Requests haben isolierte Kontexte
describe('Request Isolation with AsyncLocalStorage', () => {
  it('should isolate tenant context between concurrent requests', async () => {
    const results: { tenantId: string; data: any[] }[] = [];

    // Simuliere 3 concurrent Requests mit unterschiedlichen Tenants
    await Promise.all([
      (async () => {
        tenantContext.setTenantContext({ tenantId: 'tenant-1' });
        const data = await tenantAwarePrisma.project().findMany();
        results.push({ tenantId: 'tenant-1', data });
      })(),

      (async () => {
        tenantContext.setTenantContext({ tenantId: 'tenant-2' });
        const data = await tenantAwarePrisma.project().findMany();
        results.push({ tenantId: 'tenant-2', data });
      })(),

      (async () => {
        tenantContext.setTenantContext({ tenantId: 'tenant-3' });
        const data = await tenantAwarePrisma.project().findMany();
        results.push({ tenantId: 'tenant-3', data });
      })(),
    ]);

    // ✅ MUST PASS: Jedes Result sollte nur sein eigenes Tenant's Daten haben
    results.forEach(({ tenantId, data }) => {
      expect(data.every((item) => item.tenantId === tenantId)).toBe(true);
    });
  });
});
```

## 📋 Sicherheits-Checkliste

### Pre-Production Checklist

- [ ] **Unit Tests** - Middleware wird korrekt aufgerufen mit tenantId
- [ ] **Integration Tests** - Cross-tenant data leaks sind unmöglich
- [ ] **Security Tests** - Fehlender Context wirft Fehler
- [ ] **Concurrency Tests** - AsyncLocalStorage isolation funktioniert
- [ ] **Regression Tests** - Alte unsichere Patterns funktionieren nicht
- [ ] **Code Review** - Kein direkter Zugriff auf `prisma.model()` in Services
- [ ] **Documentation** - Alle Services dokumentiert wie tenantAwarePrisma genutzt wird
- [ ] **Monitoring** - Error Logging für Context-Fehler
- [ ] **Audit Trail** - Query Logging zum Verifizieren dass Filterung aktiv ist

### Kontinuierliche Sicherheit

```typescript
// ✅ Add periodical security audit task
export class SecurityAuditTask {
  @Cron('0 0 * * *') // Daily at midnight
  async auditTenantDataIsolation() {
    // Check ob irgendwelche Queries ohne tenantId Filter existieren
    const suspiciousQueries = await this.findUnfilteredQueries();

    if (suspiciousQueries.length > 0) {
      this.logger.error('⚠️ SECURITY ALERT: Unfiltered queries detected!', {
        queries: suspiciousQueries,
      });
      // Alert ops team
    }
  }
}
```

## 🎯 Performance Tests

```typescript
// ✅ Test: Middleware erzeugt keine Performance-Regression
describe('Performance', () => {
  it('should have minimal overhead', async () => {
    const startTime = performance.now();

    // Execute 1000 queries
    for (let i = 0; i < 1000; i++) {
      await tenantAwarePrisma.project().findMany();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 1000;

    // ✅ Middleware sollte < 1ms Overhead pro Query haben
    expect(avgTime).toBeLessThan(1);
  });
});
```

---

**Sicherheit ist nicht ein Feature, es ist eine Guarantie.**
