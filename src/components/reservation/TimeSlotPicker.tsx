"use client"

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import Spinner2 from '@/components/ui/Spinner2';

interface TimeSlot {
    time: string;
    isReserved: boolean;
    userId: string | null;
    isMyReservation: boolean;
}

interface TimeSlotPickerProps {
    selectedTime: string | null;
    onChange: (time: string | null) => void;
    date: Date;
}

export default function TimeSlotPicker({ selectedTime, onChange, date }: TimeSlotPickerProps) {
    const { session } = useAuth();
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);

    const isDateTooFarAhead = (selectedDate: Date): boolean => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 15);
        return selectedDate > maxDate;
    };

    const generateTimeSlots = () => {
        const slots: string[] = [];
        let hour = 9;
        let minutes = 30;

        while (hour < 22) {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
            slots.push(`${formattedHour}:${formattedMinutes}`);

            minutes += 90;
            while (minutes >= 60) {
                minutes -= 60;
                hour += 1;
            }
        }

        return slots;
    };

    const fetchReservedSlots = useCallback(async () => {
        setLoading(true);
        try {
            const isTimeSlotPassed = (time: string): boolean => {
                const now = new Date();
                const selectedDate = new Date(date);
                const [hours, minutes] = time.split(':').map(Number);

                const slotDateTime = new Date(selectedDate);
                slotDateTime.setHours(hours, minutes);

                return now > slotDateTime;
            };

            if (isDateTooFarAhead(date)) {
                setAvailableSlots([]);
                return;
            }

            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            console.log('Fecha formateada para Supabase:', dateString);

            const { data: reservations, error } = await supabase
                .from('reservations')
                .select(`
                    id,
                    date,
                    start_time,
                    end_time,
                    user_id,
                    is_private
                `)
                .eq('date', dateString);

            if (error) throw error;

            console.log('Fecha seleccionada:', dateString);
            console.log('Reservas encontradas:', reservations);
            console.log('Usuario actual:', session?.user.id);

            const allSlots = generateTimeSlots();

            const reservedTimesMap = new Map();

            reservations?.forEach(reservation => {
                const timeKey = reservation.start_time.slice(0, 5);
                const isCurrentUser = reservation.user_id === session?.user.id;

                console.log('Procesando reserva:', {
                    time: timeKey,
                    userId: reservation.user_id,
                    currentUser: session?.user.id,
                    isCurrentUser
                });

                reservedTimesMap.set(timeKey, {
                    isReserved: true,
                    userId: reservation.user_id,
                    isMyReservation: isCurrentUser
                });
            });

            const currentSlots = allSlots.filter(time => !isTimeSlotPassed(time));

            const availableTimes = currentSlots.map(time => {
                const slotInfo = reservedTimesMap.get(time) || {
                    isReserved: false,
                    userId: null,
                    isMyReservation: false
                };

                console.log('Slot final:', {
                    time,
                    ...slotInfo
                });

                return {
                    time,
                    ...slotInfo
                };
            });

            setAvailableSlots(availableTimes);
        } catch (error) {
            console.error('Error al obtener horarios reservados:', error);
        } finally {
            setLoading(false);
        }
    }, [date, session]);

    useEffect(() => {
        fetchReservedSlots();
    }, [fetchReservedSlots]);

    if (isDateTooFarAhead(date)) {
        return (
            <div className="text-center text-red-500">
                No se pueden hacer reservas con más de 15 días de antelación.
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-4">
                <Spinner2 className="w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-2">
            {availableSlots.map(({ time, isReserved, userId }) => {
                console.log('Slot:', {
                    time,
                    isReserved,
                    userId,
                    currentUser: session?.user.id,
                    isMyReservation: isReserved && userId === session?.user.id
                });

                const isMyReservation = isReserved && userId === session?.user.id;

                let buttonStyle = '';
                if (selectedTime === time) {
                    buttonStyle = 'bg-blue-600/85 text-white border-2 border-blue-700/85';
                } else if (isReserved) {
                    if (isMyReservation) {
                        buttonStyle = 'bg-green-100 text-green-800 border-2 border-green-500';
                    } else {
                        buttonStyle = 'bg-red-100 text-red-800 border-2 border-red-500';
                    }
                } else {
                    buttonStyle = 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-gray-300';
                }

                return (
                    <button
                        key={time}
                        type="button"
                        onClick={() => !isReserved && onChange(time)}
                        disabled={isReserved}
                        className={`p-3 relative rounded-lg text-center transition-colors flex justify-center items-center ${buttonStyle}`}
                    >
                        <span className="font-medium">{time}</span>
                        {isReserved && (
                            <span className={`absolute right-3 text-sm px-2 py-0.5 rounded
                                ${isMyReservation 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-red-200 text-red-800'}`}
                            >
                                {isMyReservation ? 'Tu Reserva' : 'Reservado'}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}