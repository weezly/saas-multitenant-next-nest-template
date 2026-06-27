# 🔐 Role & Permission Management - Complete Guide

## Overview

This comprehensive role and permission management system for Next.js frontend enables team admins to:

✅ Create custom roles with granular permissions  
✅ Edit role names, descriptions, and permissions  
✅ Assign roles to team members  
✅ Delete unused roles (if no members assigned)  
✅ View detailed permission assignments per role

## Architecture

### 📁 File Structure

```
/src
  /app
    /settings/roles/
      page.tsx                 # Main roles management page
  /components
    /roles/
      PermissionsEditor.tsx   # Interactive permissions editor
      RoleForm.tsx            # Create/edit role form
      RolesList.tsx           # Display and manage roles
      RoleDeleteDialog.tsx    # Delete confirmation modal
      RoleDetailsModal.tsx    # View role details in modal
      index.ts                # Component exports
    /ui/
      Table.tsx               # Enhanced with generic types & render functions
  /lib/api/
    client.ts                 # Updated useRoles hook with full CRUD
```

### 🎨 Key Components

#### 1. **PermissionsEditor.tsx**

Interactive permissions manager with organized sections:

```typescript
// Features:
- 4 permission categories (Projects, Team, Roles, Settings)
- Checkbox selection for each permission
- Expandable/collapsible sections
- Bulk grant/revoke per section
- Read-only mode for viewing
```

**Available Permissions:**

```json
{
  "Projects": ["projects.read", "projects.create", "projects.update", "projects.delete"],
  "Team": ["members.read", "members.invite", "members.update", "members.remove"],
  "Roles & Permissions": ["roles.read", "roles.create", "roles.update", "roles.delete"],
  "Settings": ["settings.read", "settings.update"]
}
```

#### 2. **RoleForm.tsx**

Form for creating and editing roles:

```typescript
// Props:
interface RoleFormProps {
  initialData?: { id, name, description, permissions };
  onSubmit: (data) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

// Form fields:
- Role Name (required)
- Description (optional)
- Permissions (via PermissionsEditor)
```

#### 3. **RolesList.tsx**

Table displaying all roles with metadata:

```typescript
// Columns:
- Role Name (+ description if exists)
- Permission Count
- Member Count
- Actions (View, Edit, Delete)

// Features:
- Row selection with visual highlight
- Empty state messaging
- Loading state with spinner
```

#### 4. **RoleDeleteDialog.tsx**

Confirmation modal before deletion:

```typescript
// Displays:
- Warning icon and message
- Member count assigned to role
- Warning if members exist
- Confirm/Cancel buttons
- Delete button disabled if members assigned
```

#### 5. **RoleDetailsModal.tsx**

Read-only modal to view full role details:

```typescript
// Displays:
- Role ID
- Description
- Member count
- Full permissions (via read-only PermissionsEditor)
```

### 🪝 API Hook: useRoles()

Enhanced hook with full CRUD operations:

```typescript
const { fetchRoles, fetchRole, createRole, updateRole, deleteRole } = useRoles();

// fetchRoles() - Get all roles for active tenant
const roles = await fetchRoles();

// fetchRole(id) - Get specific role with member details
const role = await fetchRole(roleId);

// createRole(data) - Create new role
const newRole = await createRole({
  name: "Editor",
  permissions: { "projects.read": ["true"], ... },
  description: "Can edit all projects"
});

// updateRole(id, data) - Update existing role
const updated = await updateRole(roleId, {
  name: "Senior Editor",
  permissions: { ... }
});

// deleteRole(id) - Delete role
await deleteRole(roleId);
```

All operations automatically include `x-tenant-id` header for multi-tenant isolation.

### 🛣️ Routes & Navigation

**Main Page:**

```
GET /settings/roles
```

**Integration in Settings:**

```
GET /settings
```

Tab-based navigation with link to full roles page.

### 🎯 Usage Flow

#### Creating a Role

1. Navigate to `/settings/roles`
2. Click "Create Role" button
3. Fill in form:
   - Enter role name (e.g., "Editor")
   - Add optional description
   - Use PermissionsEditor to select permissions
4. Click "Create Role"
5. Role appears in list with member count = 0

#### Editing a Role

1. Click "Edit" button on role row
2. Modify name, description, or permissions
3. Click "Save Changes"
4. Returns to list view with updated role

#### Viewing Role Details

1. Click "View" button on role row
2. Modal opens with:
   - Full role metadata
   - Complete permission breakdown
   - Read-only PermissionsEditor
3. Close modal to return to list

#### Deleting a Role

1. Click "Delete" button on role row
2. Confirmation modal appears showing:
   - Role name
   - Number of members assigned
   - Warning if members exist
3. If members assigned: Delete button disabled + warning message
4. If no members: Click "Delete Role" to confirm
5. Role removed from list

#### Assigning Roles to Members

Via Members tab in `/settings`:

1. Click "Team Members" tab
2. Fill invite form:
   - Enter email address
   - Select role from dropdown (populated from roles list)
3. Click "Send Invite"

### 🔄 State Management

**Page-level state:**

