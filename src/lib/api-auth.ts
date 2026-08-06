import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  roleId?: string;
  permissions?: string[];
}

export type AuthResult =
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized', message: 'You must be logged in to access this resource.' },
    { status: 401 }
  );
}

function forbidden(required: string[]): NextResponse {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: 'You do not have permission to perform this action.',
      required: required.join(' or '),
    },
    { status: 403 }
  );
}

export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return { user: null, error: unauthorized() };
  }

  const jwtToken = token as any;

  return {
    user: {
      id: (jwtToken.sub as string) || '',
      email: (jwtToken.email as string) || undefined,
      name: (jwtToken.name as string) || undefined,
      role: (jwtToken.role as string) || '',
      roleId: (jwtToken.roleId as string) || undefined,
      permissions: (jwtToken.permissions as string[]) || [],
    },
    error: null,
  };
}

/**
 * Verifies the request is authenticated and that the user holds at least one
 * of the required permissions. Admins (role 'Administrator' or 'admin.all')
 * are always allowed. An empty `required` array allows any authenticated user.
 *
 * Returns `{ user, error: null }` on success or `{ user: null, error: <Response> }`
 * on failure. Callers should `return auth.error` when it is set.
 */
export async function requirePermission(
  request: NextRequest,
  required: string[]
): Promise<AuthResult> {
  const result = await getAuthUser(request);
  if (result.error) {
    return result;
  }

  const { user } = result;
  const permissions = user.permissions || [];
  const isAdmin = user.role === 'Administrator' || permissions.includes('admin.all');
  const hasPermission = required.length === 0 || required.some((p) => permissions.includes(p));

  if (!isAdmin && !hasPermission) {
    return { user: null, error: forbidden(required) };
  }

  return { user, error: null };
}
