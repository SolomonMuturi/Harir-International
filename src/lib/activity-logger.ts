// src/lib/activity-logger.ts
'use client';

interface LogActivityParams {
  user?: string | null;
  action: string;
  status?: 'success' | 'failure' | 'pending';
  ip?: string;
  avatar?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Log an activity to the database
 * This can be called from any component after user actions
 */
export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: params.user,
        action: params.action,
        status: params.status || 'success',
        ip: params.ip,
        avatar: params.avatar,
        metadata: params.metadata,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn('Activity log failed:', errorData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

// Common activity types for your app
export const ActivityTypes = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  
  // Cold Room
  COLDROOM_TEMPERATURE_UPDATE: 'COLDROOM_TEMPERATURE_UPDATE',
  COLDROOM_INVENTORY_UPDATE: 'COLDROOM_INVENTORY_UPDATE',
  COLDROOM_BOX_ADDED: 'COLDROOM_BOX_ADDED',
  COLDROOM_BOX_REMOVED: 'COLDROOM_BOX_REMOVED',
  COLDROOM_PALLET_UPDATE: 'COLDROOM_PALLET_UPDATE',
  
  // Quality Control
  QC_CHECK_PERFORMED: 'QC_CHECK_PERFORMED',
  QC_CHECK_APPROVED: 'QC_CHECK_APPROVED',
  QC_CHECK_REJECTED: 'QC_CHECK_REJECTED',
  
  // Shipments
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  SHIPMENT_UPDATED: 'SHIPMENT_UPDATED',
  SHIPMENT_STATUS_CHANGED: 'SHIPMENT_STATUS_CHANGED',
  
  // Suppliers
  SUPPLIER_CHECK_IN: 'SUPPLIER_CHECK_IN',
  SUPPLIER_CHECK_OUT: 'SUPPLIER_CHECK_OUT',
  SUPPLIER_WEIGHT_RECORDED: 'SUPPLIER_WEIGHT_RECORDED',
  
  // System
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  
  // User Management
  USER_ROLE_ASSIGNED: 'USER_ROLE_ASSIGNED',
  USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
  PERMISSIONS_UPDATED: 'PERMISSIONS_UPDATED',
};