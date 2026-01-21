import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Activity, Stethoscope, Pill, Clipboard, FileText, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { Patient } from '../../types';
import { MOTIVES_LIST } from '../../constants';
import { ObesityHistoryModal } from '../../components/ObesityHistoryModal';

const INPUT_CLASS = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-4 focus:ring-green-100 focus:border-green-500 block transition-all duration-200 outline-none placeholder-gray-400 hover:bg-white";

export const CreateSubsecuenteScreen = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showObesityModal, setShowObesityModal] = useState(false);
    const [showObesityView, setShowObesityView] = useState(false);
    const [obesityData, setObesityData] = useState<any>({});

    // Form state - WITHOUT Historia, Antecedentes sections as requested
    const [formData, setFormData] = useState({
        // Date and Time
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),

        // Motivos
        motivos: [] as string[],
        motivoOtro: '',
        tiempoEvolucion: '',
        historiaEnfermedadActual: '',

        // Vital Signs
        fc: '',
        fr: '',
        temp: '',
        pa: '',
        pam: '',
        sat02: '',
        peso: '',
        talla: '',
        imc: '',

        // Physical Exam - by systems
        piel: 'Normal',
        pielNota: '',
        cabeza: 'Normal',
        cabezaNota: '',
        cuello: 'Normal',
        cuelloNota: '',
        torax: 'Normal',
        toraxNota: '',
        cardiaco: 'Normal',
        cardiacoNota: '',
        pulmonar: 'Normal',
        pulmonarNota: '',
        abdomen: 'Normal',
        abdomenNota: '',
        miembrosSup: 'Normal',
        miembrosSupNota: '',
        miembrosInf: 'Normal',
        miembrosInfNota: '',
        neuro: 'Normal',
        neuroNota: '',
        genitales: 'Normal',
        genitalesNota: '',
        tactoRectal: 'Normal',
        tactoRectalNota: '',

        // Diagnosis and Treatment
        diagnostico: '',
        medicamentos: '',
        alimentos: '',
        examenes: '',
        indicaciones: '',
        comentarios: '',
        proximaCita: '',
        consultationCost: ''
    });

    useEffect(() => {
        const loadPatient = async () => {
            if (patientId) {
                try {
                    const p = await api.getPatient(patientId);
                    setPatient(p);
                } catch (error) {
                    console.error('Error loading patient:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadPatient();
    }, [patientId]);

    // Calculate IMC when weight or height changes
    useEffect(() => {
        const peso = parseFloat(formData.peso);
        const talla = parseFloat(formData.talla) / 100; // cm to m
        if (peso > 0 && talla > 0) {
            const imc = (peso / (talla * talla)).toFixed(2);
            setFormData(prev => ({ ...prev, imc }));
        }
    }, [formData.peso, formData.talla]);

    const getIMCClassification = (imc: number): string => {
        if (imc < 18.5) return 'Bajo peso';
        if (imc < 25) return 'Peso normal';
        if (imc < 30) return 'Sobrepeso';
        if (imc < 35) return 'Obesidad clase I';
        if (imc < 40) return 'Obesidad clase II';
        return 'Obesidad clase III (mórbida)';
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMotiveToggle = (motivo: string) => {
        setFormData(prev => ({
            ...prev,
            motivos: prev.motivos.includes(motivo)
                ? prev.motivos.filter(m => m !== motivo)
                : [...prev.motivos, motivo]
        }));
    };

    const handleSubmit = async () => {
        if (!patientId) return;
        setSaving(true);
        try {
            // Create the consult object
            const consultData = {
                patientId,
                date: formData.date,
                time: formData.time,
                motives: formData.motivos.reduce((acc, m) => ({ ...acc, [m]: true }), {}),
                otherMotive: formData.motivoOtro,
                evolutionTime: formData.tiempoEvolucion,
                physicalExam: {
                    fc: formData.fc,
                    fr: formData.fr,
                    temp: formData.temp,
                    pa: formData.pa,
                    pam: formData.pam,
                    sat02: formData.sat02,
                    weight: formData.peso,
                    height: formData.talla,
                    imc: formData.imc,
                    piel: formData.piel,
                    pielNota: formData.pielNota,
                    cabeza: formData.cabeza,
                    cabezaNota: formData.cabezaNota,
                    cuello: formData.cuello,
                    cuelloNota: formData.cuelloNota,
                    torax: formData.torax,
                    toraxNota: formData.toraxNota,
                    cardiaco: formData.cardiaco,
                    cardiacoNota: formData.cardiacoNota,
                    pulmonar: formData.pulmonar,
                    pulmonarNota: formData.pulmonarNota,
                    abdomen: formData.abdomen,
                    abdomenNota: formData.abdomenNota,
                    miembrosSup: formData.miembrosSup,
                    miembrosSupNota: formData.miembrosSupNota,
                    miembrosInf: formData.miembrosInf,
                    miembrosInfNota: formData.miembrosInfNota,
                    neuro: formData.neuro,
                    neuroNota: formData.neuroNota,
                    genitales: formData.genitales,
                    genitalesNota: formData.genitalesNota,
                    tactoRectal: formData.tactoRectal,
                    tactoRectalNota: formData.tactoRectalNota,
                    // Required by PhysicalExam interface
                    systems: {}
                },
                diagnosis: formData.diagnostico,
                treatment: {
                    meds: formData.medicamentos ? [formData.medicamentos] : [],
                    food: formData.alimentos,
                    exams: formData.examenes ? [formData.examenes] : [],
                    norms: formData.indicaciones ? [formData.indicaciones] : []
                },
                comments: formData.comentarios,
                nextAppointment: formData.proximaCita,
                consultationCost: parseFloat(formData.consultationCost) || 0,
                createdAt: new Date().toISOString(),
                // Required fields for SubsequentConsult interface
                historyOfPresentIllness: formData.historiaEnfermedadActual,
                labs: { performed: { yes: false, no: true }, results: '' },
                diagnoses: formData.diagnostico ? [formData.diagnostico] : []
            };

            await api.createConsult(consultData);
            navigate(`/app/profile/${patientId}`);
        } catch (error) {
            console.error('Error saving consult:', error);
            alert('Error al guardar la consulta');
        } finally {
            setSaving(false);
        }
    };

    // Using the same MOTIVES_LIST as InitialHistoryScreen from constants

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Nueva Consulta Subsecuente</h1>
                            <p className="text-sm text-gray-500">
                                {patient?.firstName} {patient?.lastName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Consulta'}
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Date and Time */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="text-blue-600" /> Información de la Consulta
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Fecha</label>
                            <input type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className={INPUT_CLASS} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Hora</label>
                            <input type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} className={INPUT_CLASS} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Tiempo de Evolución</label>
                            <input type="text" value={formData.tiempoEvolucion} onChange={(e) => handleChange('tiempoEvolucion', e.target.value)} className={INPUT_CLASS} placeholder="Ej: 3 meses" />
                        </div>
                    </div>
                </div>

                {/* Motivos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Motivos de Consulta</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {MOTIVES_LIST.map(m => (
                            <div key={m} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (m === 'Obesidad') {
                                            // For Obesidad, open the modal
                                            setShowObesityModal(true);
                                            if (!formData.motivos.includes(m)) {
                                                handleMotiveToggle(m);
                                            }
                                        } else {
                                            handleMotiveToggle(m);
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${formData.motivos.includes(m)
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                                        }`}
                                >
                                    {m}
                                </button>
                                {/* Eye button for Obesidad when selected */}
                                {m === 'Obesidad' && formData.motivos.includes('Obesidad') && Object.keys(obesityData).length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowObesityView(true)}
                                        className="p-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition"
                                        title="Ver Historia de Obesidad"
                                    >
                                        <Eye size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">Otro motivo</label>
                        <input type="text" value={formData.motivoOtro} onChange={(e) => handleChange('motivoOtro', e.target.value)} className={INPUT_CLASS} placeholder="Especifique..." />
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-bold text-gray-600 mb-1">Historia de la enfermedad actual</label>
                        <textarea
                            value={formData.historiaEnfermedadActual}
                            onChange={(e) => handleChange('historiaEnfermedadActual', e.target.value)}
                            className={`${INPUT_CLASS} min-h-[120px] resize-y`}
                            placeholder="Describa la historia de la enfermedad actual del paciente..."
                            rows={5}
                        />
                    </div>
                </div>

                {/* Vital Signs */}
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                    <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <Activity className="text-blue-600" /> Signos Vitales
                    </h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">FC (lpm)</label>
                            <input type="text" value={formData.fc} onChange={(e) => handleChange('fc', e.target.value)} className={INPUT_CLASS} placeholder="72" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">FR (rpm)</label>
                            <input type="text" value={formData.fr} onChange={(e) => handleChange('fr', e.target.value)} className={INPUT_CLASS} placeholder="16" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">Temp (°C)</label>
                            <input type="text" value={formData.temp} onChange={(e) => handleChange('temp', e.target.value)} className={INPUT_CLASS} placeholder="36.5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">PA (mmHg)</label>
                            <input type="text" value={formData.pa} onChange={(e) => handleChange('pa', e.target.value)} className={INPUT_CLASS} placeholder="120/80" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">SatO2 (%)</label>
                            <input type="text" value={formData.sat02} onChange={(e) => handleChange('sat02', e.target.value)} className={INPUT_CLASS} placeholder="98" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">PAM</label>
                            <input type="text" value={formData.pam} onChange={(e) => handleChange('pam', e.target.value)} className={INPUT_CLASS} placeholder="93" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">Peso (kg)</label>
                            <input type="number" value={formData.peso} onChange={(e) => handleChange('peso', e.target.value)} className={INPUT_CLASS} placeholder="70" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">Talla (cm)</label>
                            <input type="number" value={formData.talla} onChange={(e) => handleChange('talla', e.target.value)} className={INPUT_CLASS} placeholder="170" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-700 mb-1">IMC</label>
                            <input type="text" value={formData.imc} readOnly className={`${INPUT_CLASS} bg-blue-100 font-bold`} />
                            {formData.imc && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                    {formData.imc} - {getIMCClassification(parseFloat(formData.imc))}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Physical Exam by Systems */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Stethoscope className="text-purple-600" /> Examen Físico por Sistemas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { key: 'piel', label: 'Piel' },
                            { key: 'cabeza', label: 'Cabeza' },
                            { key: 'cuello', label: 'Cuello' },
                            { key: 'torax', label: 'Tórax' },
                            { key: 'cardiaco', label: 'Cardíaco' },
                            { key: 'pulmonar', label: 'Pulmonar' },
                            { key: 'abdomen', label: 'Abdomen' },
                            { key: 'miembrosSup', label: 'Miembros Superiores' },
                            { key: 'miembrosInf', label: 'Miembros Inferiores' },
                            { key: 'neuro', label: 'Neurológico' },
                            { key: 'genitales', label: 'Genitales' },
                            { key: 'tactoRectal', label: 'Tacto Rectal' }
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
                                    <select
                                        value={(formData as any)[key]}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className={`${INPUT_CLASS} ${(formData as any)[key] === 'Anormal' ? 'border-red-300 bg-red-50' : ''}`}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Anormal">Anormal</option>
                                        <option value="No evaluado">No evaluado</option>
                                    </select>
                                </div>
                                {(formData as any)[key] === 'Anormal' && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-red-600 mb-1">Hallazgos</label>
                                        <input
                                            type="text"
                                            value={(formData as any)[`${key}Nota`]}
                                            onChange={(e) => handleChange(`${key}Nota`, e.target.value)}
                                            className={`${INPUT_CLASS} border-red-300`}
                                            placeholder="Describir..."
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Diagnosis */}
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                    <h2 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                        <Clipboard className="text-green-600" /> Diagnóstico
                    </h2>
                    <textarea
                        value={formData.diagnostico}
                        onChange={(e) => handleChange('diagnostico', e.target.value)}
                        className={`${INPUT_CLASS} min-h-[120px]`}
                        placeholder="1. Diagnóstico principal&#10;2. Diagnósticos secundarios..."
                    />
                </div>

                {/* Treatment */}
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                    <h2 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
                        <Pill className="text-purple-600" /> Tratamiento
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-purple-700 mb-1">Medicamentos</label>
                            <textarea
                                value={formData.medicamentos}
                                onChange={(e) => handleChange('medicamentos', e.target.value)}
                                className={`${INPUT_CLASS} min-h-[100px]`}
                                placeholder="1. Medicamento, dosis, vía, frecuencia..."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-purple-700 mb-1">Alimentación</label>
                                <textarea
                                    value={formData.alimentos}
                                    onChange={(e) => handleChange('alimentos', e.target.value)}
                                    className={`${INPUT_CLASS} min-h-[80px]`}
                                    placeholder="Indicaciones dietéticas..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-purple-700 mb-1">Estudios Solicitados</label>
                                <textarea
                                    value={formData.examenes}
                                    onChange={(e) => handleChange('examenes', e.target.value)}
                                    className={`${INPUT_CLASS} min-h-[80px]`}
                                    placeholder="Laboratorios, imágenes..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-purple-700 mb-1">Indicaciones Generales</label>
                            <textarea
                                value={formData.indicaciones}
                                onChange={(e) => handleChange('indicaciones', e.target.value)}
                                className={`${INPUT_CLASS} min-h-[80px]`}
                                placeholder="Reposo, actividades..."
                            />
                        </div>
                    </div>
                </div>

                {/* Comments and Next Appointment */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Comentarios del Médico</label>
                            <textarea
                                value={formData.comentarios}
                                onChange={(e) => handleChange('comentarios', e.target.value)}
                                className={`${INPUT_CLASS} min-h-[100px]`}
                                placeholder="Notas adicionales..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1">Próxima Cita</label>
                            <input
                                type="text"
                                value={formData.proximaCita}
                                onChange={(e) => handleChange('proximaCita', e.target.value)}
                                className={INPUT_CLASS}
                                placeholder="Ej: 1 mes con resultados"
                            />
                        </div>
                    </div>

                    {/* Consultation Cost */}
                    <div className="mt-6 pt-6 border-t-2 border-green-200">
                        <label className="block text-lg font-bold text-green-700 mb-2">💰 Costo de Consulta</label>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-600">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.consultationCost}
                                onChange={(e) => handleChange('consultationCost', e.target.value)}
                                placeholder="0.00"
                                className="w-48 px-4 py-3 bg-white border-3 border-green-400 text-green-800 text-xl font-bold rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 outline-none transition-all placeholder-green-300"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button (bottom) */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        <Save size={20} /> {saving ? 'Guardando...' : 'Guardar Consulta Subsecuente'}
                    </button>
                </div>
            </div>

            {/* Obesity History Modal */}
            <ObesityHistoryModal
                isOpen={showObesityModal}
                onClose={() => setShowObesityModal(false)}
                onSave={(data) => {
                    setObesityData(data);
                    setShowObesityModal(false);
                }}
                initialData={obesityData}
            />

            {/* View Obesity Data Modal */}
            {showObesityView && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                            <h3 className="text-xl font-bold">📊 Historia de Obesidad</h3>
                            <button onClick={() => setShowObesityView(false)} className="p-2 hover:bg-white/20 rounded-full">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {Object.keys(obesityData).length > 0 ? (
                                <div className="space-y-3">
                                    {Object.entries(obesityData).map(([key, value]) => (
                                        value && (
                                            <div key={key} className="flex items-start gap-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
                                                <span className="text-purple-600 font-bold">✓</span>
                                                <div>
                                                    <span className="font-medium text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    {typeof value === 'string' && value !== 'true' && (
                                                        <p className="text-gray-600 text-sm">{value}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No hay datos de obesidad registrados</p>
                            )}
                        </div>
                        <div className="p-4 border-t">
                            <button
                                onClick={() => {
                                    setShowObesityView(false);
                                    setShowObesityModal(true);
                                }}
                                className="w-full py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition"
                            >
                                Editar Historia de Obesidad
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
