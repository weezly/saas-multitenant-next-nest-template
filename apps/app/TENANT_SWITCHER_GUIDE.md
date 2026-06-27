# 🏢 Tenant Switcher - Multi-Tenant Management

## 📋 Übersicht

Das Tenant Switcher System ermöglicht es Benutzern, nahtlos zwischen mehreren Organisationen (Tenants) zu wechseln. Alle Daten sind automatisch pro Tenant isoliert.

## 🎯 Features

✅ **Multi-Tenant Support** - User kann in mehreren Organisationen Mitglied sein  
✅ **Instant Switching** - Schneller Wechsel ohne Neuladen  
✅ **Active Tenant Highlighting** - Visuelles Feedback für aktiven Tenant  
✅ **Role Display** - Zeige User-Rolle in jedem Tenant  
✅ **Error Handling** - Graceful Error Messages & Fallbacks  
✅ **Demo Mode** - Funktioniert auch ohne Backend

## 🏗️ Architektur

### Context-basiertes State Management

```
TenantProvider (Global State)
  ├─ activeTenantId (aktive Tenant ID)
  ├─ activeRoleId (aktive Role ID)
  ├─ tenants[] (alle Tenants des Users)
  ├─ isLoading (Loading State)
  ├─ error (Error Message)
  ├─ switchTenant(tenantId) (API Call)
  └─ refetchTenants() (Refresh)
```

### Komponenten

```
├─ TenantSwitcher          (Dropdown - Primary UX)
├─ TenantInfo              (Display - Read-only Info)
└─ TenantSelector          (Grid View - Selection Modal)
```

## 🔄 Flow: Tenant Wechsel

```
User klickt Tenant
  ↓
TenantSwitcher Button Click Handler
  ↓
switchTenant(tenantId) aufgerufen
  ↓
API Call: POST /api/auth/switch-tenant
  ↓
Backend verifizt Zugriff
  ↓
NextAuth Session aktualisiert
  ↓
activeTenantId in JWT Token geändert
  ↓
Alle zukünftigen API Calls verwenden neuen Tenant
  ↓
UI aktualisiert mit neuen Daten
```

## 📝 Komponenten-Übersicht

### 1️⃣ TenantSwitcher (Dropdown)

**Best For**: Navigation Bar, Header, Primary Switch UI

```tsx
import { TenantSwitcher } from '@/components/TenantSwitcher';

export function Header() {
  return (
    <header className="px-6 py-4">
      <div className="max-w-md">
        <TenantSwitcher />
      </div>
    </header>
  );
}
```

**Features**:

- Dropdown Liste aller Tenants
- Icon & Loading States
- Aktiven Tenant hervorheben
- Error Message Display
- Außen-Click zum Schließen

**Props**: Keine (nutzt TenantContext)

### 2️⃣ TenantInfo (Display)

**Best For**: Sidebar, Dashboard Info Panel, Read-only Display

```tsx
import { TenantInfo } from '@/components/TenantSwitcher';

export function Sidebar() {
  return (
    <aside className="bg-gray-900 text-white p-6">
      <h1>SaaS App</h1>
      <TenantInfo />
    </aside>
  );
}
```

**Features**:

- Zeigt aktuellen Tenant
- Zeigt User-Rolle
- Kompaktes Design
- Read-only (kein Switching)

**Props**: Keine (nutzt TenantContext)

### 3️⃣ TenantSelector (Grid)

**Best For**: Onboarding, Tenant Selection Modal, Multi-Select View

```tsx
import { TenantSelector } from '@/components/TenantSwitcher';

export function TenantSelectModal() {
  return (
    <div className="p-8">
      <h2>Select Your Organization</h2>
      <TenantSelector />
    </div>
  );
}
```

**Features**:

- Grid Layout (1-2 Spalten)
- Große Cards mit Info
- Loading Animation
- Aktiven Tenant highlighting

**Props**: Keine (nutzt TenantContext)

## 🔐 Sicherheit

### Tenant Isolation

1. **Frontend**: `x-tenant-id` Header in allen API Calls
2. **Backend**: Middleware filtert Daten automatisch
3. **Session**: ActiveTenantId im JWT Token
4. **Verification**: Server verifyzt Zugriff vor Switch

### Guard Rails

```typescript
// API Route: POST /api/auth/switch-tenant
// 1. Authentifizierung via NextAuth Session
// 2. Verifikation: User ist Mitglied von Tenant
// 3. Authorization: Tenant switch erlaubt
// 4. Session Update: JWT Token aktualisiert
```

## 🔗 Integration mit Backend

### API Endpoints

#### 1. GET `/api/user/tenants`

Fetche alle Tenants für aktuellen User

```bash
curl http://localhost:3000/api/user/tenants
```

**Response**:

```json
{
  "success": true,
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "Acme Corp",
      "role": "Admin",
      "description": "..."
    }
  ]
}
```

#### 2. POST `/api/auth/switch-tenant`

Wechsel zu anderem Tenant

```bash
curl -X POST http://localhost:3000/api/auth/switch-tenant \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "tenant-uuid"}'
```

**Response**:

