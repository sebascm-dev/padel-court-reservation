"use client"
import { useState, useRef, useEffect } from 'react';
import { todasLasLocalidades } from '@/data/localidades';

interface LocalidadAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export default function LocalidadAutocomplete({ 
    value, 
    onChange, 
    disabled = false,
    className = "" 
}: LocalidadAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredLocalidades, setFilteredLocalidades] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (inputValue: string) => {
        onChange(inputValue);
        const filtered = todasLasLocalidades.filter(localidad =>
            localidad.toLowerCase().includes(inputValue.toLowerCase())
        );
        setFilteredLocalidades(filtered);
        setIsOpen(true);
    };

    const handleSelectLocalidad = (localidad: string) => {
        onChange(localidad);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <input
                type="text"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => handleInputChange(value)}
                placeholder="Tu localidad"
                className={`w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
                disabled={disabled}
            />
            {isOpen && filteredLocalidades.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg">
                    {filteredLocalidades.map((localidad) => (
                        <li
                            key={localidad}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelectLocalidad(localidad)}
                        >
                            {localidad}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}