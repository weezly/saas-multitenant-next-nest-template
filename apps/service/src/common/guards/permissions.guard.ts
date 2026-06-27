/**
 * Permissions Guard
 *
 * Verantwortung:
 * - Liest @Permission() Metadata von der Route
 * - Prüft dass der User die erforderliche Permission hat
 * - Unterstützt Wildcard (*) für "alle Permissions"
 * - Nutzt Role.permissions JSON für flexible Permissions
 *
 * Verwendung:
 * @UseGuards(AuthGuard, TenantAccessGuard, PermissionsGuard)
 * @Permission('projects', 'create')
 * createProject() { }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata {
  resource: string;
  action: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extrahiere Permission Metadata von Route
    const permission = this.reflector.get<PermissionMetadata>(
      PERMISSION_KEY,
      context.getHandler(),
    );

    // Wenn keine Permission definiert ist, erlaube Zugriff
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // 2. Prüfe dass User und Tenant vorhanden sind
    if (!request.user?.id || !request.tenantId) {
      throw new ForbiddenException('User or tenant information missing');
    }

    if (!request.membership?.roleId) {
      throw new ForbiddenException('User role information missing');
    }

    // 3. Hole Role mit Permissions
    const role = await this.prisma.role.findUnique({
      where: {
        id: request.membership.roleId,
      },
    });

    if (!role) {
      throw new HttpException(
        'Role not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // 4. Prüfe Permissions
    const hasPermission = this.checkPermission(
      role.permissions as Record<string, string[]>,
      permission.resource,
      permission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `You do not have permission to ${permission.action} ${permission.resource}`,
      );
    }

    return true;
  }

  private checkPermission(
    permissions: Record<string, string[]>,
    resource: string,
    action: string,
  ): boolean {
    // Wildcard: Owner oder Admin hat alle Permissions
    if (permissions['*']?.includes('*')) {
      return true;
    }

    // Prüfe spezifische Resource und Action
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) {
      return false;
    }

    // Wildcard: alle Actions für diese Resource
    if (resourcePermissions.includes('*')) {
      return true;
    }

    // Spezifische Action
    return resourcePermissions.includes(action);
  }
}
