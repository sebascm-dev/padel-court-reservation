"use client"
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';

export default function Dashboard() {
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
        <div className="p-4">
            <h1>Dashboard</h1>
            <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded"
            >
                Cerrar sesión
            </button>
        </div>
    );
}
