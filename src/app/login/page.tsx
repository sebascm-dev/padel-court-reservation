"use client"
import Image from 'next/image';
import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const loadingToast = toast.loading('Iniciando sesión...');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            toast.dismiss(loadingToast);
            toast.success('¡Sesión iniciada correctamente!');
            router.push('/');
            router.refresh();

        } catch (error) {
            toast.dismiss(loadingToast);
            if (error instanceof Error && error.message === 'Invalid login credentials') {
                toast.error('Credenciales incorrectas');
            } else {
                toast.error('Error al iniciar sesión');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen fixed inset-0 bg-gray-900">
            {/* Fondo con gradiente suave */}
            <div className='absolute inset-0'> 
                <div className='absolute inset-0 backdrop-blur-xs z-10'></div>
                <Image
                    src="/images/login/loginBackground.webp"
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className='object-cover opacity-10' // Reducida opacidad
                />
            </div>

            {/* Contenido principal */}
            <div className="relative z-20 mx-auto w-full max-w-md h-full flex flex-col justify-start">
                {/* Header con animación suave */}
                <header className='flex items-center justify-center mb-12 pt-12'>
                    <motion.div 
                        className='relative size-28'
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                    >
                        <Image
                            src="/images/login/favicon.webp"
                            alt="Logo"
                            fill
                            priority
                            className='object-contain drop-shadow-lg'
                        />
                    </motion.div>
                </header>

                {/* Contenedor del formulario */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ 
                        duration: 0.5,
                        ease: "easeInOut",
                        delay: 0.2, // Añadido un pequeño retraso para la animación
                    }}
                    className='relative z-10 flex-1'
                >
                    <div className='bg-white rounded-t-[40px] h-full p-8 pt-12'> {/* Cambiado rounded-t-[40px] a rounded-tl-[40px] */}
                        <h1 className='text-2xl font-semibold text-gray-800 text-center'>
                            ¡Bienvenido de nuevo! 👋
                        </h1>
                        <p className='text-sm text-gray-700/45 text-center mb-6'>
                            Accede a tu cuenta y disfruta de todas las funcionalidades para gestionar tus partidos de pádel
                        </p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm text-gray-500 font-normal">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    placeholder="ejemplo@correo.com"
                                    className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm text-gray-500 font-normal">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 bg-blue-700/85 text-white px-6 py-3.5 rounded-lg font-medium text-sm hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                            >
                                {loading ? 'Iniciando sesión...' : 'Login'}
                            </button>

                            <p className='text-sm text-gray-400 text-center'>
                                ¿No tienes una cuenta? {" "}
                                <a href="/register" className="text-black font-medium hover:underline">
                                    Registrate
                                </a>
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}