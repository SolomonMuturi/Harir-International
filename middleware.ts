import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { enforceCsrf, enforceRateLimit } from '@/lib/security';

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
  '/oranges': ['citrus.view'],
  '/oranges/manage': ['citrus.manage'],
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

// API route permissions - enforced server-side for all /api/* requests.
// A route not listed here only requires an authenticated session.
// `permissions` applies to every method; `methods` overrides per HTTP method.
// Order does not matter here - entries are sorted by specificity at check time.
const apiRoutePermissions: Record<string, { permissions?: string[]; methods?: Record<string, string[]> }> = {
  '/api/activity-logs': {
    methods: {
      GET: ['admin.audit', 'admin.settings'],
      DELETE: ['admin.audit', 'admin.settings'],
    },
    permissions: [],
  },
  '/api/user-roles': { permissions: ['admin.roles', 'admin.settings'] },
  '/api/attendance': { permissions: ['employees.attendance.view', 'employees.attendance.record'] },
  '/api/employees': { permissions: ['employees.overview.view', 'employees.list.view', 'employees.edit', 'employees.create'] },
  '/api/weights': {
    methods: {
      GET: ['suppliers.weigh', 'qc.view', 'qc.perform', 'counting.perform', 'inventory.view', 'cold_room.view', 'cold_room.manage', 'dashboard.view', 'dashboard.analytics'],
      POST: ['suppliers.weigh'],
      PATCH: ['suppliers.weigh'],
      PUT: ['suppliers.weigh'],
      DELETE: ['suppliers.weigh'],
    },
  },
  '/api/weights/kpi': { permissions: ['suppliers.weigh', 'dashboard.view', 'dashboard.analytics', 'inventory.view'] },
  '/api/quality-control': {
    methods: {
      GET: ['qc.view', 'qc.perform', 'qc.approve'],
      POST: ['qc.perform', 'qc.approve'],
    },
  },
  '/api/quality-checks': {
    methods: {
      GET: ['qc.view', 'qc.perform', 'qc.approve'],
      POST: ['qc.perform', 'qc.approve'],
    },
  },
  '/api/rejects': {
    methods: {
      GET: ['qc.view', 'qc.perform', 'qc.approve', 'suppliers.weigh', 'counting.perform', 'inventory.view'],
      POST: ['qc.perform', 'suppliers.weigh'],
      DELETE: ['qc.perform', 'suppliers.weigh'],
    },
  },
  '/api/counting': {
    methods: {
      GET: ['counting.perform', 'suppliers.weigh', 'inventory.view', 'cold_room.view'],
      POST: ['counting.perform'],
      PATCH: ['counting.perform'],
      PUT: ['counting.perform'],
      DELETE: ['counting.perform'],
    },
  },
  '/api/cold-room': {
    methods: {
      GET: ['cold_room.view', 'cold_room.manage', 'cold_room.temperature', 'cold_room.inventory'],
      POST: ['cold_room.manage', 'cold_room.temperature', 'cold_room.inventory'],
    },
  },
  '/api/cold-room-inventory': { permissions: ['cold_room.inventory', 'cold_room.manage', 'inventory.view'] },
  '/api/citrus-intake': {
    methods: {
      GET: ['citrus.view', 'citrus.manage'],
      POST: ['citrus.manage'],
      PUT: ['citrus.manage'],
      DELETE: ['citrus.manage'],
    },
  },
  '/api/citrus-movements': {
    methods: {
      GET: ['citrus.view', 'citrus.manage'],
      POST: ['citrus.manage'],
      PUT: ['citrus.manage'],
      DELETE: ['citrus.manage'],
    },
  },
  '/api/shipments': {
    methods: {
      GET: ['shipments.view', 'shipments.create', 'shipments.update', 'shipments.track', 'shipments.manifest', 'loading.view', 'inventory.view', 'carriers.view'],
      POST: ['shipments.create', 'inventory.manage'],
    },
  },
  '/api/carriers': {
    methods: {
      GET: ['carriers.view', 'carriers.manage', 'carriers.assign', 'carriers.track'],
      POST: ['carriers.manage'],
      PATCH: ['carriers.manage'],
      DELETE: ['carriers.manage'],
    },
  },
  '/api/carrier-assignments': { permissions: ['carriers.assign', 'carriers.manage'] },
  '/api/utility-readings': {
    methods: {
      GET: ['utilities.view', 'utilities.record', 'utilities.analyze', 'utilities.reports'],
      POST: ['utilities.record'],
      PATCH: ['utilities.record'],
      PUT: ['utilities.record'],
      DELETE: ['utilities.record'],
    },
  },
  '/api/visitors': {
    methods: {
      GET: ['suppliers.visitors', 'admin.settings'],
      POST: ['suppliers.visitors'],
      PATCH: ['suppliers.visitors'],
      PUT: ['suppliers.visitors'],
      DELETE: ['suppliers.visitors'],
    },
  },
  '/api/vehicle-visits': {
    methods: {
      GET: ['vehicle_log.view', 'vehicle_log.manage'],
      POST: ['vehicle_log.manage'],
      PATCH: ['vehicle_log.manage'],
      PUT: ['vehicle_log.manage'],
      DELETE: ['vehicle_log.manage'],
    },
  },
  '/api/inventory': { permissions: ['inventory.view', 'inventory.manage', 'inventory.packaging', 'cold_room.inventory'] },
  '/api/inventory/packaging': {
    methods: {
      GET: ['inventory.packaging', 'inventory.manage'],
      POST: ['inventory.packaging', 'inventory.manage'],
      PATCH: ['inventory.packaging', 'inventory.manage'],
      DELETE: ['inventory.packaging', 'inventory.manage'],
    },
  },
  '/api/inventory/stock-take': { permissions: ['inventory.manage'] },
  '/api/inventory/cold-room': { permissions: ['cold_room.inventory', 'cold_room.manage', 'inventory.view'] },
  '/api/inventory/kpi': { permissions: ['inventory.view', 'inventory.manage', 'dashboard.view'] },
  '/api/analytics': { permissions: ['dashboard.analytics', 'admin.settings'] },
  '/api/dashboard/stats': { permissions: ['dashboard.view', 'dashboard.analytics'] },
  '/api/loading-sheets': { permissions: ['loading.view', 'loading.create', 'loading.manage', 'loading.assign'] },
  '/api/outbound-shipments': { permissions: ['loading.view', 'inventory.view'] },
  '/api/outbound-stats': { permissions: ['loading.view', 'dashboard.analytics'] },
  '/api/log-entry': { permissions: ['suppliers.weigh', 'cold_room.manage', 'loading.manage'] },
  '/api/containers': { permissions: ['shipments.manage', 'inventory.manage', 'shipments.view'] },
  '/api/transit-history': { permissions: ['shipments.track', 'shipments.view'] },
};

