"use client"
import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import LocalidadAutocomplete from '@/components/ui/LocalidadAutocomplete';
import { getNivelDescription } from '@/utils/nivelPadel';

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

        } catch (error: any) {
            toast.dismiss(loadingToast);
            console.error('Error durante el registro:', error);
            if (error.message.includes('already registered')) {
                toast.error('Este email ya está registrado');
            } else if (error.message.includes('weak-password')) {
                toast.error('La contraseña es demasiado débil');
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
                            className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
                        >
                            Ir al inicio de sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <div className='fixed inset-0'>
                <div className='absolute inset-0 bg-black/30 backdrop-blur-sm z-10'></div>
                <Image
                    src="/images/login/loginBackground.webp"
                    alt="Logo de Padel Court Reservation"
                    fill
                    priority
                    className='object-cover'
                />
            </div>

            <div className="relative z-20 mx-auto max-w-6xl">
                <header className='h-[25vh] relative overflow-hidden flex items-center justify-center'>
                    <div className='relative size-32'>
                        <Image
                            src="/images/login/favicon.webp"
                            alt="Logo de Padel Court Reservation"
                            fill
                            priority
                            className='object-contain -mt-7.5'
                        />
                    </div>
                </header>

                <motion.footer 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ 
                        type: "spring",
                        damping: 25,
                        stiffness: 180,
                    }}
                    className='min-h-[75vh] relative z-10 overflow-hidden rounded-t-[2.5rem] bg-background -mt-8'
                >
                    <div className='flex flex-col gap-4 p-6 pb-8'>
                        <h1 className='text-2xl text-gray-800 font-semibold mt-2 mb-4'>Crear nueva cuenta</h1>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="nombre" className="text-sm text-gray-600">Nombre</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        required
                                        placeholder="Tu nombre"
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="apellidos" className="text-sm text-gray-600">Apellidos</label>
                                    <input
                                        type="text"
                                        id="apellidos"
                                        required
                                        placeholder="Tus apellidos"
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.apellidos}
                                        onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="email" className="text-sm text-gray-600">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        placeholder="ejemplo@correo.com"
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="telefono" className="text-sm text-gray-600">Teléfono</label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        required
                                        placeholder="600000000"
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="fechaNacimiento" className="text-sm text-gray-600">Fecha de nacimiento</label>
                                    <input
                                        type="date"
                                        id="fechaNacimiento"
                                        required
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.fechaNacimiento}
                                        onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="sexo" className="text-sm text-gray-600">Sexo</label>
                                    <select
                                        id="sexo"
                                        required
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.sexo}
                                        onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                                    >
                                        <option value="">Selecciona</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="femenino">Femenino</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="nivel" className="text-sm text-gray-600">Nivel (1-10)</label>
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="range"
                                            id="nivel"
                                            min="1"
                                            max="10"
                                            className="px-4 py-2"
                                            value={formData.nivel}
                                            onChange={(e) => setFormData({...formData, nivel: e.target.value})}
                                        />
                                        <span className="text-center text-sm text-gray-600">
                                            Nivel: {getNivelDescription(formData.nivel)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="localidad" className="text-sm text-gray-600">Localidad</label>
                                    <LocalidadAutocomplete
                                        value={formData.localidad}
                                        onChange={(value) => setFormData({...formData, localidad: value})}
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="password" className="text-sm text-gray-600">Contraseña</label>
                                    <input
                                        type="password"
                                        id="password"
                                        required
                                        placeholder="********"
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="confirmPassword" className="text-sm text-gray-600">Confirmar contraseña</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        required
                                        placeholder="********"
                                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="bg-primary text-white px-4 py-3 mt-6 rounded-lg font-medium text-sm hover:bg-primary/75 hover:cursor-pointer transition-all ease-in duration-200"
                                disabled={loading}
                            >
                                {loading ? 'Cargando...' : 'Crear cuenta'}
                            </button>
                            <p className='text-sm text-primary/40 -mt-3 flex justify-center items-center'>
                                ¿Ya tienes cuenta? <a href="/login" className="ml-1 text-primary hover:underline">Inicia sesión</a>
                            </p>
                        </form>
                    </div>
                </motion.footer>
            </div>
        </div>
    );
}