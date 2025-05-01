"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';

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
  const { session } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchUserReservations();
    }
  }, [session]);

  const fetchUserReservations = async () => {
    try {
        // 1. Obtener las reservas creadas por el usuario
        const { data: ownedReservations, error: ownedError } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', session?.user.id);

        if (ownedError) throw ownedError;

        // 2. Obtener las reservas donde el usuario es un jugador
        const { data: joinedReservationsIds, error: joinedError } = await supabase
            .from('reservation_players')
            .select('reservation_id')
            .eq('user_id', session?.user.id);

        if (joinedError) throw joinedError;

        // 3. Obtener los detalles de las reservas donde el usuario es jugador
        const joinedIds = joinedReservationsIds?.map(r => r.reservation_id) || [];
        const { data: joinedReservations, error: joinedDetailsError } = await supabase
            .from('reservations')
            .select('*')
            .in('id', joinedIds);

        if (joinedDetailsError) throw joinedDetailsError;

        // 4. Combinar todas las reservas eliminando duplicados
        const uniqueReservations = Array.from(new Map(
            [...(ownedReservations || []), ...(joinedReservations || [])]
                .map(item => [item.id, item])
        ).values());

        // 5. Obtener los jugadores para cada reserva
        const reservationsWithPlayers = await Promise.all(
            uniqueReservations.map(async (reservation) => {
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

        // 6. Ordenar por fecha y hora
        const sortedReservations = reservationsWithPlayers.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.start_time}`);
            const dateB = new Date(`${b.date}T${b.start_time}`);
            return dateA.getTime() - dateB.getTime();
        });

        setReservations(sortedReservations);
    } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar las reservas');
    } finally {
        setLoading(false);
    }
  };

  // Primero añadimos la función para borrar la reserva
  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('¿Estás seguro de que quieres borrar este partido?')) {
        return;
    }

    try {
        // Primero borramos los jugadores asociados
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

        toast.success('Partido borrado correctamente');
        fetchUserReservations(); // Actualizamos la lista
    } catch (error) {
        console.error('Error al borrar el partido:', error);
        toast.error('Error al borrar el partido');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mis Reservas</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation: Reservation) => (
            <div
                key={reservation.id}
                className="border rounded-lg p-4 bg-white shadow-sm relative"
            >
                {/* Header con fecha/hora y tipo */}
                <div className="flex justify-between items-start mb-4">
                    <div className="text-lg">
                        {new Date(reservation.date).toLocaleDateString('es', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })} - {reservation.start_time.slice(0, 5)} a {reservation.end_time.slice(0, 5)}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${reservation.is_private 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'}`}
                    >
                        {reservation.is_private ? 'Privado' : 'Abierto'}
                    </span>
                </div>

                {/* Estado del usuario en la reserva */}
                <div className="flex items-center gap-2 text-sm mb-3">
                    {reservation.isOwner ? (
                        <span className="text-green-600 font-medium">Creador</span>
                    ) : (
                        <span className="text-blue-600 font-medium">Jugador</span>
                    )}
                </div>

                {/* Lista de jugadores */}
                <div>
                    <p className="text-gray-600 text-sm mb-2">Jugadores:</p>
                    <ul className="grid gap-2">
                        {reservation.players.map((player: Player) => (
                            <li 
                                key={`${reservation.id}-${player.user_id}`}
                                className="flex items-center gap-2"
                            >
                                <img
                                    src={player.usuarios.avatar_url || '/default-avatar.png'}
                                    alt={`${player.usuarios.nombre} ${player.usuarios.apellidos}`}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                                <span className="text-sm">
                                    {player.usuarios.nombre} {player.usuarios.apellidos}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-4">
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
                            Borrar partido
                        </button>
                    )}
                    <div className="w-24">
                        {/* Espacio reservado para el próximo botón */}
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}