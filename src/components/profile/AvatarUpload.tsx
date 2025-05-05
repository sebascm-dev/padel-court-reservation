"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Spinner from '../ui/Spinner';
import Image from 'next/image';

interface AvatarUploadProps {
    url?: string;
    onUpload: (url: string) => void;
    size?: number;
    nombre?: string;
    apellidos?: string;
}

export default function AvatarUpload({ url, onUpload, size = 150, nombre, apellidos }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (url) {
            setAvatarUrl(url);
            setImageError(false);
        }
    }, [url]);

    const getInitials = () => {
        if (!nombre) return '?';
        const firstInitial = nombre[0];
        const secondInitial = apellidos ? apellidos[0] : '';
        return `${firstInitial}${secondInitial}`.toUpperCase();
    };

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true);

            const file = event.target.files?.[0];
            if (!file) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { 
                    upsert: true,
                    cacheControl: '0'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            onUpload(publicUrl);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al subir el avatar');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div 
                className="relative overflow-hidden rounded-full bg-gray-100"
                style={{ width: size, height: size }}
            >
                {avatarUrl && !imageError ? (
                    <div className="relative w-full h-full">
                        {(uploading || imageLoading) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
                                <Spinner className="h-8 w-8" />
                            </div>
                        )}
                        <Image
                            src={avatarUrl}
                            alt="Avatar"
                            fill
                            className="object-cover"
                            onLoad={() => setImageLoading(false)}
                            onError={() => setImageError(true)}
                            sizes={`${size}px`}
                        />
                    </div>
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-blue-500/80 text-white text-6xl font-bold">
                        {uploading ? (
                            <Spinner className="h-8 w-8" />
                        ) : (
                            getInitials()
                        )}
                    </div>
                )}
            </div>
            
            <label className="cursor-pointer bg-blue-500/80 text-white px-4 py-2 rounded hover:bg-blue-300/75 transition-colors">
                {uploading ? 'Subiendo...' : 'Cambiar avatar'}
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}