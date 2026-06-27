'use client';

import React, { useState } from 'react';
import { useTenantContext } from '@/context/TenantContext';

/**
 * TenantSwitcher - Dropdown zum Wechseln zwischen Tenants
 *
 * Features:
 * - Zeigt aktiven Tenant mit Icon
 * - Dropdown mit allen verfügbaren Tenants
 * - Aktiven Tenant hervorheben
 * - Loading & Error States
 * - Nur sichtbar wenn User in mehreren Tenants Mitglied ist
 */
export function TenantSwitcher() {
  const { activeTenantId, tenants, isLoading, switchTenant, error } = useTenantContext();
  const [isOpen, setIsOpen] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === activeTenantId) {
      setIsOpen(false);
      return;
    }

    setSwitchError(null);
    try {
      await switchTenant(tenantId);
      setIsOpen(false);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : 'Failed to switch tenant');
    }
  };

  // Nicht anzeigen wenn User nur einen Tenant hat
  if (tenants.length <= 1) {
    return null;
  }

  return (
    <div className="relative inline-block w-full md:w-auto">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500">🏢</span>
          <span className="font-semibold">{activeTenant?.name || 'Select Tenant'}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Switch Organization
            </p>
          </div>

          {/* Error Message */}
          {(switchError || error) && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-200">
              <p className="text-red-700 text-xs font-medium">{switchError || error}</p>
            </div>
          )}

          {/* Tenant List */}
          <div className="py-2 max-h-80 overflow-y-auto">
            {tenants.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-500 text-sm">No organizations available</p>
              </div>
            ) : (
              tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSwitch(tenant.id)}
                  disabled={isLoading}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    tenant.id === activeTenantId
                      ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      {tenant.role && (
                        <div className="text-xs text-gray-500 mt-0.5">Role: {tenant.role}</div>
                      )}
                    </div>
                    {tenant.id === activeTenantId && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <p>💡 Tip: All data is isolated per organization</p>
          </div>
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

/**
 * TenantInfo - Display current tenant and role information
 *
 * Shows:
 * - Current active tenant name
 * - User's role in that tenant
 * - Tenant icon
 */
export function TenantInfo() {
  const { activeTenantId, activeRoleId, tenants } = useTenantContext();

  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  if (!activeTenant) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-xl">🏢</span>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{activeTenant.name}</h4>
        {activeRoleId && (
          <p className="text-xs text-gray-600">
            Role: <span className="font-medium">{activeRoleId}</span>
          </p>
        )}
      </div>
      <div className="text-right text-xs text-gray-500">
        {tenants.length > 1 && (
          <p>
            +{tenants.length - 1} more org{tenants.length > 2 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * TenantSelector - Grid view for selecting tenants
 *
 * Use cases:
 * - Organization onboarding
 * - Multi-tenant dashboard
 * - Organization selection modal
 */
export function TenantSelector() {
  const { tenants, activeTenantId, isLoading, switchTenant } = useTenantContext();
  const [isLoading_Local, setIsLoading_Local] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<string | null>(null);

  const handleSelectTenant = async (tenantId: string) => {
    if (tenantId === activeTenantId) return;

    setSelectedTenant(tenantId);
    setIsLoading_Local(true);

    try {
      await switchTenant(tenantId);
    } catch {
      // Error handled by context
    } finally {
      setIsLoading_Local(false);
      setSelectedTenant(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tenants.map((tenant) => (
        <button
          key={tenant.id}
          onClick={() => handleSelectTenant(tenant.id)}
          disabled={isLoading || isLoading_Local}
          className={`p-6 rounded-lg border-2 transition-all ${
            tenant.id === activeTenantId
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
          } disabled:opacity-50 disabled:cursor-not-allowed text-left`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏢</span>
                <h3 className="font-semibold text-gray-900 text-lg">{tenant.name}</h3>
              </div>
              {tenant.description && (
                <p className="text-sm text-gray-600 mt-2">{tenant.description}</p>
              )}
            </div>
            {tenant.id === activeTenantId && (
              <svg
                className="w-6 h-6 text-blue-600 flex-shrink-0 ml-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {tenant.role && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Role: <span className="font-medium">{tenant.role}</span>
            </div>
          )}

          {selectedTenant === tenant.id && (isLoading || isLoading_Local) && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
              <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Switching...
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
