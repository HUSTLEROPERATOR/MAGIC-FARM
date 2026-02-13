import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { sendVerificationRequest } from '@/lib/email/auth-email';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';
import { hashIP } from '@/lib/security/crypto';

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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/login',
  },

  callbacks: {
    async signIn({ user }) {
      // Block soft-deleted users from signing in
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { deletedAt: true },
        });
        if (dbUser?.deletedAt) return false;
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, populate token from DB user
      if (user) {
        token.id = user.id;
        token.alias = user.alias ?? null;
        token.firstName = user.firstName ?? null;
        token.lastName = user.lastName ?? null;
        token.role = (user.role as 'USER' | 'ADMIN') ?? 'USER';

        // Check if user has completed onboarding by looking at consent
        const consent = await prisma.consent.findFirst({
          where: {
            userId: user.id,
            privacyAcceptedAt: { not: null },
          },
        });
        token.onboardingComplete = !!(
          user.firstName &&
          user.lastName &&
          consent?.privacyAcceptedAt
        );
        // Check if required consents (privacy + terms) are accepted
        token.consentsComplete = !!(
          consent?.privacyAcceptedAt &&
          consent?.termsAcceptedAt
        );
      }

      // Allow session updates to refresh token data
      if (trigger === 'update' && session) {
        if (session.alias !== undefined) token.alias = session.alias;
        if (session.firstName !== undefined) token.firstName = session.firstName;
        if (session.lastName !== undefined) token.lastName = session.lastName;
        if (session.onboardingComplete !== undefined)
          token.onboardingComplete = session.onboardingComplete;
        if (session.consentsComplete !== undefined)
          token.consentsComplete = session.consentsComplete;
        if (session.role !== undefined)
          token.role = session.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.alias = token.alias;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.onboardingComplete = token.onboardingComplete;
        session.user.consentsComplete = token.consentsComplete;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Invalid URL, fall through to baseUrl
      }
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        await createAuditLog({
          action: AUDIT_ACTIONS.USER_REGISTER,
          actorUserId: user.id,
          metadata: { emailHash: hashIP(user.email ?? '') },
        });
      } else {
        await createAuditLog({
          action: AUDIT_ACTIONS.USER_LOGIN,
          actorUserId: user.id,
          metadata: { emailHash: hashIP(user.email ?? '') },
        });
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};
