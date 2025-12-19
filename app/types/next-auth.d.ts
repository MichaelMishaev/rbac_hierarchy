import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      avatar: string | null;
      isSuperAdmin: boolean;
      requirePasswordChange: boolean;
      activistProfile?: {
        id: string;
        neighborhoodId: string;
        cityId: string;
        neighborhood: {
          id: string;
          name: string;
        };
        city: {
          id: string;
          name: string;
        };
      } | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    isSuperAdmin: boolean;
    requirePasswordChange: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    avatar: string | null;
    isSuperAdmin: boolean;
    requirePasswordChange: boolean;
  }
}
