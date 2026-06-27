'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TenantSwitcher } from '@/components/TenantSwitcher';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    projects: 0,
    members: 0,
    activeRoles: 0,
  });

  useEffect(() => {
    // Mock stats - can be replaced with real API calls
    setStats({
      projects: 12,
      members: 8,
      activeRoles: 4,
    });
  }, []);

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {session?.user?.email}</p>
      </div>

      {/* Tenant Switching Section */}
      {session?.user?.activeTenantId && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🏢</span>
              <h3 className="text-lg font-semibold text-gray-900">Active Organization</h3>
            </div>
            <TenantSwitcher />
            <p className="text-xs text-gray-600 mt-3">
              💡 Switch between your organizations to access different projects and team members
            </p>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">{stats.projects}</p>
            <p className="text-sm text-blue-700 mt-2">Projects</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{stats.members}</p>
            <p className="text-sm text-green-700 mt-2">Team Members</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600">{stats.activeRoles}</p>
            <p className="text-sm text-purple-700 mt-2">Active Roles</p>
          </div>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card title="Account Information" subtitle="Current tenant and permissions">
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-gray-600">Email</span>
            <span className="font-medium text-gray-900">{session?.user?.email}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-gray-600">Active Tenant</span>
            <Badge variant="info">{session?.user?.activeTenantId || 'None'}</Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Active Role</span>
            <Badge variant="success">{session?.user?.activeRoleId || 'Unknown'}</Badge>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/projects"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <h4 className="font-semibold text-gray-900">View Projects</h4>
              <p className="text-sm text-gray-600 mt-1">Manage your projects and tasks</p>
            </a>

            <a
              href="/settings"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <h4 className="font-semibold text-gray-900">Settings</h4>
              <p className="text-sm text-gray-600 mt-1">Configure tenant and team members</p>
            </a>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
