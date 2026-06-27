/**
 * Tenants Service
 *
 * Verwaltet Tenant CRUD Operationen
 * Ein User kann mehrere Tenants haben über Memberships
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@service/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Erstelle neuen Tenant
   * Der Creator wird automatisch als Admin hinzugefügt
   */
  async create(data: CreateTenantDto, userId: string) {
    // 1. Erstelle Tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        description: data.description,
        logo: data.logo,
      },
    });

    // 2. Erstelle automatisch Admin Role für diesen Tenant
    const adminRole = await this.prisma.role.create({
      data: {
        name: 'admin',
        tenantId: tenant.id,
        permissions: {
          '*': ['*'], // Admin hat alle Permissions
        },
      },
    });

    // 3. Erstelle Membership für Creator als Admin
    const membership = await this.prisma.membership.create({
      data: {
        userId,
        tenantId: tenant.id,
        roleId: adminRole.id,
      },
    });

    return {
      ...tenant,
      membership,
      role: adminRole,
    };
  }

  /**
   * Hole alle Tenants für einen User
   * Basiert auf seinen Memberships
   */
  async findAllForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: {
        tenant: true,
        role: true,
      },
    });

    return memberships.map((m: any) => ({
      ...m.tenant,
      membership: {
        id: m.id,
        roleId: m.roleId,
        role: m.role,
      },
    }));
  }

  /**
   * Hole spezifischen Tenant (mit Zugriffsprüfung)
   * Nur wenn User Mitglied ist
   */
  async findOne(id: string, userId: string) {
    // 1. Prüfe dass User Mitglied des Tenants ist
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: id,
        },
      },
      include: {
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Tenant not found or access denied');
    }

    // 2. Hole Tenant Details
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            roleId: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      ...tenant,
      userRole: membership.role,
    };
  }

  /**
   * Aktualisiere Tenant
   * Nur Admins dürfen das
   */
  async update(id: string, userId: string, data: UpdateTenantDto) {
    // 1. Prüfe dass User Admin ist
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: id,
        },
      },
      include: {
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAdminPermission =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['tenant']?.includes('update');

    if (!hasAdminPermission) {
      throw new BadRequestException('Only admins can update tenant');
    }

    // 2. Update Tenant
    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        logo: data.logo,
      },
    });
  }

  /**
   * Lösche Tenant
   * Nur Admins, und nur wenn sie der einzige Admin sind
   */
  async delete(id: string, userId: string) {
    // 1. Prüfe dass User Admin ist
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: id,
        },
      },
      include: {
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAdminPermission =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['tenant']?.includes('delete');

    if (!hasAdminPermission) {
      throw new BadRequestException('Only admins can delete tenant');
    }

    // 2. Lösche Tenant (mit Cascade: Members, Projects, Roles werden automatisch gelöscht)
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  /**
   * Get Tenant by ID (ohne User-Check, für interne Nutzung)
   * ⚠️ Nutze nur wenn tenantId bereits validiert ist
   */
  async findByIdUnsafe(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
