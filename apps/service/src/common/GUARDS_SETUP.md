# 🔐 Backend Security Guards und Decorators

Sichere und flexible Zugriffskontrolle für Multi-Tenant SaaS Systeme.

## 📋 Überblick

Das System bietet 3 aufeinanderfolgende Guards für umfassende Sicherheit:

```
Request
   ↓
[1] AuthGuard         → JWT validieren, User extrahieren
   ↓
[2] TenantAccessGuard → Tenant-Zugriff prüfen, Membership laden
   ↓
[3] PermissionsGuard  → Dynamische Permissions prüfen
   ↓
✅ Endpoint Handler
```

---

## 🛡️ Die 3 Guards

### 1. AuthGuard

**Verantwortung:**
- JWT aus `Authorization: Bearer <token>` Header auslesen
- Token Signature validieren mit `JWT_SECRET`
- Token-Inhalte dekodieren
- User-Daten an Request anhängen

**Request Properties gesetzt:**
```typescript
request.user = { id, email }
request.activeTenantId = "tenant-123"
request.roleId = "role-456"
request.token = "jwt-token"
```

**Fehler:**
- `UnauthorizedException` wenn Header fehlt
- `UnauthorizedException` wenn Token ungültig/abgelaufen
- `@Public()` Decorator überspringt diesen Guard

**Beispiel:**
```typescript
@UseGuards(AuthGuard)
@Get('/profile')
getProfile(@User() user: AuthenticatedUser) {
  return user;
}
```

---

### 2. TenantAccessGuard

**Verantwortung:**
- Prüfe dass User authentifiziert ist
- Lese Tenant ID aus `x-tenant-id` Header oder JWT
- Prüfe in DB dass User Mitglied dieses Tenants ist
- Verifiziere dass Membership mit Role vorhanden ist
- Laden Membership Info an Request

**Request Properties gesetzt:**
```typescript
request.tenantId = "tenant-123"
request.membership = {
  id: "membership-789",
  userId: "user-456",
  tenantId: "tenant-123",
  roleId: "role-456"
}
```

**Fehler:**
- `UnauthorizedException` wenn User nicht authentifiziert
- `ForbiddenException` wenn Tenant ID fehlt
- `ForbiddenException` wenn User nicht Mitglied des Tenants
- `@Public()` Decorator überspringt diesen Guard

**Beispiel:**
```typescript
@UseGuards(AuthGuard, TenantAccessGuard)
@Get('/projects')
getProjects(@ActiveTenant() tenantId: string) {
  return this.projectsService.find(tenantId);
}
```

---

### 3. PermissionsGuard

**Verantwortung:**
- Lese `@Permission` Decorator von der Route
- Lade Role mit Permissions aus DB
- Prüfe dass User die erforderliche Permission hat
- Unterstütze Wildcards (`*`)

**Permission Format in Role.permissions:**
```json
{
  "projects": ["create", "read", "update", "delete"],
  "users": ["read"],
  "settings": ["*"],
  "*": ["*"]  // Super Admin
}
```

**Fehler:**
- `ForbiddenException` wenn Permission fehlt
- Überspringt automatisch wenn kein `@Permission` Decorator

**Beispiel:**
```typescript
@UseGuards(AuthGuard, TenantAccessGuard, PermissionsGuard)
@Permission('projects', 'create')
@Post('/projects')
createProject(@Body() dto: CreateProjectDto) {
  return this.projectsService.create(dto);
}
```

---

## 🎯 Decorators

### @User()
Extrahiert aktuellen User: `{ id, email }`

```typescript
@Get('/me')
getMe(@User() user: AuthenticatedUser) {
  return user;
}
```

### @ActiveTenant()
Extrahiert aktuelle Tenant ID

```typescript
@Get('/projects')
getProjects(@ActiveTenant() tenantId: string) {
  return this.projectsService.find(tenantId);
}
```

### @Membership()
Extrahiert Membership Info: `{ id, userId, tenantId, roleId }`

```typescript
@Get('/my-role')
getMyRole(@Membership() membership: MembershipInfo) {
  return { roleId: membership.roleId };
}
```

### @Permission(resource, action)
Markiert Route mit erforderlichen Permissions

```typescript
@Permission('users', 'update')
@Patch('/users/:id')
updateUser(@Param('id') id: string) {
  // Guard prüft dass User "users:update" Permission hat
}
```

### @Public()
Überspringt AuthGuard und TenantAccessGuard

```typescript
@Public()
@Post('/auth/register')
register(@Body() dto: RegisterDto) {
  // Keine Authentication nötig
}
```

---

## 📝 Praktische Beispiele

### Beispiel 1: Public Endpoint
```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    // Kein Auth nötig
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    // Kein Auth nötig
  }
}
```

### Beispiel 2: Authenticated Endpoint
```typescript
@Controller('users')
export class UsersController {
  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@User() user: AuthenticatedUser) {
    return this.usersService.findOne(user.id);
  }
}
```

### Beispiel 3: Multi-Tenant Endpoint
```typescript
@Controller('projects')
@UseGuards(AuthGuard, TenantAccessGuard)
export class ProjectsController {
  @Get()
  list(@ActiveTenant() tenantId: string) {
    return this.projectsService.findByTenant(tenantId);
  }

  @Get(':id')
  getOne(
    @Param('id') id: string,
    @ActiveTenant() tenantId: string,
  ) {
    return this.projectsService.findOne(id, tenantId);
  }
}
```

