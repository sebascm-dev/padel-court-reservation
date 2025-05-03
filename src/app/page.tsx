"use client"
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect } from 'react';
import NextReservation from '@/components/dashboard/NextReservation';

export default function DashboardPage() {
    const router = useRouter();
    const { session } = useAuth();

    useEffect(() => {
        if (!session) {
            router.push('/login');
        }
    }, [session, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!session) return null;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Próxima Reserva */}
                <div>
                    <NextReservation />
                </div>
                
                {/* Otros widgets del dashboard */}
            </div>

            <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded mt-4"
            >
                Cerrar sesión
            </button>
        </div>
    );
}
