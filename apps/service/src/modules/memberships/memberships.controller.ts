/**
 * Memberships Controller
 *
 * Endpoints:
 * GET    /api/memberships         - Alle Members des Tenants
 * GET    /api/memberships/:id     - Details
 * POST   /api/memberships/invite  - Invite Member
 * PATCH  /api/memberships/:id     - Update Role
 * DELETE /api/memberships/:id     - Remove Member
 */

import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { AuthGuard, TenantAccessGuard } from '@service/common/guards';
import { User, ActiveTenant } from '@service/common/decorators';
import { AuthenticatedUser } from '@service/common/guards/auth.guard';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Controller('api/memberships')
@UseGuards(AuthGuard, TenantAccessGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * GET /api/memberships
   * Hole alle Members des Tenants
   */
  @Get()
  async findAll(@ActiveTenant() tenantId: string) {
    return this.membershipsService.findAll();
  }

  /**
   * GET /api/memberships/:id
   * Hole Details eines Memberships
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
    return this.membershipsService.findOne(id);
  }

  /**
   * POST /api/memberships/invite
   * Invite neuen Member zum Tenant
   * Nur für Admins
   */
  @Post('invite')
  async invite(
    @Body() inviteMemberDto: InviteMemberDto,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.membershipsService.invite(inviteMemberDto, user.id);
  }

  /**
   * PATCH /api/memberships/:id
   * Update Member Role
   * Nur für Admins
   */
  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.membershipsService.updateRole(id, updateMembershipDto, user.id);
  }

  /**
   * DELETE /api/memberships/:id
   * Remove Member aus Tenant
   * Nur für Admins
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.membershipsService.remove(id, user.id);
  }
}
