import React from 'react';
import { Activity, Eye, Plus, Edit, Trash2, ClipboardList } from 'lucide-react';
import { ActionButtonSmall } from './SharedComponents';
import { Patient, SubsequentConsult } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ConsultListProps {
    patient: Patient;
    consults: SubsequentConsult[];
    navigate: (path: string, options?: any) => void;
    onDelete: (id: string) => void;
    onCreate?: () => void;
    onViewOrders?: (item: any) => void;
}

export const ConsultList: React.FC<ConsultListProps> = ({ patient, consults, navigate, onDelete, onCreate, onViewOrders }) => {
    const { role } = useAuth();
    const isAssistant = role === 'assistant';

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                            <Activity className="text-emerald-600" size={18} />
                        </div>
                        Consultas Subsecuentes
                    </h3>

                </div>
                {isAssistant ? (
                    <button
                        onClick={() => navigate(`/app/consult/${patient.id}`)}
                        className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-lg shadow-emerald-200/50"
                    >
                        <Plus size={14} /> Crear Consulta
                    </button>
                ) : (
                    <button
                        onClick={() => navigate(`/app/consult/${patient.id}`)}
                        className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-100"
                    >
                        <Plus size={14} /> Nueva
                    </button>
                )}
            </div>

            {consults.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {consults.map(c => (
                        <div key={c.id} className={`group p-4 rounded-xl border shadow-sm hover:shadow-md transition-all flex justify-between items-center relative overflow-hidden ${c.status === 'draft' ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
                            }`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${c.status === 'draft' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />

                            <div className="flex items-start gap-4 pl-2">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                        {c.date} <span className="text-gray-400 font-normal">| {c.time}</span>
                                        {c.status === 'draft' && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200">
                                                Pendiente
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 font-medium">
                                        {c.otherMotive || Object.keys(c.motives || {}).filter(k => c.motives[k]).join(', ') || 'Sin motivo especificado'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                                {/* Doctor Action: Complete Pending Consult */}
                                {c.status === 'draft' && (
                                    <>
                                        <button
                                            onClick={() => navigate(`/app/consult/${patient.id}`, { state: { consult: c } })}
                                            className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-1 mr-2"
                                            title="Completar Consulta"
                                        >
                                            <Plus size={14} />
                                            <span className="text-xs font-bold pr-1">Completar</span>
                                        </button>
                                        <ActionButtonSmall
                                            icon={<Trash2 size={16} />}
                                            onClick={() => onDelete(c.id)}
                                            color="red"
                                        />
                                    </>
                                )}

                                {/* Normal Actions (View/Edit/Delete) - Only for Completed Consults */}
                                {c.status !== 'draft' && (
                                    <>
                                        <ActionButtonSmall
                                            icon={<Eye size={16} />}
                                            onClick={() => navigate(`/app/consult-view/${patient.id}/${c.id}`)}
                                            color="blue"
                                        />
                                        {Array.isArray(c.medicalOrders) && c.medicalOrders.length > 0 && (
                                            <ActionButtonSmall
                                                icon={<ClipboardList size={16} />}
                                                onClick={() => onViewOrders?.(c)}
                                                color="emerald"
                                            />
                                        )}
                                        <ActionButtonSmall
                                            icon={<Edit size={16} />}
                                            onClick={() => navigate(`/app/consult/${patient.id}`, { state: { consult: c } })}
                                            color="amber"
                                        />
                                        <ActionButtonSmall
                                            icon={<Trash2 size={16} />}
                                            onClick={() => onDelete(c.id)}
                                            color="red"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-xs">No hay consultas registradas</p>
                </div>
            )}
        </div>
    );
};
