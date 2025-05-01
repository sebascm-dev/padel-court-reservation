"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Player {
    user_id: string;
    usuario?: {
        nombre: string;
        apellidos: string;
        avatar_url?: string;
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

    const fetchReservations = async () => {
        try {
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
                .gte('date', new Date().toISOString().split('T')[0]);

            if (reservationsError) throw reservationsError;

            if (reservationsData) {
                const reservationsWithPlayers = await Promise.all(
                    reservationsData.map(async (reservation) => {
                        const { data: players, error: playersError } = await supabase
                            .from('reservation_players')
                            .select(`
                                user_id,
                                usuario:user_id (
                                    nombre,
                                    apellidos,
                                    avatar_url
                                )
                            `)
                            .eq('reservation_id', reservation.id);
                        
                        if (playersError) console.error('Error al obtener jugadores:', playersError);

                        return {
                            ...reservation,
                            players: players || []
                        };
                    })
                );

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
        try {
            const { error } = await supabase
                .from('reservation_players')
                .insert({ reservation_id: reservationId, user_id: session?.user.id });

            if (error) {
                throw error;
            }

            toast.success('Te has unido al partido');
            fetchReservations();
        } catch (error) {
            console.error('Error al unirse al partido:', error);
            toast.error('Error al unirse al partido');
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Partidos Disponibles</h1>
            
            {loading ? (
                <div className="text-center">Cargando partidos...</div>
            ) : reservations.length === 0 ? (
                <div className="text-center text-gray-500">
                    No hay partidos disponibles en este momento
                </div>
            ) : (
                <div className="grid gap-4">
                    {reservations.map((reservation) => (
                        <div
                            key={reservation.id}
                            className="border rounded-lg p-2 bg-white shadow-sm"
                        >
                            {/* Encabezado con fecha y hora */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-lg">
                                    {format(new Date(reservation.date), 'EEEE d \'de\' MMMM', { locale: es })}
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
                                            <div key={`team1-${position}`} className="relative">
                                                {player?.usuario ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={player.usuario.avatar_url || '/default-avatar.png'}
                                                            alt={player.usuario.nombre}
                                                            className="size-14 rounded-full border-2 object-cover border-gray-200"
                                                        />
                                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full 
                                                                    opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white 
                                                                    text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                                            {player.usuario.nombre}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleJoinMatch(reservation.id)}
                                                        disabled={!session || reservation.players.some(p => p.user_id === session?.user.id)}
                                                        className="size-14 rounded-full border-2 border-dashed border-gray-300 
                                                                 flex items-center justify-center hover:border-blue-500 
                                                                 hover:bg-blue-50 transition-colors disabled:opacity-50 
                                                                 disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                                                    >
                                                        <span className="text-xl text-gray-400 hover:text-blue-500">+</span>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* VS */}
                                <div className="text-base font-medium text-gray-500">VS</div>

                                {/* Equipo 2 */}
                                <div className="flex gap-4">
                                    {[2, 3].map((position) => {
                                        const player = reservation.players[position];
                                        return (
                                            <div key={`team2-${position}`} className="relative">
                                                {player?.usuario ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={player.usuario.avatar_url || '/default-avatar.png'}
                                                            alt={player.usuario.nombre}
                                                            className="size-14 rounded-full border-2 object-cover border-gray-200"
                                                        />
                                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full 
                                                                    opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white 
                                                                    text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                                            {player.usuario.nombre}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleJoinMatch(reservation.id)}
                                                        disabled={!session || reservation.players.some(p => p.user_id === session?.user.id)}
                                                        className="size-14 rounded-full border-2 border-dashed border-gray-300 
                                                                 flex items-center justify-center hover:border-blue-500 
                                                                 hover:bg-blue-50 transition-colors disabled:opacity-50 
                                                                 disabled:hover:border-gray-300 disabled:hover:bg-transparent"
                                                    >
                                                        <span className="text-xl text-gray-400 hover:text-blue-500">+</span>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer con información */}
                            <div className="flex justify-between items-center text-sm text-gray-500 mt-3">
                                <div>
                                    Creado por: {reservation.usuarios?.nombre} {reservation.usuarios?.apellidos}
                                </div>
                                <div>
                                    {reservation.players.length}/4 jugadores
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}