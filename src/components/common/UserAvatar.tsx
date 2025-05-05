"use client"
import Image from 'next/image';

interface UserAvatarProps {
    nombre: string;
    apellidos: string;
    avatarUrl?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const UserAvatar = ({ nombre, apellidos, avatarUrl, size = 'md', className = '' }: UserAvatarProps) => {
    const getInitials = () => {
        const firstInitial = nombre?.charAt(0) || '';
        const lastInitial = apellidos?.charAt(0) || '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    const sizeClasses = {
        sm: 'w-10 h-10 text-sm',
        md: 'w-14 h-14 text-base',
        lg: 'w-20 h-20 text-xl'
    };

    if (avatarUrl) {
        return (
            <div className={`relative overflow-hidden rounded-full ${sizeClasses[size]} ${className}`}>
                <Image
                    src={avatarUrl}
                    alt={`${nombre} ${apellidos}`}
                    fill
                    className="object-cover"
                    sizes={`(max-width: 768px) ${sizeClasses[size].split(' ')[0]}, ${sizeClasses[size].split(' ')[0]}`}
                />
            </div>
        );
    }

    return (
        <div className={`rounded-full flex items-center justify-center bg-blue-500/80 text-white font-bold text-xl
            ${sizeClasses[size]} ${className}`}>
            {getInitials()}
        </div>
    );
};

export default UserAvatar;