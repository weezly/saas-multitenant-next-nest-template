# Tenant Switching mit NextAuth

Vollständiges System für Multi-Tenant Switching mit NextAuth JWT Strategy.

## 🎯 Übersicht

User können in mehreren Tenants Mitglied sein und zwischen ihnen wechseln:

1. **JWT Token** speichert aktuellen Tenant als `activeTenantId`
2. **Frontend API Route** `/api/auth/switch-tenant` prüft Zugriff
3. **Backend API** (`/api/users/me`) validiert Membership
4. **TenantContext** stellt globale Tenant-Informationen bereit

## 🔐 Sicherheit

```typescript
// Prüfung beim Tenant Switch:
1. User hat aktive Session (JWT Token) ✓
2. User ist Mitglied des Tenants (Backend Verification) ✓
3. Role wird aktualisiert (aus Membership) ✓
4. Neuer JWT wird signiert (NextAuth) ✓
```

## 📦 Installation

### 1. Dependencies installieren

```bash
pnpm install
pnpm install next-auth@5.0.0-beta.3 --filter=saas-app
```

### 2. Environment Variablen setzen

```bash
cd apps/app
cp .env.example .env.local
```

Konfiguriere:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

## 🏗️ Architektur

### Frontend (Next.js)

```
┌─ RootLayout
│  └─ SessionProvider (NextAuth)
│     └─ TenantProvider (Context)
│        └─ App Routes
│           └─ Components (useTenant, TenantSwitcher)
└─ API Routes
   ├─ /api/auth/[...nextauth] (NextAuth Handler)
   ├─ /api/auth/switch-tenant (Tenant Switch)
   ├─ /api/user/tenants (User's Tenants)
   └─ /api/user/memberships (User's Memberships)
```

### JWT Token Structure

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  activeTenantId: "tenant-uuid",  // 👈 Wichtig!
  activeRoleId: "role-uuid",      // 👈 Neue Role
  iat: 1234567890,
  exp: 1235674890
}
```

## 💻 Verwendung

### 1. NextAuth Setup

Die Konfiguration ist in `src/lib/auth.config.ts`:

```typescript
import { authOptions } from '@/lib/auth.config';
import NextAuth from 'next-auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 2. Session Provider in Layout

```typescript
<SessionProvider>
  <TenantProvider>
    {children}
  </TenantProvider>
</SessionProvider>
```

### 3. Tenant Context in Components

```typescript
'use client';

import { useTenantContext } from '@/context/TenantContext';
import { TenantSwitcher } from '@/components/TenantSwitcher';

export function Header() {
  const { activeTenantId, activeRoleId } = useTenantContext();

  return (
    <nav>
      <TenantSwitcher />
      <div>Current Tenant: {activeTenantId}</div>
      <div>Role: {activeRoleId}</div>
    </nav>
  );
}
```

### 4. Tenant Wechseln

```typescript
const { switchTenant, isLoading } = useTenantContext();

async function handleSwitch(tenantId: string) {
  try {
    await switchTenant(tenantId);
    // Erfolgreich gewechselt!
  } catch (error) {
    console.error('Switch failed:', error);
  }
}
```

## 🔄 Ablauf beim Tenant Switching

```
1. User klickt auf Tenant in TenantSwitcher
   ↓
2. Frontend sendet POST /api/auth/switch-tenant
   {
     "tenantId": "tenant-uuid"
   }
   ↓
3. Backend prüft:
   - User existiert (JWT)
   - User ist Mitglied des Tenants
   - Membership hat Role
   ↓
4. NextAuth JWT Callback wird triggered
   - Neuer JWT mit activeTenantId
   - Neuer JWT mit activeRoleId
   ↓
5. Session wird aktualisiert
   ↓
6. Frontend erhält erfolgreiche Response
   ↓
7. UI aktualisiert sich mit neuem Tenant
```

## 🛠️ API Endpoints

### POST /api/auth/switch-tenant

