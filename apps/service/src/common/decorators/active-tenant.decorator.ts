/**
 * ActiveTenant Decorator - Extrahiert aktuelle Tenant ID aus Request
 *
 * Verwendung:
 * getProjects(@ActiveTenant() tenantId: string) {
 *   return this.projectsService.findByTenant(tenantId);
 * }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId || request.activeTenantId || request.headers['x-tenant-id'];
  },
);
