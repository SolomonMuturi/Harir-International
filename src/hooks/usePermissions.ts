// hooks/usePermissions.ts
'use client';

import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session } = useSession();
  
  const permissions = (session?.user as any)?.permissions || [];
  const userRole = (session?.user as any)?.role || 'No Role';
  
  const hasPermission = (requiredPermission: string | string[]) => {
    // Admin has all permissions
    if (userRole === 'Administrator' || permissions.includes('admin.all')) {
      return true;
    }
    
    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some(perm => permissions.includes(perm));
    }
    return permissions.includes(requiredPermission);
  };

  const hasAnyPermission = () => {
    return permissions.length > 0 || userRole === 'Administrator';
  };

  const getUserRole = () => {
    return userRole;
  };

  return {
    permissions,
    userRole,
    hasPermission,
    hasAnyPermission,
    getUserRole,
  };
}