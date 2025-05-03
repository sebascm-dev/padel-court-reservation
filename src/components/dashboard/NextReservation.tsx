"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import Spinner2 from '@/components/ui/Spinner2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Player {
    id: string;
    nombre: string;
    apellidos: string;
    avatar_url: string | null;
}

interface Reservation {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    players: Player[];
}

export default function NextReservation() {
    const { session } = useAuth();
    const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchNextReservation = async () => {
        try {
            if (!session?.user.id) return;

            // Formatear la fecha de hoy en el formato correcto (aaaa-dd-mm)
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            console.log('Fecha de búsqueda:', today); // Para debug

            // 1. Obtener las reservas donde soy creador
            const { data: myReservations, error: myReservationsError } = await supabase
                .from('reservations')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('date', today)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            if (myReservationsError) {
                console.error('Error al obtener mis reservas:', myReservationsError);
            }

            // 2. Obtener las reservas donde soy jugador
            const { data: reservationsAsPlayer, error: playerError } = await supabase
                .from('reservation_players')
                .select('reservation_id')
                .eq('user_id', session.user.id);

            if (playerError) {
                console.error('Error al obtener reservas como jugador:', playerError);
            }

            let playerReservations = [];
            if (reservationsAsPlayer && reservationsAsPlayer.length > 0) {
                const reservationIds = reservationsAsPlayer.map(r => r.reservation_id);
                const { data, error } = await supabase
                    .from('reservations')
                    .select('*')
                    .in('id', reservationIds)
                    .gte('date', today)
                    .order('date', { ascending: true })
                    .order('start_time', { ascending: true });
                
                if (error) {
                    console.error('Error al obtener detalles de reservas:', error);
                }
                
                playerReservations = data || [];
            }

            // 3. Combinar y ordenar todas las reservas
            const allReservations = [...(myReservations || []), ...playerReservations];
            console.log('Todas las reservas:', allReservations); // Para debug

            const nextReservation = allReservations.sort((a, b) => {
                // Convertir las fechas al formato correcto (aaaa-dd-mm)
                const [yearA, dayA, monthA] = a.date.split('-');
                const [yearB, dayB, monthB] = b.date.split('-');
                
                const dateA = new Date(`${yearA}-${monthA}-${dayA}T${a.start_time}`);
                const dateB = new Date(`${yearB}-${monthB}-${dayB}T${b.start_time}`);
                
                return dateA.getTime() - dateB.getTime();
            })[0];

            console.log('Próxima reserva:', nextReservation); // Para debug

            if (nextReservation) {
                // 4. Obtener los jugadores de la reserva
                const { data: players } = await supabase
                    .from('reservation_players')
                    .select(`
                        usuarios (
                            id,
                            nombre,
                            apellidos,
                            avatar_url
                        )
                    `)
                    .eq('reservation_id', nextReservation.id);

                setNextReservation({
                    ...nextReservation,
                    players: players?.map(p => p.usuarios) || []
                });
            } else {
                setNextReservation(null);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error al obtener la próxima reserva:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNextReservation();
    }, [session]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner2 className="w-8 h-8" />
            </div>
        );
    }

    if (!nextReservation) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-2">Próxima Reserva</h2>
                <p className="text-gray-500 text-sm">No tienes reservas próximas</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Próxima Reserva</h2>
            <div className="space-y-3">
                <div>
                    <p className="text-gray-600 font-medium">
                        {format(new Date(`${nextReservation.date}T00:00:00`), "EEEE, d 'de' MMMM", { 
                            locale: es 
                        })}
                    </p>
                    <p className="text-gray-500">
                        {nextReservation.start_time.slice(0, 5)} - {nextReservation.end_time.slice(0, 5)}
                    </p>
                </div>
                
                <div>
                    <p className="text-sm text-gray-600 mb-2">Jugadores:</p>
                    <div className="flex flex-wrap gap-2">
                        {nextReservation.players.map((player) => (
                            <div key={player.id} className="flex items-center gap-2">
                                {player.avatar_url ? (
                                    <img
                                        src={player.avatar_url}
                                        alt={`${player.nombre} ${player.apellidos}`}
                                        className="w-6 h-6 rounded-full"
                                    />
                                ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-600">
                                            {player.nombre[0]}
                                        </span>
                                    </div>
                                )}
                                <span className="text-sm text-gray-600">
                                    {player.nombre} {player.apellidos}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}