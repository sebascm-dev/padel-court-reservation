"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Spinner from './Spinner';

interface UserData {
    nombre?: string;
    apellidos?: string;
    avatar_url?: string;
}

export default function Avatar() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function getUserData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('usuarios')
                        .select('nombre, apellidos, avatar_url')
                        .eq('id', user.id)
                        .single();
                    
                    if (error) throw error;
                    setUserData(data);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        getUserData();
    }, []);

    const getInitials = (nombre?: string, apellidos?: string) => {
        if (!nombre) return '?';
        const firstInitial = nombre[0];
        const secondInitial = apellidos ? apellidos[0] : '';
        return `${firstInitial}${secondInitial}`.toUpperCase();
    };

    return (
        <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden">
            {isLoading ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Spinner className="h-5 w-5" />
                </div>
            ) : userData?.avatar_url && !imageError ? (
                <div className="relative w-full h-full">
                    <img 
                        src={userData.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            ) : (
                <div className="bg-blue-700/85 text-white w-full h-full flex items-center justify-center font-bold">
                    {getInitials(userData?.nombre, userData?.apellidos)}
                </div>
            )}
        </div>
    );
}