```typescript
const [roles, setRoles] = useState<Role[]>([]); // All roles
const [isLoading, setIsLoading] = useState(true); // Loading state
const [error, setError] = useState(''); // Error messages
const [success, setSuccess] = useState(''); // Success messages
const [view, setView] = useState<'list' | 'create' | 'edit' | 'details'>('list'); // View mode
const [selectedRole, setSelectedRole] = useState(null); // Currently edited role
const [deleteConfirmRole, setDeleteConfirmRole] = useState(null); // Deletion confirmation
```

**Form-level state (RoleForm):**

```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  permissions: {},
});
const [error, setError] = useState('');
```

**Component-level state (PermissionsEditor):**

```typescript
const [expandedSections, setExpandedSections] = useState(new Set()); // Section toggle
```

### ✨ Features

#### 1. **Permissions Model**

- Resource-based: `"projects"`, `"members"`, `"roles"`, `"settings"`
- Action-based: `"read"`, `"create"`, `"update"`, `"delete"`
- Format: `"resource.action"`: `["true"]`
- Stored as JSON in database for flexibility

#### 2. **Validation**

- Role name required and must be unique per tenant
- At least one permission must be selected
- Cannot delete roles with assigned members
- Cannot delete last admin role (backend enforced)

#### 3. **Error Handling**

- Try/catch blocks on all API calls
- User-friendly error messages
- Toast-like messages (inline alerts)
- Error state cleared on retry

#### 4. **Loading States**

- Loading spinner in list view
- Loading state on buttons during submission
- Disabled state on form during processing
- Prevents double-submission

#### 5. **Multi-Tenant Safety**

- All requests include `x-tenant-id` header
- Roles automatically scoped to active tenant
- API hook validates active tenant exists
- Session integration for tenant context

### 🎨 UI/UX Design

**Visual Hierarchy:**

- Main heading with description
- Tab/breadcrumb navigation
- Card-based layout for forms
- Table for list display
- Modal overlays for details/confirmation

**Color Scheme:**

- Blue: Primary actions, active state
- Gray: Secondary actions, neutral state
- Red: Danger actions (delete)
- Green: Success messages
- Yellow: Warning states
- Info badges: Blue for counts

**Responsiveness:**

- Table scrollable on mobile
- Modal responsive with padding
- Forms full-width on mobile
- Touch-friendly button sizes

### 🔒 Security Considerations

1. **Backend Validation:**
   - All role operations require admin permission
   - Multi-tenant filtering via middleware
   - Permission validation on create/update

2. **Frontend Guards:**
   - Protected route via middleware (logged-in required)
   - Role-based UI (hide features if no permission)
   - CSRF protection (Next.js built-in)

3. **Data Isolation:**
   - Tenant ID in headers prevents cross-tenant access
   - API responses filtered by backend
   - No hardcoded role IDs in frontend

### 🧪 Testing Checklist

```
✅ Create Role
  - [x] Form validation (name required)
  - [x] Permission selection required
  - [x] Successful creation shows success message
  - [x] New role appears in list

✅ Edit Role
  - [x] Form pre-populates with existing data
  - [x] Can modify name and permissions
  - [x] Save updates backend and list
  - [x] Error handling on update failure

✅ Delete Role
  - [x] Warning modal shows member count
  - [x] Delete disabled if members assigned
  - [x] Confirmation on actual deletion
  - [x] Role removed from list

✅ View Details
  - [x] Modal opens with full role info
  - [x] Permissions display correctly
  - [x] Member count accurate
  - [x] Modal close returns to list

✅ Permissions
  - [x] All categories display
  - [x] Checkboxes toggle properly
  - [x] Bulk grant/revoke per section
  - [x] Read-only mode in details modal

✅ Multi-Tenant
  - [x] Only active tenant's roles shown
  - [x] Switching tenant reloads roles
  - [x] Cross-tenant access prevented
```

### 🚀 Future Enhancements

- [ ] Permission templates (pre-configured role sets)
- [ ] Role cloning (duplicate with modifications)
- [ ] Bulk role assignment (assign multiple users to role)
- [ ] Permission inheritance (role hierarchy)
- [ ] Audit logging (track permission changes)
- [ ] Role analytics (who has which roles)
- [ ] Dynamic permission discovery from backend
- [ ] Permission testing tool (what can role X do)

### 📋 Integration Notes

**Existing Components Updated:**

- `Table.tsx`: Added generic type support + render functions
- `useRoles()`: Expanded from fetch-only to full CRUD

**Settings Page:**

- Roles tab now links to dedicated roles page
- Maintains existing General and Members tabs

**Sidebar Navigation:**

- Accessible via Settings → Roles tab
- Can add direct link if needed

### 🎓 Developer Notes

1. **Permission Storage:** Stored as JSON `Record<string, string[]>` in database
2. **Tenant Scoping:** Automatic via backend middleware, no manual filtering needed
3. **Session Integration:** Uses NextAuth session for tenant ID
4. **Type Safety:** Full TypeScript support with generics
5. **API Compatibility:** Works with NestJS backend `/api/roles` endpoints

### 📞 Support

For issues or questions:

1. Check backend API response codes
2. Verify active tenant is set
3. Check browser console for error details
4. Verify permissions set correctly in form
