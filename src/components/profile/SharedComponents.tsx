import React from 'react';

export const ActionButton = ({ icon, label, onClick, color = 'blue', active = false }: any) => {
    const colors: any = {
        blue: 'hover:bg-blue-50 text-blue-700',
        indigo: 'hover:bg-indigo-50 text-indigo-700',
        amber: 'hover:bg-amber-50 text-amber-700',
        teal: 'hover:bg-teal-50 text-teal-700',
        red: 'hover:bg-red-50 text-red-700',
        gray: 'hover:bg-gray-100 text-gray-700'
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium text-xs md:text-sm ${active ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-500'} ${colors[color]}`}
        >
            <div className={`p-1.5 rounded-lg ${active ? 'bg-white shadow-sm' : 'bg-transparent'}`}>{icon}</div>
            <span className="hidden md:inline">{label}</span>
        </button>
    );
};

export const ActionButtonSmall = ({ icon, onClick, color }: any) => {
    const colors: any = {
        blue: 'hover:bg-blue-50 text-blue-600',
        amber: 'hover:bg-amber-50 text-amber-600',
        red: 'hover:bg-red-50 text-red-600',
        emerald: 'hover:bg-emerald-50 text-emerald-600',
    };
    return (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`p-1.5 rounded-lg transition-colors ${colors[color]}`}>
            {icon}
        </button>
    )
}

export const InfoItem = ({ icon, label, value }: any) => (
    <div className="flex items-start gap-3">
        <div className="mt-0.5 text-gray-400">{icon}</div>
        <div>
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    </div>
);
