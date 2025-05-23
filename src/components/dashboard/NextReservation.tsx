"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import Spinner2 from '@/components/ui/Spinner2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDisplayEndTime, formatDateForDB } from '@/utils/dateUtils';
import confetti from 'canvas-confetti';
import UserAvatar from '@/components/common/UserAvatar';

interface Player {
  id: string;
  nombre: string;
  apellidos: string;
  avatar_url: string | null;
  nivel: number;
}

interface Reservation {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  players: Player[];
  is_private?: boolean;
  creator?: {
    id: string;
    nombre: string;
    apellidos: string;
    avatar_url: string | null;
  };
}

export default function NextReservation() {
  const { session } = useAuth();
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchNextReservation = useCallback(async () => {
    try {
      if (!session?.user.id) return;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const today = formatDateForDB(now);

      const { data: mine } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      const { data: asPlayer } = await supabase
        .from('reservation_players')
        .select('reservation_id')
        .eq('user_id', session.user.id);

      let playerRes: Reservation[] = [];
      if (asPlayer?.length) {
        const ids = asPlayer.map(r => r.reservation_id);
        const { data } = await supabase
          .from('reservations')
          .select('*')
          .in('id', ids)
          .gte('date', today)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        playerRes = data || [];
      }

      const all = [...(mine || []), ...playerRes];
      const validReservations = all.filter(reservation => {
        const reservationDate = reservation.date;
        if (reservationDate > today) return true;
        if (reservationDate === today) {
          return reservation.end_time > currentTime;
        }
        return false;
      });

      const next = validReservations
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.start_time}`);
          const dateB = new Date(`${b.date}T${b.start_time}`);
          return dateA.getTime() - dateB.getTime();
        })
        .shift();

      if (!next) {
        setNextReservation(null);
        setLoading(false);
        return;
      }

      const { data: playersRaw } = await supabase
        .from('reservation_players')
        .select(`
          usuarios (
            id,
            nombre,
            apellidos,
            avatar_url,
            nivel
          )
        `)
        .eq('reservation_id', next.id);

      const { data: reservationWithUser } = await supabase
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
        .eq('id', next.id)
        .single();

      setNextReservation({
        ...next,
        players: playersRaw?.map(p => p.usuarios) || [],
        creator: reservationWithUser.usuarios
      });

      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [session]);

  const handleCancelReservation = async () => {
    const confirmar = confirm('¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.');
    
    if (!confirmar) return;

    try {
      await supabase
        .from('reservation_players')
        .delete()
        .eq('reservation_id', nextReservation?.id || '');

      await supabase
        .from('reservations')
        .delete()
        .eq('id', nextReservation?.id || '');

      fetchNextReservation();
    } catch (error) {
      console.error('Error al cancelar la reserva:', error);
    }
  };

  useEffect(() => {
    fetchNextReservation();
  }, [fetchNextReservation]);

  useEffect(() => {
    if (!nextReservation) return;

    const timer = setInterval(() => {
      const reservationDate = new Date(`${nextReservation.date}T${nextReservation.start_time}`);
      const now = new Date();
      const diff = reservationDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('¡Hora de jugar!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4CAF50', '#2196F3', '#FFC107', '#E91E63']
        });
        
        setTimeout(() => {
          fetchNextReservation();
        }, 60000);
        
        clearInterval(timer);
        return;
      }

      const hours_left = Math.floor(diff / (1000 * 60 * 60));
      const minutes_left = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds_left = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours_left}h ${minutes_left}m ${seconds_left}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [nextReservation, fetchNextReservation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner2 className="w-8 h-8" />
      </div>
    );
  }

  if (!nextReservation) {
    return (
        <div>
            <h2 className="text-lg font-semibold mb-2">Próxima Reserva</h2>
            <div>
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-2">
                        <svg 
                            className="w-12 h-12 text-gray-300" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg text-gray-600">
                        No tienes reservas activas
                    </h3>
                    <p className="text-gray-500 text-sm">
                        ¡Reserva una pista y comienza a jugar!
                    </p>
                </div>
            </div>
        </div>
    );
  }

  const { date, start_time, end_time, players } = nextReservation;

  const formattedDate = new Date(`${date}T00:00:00`);

  const displayDate = format(formattedDate, "EEEE, d 'de' MMMM", { locale: es })
    .split(' ')
    .map(word => word === 'de' ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const avgLevel = players.length 
    ? (players.reduce((sum, p) => sum + p.nivel, 0) / players.length).toFixed(1) 
    : '—';
  const slots = [0, 1, 2, 3];

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Próxima Reserva</h2>

      <div className={`relative bg-white rounded-xl p-6 border border-gray-200 shadow-md h-[160px]
        ${nextReservation.is_private ? 'bg-gradient-to-br from-purple-50 to-white' : ''}`}>
        
        <div className="absolute top-2.5 left-4 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border
            ${nextReservation.is_private 
              ? 'bg-purple-100 text-purple-700 border-purple-200' 
              : players.length < 4 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'}`}
          >
            {nextReservation.is_private ? 'Privada' : players.length < 4 ? 'Abierta' : 'Completa'}
          </span>
          
          <button
            onClick={handleCancelReservation}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Cancelar reserva"
          >
            <svg 
              className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        <div className="absolute top-3 right-4">
          <span className="text-base font-medium text-gray-700">
            {displayDate}
          </span>
        </div>

        {nextReservation.is_private && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <UserAvatar
                    nombre={nextReservation.creator?.nombre || ''}
                    apellidos={nextReservation.creator?.apellidos || ''}
                    avatarUrl={nextReservation.creator?.avatar_url || ''}
                    size='lg'
                    className="border-2 border-purple-100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!nextReservation.is_private && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1">
            <div className="flex gap-4">
              {slots.map(i => {
                const p = players[i];
                return p ? (
                  <div key={i} className="text-center">
                    <div className="aspect-square w-12 h-12">
                      <UserAvatar
                        nombre={p.nombre}
                        apellidos={p.apellidos}
                        avatarUrl={p.avatar_url || ''}
                        className="border-2 w-full h-full border-green-100 shadow-sm"
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">{p.nombre}</span>
                  </div>
                ) : (
                  <div key={i} className="text-center">
                    <div className="aspect-square w-12">
                      <div className="size-12 rounded-full bg-gray-50 border-2 border-gray-100 
                                  flex items-center justify-center shadow-sm">
                        <span className="text-gray-400 text-sm">+</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-1 block">Libre</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-0 right-0 flex justify-between items-center px-4">
          <span className="text-gray-600 font-medium">
            {start_time.slice(0, 5)} a {formatDisplayEndTime(end_time)}
          </span>
          <span className={`font-medium ${
            nextReservation.is_private 
              ? 'text-purple-600/75 font-semibold tabular-nums' 
              : 'text-gray-600'
            } ${
              timeLeft === '¡Hora de jugar!' 
                ? 'animate-bounce text-green-500 font-bold' 
                : ''
            }`}>
            {nextReservation.is_private ? timeLeft : `Nivel: ${avgLevel}`}
          </span>
        </div>
      </div>
    </div>
  );
}