```json
{
  "success": true,
  "tenantId": "tenant-uuid",
  "roleId": "admin",
  "message": "Switched to tenant: ..."
}
```

## 🧪 Demo Mode

Wenn Backend nicht verfügbar, nutzt System Demo-Tenants:

```typescript
// Demo Tenants in API Routes
const demoTenants = [
  {
    id: 'tenant-demo-1',
    name: 'Acme Corporation',
    role: 'Admin',
  },
  {
    id: 'tenant-demo-2',
    name: 'Side Project Inc',
    role: 'Member',
  },
];
```

**Aktivierung**:

1. Backend URL nicht erreichbar
2. API Routes verwenden Demo-Tenants
3. Switching funktioniert vollständig
4. Keine echten Daten betroffen

## 📚 Hooks & Context

### useTenantContext()

```typescript
const {
  activeTenantId, // Aktuelle Tenant ID
  activeRoleId, // Aktuelle Role ID
  tenants, // Array alle Tenants
  isLoading, // Loading State
  error, // Error Message
  switchTenant, // Async Function
  refetchTenants, // Refresh Tenants
} = useTenantContext();
```

### useTenant() (Legacy Hook)

```typescript
const {
  activeTenant, // Aktuelle Tenant ID
  isMultiTenant, // User hat mehrere Tenants
  availableTenants, // Array alle Tenants
  switchTenant, // Async Function
  isLoading, // Loading State
  error, // Error Message
} = useTenant();
```

## 🎨 Styling

Komponenten verwenden:

- **TailwindCSS** für Base Styles
- **Custom Colors**: blue-600 (primary)
- **Responsive**: Mobile-first Design
- **Dark Mode**: Partially (kann erweitert werden)

## 🔄 Datenfluss

### 1. Initial Load

```
App starts
  ↓
TenantProvider mounted
  ↓
refetchTenants() aufgerufen
  ↓
GET /api/user/tenants
  ↓
Tenants geladen in State
  ↓
activeTenantId aus Session gesetzt
  ↓
UI rendert mit aktivem Tenant
```

### 2. Tenant Switch

```
User wählt Tenant
  ↓
handleSwitch() aufgerufen
  ↓
POST /api/auth/switch-tenant
  ↓
Backend verifiziert Zugriff
  ↓
Response mit roleId
  ↓
Session über NextAuth updated
  ↓
TenantContext State updated
  ↓
Alle abhängigen Components re-rendern
```

## ⚡ Performance

### Optimierungen

1. **Caching**: Tenants werden gecacht (bis refetch)
2. **Lazy Loading**: API Calls nur wenn nötig
3. **Memoization**: Komponenten-Props sind stable
4. **Debouncing**: Keine Duplicate Switches

## 🧪 Testing

### Unit Tests

```typescript
// Test: Tenant Switch erfolgreich
test('should switch tenant', async () => {
  const { result } = renderHook(() => useTenantContext());

  await act(async () => {
    await result.current.switchTenant('tenant-2');
  });

  expect(result.current.activeTenantId).toBe('tenant-2');
});
```

### Integration Tests

```typescript
// Test: TenantSwitcher Dropdown
test('should show dropdown when clicked', () => {
  render(<TenantSwitcher />);

  const button = screen.getByRole('button');
  fireEvent.click(button);

  expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
});
```

## 🚀 Roadmap

- [ ] Tenant Favorite/Pin Feature
- [ ] Tenant Search/Filter
- [ ] Recently Used Tenants
- [ ] Tenant Admin Dashboard
- [ ] Bulk Organization Management
- [ ] SSO für Multi-Tenant
- [ ] Analytics per Tenant
- [ ] Audit Logs per Tenant

## 📖 Weitere Ressourcen

- [TenantContext Documentation](../../context/TenantContext.tsx)
- [useTenant Hook](../../hooks/useTenant.ts)
- [Frontend Guide](../FRONTEND_GUIDE.md)
- [Backend API Documentation](../../../service/src/modules/API_MODULES_GUIDE.md)

## 🐛 Troubleshooting

### Tenant Switch funktioniert nicht

1. **Check**: NextAuth Session aktiv?

   ```typescript
   const { data: session } = useSession();
   console.log(session); // sollte user mit ID zeigen
   ```

2. **Check**: Backend erreichbar?

   ```bash
   curl http://localhost:3001/api/tenants
   ```

3. **Check**: User ist Mitglied von Tenant?
   ```bash
   curl http://localhost:3001/api/memberships
   ```

### Tenants werden nicht geladen

1. **Check** API Response:

   ```typescript
   const response = await fetch('/api/user/tenants');
   const data = await response.json();
   console.log(data); // sollte tenants Array zeigen
   ```

2. **Check** Browser Console auf Errors
3. **Check** Network Tab auf Failed Requests

### Session wird nicht aktualisiert

1. **Check**: NextAuth configured korrekt?
   - Siehe `apps/app/src/lib/auth.config.ts`

2. **Check**: JWT Callback hat activeTenantId?
   - Siehe `authOptions.callbacks.jwt`

3. **Check**: Session Callback gibt User Data zurück?
   - Siehe `authOptions.callbacks.session`

---

**Version**: 0.1.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2026-06-27
