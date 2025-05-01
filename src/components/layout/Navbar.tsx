"use client"
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
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

    const handleLogout = async () => {
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

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Perfil */}
                    <div className="flex items-center">
                        <Avatar />
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
                        <div className="p-6 flex flex-col gap-6">
                            {/* Logo */}
                            <div className="flex justify-center mb-6">
                                <h1 className="text-xl font-bold">PadelApp</h1>
                            </div>

                            {/* Enlaces del menú */}
                            <Link href="/" className="text-lg hover:text-blue-600 transition-colors">
                                Inicio
                            </Link>
                            <Link href="/profile" className="text-lg hover:text-blue-600 transition-colors">
                                Perfil
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-lg text-red-500 hover:text-red-600 transition-colors text-left"
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