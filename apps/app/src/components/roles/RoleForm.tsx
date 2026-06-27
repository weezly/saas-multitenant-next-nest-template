'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { PermissionsEditor } from './PermissionsEditor';

interface RoleFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function RoleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || {},
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    if (Object.keys(formData.permissions).length === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    }
  };

  return (
    <Card title={isEditing ? 'Edit Role' : 'Create New Role'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Role Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Editor, Viewer, Manager"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            placeholder="Describe the purpose of this role..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Permissions Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Permissions <span className="text-red-500">*</span>
          </label>
          <PermissionsEditor
            permissions={formData.permissions}
            onChange={(permissions) => setFormData({ ...formData, permissions })}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Role'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
