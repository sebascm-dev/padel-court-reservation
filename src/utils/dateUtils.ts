import { addDays as dateFnsAddDays } from 'date-fns';

export const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    // Restamos 1 minuto para evitar solapamiento
    date.setHours(hours, mins + minutes - 1);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const formatDisplayEndTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 2); // Añadimos 2 minutos para visualización
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// Other utility functions

export function addMinutesToDate(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function getLocalISOString(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

export function formatDateToSpanish(date: string, startTime: string, endTime: string): string {
    const [year, day, month] = date.split('-');
    const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    
    const dayNumber = parseInt(day);
    const monthName = formattedDate.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    return `${dayNumber} de ${capitalizedMonth}`;
}