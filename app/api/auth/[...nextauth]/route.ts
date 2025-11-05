// app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { Doctor } from '@/model/doctorSchema';
import { User } from '@/model/userSchema';
import dbConnect from '@/lib/dbConnect';

// ======================================
// FIXED VERSION
// ======================================
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'example@gmail.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();

          const { email, password } = credentials;

          // Try to find user in Doctor collection first
          let user = await Doctor.findOne({ email }).lean() as any;
          let role: 'doctor' | 'patient' = 'doctor';

          // If not found in Doctor, try Patient collection
          if (!user) {
            user = await User.findOne({ email }).lean() as any;
            role = 'patient';
          }

          // If still not found, return null
          if (!user) {
            return null;
          }

          // Verify password exists
          if (!user.password) {
            return null;
          }

          const isValid = await compare(password, user.password);
          
          if (!isValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          role: token.role,
        };
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Export NextAuth route handler for Next.js App Router
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
