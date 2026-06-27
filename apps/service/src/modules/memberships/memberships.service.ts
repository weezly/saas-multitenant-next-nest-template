/**
 * Memberships Service
 *
 * Verwaltet Tenant-Membership für User
 * Invitation, Role Changes, Removals
 * Nutzt TenantAwarePrismaService
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@service/prisma/prisma.service';
import { TenantAwarePrismaService } from '@service/prisma/tenant-aware-prisma.service';
import { TenantContextService } from '@service/prisma/tenant-context.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAwarePrisma: TenantAwarePrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  /**
   * Lade alle Members des Tenants
   */
  async findAll() {
    return this.tenantAwarePrisma.membership().findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      orderBy: { user: { email: 'asc' } },
    });
  }

  /**
   * Lade spezifisches Membership
   */
  async findOne(id: string) {
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  /**
   * Lade Membership für User
   */
  async findByUser(userId: string) {
    return this.tenantAwarePrisma.membership().findFirst({
      where: { userId },
      include: {
        role: true,
        tenant: true,
      },
    });
  }

  /**
   * Invite neuen Member zum Tenant
   * Nur für Admins
   */
  async invite(data: InviteMemberDto, requestingUserId: string) {
    const tenantId = this.tenantContext.getTenantId();

    // 1. Prüfe dass requester Admin ist
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId: requestingUserId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const isAdmin =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['membership']?.includes('create');

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can invite members');
    }

    // 2. Prüfe dass Role existiert
    const role = await this.tenantAwarePrisma.role().findFirst({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // 3. Prüfe ob User bereits existiert
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    // 4. Falls User nicht existiert, erstelle ihn
    // (Mit disabled Status bis er sich registriert)
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          // Password wird bei Registrierung gesetzt
          // status: 'pending_registration' (optional)
        },
      });
    }

    // 5. Prüfe ob User bereits Member ist
    const existingMembership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId: user.id },
    });

    if (existingMembership) {
      throw new ConflictException('User is already member of this tenant');
    }

    // 6. Erstelle Membership
    return this.tenantAwarePrisma.membership().create({
      data: {
        userId: user.id,
        roleId: data.roleId,
        // tenantId wird automatisch vom Middleware hinzugefügt
      },
      include: {
        user: true,
        role: true,
      },
    });
  }

  /**
   * Update Member Role
   * Nur für Admins
   */
  async updateRole(id: string, data: UpdateMembershipDto, requestingUserId: string) {
    // 1. Prüfe dass requester Admin ist
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId: requestingUserId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const isAdmin =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['membership']?.includes('update');

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update members');
    }

    // 2. Prüfe dass neue Role existiert
    const newRole = await this.tenantAwarePrisma.role().findFirst({
      where: { id: data.roleId },
    });

    if (!newRole) {
      throw new NotFoundException('Role not found');
    }

    // 3. Prüfe dass Membership existiert
    const targetMembership = await this.findOne(id);

    // 4. Prüfe dass Admin nicht sich selbst degradiert
    if (targetMembership.userId === requestingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    // 5. Update Role
    return this.tenantAwarePrisma.membership().update({
      where: { id },
      data: {
        roleId: data.roleId,
      },
      include: {
        user: true,
        role: true,
      },
    });
  }

  /**
   * Entferne Member aus Tenant
   * Nur für Admins
   */
  async remove(id: string, requestingUserId: string) {
    // 1. Prüfe dass requester Admin ist
    const membership = await this.tenantAwarePrisma.membership().findFirst({
      where: { userId: requestingUserId },
      include: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not member of this tenant');
    }

    const isAdmin =
      membership.role.permissions['*']?.includes('*') ||
      membership.role.permissions['membership']?.includes('delete');

    if (!isAdmin) {
      throw new ForbiddenException('Only admins can remove members');
    }

    // 2. Prüfe dass Membership existiert
    const targetMembership = await this.findOne(id);

    // 3. Prüfe dass Admin nicht sich selbst entfernt
    if (targetMembership.userId === requestingUserId) {
      throw new ForbiddenException('You cannot remove yourself');
    }

    // 4. Prüfe ob Target letzter Admin ist
    const tenantId = this.tenantContext.getTenantId();
    const adminRole = await this.tenantAwarePrisma.role().findFirst({
      where: { name: 'admin' },
    });

    if (targetMembership.roleId === adminRole?.id) {
      const otherAdmins = await this.tenantAwarePrisma.membership().count({
        where: {
          roleId: adminRole.id,
          userId: { not: targetMembership.userId },
        },
      });

      if (otherAdmins === 0) {
        throw new BadRequestException('Cannot remove last admin. Assign another admin first.');
      }
    }

    // 5. Remove Membership
    return this.tenantAwarePrisma.membership().delete({
      where: { id },
    });
  }

  /**
   * Count Members im Tenant
   */
  async count() {
    return this.tenantAwarePrisma.membership().count();
  }
}
