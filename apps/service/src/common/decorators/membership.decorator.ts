/**
 * Membership Decorator - Extrahiert Membership Info aus Request
 *
 * Membership enthält:
 * - id: Membership ID
 * - userId: User ID
 * - tenantId: Tenant ID
 * - roleId: Role ID
 *
 * Verwendung:
 * getMyMembership(@Membership() membership: MembershipInfo) {
 *   return { tenantId: membership.tenantId, roleId: membership.roleId };
 * }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface MembershipInfo {
  id: string;
  userId: string;
  tenantId: string;
  roleId: string;
}

export const Membership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MembershipInfo | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.membership;
  },
);
