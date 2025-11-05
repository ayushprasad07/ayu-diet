import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16 requires either default export or named "proxy" export
export default async function proxy(req: NextRequest) {
  // Check if NEXTAUTH_SECRET is set
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('NEXTAUTH_SECRET is not set in environment variables');
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // Protect Doctor Dashboard routes
  if (pathname.startsWith('/dashboard/doctor')) {
    if (!token || (token as any).role !== 'doctor') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect Patient Dashboard routes
  if (pathname.startsWith('/dashboard/patient')) {
    if (!token || (token as any).role !== 'patient') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
