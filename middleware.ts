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
  
  // Customers (commented but keeping for reference)
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
  '/employees': ['employees.view'],
  '/employees/manage': ['employees.manage'],
  '/employees/attendance': ['employees.attendance'],
  '/employees/payroll': ['employees.payroll'],
  
  // Access Management
  '/visitor-management': ['suppliers.visitors'],
  '/vehicle-management': ['carriers.view'],
  
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
  
  // 5. Check route-specific permissions
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
  
  // 6. For authenticated routes without specific permissions, allow access
  return NextResponse.next();
}