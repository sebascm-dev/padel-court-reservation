"use client"
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
    const pathname = usePathname();
    const authRoutes = ['/login', '/register'];
    const showNavbar = !authRoutes.includes(pathname);

    if (!showNavbar) return null;

    return <Navbar />;
}