// Sorted by specificity so nested routes (e.g. /api/inventory/packaging) match
// before their parent (/api/inventory).
const apiRoutePermissionEntries = Object.entries(apiRoutePermissions).sort(
  (a, b) => b[0].length - a[0].length
);

// ✅ UPDATED: Function to determine first accessible page - ADMIN FIRST
const getFirstAccessiblePage = (permissions: string[]): string => {
  // 👑 ADMIN FIRST - Highest priority
  if (permissions.some(p => p.startsWith('admin.'))) {
    return '/dashboard';
  }
  
  // Check permissions in priority order
  if (permissions.includes('vehicle_log.view') || permissions.includes('vehicle_log.manage')) {
    return '/vehicle-management';
  }
  if (permissions.includes('suppliers.weigh')) {
    return '/weight-capture';
  }
  if (permissions.includes('citrus.view') || permissions.includes('citrus.manage')) {
    return '/oranges';
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
  const isApiRoute = pathname.startsWith('/api');
  
  // 0. CSRF protection for state-changing requests (before public-route exemption,
  //    so login/sign-in endpoints are covered too). Blocks cross-site requests.
  const csrfError = enforceCsrf(request);
  if (csrfError) return csrfError;
  
  // 0.5. Rate limiting for API routes (auth brute-force + mutation bursts).
  const rateError = enforceRateLimit(request);
  if (rateError) return rateError;
  
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
  
  // If no token, block the request (JSON 401 for APIs, redirect for pages)
  if (!token) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access this resource.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. Parse user permissions from token
  const userPermissions = token.permissions || [];
  const userRole = token.role || 'No Role';
  const hasAdminAccess = userRole === 'Administrator' || userPermissions.includes('admin.all');
  
  // 3.5. Enforce API route permissions (server-side authorization)
  if (isApiRoute) {
    const matchedApi = apiRoutePermissionEntries.find(
      ([route]) => pathname === route || pathname.startsWith(route + '/')
    );
    
    if (matchedApi) {
      const [, config] = matchedApi;
      const method = request.method.toUpperCase();
      const required = (config.methods && config.methods[method]) ?? config.permissions ?? [];
      
      if (required.length > 0) {
        const hasPermission = required.some(permission => userPermissions.includes(permission));
        
        if (!hasAdminAccess && !hasPermission) {
          return NextResponse.json(
            {
              error: 'Forbidden',
              message: 'You do not have permission to access this resource.',
              required: required.join(' or '),
            },
            { status: 403 }
          );
        }
      }
    }
    
    return NextResponse.next();
  }
  
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
  
  // 5. Redirect from root or dashboard to first accessible page
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