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
];

// Routes that only require authentication (no specific role)
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
];

// Admin routes that require admin role
const adminRoutes = [
  '/admin',
  '/user-roles',
  '/users',
  '/system-settings',
];

// Export the middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
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
  
  // 2. Check if user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // If no token and not on public route, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. Parse user role from token (adjust based on your token structure)
  const userRole = token.role || 'user';
  const userPermissions = token.permissions || [];
  
  // 4. Check if route requires admin access
  const isAdminRoute = adminRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isAdminRoute) {
    // Check if user has admin role or specific permissions
    const isAdmin = userRole === 'Administrator' || 
                    userRole === 'admin' || 
                    userPermissions.includes('admin.users') ||
                    userPermissions.includes('admin.roles');
    
    if (!isAdmin) {
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // 5. Check if route is protected (requires authentication)
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }
  
  // 6. Handle API routes with CORS
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Set CORS headers for all API routes except auth
    if (!pathname.startsWith('/api/auth/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: response.headers,
        });
      }
    }
    
    // Check authentication for protected API routes
    if (!pathname.startsWith('/api/auth/') && !token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return response;
  }
  
  // 7. Allow access for authenticated users
  return NextResponse.next();
}

// Helper function to check if user has permission
function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || 
         userPermissions.includes('admin.all');
}

// Optional: Create a custom middleware for specific route protection
export async function withRoleCheck(
  request: NextRequest,
  requiredRole?: string,
  requiredPermission?: string
) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const userRole = token.role || 'user';
  const userPermissions = token.permissions || [];
  
  // Check role if required
  if (requiredRole && userRole !== requiredRole) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // Check permission if required
  if (requiredPermission && !hasPermission(userPermissions, requiredPermission)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return null; // Allow access
}