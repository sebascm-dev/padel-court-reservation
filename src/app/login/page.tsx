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
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            toast.dismiss(loadingToast);
            toast.success('¡Sesión iniciada correctamente!');
            router.push('/');
            router.refresh();

        } catch (error: any) {
            toast.dismiss(loadingToast);
            if (error.message === 'Invalid login credentials') {
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
                    className='object-cover opacity-30'
                />
            </div>

            {/* Contenido principal */}
            <div className="relative z-20 mx-auto max-w-md h-full flex flex-col px-6 pt-12"> 
                {/* Header con animación suave */}
                <motion.header 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className='flex items-center justify-center mb-16' 
                >
                    <div className='relative size-20'> 
                        <Image
                            src="/images/login/favicon.webp"
                            alt="Logo"
                            fill
                            priority
                            className='object-contain drop-shadow-lg'
                        />
                    </div>
                </motion.header>

                {/* Contenedor del formulario */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className='flex-1 relative z-10 max-h-[500px]'
                >
                    <div className='bg-white/85 backdrop-blur-xl rounded-3xl p-8 shadow-xl'> 
                        <h1 className='text-xl font-medium text-gray-800 mb-4 text-center'>
                            Bienvenido de nuevo
                        </h1>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-sm text-gray-600 font-medium ml-1">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    placeholder="ejemplo@correo.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="password" className="text-sm text-gray-600 font-medium ml-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-3 bg-blue-500/80 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25" 
                            >
                                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </button>

                            <p className='text-sm text-gray-500 mt-4 text-center'>
                                ¿No tienes cuenta? {" "}
                                <a href="/register" className="text-primary font-medium hover:underline">
                                    Crear cuenta
                                </a>
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}