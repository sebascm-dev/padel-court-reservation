"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TimeSlotPickerProps {
    selectedTime: string | null;
    onChange: (time: string | null) => void;
    date: Date;
}

export default function TimeSlotPicker({ selectedTime, onChange, date }: TimeSlotPickerProps) {
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
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
            // Verificar si la fecha está más allá de 15 días
            if (isDateTooFarAhead(date)) {
                setAvailableSlots([]);
                return;
            }

            const dateString = date.toISOString().split('T')[0];
            
            // Obtener las reservas para el día seleccionado
            const { data: reservations, error } = await supabase
                .from('reservations')
                .select('start_time')
                .eq('date', dateString);

            if (error) throw error;

            // Obtener todos los horarios posibles
            const allSlots = generateTimeSlots();
            
            // Filtrar los horarios que ya están reservados
            const reservedTimes = reservations?.map(r => r.start_time.slice(0, 5)) || [];
            const availableTimes = allSlots.filter(time => !reservedTimes.includes(time));

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
            {availableSlots.map((time) => {
                const isPassed = isTimeSlotPassed(time);
                
                return (
                    <button
                        key={time}
                        type="button"
                        onClick={() => onChange(time)}
                        disabled={isPassed}
                        className={`p-2 rounded-lg text-center transition-colors
                            ${selectedTime === time 
                                ? 'bg-blue-600 text-white' 
                                : isPassed
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    >
                        {time}
                        {isPassed && (
                            <span className="ml-2 text-sm text-gray-500">
                                (Hora pasada)
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}