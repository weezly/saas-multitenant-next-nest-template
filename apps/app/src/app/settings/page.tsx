'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useMemberships } from '@/lib/api/client';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { inviteMember } = useMemberships();
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'roles'>('general');
  const [inviteForm, setInviteForm] = useState({ email: '', roleId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await inviteMember({
        email: inviteForm.email,
        roleId: inviteForm.roleId,
      });

      setSuccess('Member invited successfully');
      setInviteForm({ email: '', roleId: '' });
    } catch (err) {
      setError('Failed to invite member');
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your tenant and team</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Team Members
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Roles
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card title="Tenant Information">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenant ID</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-mono text-sm">
                {session?.user?.activeTenantId || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current User</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                {session?.user?.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <Badge variant="success">{session?.user?.activeRoleId || 'Unknown'}</Badge>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Settings</h3>
              <div className="space-y-4">
                <Input
                  label="Tenant Name"
                  placeholder="My Awesome Tenant"
                  defaultValue="My Awesome Tenant"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tenant description..."
                    rows={3}
                    defaultValue="A description of your tenant"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="primary">Save Changes</Button>
                  <Button variant="secondary">Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Team Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-8">
          {/* Invite Form */}
          <Card title="Invite Team Member">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                  required
                >
                  <option value="">Select a role</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Send Invite
              </Button>
            </form>
          </Card>

          {/* Members List */}
          <Card title="Team Members">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{session?.user?.email}</p>
                  <p className="text-sm text-gray-500">You (Tenant Owner)</p>
                </div>
                <Badge variant="success">Owner</Badge>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">john@example.com</p>
                  <p className="text-sm text-gray-500">Added 2 days ago</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="info">Admin</Badge>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium text-gray-900">jane@example.com</p>
                  <p className="text-sm text-gray-500">Added 1 week ago</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="info">Member</Badge>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card title="Roles & Permissions Management">
          <div className="space-y-4">
            <p className="text-gray-600">
              Manage roles and permissions for your team members. Create custom roles with
              fine-grained permissions for projects, team members, and settings.
            </p>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Pro Tip:</strong> Use the dedicated Roles & Permissions page for full role
                management including creating, editing, and deleting roles with granular permission
                control.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Link href="/settings/roles">
                <Button variant="primary" className="w-full">
                  Manage Roles & Permissions →
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
