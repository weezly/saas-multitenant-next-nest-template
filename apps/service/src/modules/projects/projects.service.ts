/**
 * Projects Service
 *
 * Verwaltet Projects in einem Tenant
 * Nutzt TenantAwarePrismaService für automatische Multi-Tenant Sicherheit
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TenantAwarePrismaService } from '@service/prisma/tenant-aware-prisma.service';
import { TenantContextService } from '@service/prisma/tenant-context.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly tenantAwarePrisma: TenantAwarePrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  /**
   * Erstelle neues Project
   * Automatisch im aktuellen Tenant (via TenantContext)
   */
  async create(data: CreateProjectDto, userId: string) {
    // 1. Prüfe dass User Admin oder Editor Permissions hat
    const tenantId = this.tenantContext.getTenantId();
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const canCreateProject =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['project']?.includes('create');

    if (!canCreateProject) {
      throw new ForbiddenException('You do not have permission to create projects');
    }

    // 2. Erstelle Project
    // TenantAwarePrismaService fügt tenantId automatisch hinzu
    return this.tenantAwarePrisma.project().create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status || 'active',
        ownerId: userId,
        // tenantId wird automatisch vom Middleware hinzugefügt
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Hole alle Projects des Tenants
   * Automatisch nach tenantId gefiltert
   */
  async findAll(filters?: { status?: string; ownerId?: string }) {
    return this.tenantAwarePrisma.project().findMany({
      where: filters,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Hole ein spezifisches Project
   * Automatisch tenantId-gefiltert
   */
  async findOne(id: string) {
    const project = await this.tenantAwarePrisma.project().findFirst({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Update Project
   * Nur für Owner oder Admin
   */
  async update(id: string, userId: string, data: UpdateProjectDto) {
    // 1. Hole Project
    const project = await this.findOne(id);

    // 2. Prüfe Permissions
    if (project.ownerId !== userId) {
      // Prüfe ob User Admin ist
      const membership = await this.tenantAwarePrisma.membership().findFirst({
        where: { userId },
        include: { role: true },
      });

      const isAdmin =
        membership?.role.permissions['*']?.includes('*') ||
        membership?.role.permissions['project']?.includes('update');

      if (!isAdmin) {
        throw new ForbiddenException('You can only edit your own projects');
      }
    }

    // 3. Update Project
    return this.tenantAwarePrisma.project().update({
      where: { id },
      data,
    });
  }

  /**
   * Delete Project
   * Nur für Owner oder Admin
   */
  async delete(id: string, userId: string) {
    // 1. Hole Project
    const project = await this.findOne(id);

    // 2. Prüfe Permissions
    if (project.ownerId !== userId) {
      // Prüfe ob User Admin ist
      const membership = await this.tenantAwarePrisma.membership().findFirst({
        where: { userId },
        include: { role: true },
      });

      const isAdmin =
        membership?.role.permissions['*']?.includes('*') ||
        membership?.role.permissions['project']?.includes('delete');

      if (!isAdmin) {
        throw new ForbiddenException('You can only delete your own projects');
      }
    }

    // 3. Delete Project
    return this.tenantAwarePrisma.project().delete({
      where: { id },
    });
  }

  /**
   * Count Projects im Tenant
   */
  async count() {
    return this.tenantAwarePrisma.project().count();
  }
}
