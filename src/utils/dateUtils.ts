import { addDays as dateFnsAddDays } from 'date-fns';

export const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

export const addDays = (date: Date, days: number): Date => {
    return dateFnsAddDays(date, days);
};

export const formatTimeWithZone = (time: string): string => {
    return `${time}:00+02:00`; // Zona horaria España
};