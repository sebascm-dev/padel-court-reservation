"use client"
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import NextReservation from '@/components/dashboard/NextReservation';
import DashboardActions from '@/components/dashboard/DashboardActions';
import ReservationsChart from '@/components/dashboard/ReservationsChart';
import UpcomingMatches from '@/components/dashboard/UpcomingMatches';

export default function DashboardPage() {
    const router = useRouter();
    const { session } = useAuth();
    const [userName, setUserName] = useState('');

    const fetchUserName = useCallback(async () => {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('nombre')
            .eq('id', session?.user.id)
            .single();

        if (!error && user) {
            setUserName(user.nombre);
        }
    }, [session]);

    useEffect(() => {
        if (!session) {
            router.push('/login');
        } else {
            fetchUserName();
        }
    }, [session, router, fetchUserName]);

    if (!session) return null;

    return (
        <div className="container mx-auto p-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1">
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
            </div>
            
            <div className="flex flex-col gap-5 mb-24">
                <div>
                    <NextReservation />
                </div>
                
                <div>
                    <DashboardActions />
                </div>
                
                <div className='mt-8'>
                    <UpcomingMatches />
                </div>

                <div className='mt-8'>
                    <ReservationsChart />
                </div>
            </div>
        </div>
    );
}
