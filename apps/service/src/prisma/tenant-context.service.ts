/**
 * Tenant Context Service
 *
 * Bereitstellung der aktuellen tenantId aus dem Request-Kontext.
 * Wird von TenantAwarePrismaService verwendet um automatisch
 * tenantId zu jedem Query hinzuzufügen.
 *
 * Verwendung:
 * - Mit AsyncLocalStorage: Speichert tenantId pro Request
 * - Guards setzen tenantId über setTenantId()
 * - Services lesen tenantId über getTenantId()
 */

import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId?: string;
}

@Injectable()
export class TenantContextService {
  private tenantContext = new AsyncLocalStorage<TenantContext>();

  /**
   * Setze tenantId im aktuellen Request-Kontext
   * Wird von TenantAccessGuard aufgerufen
   */
  setTenantContext(context: TenantContext) {
    this.tenantContext.enterWith(context);
  }

  /**
   * Hole aktuelle tenantId aus dem Request-Kontext
   * Wirft Fehler falls keine tenantId gesetzt ist
   */
  getTenantId(): string {
    const context = this.tenantContext.getStore();
    if (!context?.tenantId) {
      throw new Error('Tenant context not set. Make sure TenantAccessGuard is applied.');
    }
    return context.tenantId;
  }

  /**
   * Hole kompletten Kontext (mit userId)
   */
  getContext(): TenantContext {
    const context = this.tenantContext.getStore();
    if (!context?.tenantId) {
      throw new Error('Tenant context not set');
    }
    return context;
  }

  /**
   * Hole tenantId oder undefined wenn nicht gesetzt
   * Verwendung: wenn Operation optional tenantId sein kann
   */
  getTenantIdOrNull(): string | null {
    return this.tenantContext.getStore()?.tenantId ?? null;
  }

  /**
   * Prüfe ob Kontext gesetzt ist
   */
  hasTenantContext(): boolean {
    return !!this.tenantContext.getStore()?.tenantId;
  }

  /**
   * Cleane Kontext (wird normalerweise von Nest automatisch gemacht)
   */
  clearContext() {
    // AsyncLocalStorage cleared automatically per request
  }
}