### Beispiel 4: Permission-Protected Endpoint
```typescript
@Controller('projects')
@UseGuards(AuthGuard, TenantAccessGuard, PermissionsGuard)
export class ProjectsController {
  @Permission('projects', 'create')
  @Post()
  create(
    @ActiveTenant() tenantId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(dto, tenantId);
  }

  @Permission('projects', 'update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @ActiveTenant() tenantId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, dto, tenantId);
  }

  @Permission('projects', 'delete')
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @ActiveTenant() tenantId: string,
  ) {
    return this.projectsService.delete(id, tenantId);
  }
}
```

---

## ⚙️ Setup und Konfiguration

### 1. Environment Variablen

```bash
# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 2. App Module Registrierung

Guards sind global registriert in `app.module.ts`:

```typescript
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantAccessGuard,
    },
  ],
})
export class AppModule {}
```

### 3. PermissionsGuard Pro Route

PermissionsGuard ist NOT global (sonst müsste jede Public Route extra konfiguriert werden).

Verwende `@UseGuards(PermissionsGuard)` nur auf Routes die Permissions benötigen.

---

## 🔍 Error Handling

### Typical Error Responses

**Missing Auth Header:**
```json
{
  "statusCode": 401,
  "message": "Authorization header is missing",
  "error": "Unauthorized"
}
```

**Invalid Token:**
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

**Token Expired:**
```json
{
  "statusCode": 401,
  "message": "Token has expired",
  "error": "Unauthorized"
}
```

**No Tenant Access:**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this tenant",
  "error": "Forbidden"
}
```

**Permission Denied:**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to create projects",
  "error": "Forbidden"
}
```

---

## 🧪 Testing Guards

### Fake JWT für Tests

```typescript
import * as jwt from 'jsonwebtoken';

const testToken = jwt.sign(
  {
    id: 'user-123',
    email: 'test@example.com',
    activeTenantId: 'tenant-456',
    activeRoleId: 'role-789',
  },
  'test-secret'
);

const response = await request(app.getHttpServer())
  .get('/api/projects')
  .set('Authorization', `Bearer ${testToken}`)
  .set('x-tenant-id', 'tenant-456')
  .expect(200);
```

---

## 📚 Architektur-Diagramm

```
┌─────────────────────────────────┐
│     HTTP Request                │
│     Authorization: Bearer JWT   │
│     x-tenant-id: tenant-123     │
└──────────────┬──────────────────┘
               │
        ┌──────▼────────┐
        │  AuthGuard    │
        │  ✓ JWT Check  │ → request.user, activeTenantId
        │  ✓ Decode     │
        └──────┬────────┘
               │
        ┌──────▼──────────────┐
        │ TenantAccessGuard   │
        │ ✓ Membership Check  │ → request.tenantId, membership
        │ ✓ DB Lookup        │
        └──────┬──────────────┘
               │
        ┌──────▼────────────────┐
        │ PermissionsGuard      │
        │ ✓ @Permission Check   │ → Role.permissions JSON
        │ ✓ Action Allowed?     │
        └──────┬─────────────────┘
               │
        ┌──────▼────────────┐
        │ Route Handler     │
        │ @Get, @Post, etc. │ → ✅ Response
        └───────────────────┘
```

---

## 🚀 Production Checklist

- [ ] JWT_SECRET auf starkes Passwort setzen (mind. 32 Zeichen)
- [ ] JWT_EXPIRES_IN anpassen (z.B. 7d, 24h)
- [ ] CORS_ORIGIN nur auf Frontend Domain setzen
- [ ] HTTPS in Production verwenden
- [ ] Rate Limiting für Auth Endpoints
- [ ] Request Logging implementieren
- [ ] Error Monitoring (Sentry, etc.)
- [ ] Regular Token Rotation Policy
- [ ] Database Backups für Membership Daten
- [ ] Audit Logging für Permission Changes

---

## 🔗 Datei-Struktur

```
src/common/
├── guards/
│   ├── index.ts                    # Exports alle Guards
│   ├── auth.guard.ts              # JWT Validierung
│   ├── tenant-access.guard.ts      # Tenant Membership Check
│   ├── permissions.guard.ts        # Dynamic Permissions
│   └── tenant.guard.ts             # Legacy (veraltet)
├── decorators/
│   ├── index.ts                    # Exports alle Decorators
│   ├── user.decorator.ts           # @User()
│   ├── active-tenant.decorator.ts  # @ActiveTenant()
│   ├── membership.decorator.ts     # @Membership()
│   ├── permission.decorator.ts     # @Permission()
│   ├── public.decorator.ts         # @Public()
│   └── tenant.decorator.ts         # @TenantId() (legacy)
└── interceptors/
    └── (für zukünftige Logging/Monitoring)
```

---

## 📖 Weitere Ressourcen

- [NestJS Guards Doku](https://docs.nestjs.com/guards)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Multi-Tenancy Security](https://www.cloudflare.com/learning/security/what-is-multi-tenancy/)
