'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useRoles } from '@/lib/api/client';
import { RoleForm } from '@/components/roles/RoleForm';
import { RolesList } from '@/components/roles/RolesList';
import { RoleDeleteDialog } from '@/components/roles/RoleDeleteDialog';
import { RoleDetailsModal } from '@/components/roles/RoleDetailsModal';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, string[]>;
  _count?: {
    members: number;
  };
}

type View = 'list' | 'create' | 'edit' | 'details';

export default function RolesPage() {
  const { fetchRoles, createRole, updateRole, deleteRole } = useRoles();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<View>('list');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<Role | null>(null);

  // Load roles on mount
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await fetchRoles();
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: {
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
  }) => {
    try {
      setError('');
      setSuccess('');
      await createRole(data);
      setSuccess('Role created successfully');
      setView('list');
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
      throw err;
    }
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
  }) => {
    if (!selectedRole) return;

    try {
      setError('');
      setSuccess('');
      await updateRole(selectedRole.id, data);
      setSuccess('Role updated successfully');
      setView('list');
      setSelectedRole(null);
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRole) return;

    try {
      setError('');
      setSuccess('');
      await deleteRole(deleteConfirmRole.id);
      setSuccess('Role deleted successfully');
      setDeleteConfirmRole(null);
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      throw err;
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setView('edit');
  };

  const handleDelete = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      setDeleteConfirmRole(role);
    }
  };

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
    setView('details');
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="mt-2 text-gray-600">Manage roles and permissions for your team</p>
          </div>
          {view === 'list' && <Button onClick={() => setView('create')}>+ Create Role</Button>}
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Views */}
      {view === 'list' && (
        <RolesList
          roles={roles}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewPermissions={handleViewPermissions}
        />
      )}

      {view === 'create' && (
        <RoleForm onSubmit={handleCreate} onCancel={() => setView('list')} isLoading={isLoading} />
      )}

      {view === 'edit' && selectedRole && (
        <RoleForm
          initialData={selectedRole}
          onSubmit={handleUpdate}
          onCancel={() => {
            setView('list');
            setSelectedRole(null);
          }}
          isLoading={isLoading}
          isEditing
        />
      )}

      {/* Modals */}
      {view === 'details' && selectedRole && (
        <RoleDetailsModal
          role={selectedRole}
          onClose={() => {
            setView('list');
            setSelectedRole(null);
          }}
        />
      )}

      {deleteConfirmRole && (
        <RoleDeleteDialog
          roleName={deleteConfirmRole.name}
          memberCount={deleteConfirmRole._count?.members || 0}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmRole(null)}
          isLoading={isLoading}
        />
      )}
    </DashboardLayout>
  );
}
