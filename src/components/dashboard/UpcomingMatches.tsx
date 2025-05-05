"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { formatDateToSpanish, formatDateForDB } from '@/utils/dateUtils';
import Link from 'next/link';
import UserAvatar from '@/components/common/UserAvatar';
import { addDays } from 'date-fns';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Spinner2 from '@/components/ui/Spinner2';

interface Player {
    user_id: string;
    usuario?: {
        nombre: string;
        apellidos: string;
        avatar_url?: string;
        nivel: number;
    };
}

// Actualizar la interfaz Match para incluir el creador
interface Match {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    players: Player[];
    usuarios: {
        id: string;
        nombre: string;
        apellidos: string;
        avatar_url?: string;
        nivel?: number;
    };
}

// Modificar la función calculateAverageLevel
const calculateAverageLevel = (match: Match) => {
    const players = match.players || [];

    // Si no hay jugadores, devolver guión
    if (players.length === 0) return '—';

    const totalLevel = players.reduce((sum, player) => {
        return sum + (player.usuario?.nivel || 0);
    }, 0);

    // Usar el mismo formato que NextReservation
    return (totalLevel / players.length).toFixed(1);
};

export default function UpcomingMatches() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningMatch, setJoiningMatch] = useState<string | null>(null);
    const { session } = useAuth();

    const fetchUpcomingMatches = async () => {
        try {
            const now = new Date();
            const today = formatDateForDB(now);
            const tomorrow = formatDateForDB(addDays(now, 1));
            const currentTime = now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

            // Obtener partidos de hoy y mañana
            const { data: matchesData, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    usuarios (
                        id,
                        nombre,
                        apellidos,
                        avatar_url,
                        nivel
                    )
                `)
                .eq('is_private', false)
                .gte('date', today)
                .lte('date', tomorrow)
                .order('date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;

            if (matchesData) {
                // Filtrar partidos que no han terminado y no están completos
                const availableMatches = await Promise.all(
                    matchesData
                        .filter(match => {
                            if (match.date > today) return true;
                            return match.date === today && match.end_time > currentTime;
                        })
                        .map(async (match) => {
                            // Obtener jugadores de cada partido
                            const { data: players } = await supabase
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
                                .eq('reservation_id', match.id);

                            return {
                                ...match,
                                players: players || []
                            };
                        })
                );

                // Filtrar solo partidos no completos y tomar los 5 primeros
                setMatches(availableMatches
                    .filter(match => match.players.length < 4)
                    .slice(0, 5)
                );
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinMatch = async (matchId: string) => {
        try {
            if (!session?.user.id) return;

            const toastLoading = toast.loading('Uniéndote al partido...');

            // Verificar si ya estamos en el partido
            const { data: existingPlayer } = await supabase
                .from('reservation_players')
                .select('*')
                .eq('reservation_id', matchId)
                .eq('user_id', session.user.id)
                .single();

            if (existingPlayer) {
                toast.dismiss(toastLoading);
                toast.error('Ya estás inscrito en este partido');
                return;
            }

            // Unirse al partido
            const { error } = await supabase
                .from('reservation_players')
                .insert({
                    reservation_id: matchId,
                    user_id: session.user.id
                });

            if (error) throw error;

            // Lanzar confeti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#4CAF50', '#2196F3', '#FFC107', '#E91E63']
            });

            toast.dismiss(toastLoading);
            toast.success('¡Te has unido al partido!');

            // Recargar la página después de un breve delay para que se vea el confeti
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Error al unirse al partido:', error);
            toast.error('Error al unirse al partido');
        } finally {
            setJoiningMatch(null);
        }
    };

    const filteredPlayers = (match: Match) => {
        // Filtrar jugadores excluyendo al creador
        return match.players.filter(player => player.user_id !== match.usuarios.id);
    };

    useEffect(() => {
        fetchUpcomingMatches();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <Spinner2 className="w-8 h-8" />
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div>
                <h2 className="text-lg font-semibold mb-2">Partidos Disponibles</h2>
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-2">
                        <div className="text-gray-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 mx-auto"
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
                    </div>
                    <h3 className="text-lg text-gray-600">
                        No hay partidos disponibles
                    </h3>
                    <p className="text-gray-400 text-sm">
                        ¡Crea un partido nuevo y encuentra compañeros para jugar!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Partidos Disponibles</h2>
                <Link
                    href="/available-matches"
                    className="text-sm text-blue-500 hover:text-blue-600"
                >
                    Ver todos
                </Link>
            </div>

            <div className="space-y-4">
                {matches.map((match) => (
                    <div
                        key={match.id}
                        onClick={() => {
                            // Verificar si el usuario ya está en el partido
                            const isUserInMatch = match.players.some(
                                player => player.user_id === session?.user.id
                            );
                            const isCreator = match.usuarios.id === session?.user.id;

                            if (!isUserInMatch && !isCreator && match.players.length < 4) {
                                if (confirm('¿Quieres unirte a este partido?')) {
                                    handleJoinMatch(match.id);
                                }
                            }
                        }}
                        className={`flex justify-between items-center p-3 border border-gray-500/30 rounded-lg overflow-hidden bg-white shadow-md
                                  ${match.players.length < 4 &&
                                !match.players.some(p => p.user_id === session?.user.id) &&
                                match.usuarios.id !== session?.user.id
                                ? 'cursor-pointer hover:bg-gray-50 transition-colors'
                                : 'cursor-default'}`}
                    >
                        <div>
                            <div className="text-gray-900 font-medium mb-1">
                                {formatDateToSpanish(match.date, match.start_time, match.end_time)}
                            </div>
                            <div className="text-sm text-gray-500">
                                Nivel: {calculateAverageLevel(match)} · {match.start_time.slice(0, 5)}
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div className="relative mr-16">
                                <UserAvatar
                                    nombre={match.usuarios?.nombre || ''}
                                    apellidos={match.usuarios?.apellidos || ''}
                                    avatarUrl={match.usuarios?.avatar_url}
                                    className="w-14 h-14 border-2 border-blue-100 shadow-sm rounded-full"
                                />

                                <div className="absolute -top-1 -right-18 flex -space-x-1">
                                    {Array.from({ length: 3 }).map((_, i) => {
                                        const players = filteredPlayers(match);
                                        const player = players[i];
                                        return (
                                            <button
                                                key={`slot-${i}`}
                                                onClick={() => {
                                                    if (!player && confirm('¿Quieres unirte a este partido?')) {
                                                        handleJoinMatch(match.id);
                                                    }
                                                }}
                                                className={`w-8 h-8 rounded-full border-2 border-white 
                                                          flex items-center justify-center transition-colors overflow-hidden
                                                          ${player ?
                                                        'border-green-200' :
                                                        'bg-gray-100 hover:bg-blue-50 hover:border-blue-200'}`}
                                                title={player ? player.usuario?.nombre : "Unirte al partido"}
                                                disabled={!!player}
                                            >
                                                {player ? (
                                                    <UserAvatar
                                                        nombre={player.usuario?.nombre || ''}
                                                        apellidos={player.usuario?.apellidos || ''}
                                                        avatarUrl={player.usuario?.avatar_url}
                                                        className="w-full h-full object-cover text-xs"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 hover:text-blue-500">+</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}