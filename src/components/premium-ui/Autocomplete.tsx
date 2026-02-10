import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface AutocompleteProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export const Autocomplete = ({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    label,
    className = "",
    disabled = false
}: AutocompleteProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Find label for current value
    const selectedOption = options.find(opt => opt.value === value);

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between px-3 py-2.5 
                    bg-white border rounded-xl text-left shadow-sm transition-all duration-200
                    ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'}
                    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
                disabled={disabled}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-3 text-center text-sm text-gray-500">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left
                                        ${value === option.value ? 'bg-[#083c79]/10 text-[#083c79] font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {value === option.value && (
                                        <Check className="w-4 h-4 text-[#083c79]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
