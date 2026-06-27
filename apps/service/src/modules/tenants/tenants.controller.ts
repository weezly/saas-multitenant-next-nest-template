/**
 * Tenants Controller
 *
 * Endpoints:
 * POST   /api/tenants             - Erstelle neuen Tenant
 * GET    /api/tenants             - Meine Tenants
 * GET    /api/tenants/:id         - Details
 * PATCH  /api/tenants/:id         - Update
 * DELETE /api/tenants/:id         - Lösche
 */

import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '@service/common/guards/auth.guard';
import { User, Public } from '@service/common/decorators';
import { AuthenticatedUser } from '@service/common/guards/auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('api/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * POST /api/tenants
   * Erstelle neuen Tenant
   * Nur authentifizierte User
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createTenantDto: CreateTenantDto, @User() user: AuthenticatedUser) {
    return this.tenantsService.create(createTenantDto, user.id);
  }

  /**
   * GET /api/tenants
   * Hole alle Tenants des Users (basierend auf Memberships)
   * Nur authentifizierte User
   */
  @Get()
  @UseGuards(AuthGuard)
  async findAll(@User() user: AuthenticatedUser) {
    return this.tenantsService.findAllForUser(user.id);
  }

  /**
   * GET /api/tenants/:id
   * Hole Details eines Tenants
   * Nur wenn User Mitglied ist
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async findOne(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.tenantsService.findOne(id, user.id);
  }

  /**
   * PATCH /api/tenants/:id
   * Update Tenant Details
   * Nur für Admins
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @User() user: AuthenticatedUser
  ) {
    return this.tenantsService.update(id, user.id, updateTenantDto);
  }

  /**
   * DELETE /api/tenants/:id
   * Lösche Tenant komplett
   * Nur für Admins
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string, @User() user: AuthenticatedUser) {
    return this.tenantsService.delete(id, user.id);
  }
}
