/**
 * Beispiel Project Service
 *
 * Demonstriert sichere Verwendung von TenantAwarePrismaService
 * Alle Queries sind automatisch tenant-gefiltert
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantAwarePrismaService } from '@service/prisma/tenant-aware-prisma.service';
import { TenantContextService } from '@service/prisma/tenant-context.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly tenantAwarePrisma: TenantAwarePrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  /**
   * ✅ SAFE: Nur Projects des aktuellen Tenants werden zurückgegeben
   * Die tenantId wird automatisch gefiltert durch TenantAwarePrismaService
   */
  async findAll() {
    const tenantId = this.tenantContext.getTenantId();
    console.log(`📋 Fetching projects for tenant: ${tenantId}`);

    return this.tenantAwarePrisma.project().findMany({
      // Middleware fügt automatisch where: { tenantId } hinzu
      // Das ist äquivalent zu:
      // this.prisma.project.findMany({ where: { tenantId } })
      include: {
        owner: true,
      },
    });
  }

  /**
   * ✅ SAFE: Findet einen Project basierend auf ID
   * Prüft automatisch dass er zum aktuellen Tenant gehört
   */
  async findOne(id: string) {
    const project = await this.tenantAwarePrisma.project().findFirst({
      where: {
        id,
        // Middleware fügt automatisch tenantId Filter hinzu
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * ✅ SAFE: Erstellt neuen Project
   * tenantId wird automatisch hinzugefügt
   */
  async create(data: { name: string; description?: string }) {
    const tenantId = this.tenantContext.getTenantId();

    return this.tenantAwarePrisma.project().create({
      data: {
        ...data,
        // Middleware fügt tenantId automatisch hinzu
        // Keine Notwendigkeit das hier zu setten
      },
    });
  }

  /**
   * ✅ SAFE: Aktualisiert Project
   * Kann nur Projects des aktuellen Tenants ändern
   */
  async update(id: string, data: { name?: string; description?: string }) {
    const project = await this.findOne(id); // Sichert ab dass Project zu Tenant gehört

    return this.tenantAwarePrisma.project().update({
      where: { id },
      data,
      // Middleware stellt sicher dass Update nur im aktuellen Tenant passiert
    });
  }

  /**
   * ✅ SAFE: Löscht Project
   * Kann nur Projects des aktuellen Tenants löschen
   */
  async delete(id: string) {
    await this.findOne(id); // Sichert ab dass Project zu Tenant gehört

    return this.tenantAwarePrisma.project().delete({
      where: { id },
      // Middleware stellt sicher dass Delete nur im aktuellen Tenant passiert
    });
  }

  /**
   * ✅ SAFE: Count Projects im Tenant
   * Zählt automatisch nur Projects des aktuellen Tenants
   */
  async count() {
    return this.tenantAwarePrisma.project().count({
      // Middleware fügt automatically tenantId Filter hinzu
    });
  }

  /**
   * ✅ SAFE: Batch Update
   * Aktualisiert mehrere Projects gleichzeitig
   * Nur Projects des aktuellen Tenants werden aktualisiert
   */
  async bulkUpdate(projectIds: string[], status: string) {
    return this.tenantAwarePrisma.project().updateMany({
      where: {
        id: { in: projectIds },
        // Middleware fügt tenantId Filter hinzu - garantiert dass nur
        // Projects des aktuellen Tenants aktualisiert werden
      },
      data: { status },
    });
  }

  /**
   * ❌ OHNE TenantAwarePrismaService würde das passieren:
   * prisma.project.findMany()
   * // Problem: Gibt ALLE Projects aller Tenants zurück! 🔓 UNSICHER
   *
   * ✅ MIT TenantAwarePrismaService:
   * tenantAwarePrisma.project().findMany()
   * // Automatisch: prisma.project.findMany({ where: { tenantId } })
   * // Nur Projects des aktuellen Tenants! ✅ SICHER
   */
}
