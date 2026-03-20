// types/next-auth.d.ts
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    roleId?: string;
    permissions?: string[];
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role?: string;
      roleId?: string;
      permissions?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    roleId?: string;
    permissions?: string[];
  }
}