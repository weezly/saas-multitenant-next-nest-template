'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, string[]>;
  _count?: {
    members: number;
  };
}

interface RolesListProps {
  roles: Role[];
  isLoading?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (roleId: string) => void;
  onViewPermissions?: (role: Role) => void;
}

export function RolesList({
  roles,
  isLoading = false,
  onEdit,
  onDelete,
  onViewPermissions,
}: RolesListProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const countPermissions = (permissions: Record<string, string[]>) => {
    return Object.keys(permissions).length;
  };

  const columns: any[] = [
    {
      key: 'name',
      label: 'Role Name',
      render: (role: Role) => (
        <div>
          <p className="font-semibold text-gray-900">{role.name}</p>
          {role.description && <p className="text-sm text-gray-600">{role.description}</p>}
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (role: Role) => (
        <div className="flex items-center gap-2">
          <Badge variant="info">{countPermissions(role.permissions)} permissions</Badge>
        </div>
      ),
    },
    {
      key: 'members',
      label: 'Members',
      render: (role: Role) => <span className="text-gray-700">{role._count?.members || 0}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (role: Role) => (
        <div className="flex gap-2">
          {onViewPermissions && (
            <Button size="sm" variant="ghost" onClick={() => onViewPermissions(role)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={() => onEdit(role)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="danger" onClick={() => onDelete(role.id)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card title="Roles">
        <div className="text-center py-8">
          <div className="inline-block animate-spin text-blue-600">⟳</div>
          <p className="mt-2 text-gray-600">Loading roles...</p>
        </div>
      </Card>
    );
  }

  if (roles.length === 0) {
    return (
      <Card title="Roles">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No roles created yet</p>
          <p className="text-sm text-gray-500">
            Create your first role to get started with permission management
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Roles (${roles.length})`}>
      <Table
        columns={columns}
        data={roles}
        onRowClick={(role) => setSelectedRoleId(role.id === selectedRoleId ? null : role.id)}
        rowClassName={(role) => (selectedRoleId === role.id ? 'bg-blue-50' : '')}
      />
    </Card>
  );
}
