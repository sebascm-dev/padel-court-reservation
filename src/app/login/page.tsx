"use client"
import Image from 'next/image';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Aquí irá la lógica de autenticación
        console.log('Datos del formulario:', formData);
    };

    return (
        <div className="min-h-screen relative">
            {/* Fondo que ocupa toda la pantalla */}
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

            {/* Contenido principal */}
            <div className="relative z-20 mx-auto max-w-6xl">
                <header className='h-[30vh] relative overflow-hidden flex items-center justify-center'>
                    <div className='relative size-36'>
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
                        duration: 0.3
                    }}
                    className='min-h-[75vh] relative z-10 overflow-hidden rounded-t-[2.5rem] bg-background -mt-8'
                >
                    <div className='flex flex-col gap-4 p-6 pb-8'>
                        <h1 className='text-2xl text-gray-800 font-semibold mt-2 mb-1'>Inicia Sesión con:</h1>

                        <button className="flex h-10 flex-row cursor-pointer text-black gap-2 items-center justify-center bg-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-zinc-100 transition-all ease-in duration-200 shadow-sm">
                            <Image
                                src="google.svg"
                                alt='Logo de Google'
                                width={20}
                                height={20}
                                className='w-6'
                            />
                            <span>Continuar con Google</span>
                        </button>

                        <button className="flex h-10 flex-row cursor-pointer text-black gap-3 items-center justify-center bg-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-zinc-100 transition-all ease-in duration-200 shadow-sm">
                            <Image
                                src="apple.svg"
                                alt='Logo de Apple'
                                width={20}
                                height={20}
                                className='w-5'
                            />
                            <span className='mt-0.5'>Continuar con Apple</span>
                        </button>

                        <div className="flex items-center justify-center">
                            <p className="text-gray-400 text-sm">ó</p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 -mt-2">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="text-sm text-gray-600 font-medium">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    placeholder="ejemplo@correo.com"
                                    className="px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label htmlFor="password" className="text-sm text-gray-600 font-medium">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    required
                                    placeholder="********"
                                    className="px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <button 
                                type="submit"
                                className="bg-primary text-white px-4 py-3 rounded-lg font-medium text-sm hover:bg-primary/75 hover:cursor-pointer transition-all ease-in duration-200"
                            >
                                Iniciar Sesión
                            </button>
                            <p className='text-sm text-primary/40 -mt-3 flex justify-center items-center'>
                                ¿No tienes cuenta? <a href="/register" className="ml-1 text-primary hover:underline">Registrarse</a>
                            </p>
                        </form>
                    </div>
                </motion.footer>
            </div>
        </div>
    );
}