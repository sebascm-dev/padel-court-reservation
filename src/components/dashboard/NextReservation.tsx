"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import Spinner2 from '@/components/ui/Spinner2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDisplayEndTime } from '@/utils/dateUtils';

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
}

export default function NextReservation() {
  const { session } = useAuth();
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNextReservation = async () => {
    try {
      if (!session?.user.id) return;
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}`;

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

      let playerRes: any[] = [];
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
      const next = all
        .sort((a, b) => {
          const [yA, dA, mA] = a.date.split('-');
          const [yB, dB, mB] = b.date.split('-');
          return (
            new Date(`${yA}-${mA}-${dA}T${a.start_time}`).getTime() -
            new Date(`${yB}-${mB}-${dB}T${b.start_time}`).getTime()
          );
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

      setNextReservation({
        ...next,
        players: playersRaw?.map(p => p.usuarios) || []
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
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

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const { date, start_time, end_time, players } = nextReservation;

  const [year, day, month] = date.split('-');
  const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);
  const displayDate = format(formattedDate, "d 'de' MMMM", { locale: es })
    .replace(/de ([a-z])/, (_, letter) => `de ${letter.toUpperCase()}`);

  const avgLevel = players.length 
    ? (players.reduce((sum, p) => sum + p.nivel, 0) / players.length).toFixed(1) 
    : '—';
  const slots = [0, 1, 2, 3];

  return (
    <div>
      <h2 className="text-sm font-semibold">Tu Próxima Reserva</h2>

      <div className="relative bg-gray-50 rounded-lg p-4 h-36 w-[75%] border border-gray-200">
        {/* Pill estado */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              players.length < 4 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {players.length < 4 ? 'Abierta' : 'Completa'}
          </span>
        </div>

        {/* Círculos de jugadores */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {slots.map(i => {
            const p = players[i];
            return p ? (
              <img
                key={i}
                src={p.avatar_url || ''}
                alt={p.nombre}
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
              >
                <span className="text-gray-400 text-xs">+</span>
              </div>
            );
          })}
        </div>

        {/* Fecha centrada */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-4 py-2 mt-2 bg-green-100 text-green-800 text-base font-medium rounded-md">
            {displayDate}
          </span>
        </div>

        {/* Footer: hora y nivel */}
        <div className="absolute bottom-4 left-4 text-gray-600 font-medium">
          {start_time.slice(0, 5)} a {formatDisplayEndTime(end_time)}
        </div>
        <div className="absolute bottom-4 right-4 text-gray-600 font-medium">
          Nivel: {avgLevel}
        </div>
      </div>
    </div>
  );
}
