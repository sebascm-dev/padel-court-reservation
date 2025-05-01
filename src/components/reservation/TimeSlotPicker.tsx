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

    // Horarios disponibles (9:30 a 21:30)
    const timeSlots = Array.from({ length: 25 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minutes = i % 2 === 0 ? '30' : '00';
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    });

    useEffect(() => {
        fetchExistingReservations();
    }, [date]);

    const fetchExistingReservations = async () => {
        setLoading(true);
        try {
            const { data: reservations, error } = await supabase
                .from('reservations')
                .select('start_time, end_time')
                .eq('date', date.toISOString().split('T')[0]);

            if (error) throw error;

            // Filtrar slots disponibles
            const reservedSlots = new Set(
                reservations?.flatMap(r => {
                    const start = r.start_time.slice(0, 5);
                    const end = r.end_time.slice(0, 5);
                    return timeSlots.filter(t => t >= start && t < end);
                }) || []
            );

            setAvailableSlots(timeSlots.filter(t => !reservedSlots.has(t)));
        } catch (error) {
            console.error('Error fetching reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-4 gap-2">
            {loading ? (
                <div className="col-span-4 text-center">Cargando horarios...</div>
            ) : (
                availableSlots.map((time) => (
                    <button
                        key={time}
                        type="button"
                        onClick={() => onChange(time)}
                        className={`p-2 rounded-lg border ${
                            selectedTime === time
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white hover:bg-gray-50 border-gray-300'
                        }`}
                    >
                        {time}
                    </button>
                ))
            )}
        </div>
    );
}