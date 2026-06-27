'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PermissionsEditor } from './PermissionsEditor';

interface RoleDetailsModalProps {
  role: {
    id: string;
    name: string;
    description?: string;
    permissions: Record<string, string[]>;
    _count?: {
      members: number;
    };
  };
  onClose: () => void;
}

export function RoleDetailsModal({ role, onClose }: RoleDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card title={`Role: ${role.name}`}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <code className="block px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-700 font-mono">
                  {role.id}
                </code>
              </div>

              {role.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-700">{role.description}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                <Badge variant="info">{role._count?.members || 0} members</Badge>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
              <PermissionsEditor permissions={role.permissions} onChange={() => {}} readOnly />
            </div>

            {/* Close Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
