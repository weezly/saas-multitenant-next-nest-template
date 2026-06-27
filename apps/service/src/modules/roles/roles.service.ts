/**
 * Roles Service
 *
 * Verwaltet Roles pro Tenant
 * Jeder Tenant hat seine eigenen Roles
 * Nutzt TenantAwarePrismaService für Multi-Tenant Sicherheit
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TenantAwarePrismaService } from '@service/prisma/tenant-aware-prisma.service';
import { TenantContextService } from '@service/prisma/tenant-context.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly tenantAwarePrisma: TenantAwarePrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  /**
   * Erstelle neue Role im Tenant
   * Nur für Admins
   */
  async create(data: CreateRoleDto, userId: string) {
    // 1. Prüfe dass User Admin ist
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const isAdmin =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['role']?.includes('create');

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can create roles');
    }

    // 2. Prüfe dass Role Name einmalig ist
    const existingRole = await this.tenantAwarePrisma.role().findFirst({
      where: { name: data.name },
    });

    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    // 3. Erstelle Role
    return this.tenantAwarePrisma.role().create({
      data: {
        name: data.name,
        permissions: data.permissions,
        description: data.description,
        // tenantId wird automatisch vom Middleware hinzugefügt
      },
    });
  }

  /**
   * Hole alle Roles des Tenants
   */
  async findAll() {
    return this.tenantAwarePrisma.role().findMany({
      include: {
        _count: {
          select: {
            members: true, // Count wie viele User diese Role haben
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Hole spezifische Role
   */
  async findOne(id: string) {
    const role = await this.tenantAwarePrisma.role().findFirst({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
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

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * Update Role Permissions
   * Nur für Admins
   * ⚠️ Ändert Permissions aller User mit dieser Role!
   */
  async update(id: string, userId: string, data: UpdateRoleDto) {
    // 1. Prüfe dass User Admin ist
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const isAdmin =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['role']?.includes('update');

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update roles');
    }

    // 2. Prüfe dass Role existiert
    const role = await this.findOne(id);

    // 3. Prüfe ob es die Admin-Role ist
    if (role.name === 'admin' && data.permissions) {
      // Erlaube Anpassungen an Admin-Role
    }

    // 4. Update Role
    return this.tenantAwarePrisma.role().update({
      where: { id },
      data: {
        name: data.name,
        permissions: data.permissions,
        description: data.description,
      },
    });
  }

  /**
   * Delete Role
   * Nur für Admins
   * Kann nur gelöscht werden wenn keine User diese Role haben
   */
  async delete(id: string, userId: string) {
    // 1. Prüfe dass User Admin ist
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const isAdmin =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['role']?.includes('delete');

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete roles');
    }

    // 2. Hole Role mit Member Count
    const role = await this.findOne(id);

    // 3. Prüfe dass keine User diese Role haben
    if (role.members?.length > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${role.members.length} members. Reassign users first.`
      );
    }

    // 4. Prüfe dass es nicht die Admin-Role ist
    if (role.name === 'admin') {
      throw new BadRequestException('Cannot delete admin role');
    }

    // 5. Delete Role
    return this.tenantAwarePrisma.role().delete({
      where: { id },
    });
  }
}
