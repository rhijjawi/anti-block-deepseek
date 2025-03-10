import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// This function will verify the JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  if (path === '/' || path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth_token')?.value;

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify the token
  const isValid = await verifyToken(token);

  // If token is invalid, redirect to login
  if (!isValid) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/api/chat/:path*',
  ],
};
