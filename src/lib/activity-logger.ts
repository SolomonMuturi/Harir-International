// src/lib/activity-logger.ts
'use client';

interface LogActivityParams {
  user?: string | null;
  action: string;
  status?: 'success' | 'failure' | 'pending';
  ip?: string;
  avatar?: string | null;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    // Get IP from browser if not provided
    let ip = params.ip;
    if (!ip) {
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        ip = ipData.ip;
      } catch (e) {
        // Fallback to localhost if IP fetch fails
        ip = '127.0.0.1';
      }
    }

    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: params.user || null,
        action: params.action,
        status: params.status || 'success',
        ip: ip,
        avatar: params.avatar || null,
        metadata: params.metadata,
        timestamp: params.timestamp || new Date().toISOString(),
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

// Enhanced activity types with categories
export const ActivityTypes = {
  // Authentication
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  
  // Cold Room
  COLDROOM_TEMPERATURE_UPDATE: 'COLDROOM_TEMPERATURE_UPDATE',
  COLDROOM_INVENTORY_UPDATE: 'COLDROOM_INVENTORY_UPDATE',
  COLDROOM_BOX_ADDED: 'COLDROOM_BOX_ADDED',
  COLDROOM_BOX_REMOVED: 'COLDROOM_BOX_REMOVED',
  COLDROOM_PALLET_UPDATE: 'COLDROOM_PALLET_UPDATE',
  COLDROOM_PALLET_CREATED: 'COLDROOM_PALLET_CREATED',
  COLDROOM_ALERT_TRIGGERED: 'COLDROOM_ALERT_TRIGGERED',
  
  // Quality Control
  QC_CHECK_PERFORMED: 'QC_CHECK_PERFORMED',
  QC_CHECK_APPROVED: 'QC_CHECK_APPROVED',
  QC_CHECK_REJECTED: 'QC_CHECK_REJECTED',
  QC_WEIGHT_VERIFIED: 'QC_WEIGHT_VERIFIED',
  
  // Shipments
  SHIPMENT_CREATED: 'SHIPMENT_CREATED',
  SHIPMENT_UPDATED: 'SHIPMENT_UPDATED',
  SHIPMENT_STATUS_CHANGED: 'SHIPMENT_STATUS_CHANGED',
  SHIPMENT_DELIVERED: 'SHIPMENT_DELIVERED',
  SHIPMENT_DELAYED: 'SHIPMENT_DELAYED',
  
  // Suppliers
  SUPPLIER_CHECK_IN: 'SUPPLIER_CHECK_IN',
  SUPPLIER_CHECK_OUT: 'SUPPLIER_CHECK_OUT',
  SUPPLIER_WEIGHT_RECORDED: 'SUPPLIER_WEIGHT_RECORDED',
  SUPPLIER_CREATED: 'SUPPLIER_CREATED',
  SUPPLIER_UPDATED: 'SUPPLIER_UPDATED',
  
  // Weight Entries
  WEIGHT_ENTRY_CREATED: 'WEIGHT_ENTRY_CREATED',
  WEIGHT_ENTRY_UPDATED: 'WEIGHT_ENTRY_UPDATED',
  WEIGHT_ENTRY_REJECTED: 'WEIGHT_ENTRY_REJECTED',
  
  // Counting Records
  COUNTING_RECORD_SUBMITTED: 'COUNTING_RECORD_SUBMITTED',
  COUNTING_RECORD_LOADED: 'COUNTING_RECORD_LOADED',
  
  // System
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  DATABASE_BACKUP: 'DATABASE_BACKUP',
  
  // User Management
  USER_ROLE_ASSIGNED: 'USER_ROLE_ASSIGNED',
  USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
  PERMISSIONS_UPDATED: 'PERMISSIONS_UPDATED',
  
  // Reports
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_DOWNLOADED: 'REPORT_DOWNLOADED',
  
  // Loading Sheets
  LOADING_SHEET_CREATED: 'LOADING_SHEET_CREATED',
  LOADING_SHEET_UPDATED: 'LOADING_SHEET_UPDATED',
  LOADING_SHEET_COMPLETED: 'LOADING_SHEET_COMPLETED',
  
  // Utilities
  UTILITY_READING_RECORDED: 'UTILITY_READING_RECORDED',
  GENERATOR_USAGE_RECORDED: 'GENERATOR_USAGE_RECORDED',
  
  // Payments
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVOICE_GENERATED: 'INVOICE_GENERATED',
  
  // Visitors
  VISITOR_CHECK_IN: 'VISITOR_CHECK_IN',
  VISITOR_CHECK_OUT: 'VISITOR_CHECK_OUT',
};

// Helper function to log common actions with user context
export const ActivityLogger = {
  async logUserAction(
    userId: string,
    userName: string,
    action: string,
    status: 'success' | 'failure' | 'pending' = 'success',
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: userName,
      action,
      status,
      avatar: userId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        userId,
        timestamp: new Date().toISOString(),
      },
    });
  },

  async logSystemAction(
    action: string,
    status: 'success' | 'failure' | 'pending' = 'success',
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: 'System',
      action,
      status,
      avatar: 'SYS',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  },

  async logError(
    action: string,
    error: Error,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: 'System',
      action: `ERROR_${action}`,
      status: 'failure',
      avatar: 'ERR',
      metadata: {
        ...metadata,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      },
    });
  },
};