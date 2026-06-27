import { useSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Get Authorization Headers with Tenant Context
 */
function getHeaders(tenantId?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return headers;
}

/**
 * API Request Helper
 */
async function apiCall(endpoint: string, options?: RequestInit & { tenantId?: string }) {
  const { tenantId, ...fetchOptions } = options || {};
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getHeaders(tenantId),
      ...(fetchOptions?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook: Fetch Tenants
 */
export function useTenants() {
  const { data: session } = useSession();

  const fetchTenants = async () => {
    if (!session?.user?.id) throw new Error('Not authenticated');

    return apiCall('/tenants', {
      headers: {
        'x-user-id': session.user.id,
      },
    });
  };

  return { fetchTenants };
}

/**
 * Hook: Fetch Projects
 */
export function useProjects() {
  const { data: session } = useSession();

  const fetchProjects = async (filters?: { status?: string; ownerId?: string }) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ownerId) params.append('ownerId', filters.ownerId);

    const endpoint = `/projects${params.toString() ? `?${params.toString()}` : ''}`;

    return apiCall(endpoint, {
      tenantId: session.user.activeTenantId,
    });
  };

  const createProject = async (data: { name: string; description?: string; status?: string }) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
      tenantId: session.user.activeTenantId,
    });
  };

  const updateProject = async (
    id: string,
    data: Partial<{ name: string; description: string; status: string }>
  ) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      tenantId: session.user.activeTenantId,
    });
  };

  const deleteProject = async (id: string) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall(`/projects/${id}`, {
      method: 'DELETE',
      tenantId: session.user.activeTenantId,
    });
  };

  return { fetchProjects, createProject, updateProject, deleteProject };
}

/**
 * Hook: Roles Management
 */
export function useRoles() {
  const { data: session } = useSession();

  const fetchRoles = async () => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall('/roles', {
      tenantId: session.user.activeTenantId,
    });
  };

  const fetchRole = async (id: string) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall(`/roles/${id}`, {
      tenantId: session.user.activeTenantId,
    });
  };

  const createRole = async (data: {
    name: string;
    permissions: Record<string, string[]>;
    description?: string;
  }) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
      tenantId: session.user.activeTenantId,
    });
  };

  const updateRole = async (
    id: string,
    data: Partial<{
      name: string;
      permissions: Record<string, string[]>;
      description: string;
    }>
  ) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall(`/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      tenantId: session.user.activeTenantId,
    });
  };

  const deleteRole = async (id: string) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall(`/roles/${id}`, {
      method: 'DELETE',
      tenantId: session.user.activeTenantId,
    });
  };

  return { fetchRoles, fetchRole, createRole, updateRole, deleteRole };
}

/**
 * Hook: Fetch Memberships
 */
export function useMemberships() {
  const { data: session } = useSession();

  const fetchMembers = async () => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall('/memberships', {
      tenantId: session.user.activeTenantId,
    });
  };

  const inviteMember = async (data: { email: string; roleId: string }) => {
    if (!session?.user?.activeTenantId) throw new Error('No active tenant');

    return apiCall('/memberships/invite', {
      method: 'POST',
      body: JSON.stringify(data),
      tenantId: session.user.activeTenantId,
    });
  };

  return { fetchMembers, inviteMember };
}
