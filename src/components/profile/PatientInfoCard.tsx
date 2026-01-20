import React from 'react';
import { User, Edit, Loader2, ClipboardList, CheckCircle, Bell, Brain, Calendar, ArrowLeft, Eye, Trash2 } from 'lucide-react';
import { InfoItem } from './SharedComponents';
import { Patient } from '../../types';
import { api } from '../../lib/api';

interface PatientInfoCardProps {
    patient: Patient;
    onEdit: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    uploadingImage: boolean;
    navigate: (path: string) => void;
    snapshots: any[];
    onDeleteSnapshot: (id: string) => void;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
    patient,
    onEdit,
    fileInputRef,
    onImageUpload,
    uploadingImage,
    navigate,
    snapshots,
    onDeleteSnapshot
}) => {

    const handleCreateSnapshot = async () => {
        try {
            const newSnap = await api.createSnapshot(patient.id);
            navigate(`/app/crearimagen/${patient.id}/${newSnap.id}`);
        } catch (e) {
            alert('Error al crear imagen');
        }
    };

    return (
        <div className="md:col-span-1 bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] p-6 space-y-4 h-fit border border-gray-100">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Perfil del Paciente</h3>
                <button onClick={onEdit} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                    <Edit size={16} />
                </button>
            </div>

            {/* Profile Image Section */}
            <div className="flex flex-col items-center justify-center mb-6 relative group">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={onImageUpload}
                />
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-gray-100">
                    {uploadingImage ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : (patient as any).profileImage ? (
                        <img
                            src={(patient as any).profileImage}
                            alt="Perfil"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <User size={48} />
                        </div>
                    )}
                    {/* Edit Image Overlay */}
                    {!uploadingImage && (
                        <div
                            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Edit className="text-white" size={24} />
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">Click para cambiar</p>
            </div>

            <div className="space-y-4">
                {/* Migrated Data Display */}
                {(patient.isMigrated || patient.legacyIdSistema) && (
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mb-4">
                        <p className="text-xs font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                            <ClipboardList size={12} /> Datos Migrados
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                            <p className="text-xs text-gray-600"><span className="font-semibold">ID Único:</span> {patient.legacyIdSistema || 'N/A'}</p>
                            <p className="text-xs text-gray-600"><span className="font-semibold">Origen:</span> Migración 2025</p>
                        </div>
                    </div>
                )}

                {patient.registrationSource === 'online' && (
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                        <p className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1">
                            <CheckCircle size={12} /> Registro Online
                        </p>
                    </div>
                )}

                <InfoItem icon={<User size={16} />} label="Profesión" value={patient.profession} />
                <InfoItem icon={<Bell size={16} />} label="Teléfono" value={patient.phone} />
                <InfoItem icon={<Brain size={16} />} label="Email" value={patient.email} />
                <InfoItem icon={<Calendar size={16} />} label="Fecha Nacimiento" value={new Date(patient.birthDate).toLocaleDateString()} />

                <div className="pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Dirección (Migrada/Actual)</p>
                    <p className="text-sm font-medium text-gray-700 leading-tight">{patient.address}</p>
                </div>
            </div>

        </div>
    );
};
