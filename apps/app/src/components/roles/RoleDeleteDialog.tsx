'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface RoleDeleteDialogProps {
  roleName: string;
  memberCount?: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoleDeleteDialog({
  roleName,
  memberCount = 0,
  onConfirm,
  onCancel,
  isLoading = false,
}: RoleDeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md" title="Delete Role">
        <div className="space-y-4">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-gray-900 font-semibold mb-2">Delete role "{roleName}"?</p>
            <p className="text-sm text-gray-600">This action cannot be undone.</p>

            {memberCount > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{memberCount}</strong> member{memberCount !== 1 ? 's' : ''} currently have
                  this role.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Please assign them to another role before deleting this one.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={isLoading || memberCount > 0}
              isLoading={isLoading}
              className="flex-1"
            >
              Delete Role
            </Button>
            <Button variant="secondary" onClick={onCancel} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
