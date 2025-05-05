"use client"
import { useState } from 'react';
import { addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
    selectedDate: Date | null;
    onChange: (date: Date | null) => void;
    minDate: Date;
    maxDate: Date;
}

export default function DatePicker({ selectedDate, onChange, minDate, maxDate }: DatePickerProps) {
    return (
        <div className="bg-white border rounded-lg p-4">
            <DayPicker
                mode="single"
                required={true}
                selected={selectedDate || undefined}
                onSelect={onChange}
                locale={es}
                fromDate={minDate}
                toDate={maxDate}
                disabled={[
                    { before: minDate },
                    { after: maxDate }
                ]}
                modifiers={{
                    today: new Date()
                }}
                modifiersStyles={{
                    today: {
                        fontWeight: 'bold',
                        color: '#0000FF'
                    }
                }}
            />
        </div>
    );
}

export function App() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    return (
        <DatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            maxDate={addDays(new Date(), 15)} // Cambiamos de 30 a 15 días
        />
    );
}