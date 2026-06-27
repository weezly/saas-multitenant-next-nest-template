/**
 * Security Guards und Decorators - Dokumentation und Verwendungsbeispiele
 *
 * Dieses Dokument zeigt wie die 3 Security Guards und Decorators verwendet werden.
 */

// =====================================================
// GUARDS: Execution Order und Verantwortung
// =====================================================

/**
 * 1. AuthGuard
 * - Extrahiert JWT aus "Authorization: Bearer <token>" Header
 * - Validiert Token Signature
 * - Setzt auf request: user, activeTenantId, roleId, token
 * - Wirft UnauthorizedException wenn JWT ungültig/fehlt
 *
 * 2. TenantAccessGuard
 * - Prüft dass activeTenantId vorhanden ist
 * - Prüft dass User Mitglied des Tenants ist (DB Lookup)
 * - Setzt auf request: tenantId, membership
 * - Wirft ForbiddenException wenn User keine Zugriff hat
 *
 * 3. PermissionsGuard
 * - Liest @Permission Decorator von der Route
 * - Prüft dass User die erforderliche Permission in seiner Role hat
 * - Wirft ForbiddenException wenn Permission fehlt
 * - Optional: nur wenn @Permission Decorator verwendet
 */

// =====================================================
// BEISPIEL 1: Public Route (Auth optional)
// =====================================================

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

// Hinweis: Keine Guards nötig, da AuthGuard nur auf authentifizierten Routes läuft

// =====================================================
// BEISPIEL 2: Protected Route - nur User Info
// =====================================================

import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards';
import { User } from '../common/decorators';
import { AuthenticatedUser } from '../common/guards/auth.guard';

@Controller('api/profile')
export class ProfileController {
  @UseGuards(AuthGuard)
  @Get()
  getProfile(@User() user: AuthenticatedUser) {
    return {
      id: user.id,
      email: user.email,
    };
  }
}

// =====================================================
// BEISPIEL 3: Multi-Tenant Route - mit Tenant Access
// =====================================================

import { TenantAccessGuard } from '../common/guards';
import { ActiveTenant, Membership, MembershipInfo } from '../common/decorators';

@Controller('api/tenants')
@UseGuards(AuthGuard, TenantAccessGuard)
export class TenantsController {
  @Get(':tenantId')
  getTenant(
    @ActiveTenant() tenantId: string,
    @Membership() membership: MembershipInfo,
  ) {
    return {
      tenantId,
      roleId: membership.roleId,
      message: `You are accessing tenant ${tenantId}`,
    };
  }
}

// =====================================================
// BEISPIEL 4: Protected Route - mit Permissions Check
// =====================================================

import { PermissionsGuard } from '../common/guards';
import { Permission } from '../common/decorators';

@Controller('api/projects')
@UseGuards(AuthGuard, TenantAccessGuard, PermissionsGuard)
export class ProjectsController {
  // User muss "projects:create" Permission haben
  @Permission('projects', 'create')
  @Post()
  createProject(
    @ActiveTenant() tenantId: string,
    @Body() createProjectDto: any,
  ) {
    return {
      message: 'Project created',
      tenantId,
    };
  }

  // User muss "projects:read" Permission haben
  @Permission('projects', 'read')
  @Get()
  getProjects(@ActiveTenant() tenantId: string) {
    return {
      message: 'Listing projects',
      tenantId,
    };
  }

  // User muss "projects:update" Permission haben
  @Permission('projects', 'update')
  @Patch(':projectId')
  updateProject(
    @ActiveTenant() tenantId: string,
    @Param('projectId') projectId: string,
  ) {
    return {
      message: 'Project updated',
      tenantId,
      projectId,
    };
  }

  // User muss "projects:delete" Permission haben
  @Permission('projects', 'delete')
  @Delete(':projectId')
  deleteProject(
    @ActiveTenant() tenantId: string,
    @Param('projectId') projectId: string,
  ) {
    return {
      message: 'Project deleted',
      tenantId,
      projectId,
    };
  }
}

// =====================================================
// PERMISSIONS Struktur in Role.permissions JSON
// =====================================================

/**
 * Beispiel Role mit Permissions:
 *
 * {
 *   "id": "role-123",
 *   "name": "Admin",
 *   "tenantId": "tenant-456",
 *   "permissions": {
 *     "projects": ["create", "read", "update", "delete"],
 *     "users": ["read", "update"],
 *     "settings": ["read", "update"]
 *   }
 * }
 *
 * Wildcard Support:
 * - "projects": ["*"] = alle Actions für projects
 * - "*": ["*"] = alle Permissions für alles (Super Admin)
 */

// =====================================================
// CLIENT: JWT Token erstellen und senden
// =====================================================

/**
 * 1. Frontend (NextAuth) generiert JWT mit:
 *    {
 *      "id": "user-123",
 *      "email": "user@example.com",
 *      "activeTenantId": "tenant-456",
 *      "activeRoleId": "role-789"
 *    }
 *
 * 2. Client sendet Request mit:
 *    Authorization: Bearer <jwt>
 *    x-tenant-id: tenant-456 (optional, falls nicht in JWT)
 *
 * 3. Server validiert und extrahiert Daten
 */

// =====================================================
// TESTING: Guards und Decorators testen
// =====================================================

/**
 * Unit Test Beispiel:
 *
 * describe('AuthGuard', () => {
 *   it('should extract user from valid JWT', () => {
 *     const token = jwt.sign(
 *       { id: 'user-123', email: 'user@test.com' },
 *       'secret'
 *     );
 *     const request = { headers: { authorization: `Bearer ${token}` } };
 *     const guard = new AuthGuard();
 *     const result = guard.canActivate(createExecutionContext(request));
 *     expect(result).toBe(true);
 *     expect(request.user.id).toBe('user-123');
 *   });
 * });
 */

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

/**
 * Erforderliche Environment Variablen:
 *
 * JWT_SECRET=your-secret-key-min-32-chars
 * JWT_EXPIRES_IN=7d
 * DATABASE_URL=postgresql://user:password@localhost:5432/db
 * CORS_ORIGIN=http://localhost:3000
 */

export {};
