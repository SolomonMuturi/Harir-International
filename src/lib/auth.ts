import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { role: true }
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          if (!user.password) {
            throw new Error('Account not properly configured. Please contact administrator.');
          }

          if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error('Account is temporarily locked. Please try again later or contact administrator.');
          }

          const passwordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!passwordValid) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: user.loginAttempts + 1,
                lockedUntil: user.loginAttempts + 1 >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
              }
            });
            
            throw new Error('Invalid credentials');
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              loginAttempts: 0,
              lockedUntil: null
            }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            role: user.role?.name || 'No Role',
            roleId: user.roleId,
            permissions: user.role?.permissions ? JSON.parse(user.role.permissions) : []
          };
        } catch (error: any) {
          console.error('Authentication error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
        token.permissions = user.permissions;
      }
      return token;
    }
  }
};