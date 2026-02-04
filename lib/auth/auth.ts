import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { sendVerificationRequest } from '@/lib/email/auth-email';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM || 'Magic Farm <noreply@magic-farm.com>',
      sendVerificationRequest,
    }),
  ],

  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/login',
  },

  callbacks: {
    async session({ session, user }) {
      // Add user id and alias to the session
      if (session.user) {
        session.user.id = user.id;
        session.user.alias = (user as any).alias;
        session.user.firstName = (user as any).firstName;
        session.user.lastName = (user as any).lastName;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        // Log new user registration
        console.log(`[AUTH] New user registered: ${user.email}`);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
