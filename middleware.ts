import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/login', '/register', '/auth/callback'];
    
    // Obtener la ruta actual sin query params
    const currentPath = req.nextUrl.pathname;

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));

    // Si no hay sesión y la ruta no es pública, redirigir a login
    if (!session && !isPublicRoute) {
        const redirectUrl = new URL('/login', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    // Si hay sesión y trata de acceder a login/register, redirigir a home
    if (session && (currentPath === '/login' || currentPath === '/register')) {
        const redirectUrl = new URL('/', req.url);
        return NextResponse.redirect(redirectUrl);
    }

    return res;
}

// Asegúrate de que el matcher incluya todas las rutas que quieres proteger
export const config = {
    matcher: [
        '/',                    // página principal
        '/dashboard/:path*',    // todas las rutas que empiecen con /dashboard
        '/profile',            // ruta de perfil
        '/reservation',
        'my-reservations',
        'available-matches',
        '/login',             // ruta de login
        '/register',          // ruta de registro
    ]
};