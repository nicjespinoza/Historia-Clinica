import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

// Registrar locale español
registerLocale('es', es);

interface DatePickerProps {
    label: string;
    value: Date | null;
    onChange: (date: Date | null) => void;
    error?: string;
    required?: boolean;
    className?: string;
    placeholder?: string;
    maxDate?: Date;
    minDate?: Date;
    showYearDropdown?: boolean;
    showMonthDropdown?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    error,
    required,
    className = '',
    placeholder = 'Seleccione fecha',
    maxDate,
    minDate,
    showYearDropdown = true,
    showMonthDropdown = true
}) => {
    const id = React.useId();
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm font-semibold text-[#0a3d7c] mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`relative flex items-center border-2 ${error ? 'border-red-400' : 'border-gray-300'} rounded-xl bg-white hover:border-[#0a3d7c] focus-within:border-[#0a3d7c] transition-colors`}>
                <div className="pl-3 text-[#0a3d7c]">
                    <Calendar size={20} />
                </div>
                <ReactDatePicker
                    id={id}
                    selected={value}
                    onChange={onChange}
                    className="w-full p-2.5 outline-none bg-transparent text-gray-800 placeholder-gray-400"
                    dateFormat="dd/MM/yyyy"
                    locale="es"
                    placeholderText={placeholder}
                    maxDate={maxDate}
                    minDate={minDate}
                    showYearDropdown={showYearDropdown}
                    showMonthDropdown={showMonthDropdown}
                    dropdownMode="select"
                    showPopperArrow={false}
                    customInput={
                        <input className="w-full outline-none bg-transparent cursor-pointer" />
                    }
                    renderCustomHeader={({
                        date,
                        changeYear,
                        changeMonth,
                        decreaseMonth,
                        increaseMonth,
                        prevMonthButtonDisabled,
                        nextMonthButtonDisabled,
                    }) => (
                        <div className="flex items-center justify-between px-2 py-2 bg-[#083C79] text-white rounded-t-lg">
                            <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" className="p-1 hover:bg-white/10 rounded-full">
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex gap-2">
                                <select
                                    value={date.getFullYear()}
                                    onChange={({ target: { value } }) => changeYear(Number(value))}
                                    className="bg-white/10 text-white rounded px-2 py-1 text-sm font-bold border-none outline-none cursor-pointer hover:bg-white/20"
                                >
                                    {Array.from({ length: 100 }).map((_, i) => (
                                        <option key={i} value={new Date().getFullYear() - i} className="text-gray-900">
                                            {new Date().getFullYear() - i}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={date.getMonth()}
                                    onChange={({ target: { value } }) => changeMonth(Number(value))}
                                    className="bg-white/10 text-white rounded px-2 py-1 text-sm font-bold border-none outline-none cursor-pointer hover:bg-white/20 capitalize"
                                >
                                    {[
                                        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                                    ].map((option, index) => (
                                        <option key={option} value={index} className="text-gray-900">
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button" className="p-1 hover:bg-white/10 rounded-full">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            <style>{`
                .react-datepicker {
                    font-family: inherit;
                    border: none;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                .react-datepicker__header {
                    background-color: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    padding-top: 0;
                }
                .react-datepicker__triangle {
                    display: none;
                }
                .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
                    background-color: #083C79 !important;
                    color: white !important;
                    border-radius: 0.5rem;
                }
                .react-datepicker__day:hover {
                    background-color: #f3f4f6;
                    border-radius: 0.5rem;
                }
                .react-datepicker__day-name {
                    color: #6b7280;
                    font-weight: 600;
                    margin: 0.4rem;
                }
                .react-datepicker__day {
                    margin: 0.4rem;
                }
            `}</style>
        </div>
    );
};
