import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { UserService } from './users.service';
import { AuthGuard, TenantAccessGuard, PermissionsGuard } from '@service/common/guards';
import { User, ActiveTenant, Membership, MembershipInfo, Public } from '@service/common/decorators';
import { AuthenticatedUser } from '@service/common/guards/auth.guard';

@Controller('api/users')
export class UsersController {
  constructor(private userService: UserService) {}

  /**
   * Get current user profile (requires auth)
   * GET /api/users/me
   */
  @UseGuards(AuthGuard)
  @Get('me')
  async getCurrentUser(@User() user: AuthenticatedUser) {
    return this.userService.getUserWithTenants(user.id);
  }

  /**
   * Get user's tenants and memberships (requires auth + tenant access)
   * GET /api/users/tenants
   */
  @UseGuards(AuthGuard, TenantAccessGuard)
  @Get('tenants')
  async getUserTenants(@User() user: AuthenticatedUser, @ActiveTenant() tenantId: string) {
    return this.userService.getUserTenants(user.id, tenantId);
  }

  /**
   * Get membership info for current user in tenant
   * GET /api/users/membership
   */
  @UseGuards(AuthGuard, TenantAccessGuard)
  @Get('membership')
  async getMembership(@Membership() membership: MembershipInfo) {
    return {
      id: membership.id,
      tenantId: membership.tenantId,
      roleId: membership.roleId,
      userId: membership.userId,
    };
  }

  /**
   * Verify user has specific permission (example)
   * POST /api/users/check-permission
   * Body: { resource: string, action: string }
   */
  @UseGuards(AuthGuard, TenantAccessGuard)
  @Post('check-permission')
  async checkPermission(
    @User() user: AuthenticatedUser,
    @Membership() membership: MembershipInfo,
    @Body() { resource, action }: { resource: string; action: string }
  ) {
    return this.userService.hasPermission(user.id, membership.tenantId, resource, action);
  }
}
