"use client"
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { formatDateToSpanish } from '@/utils/dateUtils';
import UserAvatar from '@/components/common/UserAvatar';
import Spinner2 from '@/components/ui/Spinner2';

interface Player {
    user_id: string;
    usuarios: {
        id: string;
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
    players: Player[];
    isOwner: boolean;
    isPlayer: boolean;
}

export default function MyReservationsPage() {
    const router = useRouter();
    const { session } = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const ensureCorrectDateFormat = (dateString: string): string => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateString)) {
            const [month] = dateString.split('-').map(Number);
            if (month <= 12) {
                return dateString;
            }
        }

        const [year, day, month] = dateString.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const fetchUserReservations = useCallback(async () => {
        try {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            const today = now.toISOString().split('T')[0];

            const { data: ownedReservations, error: ownedError } = await supabase
                .from('reservations')
                .select('*')
                .eq('user_id', session?.user.id)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            let filteredOwnedReservations = [];
            if (ownedReservations) {
                filteredOwnedReservations = ownedReservations.filter(reservation => {
                    const reservationDate = ensureCorrectDateFormat(reservation.date);
                    if (reservationDate > today) return true;
                    if (reservationDate === today) {
                        return reservation.end_time > currentTime;
                    }
                    return false;
                });
            }

            if (ownedError) throw ownedError;

            const { data: joinedReservationsIds, error: joinedError } = await supabase
                .from('reservation_players')
                .select('reservation_id')
                .eq('user_id', session?.user.id);

            if (joinedError) throw joinedError;

            const joinedIds = joinedReservationsIds?.map(r => r.reservation_id) || [];
            const { data: joinedReservations, error: joinedDetailsError } = await supabase
                .from('reservations')
                .select('*')
                .in('id', joinedIds)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            let filteredJoinedReservations = [];
            if (joinedReservations) {
                filteredJoinedReservations = joinedReservations.filter(reservation => {
                    const reservationDate = ensureCorrectDateFormat(reservation.date);
                    if (reservationDate > today) return true;
                    if (reservationDate === today) {
                        return reservation.end_time > currentTime;
                    }
                    return false;
                });
            }

            if (joinedDetailsError) throw joinedDetailsError;

            const allReservations = Array.from(
                new Map(
                    [...filteredOwnedReservations, ...filteredJoinedReservations]
                        .map(item => [item.id, item])
                ).values()
            );

            const reservationsWithPlayers = await Promise.all(
                allReservations.map(async (reservation) => {
                    const { data: players, error: playersError } = await supabase
                        .from('reservation_players')
                        .select(`
                        user_id,
                        usuarios (
                            id,
                            nombre,
                            apellidos,
                            avatar_url
                        )
                    `)
                        .eq('reservation_id', reservation.id);

                    if (playersError) {
                        console.error('Error al obtener jugadores:', playersError);
                        return {
                            ...reservation,
                            players: [],
                            isOwner: reservation.user_id === session?.user.id,
                            isPlayer: true
                        };
                    }

                    return {
                        ...reservation,
                        players: players || [],
                        isOwner: reservation.user_id === session?.user.id,
                        isPlayer: true
                    };
                })
            );

            setReservations(reservationsWithPlayers);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar las reservas');
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (!session) {
            router.push('/login');
            return;
        }
        fetchUserReservations();
    }, [session, router, fetchUserReservations]);

    const handleDeleteReservation = async (reservationId: string) => {
        if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
            return;
        }

        try {
            const { error: playersError } = await supabase
                .from('reservation_players')
                .delete()
                .eq('reservation_id', reservationId);

            if (playersError) throw playersError;

            const { error: reservationError } = await supabase
                .from('reservations')
                .delete()
                .eq('id', reservationId);

            if (reservationError) throw reservationError;

            toast.success('Reserva cancelada correctamente');
            fetchUserReservations();
        } catch (error) {
            console.error('Error al cancelar la reserva:', error);
            toast.error('Error al cancelar la reserva');
        }
    };

    if (!session) return null;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Mis Reservas</h1>
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <Spinner2 className="w-12 h-12" />
                </div>
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-600 text-lg">No tienes reservas activas</p>
                    <p className="text-gray-400 text-sm mt-1">¡Reserva una pista y comienza a jugar!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reservations.map((reservation: Reservation) => (
                        <div
                            key={reservation.id}
                            className="border rounded-lg p-4 bg-white shadow-sm relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-lg flex items-center">
                                    <span>{formatDateToSpanish(reservation.date)}</span>
                                    <span className="text-sm text-gray-500/85 ml-2">
                                        ({reservation.start_time.slice(0, 5)})
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium
                                    ${reservation.is_private
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-green-100 text-green-700'}`}
                                >
                                    {reservation.is_private ? 'Privado' : 'Abierto'}
                                </span>
                            </div>

                            {!reservation.is_private && (
                                <>
                                    <div className="flex items-center gap-2 text-sm">
                                        {reservation.isOwner ? (
                                            <span className="text-green-600 font-medium">Creador</span>
                                        ) : (
                                            <span className="text-blue-600 font-medium">Jugador</span>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-gray-600 text-sm mb-2">Jugadores:</p>
                                        <ul className="grid gap-2">
                                            {reservation.players.map((player: Player) => (
                                                <li
                                                    key={`${reservation.id}-${player.user_id}`}
                                                    className="flex items-center gap-2"
                                                >
                                                    <UserAvatar
                                                        nombre={player.usuarios.nombre}
                                                        apellidos={player.usuarios.apellidos}
                                                        avatarUrl={player.usuarios.avatar_url}
                                                        size="sm"
                                                        className="w-8 h-8"
                                                    />
                                                    <span className="text-sm">
                                                        {player.usuarios.nombre} {player.usuarios.apellidos}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-center gap-2 mt-4">
                                {reservation.isOwner && (
                                    <button
                                        onClick={() => handleDeleteReservation(reservation.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium 
                                     text-red-600 hover:text-red-700 hover:bg-red-50 
                                     rounded-md transition-colors duration-200"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-5 h-5"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                            />
                                        </svg>
                                        Cancelar Reserva
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}