/**
 * Roles Controller
 *
 * Endpoints:
 * POST   /api/roles              - Erstelle neue Role
 * GET    /api/roles              - Alle Roles des Tenants
 * GET    /api/roles/:id          - Details
 * PATCH  /api/roles/:id          - Update Permissions
 * DELETE /api/roles/:id          - Lösche Role
 */

import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard, TenantAccessGuard } from '@service/common/guards';
import { User, ActiveTenant } from '@service/common/decorators';
import { AuthenticatedUser } from '@service/common/guards/auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('api/roles')
@UseGuards(AuthGuard, TenantAccessGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * POST /api/roles
   * Erstelle neue Role im Tenant
   * Nur für Admins
   */
  @Post()
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.rolesService.create(createRoleDto, user.id);
  }

  /**
   * GET /api/roles
   * Hole alle Roles des Tenants
   */
  @Get()
  async findAll(@ActiveTenant() tenantId: string) {
    return this.rolesService.findAll();
  }

  /**
   * GET /api/roles/:id
   * Hole Details einer Role mit Members
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
    return this.rolesService.findOne(id);
  }

  /**
   * PATCH /api/roles/:id
   * Update Role Name oder Permissions
   * Nur für Admins
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.rolesService.update(id, user.id, updateRoleDto);
  }

  /**
   * DELETE /api/roles/:id
   * Lösche Role
   * Nur für Admins
   * Nur wenn keine User diese Role haben
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.rolesService.delete(id, user.id);
  }
}