Wechselt zu einem anderen Tenant.

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/switch-tenant \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "tenant-uuid"}'
```

**Response (Success):**

```json
{
  "success": true,
  "tenantId": "tenant-uuid",
  "roleId": "role-uuid",
  "message": "Switched to tenant: tenant-uuid"
}
```

**Response (Error):**

```json
{
  "error": "Forbidden: User not member of tenant"
}
```

### GET /api/user/tenants

Gibt alle Tenants des Users zurück.

**Response:**

```json
{
  "success": true,
  "tenants": [
    {
      "id": "tenant-1-uuid",
      "name": "Acme Corp",
      "role": "Owner"
    },
    {
      "id": "tenant-2-uuid",
      "name": "Tech Startup",
      "role": "Admin"
    }
  ]
}
```

### GET /api/user/memberships

Gibt Membership Details.

**Response:**

```json
{
  "success": true,
  "memberships": [
    {
      "userId": "user-uuid",
      "tenantId": "tenant-uuid",
      "roleId": "role-uuid"
    }
  ]
}
```

## 🎨 UI Komponenten

### TenantSwitcher

Dropdown zum Wechseln zwischen Tenants.

```typescript
<TenantSwitcher />
```

Features:
- Zeigt aktuellen Tenant
- Dropdown mit allen verfügbaren Tenants
- Loading State während Wechsel
- Error Handling

### TenantInfo

Anzeige von aktuellem Tenant und Role.

```typescript
<TenantInfo />
// Output: "Acme Corp • Owner"
```

### TenantSelector

Grid zur Anzeige aller Tenants.

```typescript
<TenantSelector />
```

## 🔗 Hooks

### useTenant()

Simple Tenant Management.

```typescript
const {
  activeTenant,        // String: Tenant UUID
  activeRoleId,        // String: Role UUID
  availableTenants,    // Array: Verfügbare Tenants
  switchTenant,        // Function: Tenant wechseln
  isLoading,           // Boolean: Loading State
  error                // String: Error Message
} = useTenant();
```

### useTenantContext()

Zugriff auf globales Tenant Context.

```typescript
const {
  activeTenantId,      // String: Tenant UUID
  activeRoleId,        // String: Role UUID
  tenants,             // Array: Alle Tenants
  switchTenant,        // Function: Tenant wechseln
  isLoading,           // Boolean: Loading State
  error,               // String: Error Message
  refetchTenants       // Function: Tenants neu laden
} = useTenantContext();
```

### useTenantMemberships()

Fetch Memberships.

```typescript
const {
  memberships,         // Array: Memberships
  isLoading,           // Boolean: Loading State
  refetch              // Function: Neu laden
} = useTenantMemberships();
```

## 🔐 Backend Integration

Der Frontend benötigt folgende Backend Endpoints:

### GET /api/users/me

Gibt aktuellen User mit Memberships zurück.

```typescript
// Response
{
  "id": "user-uuid",
  "email": "user@example.com",
  "memberships": [
    {
      "userId": "user-uuid",
      "tenantId": "tenant-uuid",
      "roleId": "role-uuid",
      "tenant": {
        "id": "tenant-uuid",
        "name": "Acme Corp"
      },
      "role": {
        "id": "role-uuid",
        "name": "Owner",
        "permissions": {...}
      }
    }
  ]
}
```

### GET /api/tenants/:id/members

Prüft Membership des Users.

```typescript
// Header: x-tenant-id, x-user-id
// Response
{
  "memberships": [
    {
      "userId": "user-uuid",
      "tenantId": "tenant-uuid",
      "roleId": "role-uuid"
    }
  ]
}
```

## 📝 Implementierungs-Checkliste

- [ ] NextAuth installiert
- [ ] Environment Variablen konfiguriert
- [ ] `auth.config.ts` mit Tenant Callbacks
- [ ] `SessionProvider` im RootLayout
- [ ] `TenantProvider` im RootLayout
- [ ] `/api/auth/switch-tenant` Route
- [ ] `/api/user/tenants` Route
- [ ] `/api/user/memberships` Route
- [ ] `TenantSwitcher` Component in Header
- [ ] Backend `/api/users/me` Endpoint
- [ ] Backend `/api/tenants/:id/members` Endpoint

## 🚀 Production Checklist

- [ ] `NEXTAUTH_SECRET` aktualisiert (neuer zufälliger String)
- [ ] `NEXTAUTH_URL` auf Production Domain gesetzt
- [ ] `NEXT_PUBLIC_API_URL` auf Backend URL gesetzt
- [ ] OAuth Provider konfiguriert (optional)
- [ ] Session timeout korrekt gesetzt
- [ ] HTTPS aktiviert
- [ ] Error Handling für offline Backend
- [ ] Rate limiting für Tenant Switch
- [ ] Audit Logging für Tenant Wechsel

## 🐛 Troubleshooting

### Session aktualisiert sich nicht

Stelle sicher, dass `SessionProvider` im RootLayout ist:

```typescript
<SessionProvider>
  {children}
</SessionProvider>
```

### Tenant Wechsel schlägt fehl

Prüfe:
1. Backend `/api/users/me` Endpoint antwortet
2. Header `x-user-id` wird gesetzt
3. User ist wirklich Mitglied des Tenants
4. Backend gibt Memberships zurück

### JWT Cookie wird nicht gesetzt

Prüfe:
1. `NEXTAUTH_SECRET` ist gesetzt
2. `NEXTAUTH_URL` stimmt mit Frontend URL überein
3. HTTPS in Production

## 📚 Weitere Ressourcen

- [NextAuth.js Docs](https://next-auth.js.org/)
- [JWT Callbacks](https://next-auth.js.org/configuration/callbacks/jwt)
- [Session Callbacks](https://next-auth.js.org/configuration/callbacks/session)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
