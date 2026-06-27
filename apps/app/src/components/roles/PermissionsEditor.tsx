'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PermissionsEditorProps {
  permissions: Record<string, string[]>;
  onChange: (permissions: Record<string, string[]>) => void;
  readOnly?: boolean;
}

// Available permissions organized by resource
const AVAILABLE_PERMISSIONS = {
  Projects: [
    { key: 'projects.read', label: 'View Projects' },
    { key: 'projects.create', label: 'Create Projects' },
    { key: 'projects.update', label: 'Edit Projects' },
    { key: 'projects.delete', label: 'Delete Projects' },
  ],
  Team: [
    { key: 'members.read', label: 'View Team Members' },
    { key: 'members.invite', label: 'Invite Members' },
    { key: 'members.update', label: 'Edit Member Roles' },
    { key: 'members.remove', label: 'Remove Members' },
  ],
  'Roles & Permissions': [
    { key: 'roles.read', label: 'View Roles' },
    { key: 'roles.create', label: 'Create Roles' },
    { key: 'roles.update', label: 'Edit Roles' },
    { key: 'roles.delete', label: 'Delete Roles' },
  ],
  Settings: [
    { key: 'settings.read', label: 'View Settings' },
    { key: 'settings.update', label: 'Edit Settings' },
  ],
};

export function PermissionsEditor({
  permissions,
  onChange,
  readOnly = false,
}: PermissionsEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(Object.keys(AVAILABLE_PERMISSIONS))
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const hasPermission = (permissionKey: string): boolean => {
    // Check if permission is granted (format: "resource.action")
    const [resource, action] = permissionKey.split('.');
    return (
      permissions[permissionKey]?.includes('true') ||
      permissions['*']?.includes('*') ||
      permissions[resource]?.includes(action) ||
      permissions[resource]?.includes('*') ||
      false
    );
  };

  const togglePermission = (permissionKey: string) => {
    if (readOnly) return;

    const newPermissions = { ...permissions };
    const isGranted = hasPermission(permissionKey);

    if (!isGranted) {
      // Grant permission
      newPermissions[permissionKey] = ['true'];
    } else {
      // Revoke permission
      delete newPermissions[permissionKey];
    }

    onChange(newPermissions);
  };

  const toggleSectionPermissions = (section: string, grant: boolean) => {
    if (readOnly) return;

    const newPermissions = { ...permissions };
    const sectionPermissions = AVAILABLE_PERMISSIONS[section as keyof typeof AVAILABLE_PERMISSIONS];

    sectionPermissions.forEach(({ key }) => {
      if (grant) {
        newPermissions[key] = ['true'];
      } else {
        delete newPermissions[key];
      }
    });

    onChange(newPermissions);
  };

  const allSectionPermissionsGranted = (section: string): boolean => {
    const sectionPerms = AVAILABLE_PERMISSIONS[section as keyof typeof AVAILABLE_PERMISSIONS];
    return sectionPerms.every(({ key }) => hasPermission(key));
  };

  return (
    <div className="space-y-4">
      {Object.entries(AVAILABLE_PERMISSIONS).map(([section, perms]) => (
        <div key={section} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Section Header */}
          <div
            className={`flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 ${
              !readOnly && 'cursor-pointer hover:bg-gray-100'
            }`}
            onClick={() => !readOnly && toggleSection(section)}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(section);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <span
                  className={`transform transition-transform ${expandedSections.has(section) ? 'rotate-90' : ''}`}
                >
                  ▶
                </span>
              </button>
              <h4 className="font-semibold text-gray-900">{section}</h4>
            </div>

            {!readOnly && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant={allSectionPermissionsGranted(section) ? 'secondary' : 'primary'}
                  onClick={() => toggleSectionPermissions(section, true)}
                >
                  Grant All
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleSectionPermissions(section, false)}
                >
                  Revoke All
                </Button>
              </div>
            )}
          </div>

          {/* Section Items */}
          {expandedSections.has(section) && (
            <div className="p-4 space-y-3 bg-white">
              {perms.map(({ key, label }) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    id={key}
                    checked={hasPermission(key)}
                    onChange={() => togglePermission(key)}
                    disabled={readOnly}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <label
                    htmlFor={key}
                    className={`ml-3 text-sm text-gray-700 ${readOnly ? '' : 'cursor-pointer'}`}
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
