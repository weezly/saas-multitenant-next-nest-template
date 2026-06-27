# 🚀 Frontend - Multi-Tenant SaaS Application

## 📋 Übersicht

Ein modernes Next.js 15+ Frontend für Multi-Tenant SaaS Anwendungen mit:

- ✅ **NextAuth Integration** - Sichere Authentication mit JWT
- ✅ **Route Protection** - Middleware für geschützte Routes
- ✅ **Responsive UI** - TailwindCSS Components
- ✅ **Multi-Tenant Support** - Tenant-Switching & Context
- ✅ **API Integration** - Hooks für Backend-Kommunikation

## 🏗️ Struktur

```
/src
├── /app                          # App Router Pages
│   ├── page.tsx                  # Redirect to login/dashboard
│   ├── layout.tsx                # Root layout (SessionProvider, TenantProvider)
│   ├── /login                    # Login page (public)
│   │   ├── page.tsx             # Credentials & OAuth
│   │   └── layout.tsx           # Login layout
│   ├── /dashboard                # Dashboard (protected)
│   │   ├── page.tsx             # Main dashboard with stats
│   │   └── layout.tsx           # Dashboard layout
│   ├── /projects                 # Projects management (protected)
│   │   ├── page.tsx             # Projects list & create form
│   │   └── layout.tsx           # Projects layout
│   └── /settings                 # Settings & team management (protected)
│       ├── page.tsx             # General, Members, Roles tabs
│       └── layout.tsx           # Settings layout
│
├── /components                   # Reusable React Components
│   ├── /ui                       # Unstyled UI Components
│   │   ├── Button.tsx           # Button component
│   │   ├── Input.tsx            # Input component
│   │   ├── Card.tsx             # Card component
│   │   ├── Badge.tsx            # Badge component
│   │   └── Table.tsx            # Table component
│   ├── /layout                   # Layout Components
│   │   ├── Header.tsx           # Header with user info & logout
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── DashboardLayout.tsx  # Main dashboard layout wrapper
│   │   └── TenantSwitcher.tsx   # Tenant switching component
│   └── TenantSwitcher.tsx        # Existing tenant switcher
│
├── /lib                          # Utilities & Helpers
│   ├── /api
│   │   └── client.ts            # API hooks (useTenants, useProjects, etc.)
│   ├── auth.ts                  # Authentication utilities
│   ├── auth.config.ts           # NextAuth v5 configuration
│   └── auth.types.ts            # Auth types
│
├── /hooks                        # Custom React Hooks
│   └── (to be added as needed)
│
├── /context
│   └── TenantContext.tsx         # Tenant context provider (existing)
│
├── /styles
│   └── globals.css              # Global styles & TailwindCSS
│
└── /public                       # Static files

middleware.ts                     # Next.js middleware for route protection
```

## 🔐 Authentication Flow

### Login Page (`/login`)

**Features:**

- Credentials-based login (email + password)
- Error handling and validation
- Redirect to dashboard on success
- Demo credentials display

**Implementation:**

```typescript
// Login with NextAuth
const result = await signIn('credentials', {
  email,
  password,
  redirect: false,
});
```

### Protected Routes

**Middleware** (`middleware.ts`):

```typescript
// Protects these routes:
- /dashboard/*
- /projects/*
- /settings/*
```

**Guard:**

```typescript
// Redirects to /login if not authenticated
if (!token) {
  return redirect('/login');
}
```

## 📊 Pages

### 1️⃣ Login Page (`/login`)

- Email & Password input fields
- Sign-in button
- Demo credentials display
- Error messaging

### 2️⃣ Dashboard (`/dashboard`)

- Stats cards (Projects, Members, Roles)
- Tenant info display
- Tenant switching component
- Quick action links

### 3️⃣ Projects (`/projects`)

- List all projects with filters
- Create project form
- Status badges (active, planning, archived)
- Edit/delete actions (buttons ready)

### 4️⃣ Settings (`/settings`)

- **General Tab**: Tenant info & settings
- **Members Tab**: Invite members + team list
- **Roles Tab**: Manage roles & permissions

## 🎨 UI Components

### Button

```typescript
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
// Variants: primary | secondary | danger | ghost
// Sizes: sm | md | lg
```

### Input

```typescript
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  error={errors.email}
/>
```

### Card

```typescript
<Card title="Title" subtitle="Optional subtitle">
  Content here
</Card>
```

### Badge

```typescript
<Badge variant="success">Active</Badge>
// Variants: default | success | warning | danger | info
```

### Table

```typescript
<Table
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ]}
  data={data}
  onRowClick={handleRow}
/>
```

## 🔗 API Integration

### Hooks

```typescript
// Fetch and create projects
const { fetchProjects, createProject, updateProject, deleteProject } = useProjects();

// Fetch and manage team members
const { fetchMembers, inviteMember } = useMemberships();

// Fetch roles
const { fetchRoles } = useRoles();

// Fetch tenants
const { fetchTenants } = useTenants();
```

### Example Usage

```typescript
'use client';

import { useProjects } from '@/lib/api/client';
import { useEffect, useState } from 'react';

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const { fetchProjects, createProject } = useProjects();

  useEffect(() => {
    async function load() {
      const data = await fetchProjects({ status: 'active' });
      setProjects(data);
    }
    load();
  }, []);

  const handleCreate = async () => {
    const newProject = await createProject({
      name: 'New Project',
      status: 'planning',
    });
    setProjects([...projects, newProject]);
  };

  return (
    // ... JSX
  );
}
```

## 🚀 Development

### Installation

```bash
cd apps/app
pnpm install
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
pnpm build
pnpm start
```

## 🔒 Security

### NextAuth Configuration

- Uses JWT tokens for session management
- Validates tokens on protected routes
- Stores active tenant ID in token
- Automatic token refresh on updates

### Route Protection

- Middleware validates authentication before route access
- Unauthorized users redirected to `/login`
- Protected routes: `/dashboard`, `/projects`, `/settings`

### Multi-Tenant Safety

- All API calls include `x-tenant-id` header
- Active tenant ID stored in session
- Tenant context available to all components

## 📝 Credentials Login

For development/testing:

```
Email: demo@example.com
Password: password123
```

## 🔄 Tenant Switching

The `TenantSwitcher` component (in `/components/TenantSwitcher.tsx`) handles tenant switching:

```typescript
// Calls updateSession() to update JWT token
// Refreshes active tenant in session
// Updates x-tenant-id header for future API calls
```

## 🎯 Next Steps

- [ ] Implement real OAuth providers (Google, GitHub)
- [ ] Add project details/board views
- [ ] Implement project tasks management
- [ ] Add user profile settings
- [ ] Implement audit logs view
- [ ] Add notifications system
- [ ] Create admin dashboard
- [ ] Add email notifications for invites
- [ ] Implement permission checking in UI
- [ ] Add analytics dashboard

## 📚 References

- [Next.js App Router](https://nextjs.org/docs/app)
- [NextAuth v5](https://next-auth.js.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Hooks](https://react.dev/reference/react/hooks)

---

**Version:** 0.1.0  
**Last Updated:** 2026-06-27
