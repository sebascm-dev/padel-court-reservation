"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

interface TimeSlotPickerProps {
    selectedTime: string | null;
    onChange: (time: string | null) => void;
    date: Date;
}

export default function TimeSlotPicker({ selectedTime, onChange, date }: TimeSlotPickerProps) {
    const { session } = useAuth();
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Función para verificar si un horario ya ha pasado
    const isTimeSlotPassed = (time: string): boolean => {
        const now = new Date();
        const selectedDate = new Date(date);
        const [hours, minutes] = time.split(':').map(Number);
        
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hours, minutes);

        return now > slotDateTime;
    };

    const isDateTooFarAhead = (selectedDate: Date): boolean => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 15);
        return selectedDate > maxDate;
    };

    // Genera todos los horarios posibles de 9:30 a 21:30 cada 90 minutos
    const generateTimeSlots = () => {
        const slots: string[] = [];
        let hour = 9; // Empezamos a las 9:30
        let minutes = 30;

        while (hour < 22) { // Hasta las 21:30 (último turno posible)
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
            slots.push(`${formattedHour}:${formattedMinutes}`);

            // Añadimos 90 minutos
            minutes += 90;
            while (minutes >= 60) {
                minutes -= 60;
                hour += 1;
            }
        }

        return slots;
    };

    const fetchReservedSlots = async () => {
        setLoading(true);
        try {
            if (isDateTooFarAhead(date)) {
                setAvailableSlots([]);
                return;
            }

            const dateString = date.toLocaleDateString('en-CA');
            
            const { data: reservations, error } = await supabase
                .from('reservations')
                .select('start_time, user_id')
                .eq('date', dateString);

            if (error) throw error;

            const allSlots = generateTimeSlots();
            
            // Crear un mapa de horarios reservados
            const reservedTimesMap = new Map(
                reservations?.map(r => [
                    r.start_time.slice(0, 5),
                    { isReserved: true, userId: r.user_id }
                ]) || []
            );

            // Filtrar las horas pasadas y actualizar los slots disponibles
            const currentSlots = allSlots.filter(time => !isTimeSlotPassed(time));
            
            const availableTimes = currentSlots.map(time => ({
                time,
                ...reservedTimesMap.get(time) || { isReserved: false, userId: null }
            }));

            setAvailableSlots(availableTimes);
        } catch (error) {
            console.error('Error al obtener horarios reservados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservedSlots();
    }, [date]);

    if (isDateTooFarAhead(date)) {
        return (
            <div className="text-center text-red-500">
                No se pueden hacer reservas con más de 15 días de antelación
            </div>
        );
    }

    if (loading) {
        return <div className="text-center text-gray-500">Cargando horarios disponibles...</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-2">
            {availableSlots.map(({ time, isReserved, userId }) => {
                const isMyReservation = isReserved && userId === session?.user.id;
                
                let buttonStyle = '';
                if (selectedTime === time) {
                    buttonStyle = 'bg-blue-500/80 text-white border-2 border-blue-700/30';
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