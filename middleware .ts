import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Si el usuario no está autenticado y trata de acceder a rutas protegidas
    if (!session && req.nextUrl.pathname.startsWith('/')) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Si el usuario está autenticado y trata de acceder a login/register
    if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
}

export const config = {
    matcher: [
        '/:path*', 
        '/login', 
        '/register',
        '/auth/callback'
    ],
};