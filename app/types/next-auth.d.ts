import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      avatar: string | null;
      isSuperAdmin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    isSuperAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    avatar: string | null;
    isSuperAdmin: boolean;
  }
}
