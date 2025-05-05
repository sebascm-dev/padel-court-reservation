"use client"
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';
import NextReservation from '@/components/dashboard/NextReservation';

export default function DashboardPage() {
    const router = useRouter();
    const { session } = useAuth();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        if (!session) {
            router.push('/login');
        } else {
            fetchUserName();
        }
    }, [session, router]);

    const fetchUserName = async () => {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('nombre')
            .eq('id', session?.user.id)
            .single();

        if (!error && user) {
            setUserName(user.nombre);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!session) return null;

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center gap-1 mb-6">
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="size-6 text-blue-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                    />
                </svg>
                <h1 className="text-2xl font-bold">
                    Bienvenido, <span className="text-blue-600">{userName}</span>
                </h1>
            </div>
            
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
