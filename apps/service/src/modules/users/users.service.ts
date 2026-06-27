import { Injectable } from '@nestjs/common';
import { PrismaService } from '@service/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   */
  async createUser(data: any) {
    return this.prisma.user.create({ data });
  }

  /**
   * Find user by ID with all memberships
   */
  async getUserWithTenants(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            tenant: true,
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get user's tenants for a specific tenant (with memberships)
   */
  async getUserTenants(userId: string, tenantId: string) {
    return this.prisma.membership.findMany({
      where: { userId, tenantId },
      include: {
        tenant: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Check if user has permission in tenant
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      include: {
        role: {
          select: {
            permissions: true,
          },
        },
      },
    });

    if (!membership) return false;

    const permissions = membership.role.permissions as Record<string, string[]>;
    return permissions[resource]?.includes(action) ?? false;
  }
}
