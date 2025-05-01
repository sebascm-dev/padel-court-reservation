"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import AvatarUpload from '@/components/profile/AvatarUpload';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import LocalidadAutocomplete from '@/components/ui/LocalidadAutocomplete';
import { getNivelDescription } from '@/utils/nivelPadel';

interface ProfileData {
    id?: string;
    nombre?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    sexo?: string;
    nivel?: string;
    localidad?: string;
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
                    apellidos: profile.apellidos,
                    telefono: profile.telefono,
                    sexo: profile.sexo,
                    nivel: profile.nivel,
                    localidad: profile.localidad
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="flex flex-col gap-2">
                                <label htmlFor="telefono" className="text-sm text-gray-600">Teléfono</label>
                                <input
                                    type="tel"
                                    id="telefono"
                                    placeholder="600000000"
                                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={profile.telefono || ''}
                                    onChange={(e) => setProfile({...profile, telefono: e.target.value})}
                                    disabled={updating}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="sexo" className="text-sm text-gray-600">Sexo</label>
                                <select
                                    id="sexo"
                                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={profile.sexo || ''}
                                    onChange={(e) => setProfile({...profile, sexo: e.target.value})}
                                    disabled={updating}
                                >
                                    <option value="">Selecciona</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="femenino">Femenino</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="nivel" className="text-sm text-gray-600">Nivel (1-10)</label>
                                <div className="flex flex-col">
                                    <input
                                        type="range"
                                        id="nivel"
                                        min="1"
                                        max="10"
                                        className="w-full"
                                        value={profile.nivel || '5'}
                                        onChange={(e) => setProfile({...profile, nivel: e.target.value})}
                                        disabled={updating}
                                    />
                                    <span className="text-center text-sm text-gray-600">
                                        Nivel: {getNivelDescription(profile.nivel)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="localidad" className="text-sm text-gray-600">Localidad</label>
                                <LocalidadAutocomplete
                                    value={profile.localidad || ''}
                                    onChange={(value) => setProfile({...profile, localidad: value})}
                                    disabled={updating}
                                />
                            </div>
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