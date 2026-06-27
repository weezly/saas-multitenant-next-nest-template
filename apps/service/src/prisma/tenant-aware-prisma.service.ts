/**
 * Tenant-Aware Prisma Service
 *
 * Sichere Data Access Layer die automatisch tenantId zu jedem Query hinzufügt.
 *
 * Verhindert dass Entwickler folgendes schreiben können:
 * ❌ prisma.project.findMany()  // UNSICHER - alle Tenants!
 *
 * Erzwingt automatische Filterung:
 * ✅ tenantAwarePrisma.project.findMany()
 *    // Wird automatisch zu:
 *    // prisma.project.findMany({ where: { tenantId: <current-tenant> } })
 *
 * Modelle mit Tenant-Filterung:
 * - Role (pro Tenant)
 * - Membership (M2M mit Tenant)
 * - Project (gehört zu Tenant)
 * - Weitere Tenant-spezifische Modelle
 *
 * Globale Modelle (KEINE Filterung):
 * - User (global über Tenants)
 * - Tenant (selbst)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

// Modelle die automatisch tenantId Filterung bekommen
const TENANT_AWARE_MODELS = new Set([
  'role',
  'membership',
  'project',
  // Weitere tenant-spezifische Modelle hinzufügen
]);

@Injectable()
export class TenantAwarePrismaService {
  private logger = new Logger('TenantAwarePrismaService');

  constructor(
    private readonly prisma: PrismaClient,
    private readonly tenantContext: TenantContextService
  ) {
    this.setupMiddleware();
  }

  /**
   * Setup Prisma Middleware für automatische tenantId Filterung
   * Wird auf allen Queries angewendet
   */
  private setupMiddleware() {
    this.prisma.$use(async (params: any, next: any) => {
      // Hole tenantId aus Kontext
      const tenantId = this.tenantContext.getTenantIdOrNull();

      // Wenn kein Kontext (z.B. public routes), nicht filtern
      if (!tenantId) {
        return next(params);
      }

      // Nur tenant-aware Modelle filtern
      if (!TENANT_AWARE_MODELS.has(params.model)) {
        return next(params);
      }

      // Bestimmte Operationen brauchen Filterung
      if (
        params.action === 'findUnique' ||
        params.action === 'findFirst' ||
        params.action === 'findMany' ||
        params.action === 'count'
      ) {
        // Füge tenantId zu where Klausel hinzu (AND)
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

      if (
        params.action === 'update' ||
        params.action === 'delete' ||
        params.action === 'updateMany' ||
        params.action === 'deleteMany'
      ) {
        // Für Mutationen: Stelle sicher dass tenantId in where ist
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

      if (params.action === 'create' || params.action === 'upsert') {
        // Für create/upsert: Füge tenantId zu data hinzu
        return next({
          ...params,
          args: {
            ...params.args,
            data: {
              ...(params.args.data || {}),
              tenantId,
            },
          },
        });
      }

      if (params.action === 'createMany') {
        // Für createMany: Füge tenantId zu allen items hinzu
        return next({
          ...params,
          args: {
            ...params.args,
            data: Array.isArray(params.args.data)
              ? params.args.data.map((item: any) => ({
                  ...item,
                  tenantId,
                }))
              : params.args.data,
          },
        });
      }

      // Alle anderen Operationen durchlassen
      return next(params);
    });
  }

  /**
   * Direkter Zugriff auf Raw Prisma Client
   * ⚠️ Bypass tenant filtering - nutzen mit Vorsicht!
   * Nur für Admin/System Operations!
   */
  raw(): PrismaClient {
    return this.prisma;
  }

  /**
   * Admin-Modus: Query ohne Tenant-Filterung
   * ⚠️ Nur für echte Admin-Operationen verwenden
   */
  async runAsAdmin<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    this.logger.warn('⚠️ Running admin operation without tenant filtering');
    return fn(this.prisma);
  }

  /**
   * Shortcut zu Standard Prisma für globale Operationen (User, Tenant)
   */
  user() {
    return this.prisma.user;
  }

  tenant() {
    return this.prisma.tenant;
  }

  /**
   * Tenant-aware Modelle - automatisch gefiltert
   */
  role() {
    if (!this.tenantContext.hasTenantContext()) {
      throw new Error(
        'Cannot access role() without tenant context. Make sure to use TenantAccessGuard.'
      );
    }
    return this.prisma.role;
  }

  membership() {
    if (!this.tenantContext.hasTenantContext()) {
      throw new Error(
        'Cannot access membership() without tenant context. Make sure to use TenantAccessGuard.'
      );
    }
    return this.prisma.membership;
  }

  project() {
    if (!this.tenantContext.hasTenantContext()) {
      throw new Error(
        'Cannot access project() without tenant context. Make sure to use TenantAccessGuard.'
      );
    }
    return this.prisma.project;
  }

  // Weitere tenant-aware Models hier hinzufügen

  /**
   * Allgemeiner Zugriff auf Prisma Models
   * Mit Runtime-Check für tenant-awareness
   */
  model(modelName: string): any {
    if (TENANT_AWARE_MODELS.has(modelName)) {
      if (!this.tenantContext.hasTenantContext()) {
        throw new Error(`Cannot access ${modelName}() without tenant context.`);
      }
    }
    return this.prisma[modelName as keyof PrismaClient];
  }
}
