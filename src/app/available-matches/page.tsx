"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { formatDateToSpanish, formatDisplayEndTime } from '@/utils/dateUtils';
import UserAvatar from '@/components/common/UserAvatar';
import Spinner2 from '@/components/ui/Spinner2';
import { useRouter } from 'next/navigation'; // Añadir esto

// Reemplazar la función getLocalISOString por una más específica
const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Añadir función para validar formato de fecha
const isValidDateFormat = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const [month, day] = dateString.split('-').map(Number);
    return month <= 12 && day <= 31;
};

interface Player {
    user_id: string;
    usuario?: {
        nombre: string;
        apellidos: string;
        avatar_url?: string;
        nivel: number; // Añadimos el nivel
    };
}

interface Reservation {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_private: boolean;
    user_id: string;
    usuarios: {
        id: string;
        nombre: string;
        apellidos: string;
        avatar_url?: string;
    } | null;
    players: Player[];
}

export default function AvailableMatchesPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const { session } = useAuth();
    const router = useRouter(); // Añadir esto

    useEffect(() => {
        if (!session) {
            router.push('/login');
            return;
        }
        fetchReservations();
    }, [session, router]); // Añadir router a las dependencias

    const fetchReservations = async () => {
        try {
            // Obtener fecha y hora actual
            const now = new Date();
            const currentTime = now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            const today = formatDateToYYYYMMDD(now);

            const { data: reservationsData, error: reservationsError } = await supabase
                .from('reservations')
                .select(`
                    *,
                    usuarios (
                        id,
                        nombre,
                        apellidos,
                        avatar_url
                    )
                `)
                .eq('is_private', false)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            if (reservationsError) throw reservationsError;

            if (reservationsData) {
                // Filtrar reservas pasadas y formatear fechas
                const formattedReservations = reservationsData
                    .filter(reservation => {
                        const reservationDate = isValidDateFormat(reservation.date) 
                            ? reservation.date 
                            : formatDateToYYYYMMDD(new Date(reservation.date));
                        
                        // Si la fecha es futura, mantener la reserva
                        if (reservationDate > today) return true;
                        // Si es hoy, verificar la hora
                        if (reservationDate === today) {
                            return reservation.end_time > currentTime;
                        }
                        return false;
                    })
                    .map(reservation => ({
                        ...reservation,
                        date: isValidDateFormat(reservation.date) 
                            ? reservation.date 
                            : formatDateToYYYYMMDD(new Date(reservation.date))
                    }));

                // Obtener los jugadores para cada reserva
                const reservationsWithPlayers = await Promise.all(
                    formattedReservations.map(async (reservation) => {
                        const { data: players, error: playersError } = await supabase
                            .from('reservation_players')
                            .select(`
                                user_id,
                                usuario:user_id (
                                    nombre,
                                    apellidos,
                                    avatar_url,
                                    nivel
                                )
                            `)
                            .eq('reservation_id', reservation.id);
                        
                        if (playersError) {
                            console.error('Error al obtener jugadores:', playersError);
                            return {
                                ...reservation,
                                players: []
                            };
                        }

                        return {
                            ...reservation,
                            players: players || []
                        };
                    })
                );

                console.log('Reservas filtradas y formateadas:', reservationsWithPlayers);
                setReservations(reservationsWithPlayers);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar las reservas');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinMatch = async (reservationId: string) => {
        if (!session) return;

        try {
            // 1. Primero verificamos el número actual de jugadores
            const { data: currentPlayers, error: countError } = await supabase
                .from('reservation_players')
                .select('user_id')
                .eq('reservation_id', reservationId);

            if (countError) throw countError;

            // Verificar si el partido está lleno
            if (currentPlayers && currentPlayers.length >= 4) {
                toast.error('El partido está completo');
                return;
            }

            // 2. Si hay espacio, intentamos unir al jugador
            const { error } = await supabase
                .from('reservation_players')
                .insert({ 
                    reservation_id: reservationId, 
                    user_id: session.user.id,
                    created_at: new Date().toISOString()
                });

            if (error) {
                // Si hay error por restricción única, significa que ya está lleno
                if (error.code === '23505') {
                    toast.error('Ya eres parte de este partido');
                    return;
                }
                throw error;
            }

            toast.success('Te has unido al partido');
            fetchReservations();
        } catch (error) {
            console.error('Error al unirse al partido:', error);
            toast.error('Error al unirse al partido');
        }
    };

    const handleLeaveMatch = async (reservationId: string, isCreator: boolean) => {
        try {
            if (isCreator) {
                const shouldCancel = window.confirm(
                    '¿Eres el creador del partido. ¿Quieres cancelar la reserva completa? ' +
                    'Esto eliminará el partido para todos los jugadores.'
                );

                if (shouldCancel) {
                    // Primero borramos los jugadores
                    const { error: playersError } = await supabase
                        .from('reservation_players')
                        .delete()
                        .eq('reservation_id', reservationId);

                    if (playersError) throw playersError;

                    // Luego borramos la reserva
                    const { error: reservationError } = await supabase
                        .from('reservations')
                        .delete()
                        .eq('id', reservationId);

                    if (reservationError) throw reservationError;

                    toast.success('Reserva cancelada correctamente');
                } else {
                    // Si no quiere cancelar la reserva, solo se sale como jugador
                    const { error } = await supabase
                        .from('reservation_players')
                        .delete()
                        .eq('reservation_id', reservationId)
                        .eq('user_id', session?.user.id);

                    if (error) throw error;
                    
                    toast.success('Te has salido del partido');
                }
            } else {
                // Comportamiento normal para jugadores no creadores
                const { error } = await supabase
                    .from('reservation_players')
                    .delete()
                    .eq('reservation_id', reservationId)
                    .eq('user_id', session?.user.id);

                if (error) throw error;
                
                toast.success('Te has salido del partido');
            }

            fetchReservations();
        } catch (error) {
            console.error('Error al salirse del partido:', error);
            toast.error('Error al salirse del partido');
        }
    };

    // Añadir protección antes del return
    if (!session) return null;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Partidos Disponibles</h1>
            
            {loading ? (
                <div className="text-center"></div>
            ) : reservations.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-12 w-12 mx-auto mb-3" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-600 text-lg">No hay partidos disponibles</p>
                    <p className="text-gray-400 text-sm mt-1">¡Crea un partido nuevo y encuentra compañeros para jugar!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reservations.map((reservation) => (
                        <div
                            key={reservation.id}
                            className="border rounded-lg border-gray-300/50 p-2 bg-white shadow-lg relative"
                        >
                            {/* Overlay para partido completo */}
                            {reservation.players.length >= 4 && 
                            !reservation.players.some(p => p.user_id === session?.user.id) && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs 
                                              rounded-lg z-10 flex items-center justify-center">
                                    <div className="bg-red-500/60 text-white px-6 py-3 rounded-lg 
                                                  font-semibold text-lg shadow-xl transform">
                                        Partido Completo
                                    </div>
                                </div>
                            )}

                            {/* Encabezado con fecha y hora */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-lg">
                                    <span>
                                        {formatDateToSpanish(
                                            isValidDateFormat(reservation.date) 
                                                ? reservation.date 
                                                : formatDateToYYYYMMDD(new Date(reservation.date)),
                                        )}
                                    </span>
                                </h3>
                                <span className="text-lg font-medium">
                                    {reservation.start_time.slice(0, 5)}
                                </span>
                            </div>

                            {/* Equipos */}
                            <div className="flex justify-center items-center gap-6 my-4">
                                {/* Equipo 1 */}
                                <div className="flex gap-4">
                                    {[0, 1].map((position) => {
                                        const player = reservation.players[position];
                                        return (
                                            <div key={`team1-${position}`} className="relative group flex flex-col items-center">
                                                {player?.usuario ? (
                                                    <>
                                                        <button 
                                                            onClick={() => {
                                                                if (session?.user.id === player.user_id) {
                                                                    handleLeaveMatch(
                                                                        reservation.id, 
                                                                        session.user.id === reservation.user_id
                                                                    );
                                                                }
                                                            }}
                                                            className="relative w-14 h-14 rounded-full overflow-hidden"
                                                            title={session?.user.id === player.user_id ? "Salir del partido" : player.usuario.nombre}
                                                        >
                                                            <UserAvatar
                                                                nombre={player.usuario.nombre}
                                                                apellidos={player.usuario.apellidos}
                                                                avatarUrl={player.usuario.avatar_url}
                                                                className={session?.user.id === player.user_id ? 'opacity-50' : ''}
                                                            />
                                                            {/* Icono de papelera siempre visible para el usuario actual */}
                                                            {session?.user.id === player.user_id && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <svg 
                                                                        className="w-8 h-8 text-red-500 transition-transform duration-300 
                                                                                group-hover:scale-110"
                                                                        viewBox="0 0 24 24" 
                                                                        fill="none" 
                                                                        stroke="currentColor" 
                                                                        strokeWidth="2"
                                                                    >
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                        <line x1="10" y1="11" x2="10" y2="17" />
                                                                        <line x1="14" y1="11" x2="14" y2="17" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                        {/* Nivel del jugador */}
                                                        <span className="mt-1 text-sm font-medium text-gray-600">
                                                            Nivel {player.usuario.nivel}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <button
                                                            onClick={() => handleJoinMatch(reservation.id)}
                                                            disabled={!session || 
                                                                      reservation.players.some(p => p.user_id === session?.user.id) ||
                                                                      reservation.players.length >= 4}
                                                            className="size-14 rounded-full border-2 border-dashed border-gray-300 
                                                                     flex items-center justify-center hover:border-blue-500 
                                                                     hover:bg-blue-50 transition-colors disabled:opacity-50 
                                                                     disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                                                        >
                                                            <span className="text-xl text-gray-400 hover:text-blue-500">
                                                                {reservation.players.length >= 4 ? 'Completo' : '+'}
                                                            </span>
                                                        </button>
                                                        <span className="mt-1 text-sm font-medium text-gray-400">
                                                            Vacío
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* VS */}
                                <div className="flex flex-col items-center">
                                    <div className="text-base font-medium text-gray-500 mb-1">VS</div>
                                    {reservation.players.length > 0 && (
                                        <div className="text-sm text-gray-600">
                                            {(reservation.players.reduce((acc, player) => 
                                                acc + (player.usuario?.nivel || 0), 0) / 
                                                reservation.players.length).toFixed(2)}
                                        </div>
                                    )}
                                </div>

                                {/* Equipo 2 */}
                                <div className="flex gap-4">
                                    {[2, 3].map((position) => {
                                        const player = reservation.players[position];
                                        return (
                                            <div key={`team2-${position}`} className="relative group flex flex-col items-center">
                                                {player?.usuario ? (
                                                    <>
                                                        <button 
                                                            onClick={() => {
                                                                if (session?.user.id === player.user_id) {
                                                                    handleLeaveMatch(
                                                                        reservation.id, 
                                                                        session.user.id === reservation.user_id
                                                                    );
                                                                }
                                                            }}
                                                            className="relative w-14 h-14 rounded-full overflow-hidden"
                                                            title={session?.user.id === player.user_id ? "Salir del partido" : player.usuario.nombre}
                                                        >
                                                            <UserAvatar
                                                                nombre={player.usuario.nombre}
                                                                apellidos={player.usuario.apellidos}
                                                                avatarUrl={player.usuario.avatar_url}
                                                                className={session?.user.id === player.user_id ? 'opacity-50' : ''}
                                                            />
                                                            {/* Icono de papelera siempre visible para el usuario actual */}
                                                            {session?.user.id === player.user_id && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <svg 
                                                                        className="w-8 h-8 text-red-500 transition-transform duration-300 
                                                                                group-hover:scale-110"
                                                                        viewBox="0 0 24 24" 
                                                                        fill="none" 
                                                                        stroke="currentColor" 
                                                                        strokeWidth="2"
                                                                    >
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                        <line x1="10" y1="11" x2="10" y2="17" />
                                                                        <line x1="14" y1="11" x2="14" y2="17" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                        {/* Nivel del jugador */}
                                                        <span className="mt-1 text-sm font-medium text-gray-600">
                                                            Nivel {player.usuario.nivel}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <button
                                                            onClick={() => handleJoinMatch(reservation.id)}
                                                            disabled={!session || 
                                                                      reservation.players.some(p => p.user_id === session?.user.id) ||
                                                                      reservation.players.length >= 4}
                                                            className="size-14 rounded-full border-2 border-dashed border-gray-300 
                                                                     flex items-center justify-center hover:border-blue-500 
                                                                     hover:bg-blue-50 transition-colors disabled:opacity-50 
                                                                     disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                                                        >
                                                            <span className="text-xl text-gray-400 hover:text-blue-500">
                                                                {reservation.players.length >= 4 ? 'Completo' : '+'}
                                                            </span>
                                                        </button>
                                                        <span className="mt-1 text-sm font-medium text-gray-400">
                                                            Vacío
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer con información */}
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
                                <div>
                                    {reservation.start_time.slice(0, 5)} a {formatDisplayEndTime(reservation.end_time)}
                                </div>
                                <div>
                                    {reservation.players.length}/4 jugadores
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {loading && (
                <div className="flex justify-center items-center h-full">
                    <Spinner2 className="w-12 h-12" />
                </div>
            )}
        </div>
    );
}