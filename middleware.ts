import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/unauthorized',
];

// Define required permissions for each route based on your sidebar
const routePermissions: Record<string, string[]> = {
  // Dashboard routes
  '/': ['dashboard.view'],
  '/dashboard': ['dashboard.view'],
  '/warehouse': ['dashboard.view'],
  '/security/dashboard': ['dashboard.view'],
  
  // Analytics
  '/analytics': ['dashboard.analytics'],
  '/bi-features': ['dashboard.analytics'],
  
  // Customers
  '/customers': ['customers.view'],
  '/customers/manage': ['customers.manage'],
  '/customers/quotes': ['customers.quotes'],
  '/customers/invoices': ['customers.invoices'],
  '/customers/receivables': ['customers.receivables'],
  
  // Suppliers
  '/suppliers': ['suppliers.view'],
  '/suppliers/manage': ['suppliers.manage'],
  '/suppliers/weigh': ['suppliers.weigh'],
  '/suppliers/visitors': ['suppliers.visitors'],
  
  // HR - Employees
  '/employees': ['employees.overview.view', 'employees.list.view'],
  '/employees/manage': ['employees.edit', 'employees.create'],
  '/employees/attendance': ['employees.attendance.view'],
  
  // Access Management
  '/visitor-management': ['suppliers.visitors'],
  '/vehicle-management': ['vehicle_log.view', 'vehicle_log.manage'],
  
  // Operations
  '/traceability': ['inventory.view'],
  '/weight-capture': ['suppliers.weigh'],
  '/quality-control': ['qc.view'],
  '/quality-control/perform': ['qc.perform'],
  '/quality-control/approve': ['qc.approve'],
  '/cold-room': ['cold_room.view'],
  '/cold-room/manage': ['cold_room.manage'],
  '/cold-room/temperature': ['cold_room.temperature'],
  '/cold-room/inventory': ['cold_room.inventory'],
  '/shipments': ['shipments.view'],
  '/shipments/create': ['shipments.create'],
  '/shipments/track': ['shipments.track'],
  '/carriers': ['carriers.view'],
  '/carriers/manage': ['carriers.manage'],
  '/carriers/assign': ['carriers.assign'],
  '/outbound': ['loading.view'],
  '/loading': ['loading.view'],
  '/loading/create': ['loading.create'],
  '/loading/manage': ['loading.manage'],
  '/tag-management': ['inventory.manage'],
  '/inventory': ['inventory.view'],
  '/inventory/manage': ['inventory.manage'],
  '/inventory/packaging': ['inventory.packaging'],
  '/produce': ['cold_room.inventory'],
  '/utility': ['utilities.view'],
  '/utility/record': ['utilities.record'],
  
  // Financials
  '/financials': ['dashboard.analytics'],
  '/payroll': ['employees.payroll'],
  '/financials/petty-cash': ['admin.settings'],
  '/financials/accounts-receivable': ['customers.receivables'],
  '/financials/invoices': ['customers.invoices'],
  '/financials/ledger': ['admin.settings'],
  
  // Administration
  '/reports': ['admin.audit'],
  '/sop': ['admin.settings'],
  '/user-roles': ['admin.roles'],
  '/branches': ['admin.settings'],
  '/clients': ['customers.manage'],
  '/security': ['admin.settings'],
  '/settings': ['admin.settings'],
};

// Admin-only routes (full system access)
const adminOnlyRoutes = [
  '/user-roles',
  '/security',
  '/settings',
  '/branches',
];

// ✅ Function to determine first accessible page based on permissions
const getFirstAccessiblePage = (permissions: string[]): string => {
  // Check permissions in priority order
  if (permissions.includes('vehicle_log.view') || permissions.includes('vehicle_log.manage')) {
    return '/vehicle-management';
  }
  if (permissions.includes('suppliers.weigh')) {
    return '/weight-capture';
  }
  if (permissions.includes('counting.perform')) {
    return '/warehouse';
  }
  if (permissions.includes('cold_room.view') || permissions.includes('cold_room.manage') || 
      permissions.includes('cold_room.temperature') || permissions.includes('cold_room.inventory')) {
    return '/cold-room';
  }
  if (permissions.includes('shipments.view') || permissions.includes('shipments.create') || 
      permissions.includes('shipments.update') || permissions.includes('shipments.track') || 
      permissions.includes('shipments.manifest')) {
    return '/shipments';
  }
  if (permissions.includes('qc.view') || permissions.includes('qc.perform') || 
      permissions.includes('qc.approve') || permissions.includes('qc.export')) {
    return '/quality-control';
  }
  if (permissions.includes('inventory.view') || permissions.includes('inventory.manage') || 
      permissions.includes('inventory.packaging') || permissions.includes('inventory.reports')) {
    return '/inventory';
  }
  if (permissions.includes('loading.view') || permissions.includes('loading.create') || 
      permissions.includes('loading.manage') || permissions.includes('loading.assign') || 
      permissions.includes('loading.transit')) {
    return '/outbound';
  }
  if (permissions.includes('carriers.view') || permissions.includes('carriers.manage') || 
      permissions.includes('carriers.assign') || permissions.includes('carriers.track')) {
    return '/carriers';
  }
  if (permissions.includes('utilities.view') || permissions.includes('utilities.record') || 
      permissions.includes('utilities.analyze') || permissions.includes('utilities.reports')) {
    return '/utility';
  }
  if (permissions.includes('suppliers.view') || permissions.includes('suppliers.manage') || 
      permissions.includes('suppliers.visitors')) {
    return '/suppliers';
  }
  if (permissions.some(p => p.startsWith('employees.'))) {
    return '/employees';
  }
  if (permissions.includes('customers.view') || permissions.includes('customers.manage') || 
      permissions.includes('customers.quotes') || permissions.includes('customers.invoices') || 
      permissions.includes('customers.receivables')) {
    return '/customers';
  }
  if (permissions.includes('admin.users') || permissions.includes('admin.roles') || 
      permissions.includes('admin.settings') || permissions.includes('admin.audit') || 
      permissions.includes('admin.backup')) {
    return '/user-roles';
  }
  // Fallback to dashboard
  return '/dashboard';
};

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // 2. Get authentication token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. Parse user permissions from token
  const userPermissions = token.permissions || [];
  const userRole = token.role || 'No Role';
  
  // 4. Check if route is admin-only
  const isAdminRoute = adminOnlyRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isAdminRoute) {
    const hasAdminAccess = userRole === 'Administrator' || 
                          userPermissions.includes('admin.all') ||
                          userPermissions.includes('admin.settings');
    
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // 5. ✅ Redirect from root or dashboard to first accessible page
  if (pathname === '/' || pathname === '/dashboard') {
    const redirectUrl = getFirstAccessiblePage(userPermissions);
    // Only redirect if not already on the right page
    if (pathname !== redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }
  
  // 6. Check route-specific permissions
  let routePermissionChecked = false;
  
  for (const [route, requiredPermissions] of Object.entries(routePermissions)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      routePermissionChecked = true;
      
      // Check if user has at least one required permission
      const hasRequiredPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission) ||
        userPermissions.includes('admin.all') ||
        userRole === 'Administrator'
      );
      
      if (!hasRequiredPermission) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      break;
    }
  }
  
  // 7. For authenticated routes without specific permissions, allow access
  return NextResponse.next();
}