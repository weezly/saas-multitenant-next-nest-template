/**
 * Projects Controller
 *
 * Endpoints:
 * POST   /api/projects            - Erstelle neues Project
 * GET    /api/projects            - Alle Projects des Tenants
 * GET    /api/projects/:id        - Details
 * PATCH  /api/projects/:id        - Update
 * DELETE /api/projects/:id        - Lösche
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard, TenantAccessGuard } from '@service/common/guards';
import { User, ActiveTenant } from '@service/common/decorators';
import { AuthenticatedUser } from '@service/common/guards/auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('api/projects')
@UseGuards(AuthGuard, TenantAccessGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * POST /api/projects
   * Erstelle neues Project im aktuellen Tenant
   */
  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  /**
   * GET /api/projects
   * Hole alle Projects des Tenants
   * Optional: Filter nach status oder ownerId
   */
  @Get()
  async findAll(
    @ActiveTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('ownerId') ownerId?: string
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (ownerId) filters.ownerId = ownerId;

    return this.projectsService.findAll(filters);
  }

  /**
   * GET /api/projects/:id
   * Hole Details eines Projects
   * Automatisch tenantId-gefiltert
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @ActiveTenant() tenantId: string) {
    return this.projectsService.findOne(id);
  }

  /**
   * PATCH /api/projects/:id
   * Update Project Details
   * Nur für Owner oder Admin
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.projectsService.update(id, user.id, updateProjectDto);
  }

  /**
   * DELETE /api/projects/:id
   * Lösche Project komplett
   * Nur für Owner oder Admin
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
    @ActiveTenant() tenantId: string
  ) {
    return this.projectsService.delete(id, user.id);
  }
}
