"use client"
import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LocalidadAutocomplete from '@/components/ui/LocalidadAutocomplete';
import { getNivelDescription } from '@/utils/nivelPadel';
import { AuthError } from '@supabase/supabase-js';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        fechaNacimiento: '',
        sexo: '',
        nivel: '5',
        localidad: '',
        password: '',
        confirmPassword: ''
    });
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        const loadingToast = toast.loading('Creando tu cuenta...');

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;

            const { error: profileError } = await supabase
                .from('usuarios')
                .insert({
                    id: data.user?.id,
                    nombre: formData.nombre,
                    apellidos: formData.apellidos,
                    telefono: formData.telefono,
                    fecha_nacimiento: formData.fechaNacimiento,
                    sexo: formData.sexo,
                    nivel: parseInt(formData.nivel),
                    localidad: formData.localidad,
                });

            if (profileError) throw profileError;

            toast.dismiss(loadingToast);
            toast.success('¡Registro completado! Por favor, verifica tu email.');
            setRegistrationComplete(true);

        } catch (error) {
            toast.dismiss(loadingToast);
            console.error('Error durante el registro:', error);
            
            if (error instanceof AuthError) {
                if (error.message.includes('already registered')) {
                    toast.error('Este email ya está registrado');
                } else if (error.message.includes('weak-password')) {
                    toast.error('La contraseña es demasiado débil');
                } else {
                    toast.error('Error durante el registro');
                }
            } else {
                toast.error('Error durante el registro');
            }
        } finally {
            setLoading(false);
        }
    };

    if (registrationComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">¡Registro completado!</h2>
                        <p className="mt-2 text-gray-600">
                            Te hemos enviado un email de confirmación.
                            Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-4 bg-blue-500/80 text-white px-4 py-2 rounded-lg"
                        >
                            Ir al inicio de sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen fixed inset-0 bg-gray-900 overflow-hidden">
            {/* Fondo con gradiente suave */}
            <div className='absolute inset-0'>
                <div className='absolute inset-0 backdrop-blur-xs z-10'></div>
                <Image
                    src="/images/login/loginBackground.webp"
                    alt="Background"
                    fill
                    priority
                    sizes="100vw"
                    className='object-cover opacity-10'
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
                        delay: 0.2,
                    }}
                    className='relative z-10 flex-1 min-h-0'
                >
                    <div className='bg-white rounded-t-[40px] h-full overflow-y-auto'>
                        <div className='p-8 pb-20 pt-10'>
                            <h1 className='text-2xl font-semibold text-gray-800 text-center'>
                                Crear nueva cuenta 🎾
                            </h1>
                            <p className='text-sm text-gray-700/45 text-center mb-6'>
                                Regístrate para empezar a disfrutar de todas las funcionalidades
                            </p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-16">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Mantener los mismos inputs pero con los nuevos estilos */}
                                    <div className="space-y-2">
                                        <label htmlFor="nombre" className="text-sm text-gray-500 font-normal">
                                            Nombre
                                        </label>
                                        <input
                                            type="text"
                                            id="nombre"
                                            required
                                            placeholder="Tu nombre"
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="apellidos" className="text-sm text-gray-500 font-normal">
                                            Apellidos
                                        </label>
                                        <input
                                            type="text"
                                            id="apellidos"
                                            required
                                            placeholder="Tus apellidos"
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.apellidos}
                                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                                        />
                                    </div>

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
                                        <label htmlFor="telefono" className="text-sm text-gray-500 font-normal">
                                            Teléfono
                                        </label>
                                        <input
                                            type="tel"
                                            id="telefono"
                                            required
                                            placeholder="600000000"
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="fechaNacimiento" className="text-sm text-gray-500 font-normal">
                                            Fecha de nacimiento
                                        </label>
                                        <input
                                            type="date"
                                            id="fechaNacimiento"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.fechaNacimiento}
                                            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="sexo" className="text-sm text-gray-500 font-normal">
                                            Sexo
                                        </label>
                                        <select
                                            id="sexo"
                                            required
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.sexo}
                                            onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                                        >
                                            <option value="">Selecciona</option>
                                            <option value="masculino">Masculino</option>
                                            <option value="femenino">Femenino</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="nivel" className="text-sm text-gray-500 font-normal">
                                            Nivel (1-10)
                                        </label>
                                        <div className="flex flex-col gap-1">
                                            <input
                                                type="range"
                                                id="nivel"
                                                min="1"
                                                max="10"
                                                className="w-full"
                                                value={formData.nivel}
                                                onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                                            />
                                            <span className="text-center text-sm text-gray-500">
                                                Nivel: {getNivelDescription(formData.nivel)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="localidad" className="text-sm text-gray-500 font-normal">
                                            Localidad
                                        </label>
                                        <LocalidadAutocomplete
                                            value={formData.localidad}
                                            onChange={(value) => setFormData({ ...formData, localidad: value })}
                                            disabled={loading}
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
                                            placeholder="********"
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="text-sm text-gray-500 font-normal">
                                            Confirmar contraseña
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            required
                                            placeholder="********"
                                            className="w-full px-4 py-3 rounded-lg border-gray-200 bg-gray-50 focus:outline-none focus:border-gray-300 transition-all"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-4 bg-blue-700/85 text-white px-6 py-3.5 rounded-lg font-medium text-sm hover:bg-gray-900 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creando cuenta...' : 'Registrarse'}
                                </button>

                                <p className='text-sm text-gray-400 text-center'>
                                    ¿Ya tienes una cuenta? {" "}
                                    <a href="/login" className="text-black font-medium hover:underline">
                                        Inicia sesión
                                    </a>
                                </p>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}