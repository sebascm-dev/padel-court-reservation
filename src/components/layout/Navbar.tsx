"use client"
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import Image from 'next/image';
import UserAvatar from '@/components/common/UserAvatar';

const Navbar = () => {
    const { session } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [userData, setUserData] = useState<{
        nombre: string;
        apellidos: string;
        avatar_url: string | null;
    } | null>(null);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!session?.user?.id) return; // Verificar que existe session.user.id

            const { data, error } = await supabase
                .from('usuarios')
                .select('nombre, apellidos, avatar_url')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error al obtener datos del usuario:', error);
                return;
            }

            if (data) {
                setUserData(data);
            }
        };

        if (session) {
            fetchUserData();
        }
    }, [session]); // Dependencia de session

    const handleNavigation = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    const handleLogout = async () => {
        setIsOpen(false);
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuVariants = {
        closed: {
            x: "100%",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        },
        open: {
            x: 0,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 40
            }
        }
    };

    const menuItems = [
        { label: 'Inicio', path: '/' },
        { label: 'Reservar', path: '/reservation' },
        { label: 'Mis Reservas', path: '/my-reservations' },
        { label: 'Partidos Disponibles', path: '/available-matches' },
        { label: 'Perfil', path: '/profile' }
    ];

    return (
        <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        {session && userData && ( // Verificar que existe session y userData
                            <div 
                                onClick={() => handleNavigation('/profile')}
                                className="cursor-pointer"
                            >
                                <UserAvatar
                                    nombre={userData.nombre}
                                    apellidos={userData.apellidos}
                                    avatarUrl={userData.avatar_url || ''}
                                    size="sm"
                                    className="border-2 border-blue-100 shadow-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Botón hamburguesa */}
                    <button
                        ref={buttonRef}
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2"
                    >
                        <div className="w-6 h-6 flex flex-col justify-between">
                            <motion.span
                                animate={isOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                                className="w-full h-0.5 bg-black block"
                            />
                            <motion.span
                                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                                className="w-full h-0.5 bg-black block"
                            />
                            <motion.span
                                animate={isOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                                className="w-full h-0.5 bg-black block"
                            />
                        </div>
                    </button>
                </div>
            </div>

            {/* Menú desplegable */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={menuRef}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50"
                    >
                        {/* Botón de cierre */}
                        <motion.button
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsOpen(false)}
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="relative w-6 h-6">
                                <motion.span
                                    className="absolute top-1/2 left-0 w-full h-0.5 bg-black block"
                                    style={{ y: "-50%" }}
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: 45 }}
                                />
                                <motion.span
                                    className="absolute top-1/2 left-0 w-full h-0.5 bg-black block"
                                    style={{ y: "-50%" }}
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: -45 }}
                                />
                            </div>
                        </motion.button>

                        <div className="p-6 flex flex-col gap-6">
                            {/* Logo en el menú */}
                            <div className="flex justify-center mb-6">
                                <Image
                                    src="/images/login/favicon.webp"
                                    alt="PadelApp Logo"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12"
                                />
                            </div>

                            {/* Enlaces del menú */}
                            {menuItems.map((item) => (
                                <button 
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className="text-left text-lg hover:text-blue-600 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="text-left text-lg text-red-500 hover:text-red-600 transition-colors"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;