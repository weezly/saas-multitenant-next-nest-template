/**
 * Tenant Access Guard
 *
 * Verantwortung:
 * - Prüfe dass activeTenantId vorhanden ist (von AuthGuard gesetzt)
 * - Verifiziere dass der User Mitglied des Tenants ist
 * - Prüfe dass der User für diesen Tenant eine Rolle hat
 * - Hänge Membership Informationen an request an
 * - Setze TenantContext für Data Access Layer
 *
 * @Public() Decorator überspringt diesen Guard
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../prisma/tenant-context.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      membership?: {
        id: string;
        userId: string;
        tenantId: string;
        roleId: string;
      };
    }
  }
}

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Prüfe ob Route als @Public() markiert ist
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 1. Prüfe dass User authentifiziert ist (AuthGuard muss zuerst laufen)
    if (!request.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    // 2. Prüfe dass activeTenantId vorhanden ist
    const tenantId = request.activeTenantId || (request.headers['x-tenant-id'] as string);

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // 3. Verifiziere dass der User Mitglied des Tenants ist
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: request.user.id,
          tenantId,
        },
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    // 4. Hänge Membership Informationen an request an
    request.tenantId = tenantId;
    request.membership = {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      roleId: membership.roleId,
    };

    // 5. Setze TenantContext für Data Access Layer
    this.tenantContext.setTenantContext({
      tenantId,
      userId: request.user.id,
    });

    return true;
  }
}
