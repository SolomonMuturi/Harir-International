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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Check if user exists in your User table
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true }
        });

        if (!user) {
          // User not found in your system
          throw new Error('User not found. Please contact administrator.');
        }

        // 2. Check if user has a password (some users might not if created differently)
        if (!user.password) {
          throw new Error('No password set. Please contact administrator.');
        }

        // 3. Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is temporarily locked. Please contact administrator.');
        }

        // 4. Verify password
        const passwordValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!passwordValid) {
          // Increment login attempts
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: user.loginAttempts + 1,
              lockedUntil: user.loginAttempts + 1 >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null // Lock for 15 minutes after 5 attempts
            }
          });
          
          throw new Error('Invalid password');
        }

        // 5. Reset login attempts on successful login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            loginAttempts: 0,
            lockedUntil: null
          }
        });

        // 6. Return user object that will be encoded in the JWT
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          role: user.role?.name || 'No Role'
        };
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
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    }
  }
};