"use client"

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
            <img
                src={avatarUrl}
                alt={`${nombre} ${apellidos}`}
                className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
            />
        );
    }

    return (
        <div className={`rounded-full flex items-center justify-center bg-primary text-white font-bold text-xl
            ${sizeClasses[size]} ${className}`}>
            {getInitials()}
        </div>
    );
};

export default UserAvatar;