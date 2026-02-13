import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      alias?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      role: 'USER' | 'ADMIN';
      onboardingComplete: boolean;
      consentsComplete: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    alias?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role?: 'USER' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    alias?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: 'USER' | 'ADMIN';
    onboardingComplete: boolean;
    consentsComplete: boolean;
  }
}
