"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';

export default function MyReservationsPage() {
  const { session } = useAuth();
  const [reservations, setReservations] = useState<{ id: number; date: string; start_time: string; end_time: string; is_private: boolean; }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchReservations();
    }
  }, [session]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mis Reservas</h1>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation: any) => (
            <div
              key={reservation.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <p>Fecha: {new Date(reservation.date).toLocaleDateString()}</p>
              <p>Hora: {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</p>
              <p>Tipo: {reservation.is_private ? 'Privada' : 'Abierta'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}