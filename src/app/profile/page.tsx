"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import AvatarUpload from '@/components/profile/AvatarUpload';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface ProfileData {
    id?: string;
    nombre?: string;
    apellidos?: string;
    email?: string;
    avatar_url?: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData>({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const router = useRouter();
    const { session } = useAuth();

    useEffect(() => {
        if (!session) {
            router.push('/login');
            return;
        }
        getProfile();
    }, [session]);

    async function getProfile() {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) throw new Error('No user');

            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setProfile(data || {});
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar el perfil');
        } finally {
            setLoading(false);
        }
    }

    const handleAvatarUpload = (url: string) => {
        setProfile({ ...profile, avatar_url: url });
        toast.success('Avatar actualizado correctamente');
    };

    async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            setUpdating(true);
            const { error } = await supabase
                .from('usuarios')
                .update({
                    nombre: profile.nombre,
                    apellidos: profile.apellidos
                })
                .eq('id', session?.user.id);

            if (error) throw error;
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar el perfil');
        } finally {
            setUpdating(false);
        }
    }

    if (!session) return null;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
            
            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <Spinner className="h-8 w-8" />
                </div>
            ) : (
                <>
                    <div className="mb-8 flex justify-center">
                        <AvatarUpload 
                            url={profile.avatar_url}
                            onUpload={handleAvatarUpload}
                            size={150}
                            nombre={profile.nombre}
                            apellidos={profile.apellidos}
                        />
                    </div>

                    <form onSubmit={updateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={profile.nombre || ''}
                                onChange={(e) => setProfile({ ...profile, nombre: e.target.value })}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={updating}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellidos
                            </label>
                            <input
                                type="text"
                                value={profile.apellidos || ''}
                                onChange={(e) => setProfile({ ...profile, apellidos: e.target.value })}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={updating}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={session?.user?.email || ''}
                                disabled
                                className="w-full p-2 border rounded bg-gray-50"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed relative"
                            disabled={updating}
                        >
                            {updating ? (
                                <div className="flex items-center justify-center">
                                    <Spinner className="h-5 w-5 mr-2" />
                                    <span>Actualizando...</span>
                                </div>
                            ) : (
                                'Actualizar Perfil'
                            )}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}