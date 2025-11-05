// types/next-auth.d.ts

import type { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'doctor' | 'patient';
    } & DefaultUser;
  }

  interface User extends DefaultUser {
    id: string;
    role: 'doctor' | 'patient';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'doctor' | 'patient';
  }
}
