/**
 * Common types for the entire SaaS application
 */

// =====================
// USER & AUTH TYPES
// =====================
export interface User {
  id: string;
  email: string;
  name?: string;
  provider: 'credentials' | 'google' | 'github';
  createdAt: Date;
  updatedAt: Date;
}

// =====================
// TENANT & MULTI-TENANCY
// =====================
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantUser {
  userId: string;
  tenantId: string;
  roleId: string;
  role?: Role;
  createdAt: Date;
}

// =====================
// ROLE & PERMISSIONS
// =====================
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type PermissionResource = 'projects' | 'users' | 'roles' | 'members' | 'settings';

/**
 * Permissions Structure
 * Defines what a user can do in a tenant
 * Example: {
 *   "projects": ["create", "read", "update", "delete"],
 *   "users": ["read", "update"],
 *   "roles": ["read"],
 *   "settings": ["read", "update"]
 * }
 */
export interface Permissions {
  projects?: PermissionAction[];
  users?: PermissionAction[];
  roles?: PermissionAction[];
  members?: PermissionAction[];
  settings?: PermissionAction[];
}

export interface Role {
  id: string;
  name: string;
  tenantId: string;
  permissions: Permissions;
  createdAt: Date;
  updatedAt: Date;
}

// Predefined Roles (Suggestions)
export const DEFAULT_ROLES = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
} as const;

// =====================
// PROJECT TYPES
// =====================
export interface Project {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================
// API RESPONSE TYPES
// =====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
