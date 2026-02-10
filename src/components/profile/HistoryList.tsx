import React from 'react';
import { FileText, Eye, Plus, Edit, Trash2, ClipboardList } from 'lucide-react';
import { ActionButtonSmall } from './SharedComponents';
import { InitialHistory, Patient } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface HistoryListProps {
    patient: Patient;
    histories: InitialHistory[];
    navigate: (path: string, options?: any) => void;
    onDelete: (id: string) => void;
    onViewOrders?: (item: any) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ patient, histories, navigate, onDelete, onViewOrders }) => {
    const { role } = useAuth();
    const isAssistant = role === 'assistant';

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-lg">
                            <FileText className="text-blue-600" size={18} />
                        </div>
                        Historias Clínicas
                    </h3>
                    {/* Link to Migrated History (Restored Legacy Behavior) */}
                    {(patient.isMigrated || patient.legacyIdSistema) && (
                        <button
                            onClick={() => navigate(`/app/historiaclinica2025/${patient.id}`)}
                            className="flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors"
                        >
                            <Eye size={14} /> Historia 2025
                        </button>
                    )}
                </div>
                <button
                    onClick={() => navigate(`/app/history/${patient.id}`, { state: { forceNew: true } })}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 border border-blue-100"
                >
                    <Plus size={14} /> Nueva
                </button>
            </div>

            {histories.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {histories.map(h => (
                        <div key={h.id} className="group bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />

                            <div className="flex items-start gap-4 pl-2">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{h.date} <span className="text-gray-400 font-normal">| {h.time}</span></p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-medium">
                                        {Object.keys(h.motives || {}).filter(k => h.motives[k]).join(', ') || h.otherMotive || 'Consulta General'}
                                    </p>
                                    {h.isValidated === false && (
                                        <span className="inline-block mt-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wide border border-yellow-200">
                                            Borrador
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {h.isValidated === false ? (
                                    <ActionButtonSmall
                                        icon={<Edit size={16} />}
                                        onClick={() => navigate(`/app/history/${patient.id}`, { state: { history: h } })}
                                        color="amber"
                                    />
                                ) : (
                                    <>
                                        <ActionButtonSmall
                                            icon={<Eye size={16} />}
                                            onClick={() => navigate(`/app/history-view/${patient.id}/${h.id}`)}
                                            color="blue"
                                        />
                                        {Array.isArray(h.medicalOrders) && h.medicalOrders.length > 0 && (
                                            <ActionButtonSmall
                                                icon={<ClipboardList size={16} />}
                                                onClick={() => onViewOrders?.(h)}
                                                color="emerald"
                                            />
                                        )}
                                        <ActionButtonSmall
                                            icon={<Edit size={16} />}
                                            onClick={() => navigate(`/app/history/${patient.id}`, { state: { history: h } })}
                                            color="amber"
                                        />
                                    </>
                                )}
                                <ActionButtonSmall
                                    icon={<Trash2 size={16} />}
                                    onClick={() => onDelete(h.id)}
                                    color="red"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 bg-green-50/50 rounded-xl border border-dashed border-green-200">
                    <p className="text-green-600 font-medium text-sm">
                        {isAssistant
                            ? "Paciente en consulta medica, pendiente historia clinica"
                            : "Historia clinica pendiente"}
                    </p>
                </div>
            )}
        </div>
    );
};
