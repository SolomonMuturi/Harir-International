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
    const payload = {
      user: params.user || 'System',
      action: params.action,
      status: params.status || 'success',
      ip: params.ip || null,
      avatar: params.avatar || null,
      metadata: params.metadata || null,
      timestamp: params.timestamp || new Date().toISOString(),
    };

    console.log('📤 Sending activity log payload:', payload);

    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log('📥 Activity log response:', responseData);

    if (!response.ok) {
      console.warn('⚠️ Activity log failed:', responseData);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    return false;
  }
}

// ============================================
// ACTIVITY TYPES
// ============================================
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
  
  // Roles
  ROLE_CREATED: 'ROLE_CREATED',
  ROLE_UPDATED: 'ROLE_UPDATED',
  ROLE_DELETED: 'ROLE_DELETED',
  ROLES_INITIALIZED: 'ROLES_INITIALIZED',
  
  // Bulk Operations
  BULK_ROLE_ASSIGNMENT: 'BULK_ROLE_ASSIGNMENT',
  BULK_ROLE_UPDATE: 'BULK_ROLE_UPDATE',
  
  // Warehouse
  WAREHOUSE_DATA_REFRESH: 'WAREHOUSE_DATA_REFRESH',
  WAREHOUSE_GRN_DOWNLOADED: 'WAREHOUSE_GRN_DOWNLOADED',
  SUPPLIER_REJECTION_SAVED: 'SUPPLIER_REJECTION_SAVED',
  
  // Permissions
  PERMISSIONS_COPIED: 'PERMISSIONS_COPIED',
  ROLES_EXPORTED: 'ROLES_EXPORTED',
};

// ============================================
// ACTIVITY LOGGER HELPER FUNCTIONS
// ============================================
export const ActivityLogger = {
  /**
   * Log a user action with full context
   */
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

  /**
   * Log a system action
   */
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

  /**
   * Log an error
   */
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

  /**
   * Log a user login
   */
  async logLogin(
    userName: string,
    userId: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: userName,
      action: success ? ActivityTypes.USER_LOGIN : ActivityTypes.USER_LOGIN_FAILED,
      status: success ? 'success' : 'failure',
      avatar: userId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        userId,
        loginTime: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a user logout
   */
  async logLogout(
    userName: string,
    userId: string,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: userName,
      action: ActivityTypes.USER_LOGOUT,
      status: 'success',
      avatar: userId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        userId,
        logoutTime: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a user creation
   */
  async logUserCreated(
    creatorName: string,
    creatorId: string,
    newUserEmail: string,
    newUserName: string,
    roleId?: string,
    roleName?: string,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: creatorName,
      action: ActivityTypes.USER_CREATED,
      status: 'success',
      avatar: creatorId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        createdBy: creatorId,
        newUserEmail,
        newUserName,
        roleId: roleId || null,
        roleName: roleName || 'No Role',
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a role assignment
   */
  async logRoleAssignment(
    assignerName: string,
    assignerId: string,
    userId: string,
    userEmail: string,
    userName: string,
    roleId: string | null,
    roleName: string | null,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: assignerName,
      action: ActivityTypes.USER_ROLE_ASSIGNED,
      status: 'success',
      avatar: assignerId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        assignedBy: assignerId,
        userId,
        userEmail,
        userName,
        roleId: roleId || null,
        roleName: roleName || 'No Role (Unassigned)',
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a role creation
   */
  async logRoleCreated(
    creatorName: string,
    creatorId: string,
    roleName: string,
    permissionsCount: number,
    isDefault: boolean,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: creatorName,
      action: ActivityTypes.ROLE_CREATED,
      status: 'success',
      avatar: creatorId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        createdBy: creatorId,
        roleName,
        permissionsCount,
        isDefault,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a role update
   */
  async logRoleUpdated(
    updaterName: string,
    updaterId: string,
    roleId: string,
    oldName: string,
    newName: string,
    oldPermissionsCount: number,
    newPermissionsCount: number,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: updaterName,
      action: ActivityTypes.ROLE_UPDATED,
      status: 'success',
      avatar: updaterId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        updatedBy: updaterId,
        roleId,
        oldName,
        newName,
        oldPermissionsCount,
        newPermissionsCount,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a role deletion
   */
  async logRoleDeleted(
    deleterName: string,
    deleterId: string,
    roleId: string,
    roleName: string,
    permissionsCount: number,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: deleterName,
      action: ActivityTypes.ROLE_DELETED,
      status: 'success',
      avatar: deleterId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        deletedBy: deleterId,
        roleId,
        roleName,
        permissionsCount,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a counting record submission
   */
  async logCountingRecordSubmitted(
    clerkName: string,
    clerkId: string,
    supplierId: string,
    supplierName: string,
    palletId: string,
    totalBoxes: number,
    totalWeight: number,
    rejectedWeight: number,
    recordId: string,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: clerkName,
      action: ActivityTypes.COUNTING_RECORD_SUBMITTED,
      status: 'success',
      avatar: clerkId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        userId: clerkId,
        supplierId,
        supplierName,
        palletId,
        totalBoxes,
        totalWeight,
        rejectedWeight: rejectedWeight > 0 ? rejectedWeight : 0,
        recordId,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a warehouse GRN download
   */
  async logGRNDownloaded(
    userName: string,
    userId: string,
    supplierId: string,
    supplierName: string,
    recordId: string,
    palletId: string,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: userName,
      action: ActivityTypes.WAREHOUSE_GRN_DOWNLOADED,
      status: 'success',
      avatar: userId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        userId,
        supplierId,
        supplierName,
        recordId,
        palletId,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Log a supplier rejection
   */
  async logSupplierRejection(
    userName: string,
    userId: string,
    supplierId: string | undefined,
    supplierName: string,
    palletId: string,
    rejectedWeight: number,
    rejectedCrates: number,
    reason: string,
    metadata?: Record<string, any>
  ) {
    return logActivity({
      user: userName,
      action: ActivityTypes.SUPPLIER_REJECTION_SAVED,
      status: 'success',
      avatar: userId.substring(0, 2).toUpperCase(),
      metadata: {
        ...metadata,
        userId,
        supplierId,
        supplierName,
        palletId,
        rejectedWeight,
        rejectedCrates,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  },
};

export default {
  logActivity,
  ActivityTypes,
  ActivityLogger,
};