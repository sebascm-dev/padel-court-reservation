import { addDays } from 'date-fns';

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

export function getLocalISOString(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

export function isValidDateFormat(dateString: string): boolean {
    // Verifica si la fecha está en formato AAAA-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
}

export function formatDateToSpanish(date: string): string {
    if (!isValidDateFormat(date)) {
        console.error('Formato de fecha inválido:', date);
        return 'Fecha inválida';
    }

    const [year, month, day] = date.split('-');
    const formattedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    
    // Verificamos que la fecha sea válida
    if (isNaN(formattedDate.getTime())) {
        console.error('Fecha inválida:', date);
        return 'Fecha inválida';
    }
    
    const weekDay = formattedDate.toLocaleString('es-ES', { weekday: 'long' });
    const capitalizedWeekDay = weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
    const dayNumber = parseInt(day);
    const monthName = formattedDate.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    return `${capitalizedWeekDay}, ${dayNumber} de ${capitalizedMonth}`;
}

// Eliminamos nuestra implementación de addDays ya que usaremos la de date-fns
export { addDays };

export function formatDateForDB(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseDateFromDB(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}