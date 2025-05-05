"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import DatePicker from '@/components/reservation/DatePicker';
import TimeSlotPicker from '@/components/reservation/TimeSlotPicker';
import { addMinutes, addDays, getLocalISOString } from '@/utils/dateUtils';

export default function ReservationPage() {
    const router = useRouter();
    const { session } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime || !session) return;

        setLoading(true);
        const startTime = selectedTime;
        const endTime = addMinutes(selectedTime, 89);

        try {
            // Formatear la fecha correctamente en AAAA-MM-DD
            const year = selectedDate.getFullYear();
            const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
            const day = selectedDate.getDate().toString().padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // Crear la reserva con el formato correcto
            const { data: reservation, error: reservationError } = await supabase
                .from('reservations')
                .insert({
                    user_id: session.user.id,
                    date: formattedDate,
                    start_time: startTime,
                    end_time: endTime,
                    is_private: isPrivate
                })
                .select()
                .single();

            if (reservationError) {
                // Verificar si es el error de solapamiento
                if (reservationError.code === '23P01') {
                    toast.error('Esta pista ya ha sido reservada para ese horario');
                    return;
                }
                throw reservationError;
            }

            // 2. Si no es privada, añadir al creador como jugador automáticamente
            if (!isPrivate && reservation) {
                const { error: playerError } = await supabase
                    .from('reservation_players')
                    .insert({
                        reservation_id: reservation.id,
                        user_id: session.user.id,
                        created_at: new Date().toISOString()
                    });

                if (playerError) throw playerError;
            }

            toast.success('Reserva realizada con éxito');
            router.push('/my-reservations');
        } catch (error: any) {
            console.error('Error:', error.message);
            toast.error('Error al realizar la reserva');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Reservar Pista</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selecciona un día
                    </label>
                    <DatePicker
                        selectedDate={selectedDate}
                        onChange={setSelectedDate}
                        minDate={new Date()}
                        maxDate={addDays(new Date(), 30)}
                    />
                </div>

                {selectedDate && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selecciona una hora
                        </label>
                        <TimeSlotPicker
                            selectedTime={selectedTime}
                            onChange={setSelectedTime}
                            date={selectedDate}
                        />
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isPrivate"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="h-4 w-4 text-blue-700/85 focus:ring-blue-600/60 border-gray-300 rounded"
                    />
                    <label htmlFor="isPrivate" className="text-sm text-gray-700">
                        Reserva privada (ya tengo 4 jugadores)
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={!selectedDate || !selectedTime || loading}
                    className="w-full bg-blue-700/85 text-white py-2 px-4 mb-16 rounded-lg hover:bg-blue-700/30 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Reservando...' : 'Confirmar Reserva'}
                </button>
            </form>
        </div>
    );
}