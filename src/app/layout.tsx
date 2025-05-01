import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/components/auth/AuthProvider';
import NavbarWrapper from '@/components/layout/NavbarWrapper';
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Padel Court Reservation",
    description: "Reserva de pistas de pádel de forma fácil y rápida",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider>
                    <NavbarWrapper />
                    <main className="min-h-screen pt-16">
                        {children}
                    </main>
                    <Toaster position="top-center" />
                </AuthProvider>
            </body>
        </html>
    );
}
