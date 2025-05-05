import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateForDB } from '@/utils/dateUtils';

interface MonthlyReservations {
  [key: string]: number;
}

interface ChartData {
  name: string;
  reservas: number;
}

const isValidDateFormat = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    console.error(`Formato de fecha inválido: ${dateString}. Debe ser AAAA-MM-DD`);
    return false;
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  return month <= 12 && day <= 31;
};

const ReservationsCount = () => {
  const [monthlyReservations, setMonthlyReservations] = useState<MonthlyReservations>({});
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const getLastMonths = () => {
    const months = [];
    for (let i = 8; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      // Formatear la fecha como AAAA-MM-DD
      months.push(format(date, 'MMMM', { locale: es }));
    }
    return months;
  };

  useEffect(() => {
    const fetchReservationCount = async () => {
      try {
        if (!session?.user?.id) return;

        // Obtener la fecha actual en formato AAAA-MM-DD
        const today = formatDateForDB(new Date());

        // 1. Obtener las reservas creadas por el usuario
        const { data: ownedReservations, error: ownedError } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (ownedError) {
          console.error('Error al obtener reservas creadas:', ownedError);
          return;
        }

        // 2. Obtener las reservas donde el usuario es un jugador
        const { data: joinedReservationsIds, error: joinedError } = await supabase
          .from('reservation_players')
          .select('reservation_id')
          .eq('user_id', session.user.id);

        if (joinedError) {
          console.error('Error al obtener IDs de reservas como jugador:', joinedError);
          return;
        }

        // 3. Obtener los detalles de las reservas donde el usuario es jugador
        const joinedIds: number[] = joinedReservationsIds?.map((r: { reservation_id: number }) => r.reservation_id) || [];
        const { data: joinedReservations, error: joinedDetailsError } = await supabase
          .from('reservations')
          .select('*')
          .in('id', joinedIds)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (joinedDetailsError) {
          console.error('Error al obtener detalles de reservas como jugador:', joinedDetailsError);
          return;
        }

        // 4. Combinar todas las reservas y eliminar duplicados
        const allReservations = Array.from(
          new Map(
            [...(ownedReservations || []), ...(joinedReservations || [])]
              .map(item => [item.id, item])
          ).values()
        );

        // 5. Organizar reservas por mes
        const reservationsByMonth = allReservations.reduce((acc: MonthlyReservations, reservation) => {
          // Asumimos que la fecha viene en formato AAAA-MM-DD
          const [year, month, day] = reservation.date.split('-').map(Number);
          
          // Creamos la fecha con el formato correcto
          const date = new Date(year, month - 1, day);
          const monthKey = format(date, 'MMMM', { locale: es });
          
          console.log('Procesando reserva:', {
            fechaOriginal: reservation.date,
            formatoEsperado: 'AAAA-MM-DD',
            año: year,
            mes: month,
            día: day,
            fechaProcesada: date.toISOString(),
            mesResultante: monthKey
          });
          
          acc[monthKey] = (acc[monthKey] || 0) + 1;
          return acc;
        }, {});

        console.log('Reservas por mes:', reservationsByMonth);
        setMonthlyReservations(reservationsByMonth);

      } catch (error) {
        console.error('Error general:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationCount();
  }, [session]);

  const formatDataForChart = (reservations: MonthlyReservations): ChartData[] => {
    const months = getLastMonths();
    return months.map(month => ({
      name: month,
      reservas: reservations[month] || 0
    }));
  };

  if (loading) return <div>Cargando...</div>;

  const chartData = formatDataForChart(monthlyReservations);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Pistas Reservadas</h2>
      <div className="h-56 w-[100vw] -ml-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.substring(0, 3)}
            />
            <YAxis 
              allowDecimals={false}
              tickFormatter={(value) => Math.floor(value).toString()}
            />
            <Tooltip 
              formatter={(value: number) => [Math.floor(value), 'Reservas']}
            />
            <Line
              type="monotone"
              dataKey="reservas"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="-mt-1 mx-2 pt-2 border-t">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total:</span>
          <span className="font-bold text-blue-600">
            {Object.values(monthlyReservations).reduce((a, b) => a + b, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReservationsCount;