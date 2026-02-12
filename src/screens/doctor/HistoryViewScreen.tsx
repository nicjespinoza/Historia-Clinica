import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Patient, InitialHistory } from '../../types';
import { ArrowLeft, Printer, Edit, AlertCircle, Check, Stethoscope } from 'lucide-react';
import { PageTransition } from '../../components/ui/PageTransition';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';

const cleanString = (str: any) => str ? String(str).trim() : '';

const formatCheckboxData = (data: any) => {
    if (!data) return '';
    if (typeof data === 'object' && !Array.isArray(data)) {
        const activeKeys = Object.entries(data)
            .filter(([_, value]) => value === true)
            .map(([key]) => key);
        return activeKeys.length > 0 ? activeKeys.join(', ') : '';
    }
    if (Array.isArray(data)) return data.join(', ');
    return String(data);
};

export const HistoryViewScreen = () => {
    const { patientId, historyId } = useParams<{ patientId: string; historyId: string }>();
    const navigate = useNavigate();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<InitialHistory | any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!patientId || !historyId) return;
            try {
                setLoading(true);
                const p = await api.getPatient(patientId);
                setPatient(p);

                const histories = await api.getHistories(patientId);
                const h = histories.find(hist => hist.id === historyId);

                if (h) {
                    setHistory(h);
                } else {
                    setError("No se encontró la historia clínica con ese ID.");
                    toast.error("Historia no encontrada");
                }
            } catch (err) {
                console.error("Error cargando historia:", err);
                setError("Ocurrió un error al cargar la información de la base de datos.");
                toast.error("Error de conexión");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [patientId, historyId]);

    // Helper: Check if field is positive (yes = true)
    const isPositive = (data: any) => {
        if (!data) return false;
        return data?.yes === true || data === 'Si' || data === true;
    };

    // Helper: Get ALL details from a condition field - comprehensive extraction
    const getFullDetails = (data: any): string[] => {
        if (!data) return [];
        const details: string[] = [];

        // Extract from conditions (checkbox data)
        if (data.conditions) {
            const condStr = formatCheckboxData(data.conditions);
            if (condStr) details.push(condStr);
        }

        // Extract from list (either checkbox data or string)
        if (data.list) {
            if (typeof data.list === 'string' && data.list.trim()) {
                details.push(data.list);
            } else if (typeof data.list === 'object') {
                const listStr = formatCheckboxData(data.list);
                if (listStr) details.push(listStr);
            }
        }

        // Extract specific text fields
        if (data.specific && data.specific.trim()) details.push(data.specific);
        if (data.description && data.description.trim()) details.push(data.description);
        if (data.other && data.other.trim()) details.push(`Otro: ${data.other}`);
        if (data.which && data.which.trim()) details.push(data.which);
        if (data.reason && data.reason.trim()) details.push(data.reason);
        if (data.results && data.results.trim()) details.push(`Resultados: ${data.results}`);
        if (data.surgeries && data.surgeries.trim()) details.push(`Cirugías: ${data.surgeries}`);

        // Individual Habit Details
        if (data.drugsDetails && data.drugsDetails.trim()) details.push(`Detalle Drogas: ${data.drugsDetails}`);
        if (data.psychDetails && data.psychDetails.trim()) details.push(`Detalle Psicofármacos: ${data.psychDetails}`);
        if (data.controlledDetails && data.controlledDetails.trim()) details.push(`Detalle Medicamentos Controlados: ${data.controlledDetails}`);
        if (data.cancerDetails && data.cancerDetails.trim()) details.push(`Detalle Cáncer: ${data.cancerDetails}`);
        if (data.details && data.details.trim()) details.push(data.details);

        // Endoscopy Procedures
        if (Array.isArray(data.procedures) && data.procedures.length > 0) {
            data.procedures.forEach((p: any, i: number) => {
                const parts = [];
                if (p.which) parts.push(`Procedimiento: ${p.which}`);
                if (p.lastDate) parts.push(`Fecha: ${p.lastDate}`);
                if (p.results) parts.push(`Resultados: ${p.results}`);
                if (parts.length > 0) details.push(`[${i + 1}] ${parts.join(' • ')}`);
            });
        }

        // For transfusions - check reactions
        if (data.reactions === true || (data.reactions && data.reactions.yes === true)) details.push('Con reacciones adversas');

        // For gyneco - G, P, A, C
        if (data.g || data.p || data.a || data.c) {
            const gpac = [];
            if (data.g) gpac.push(`G${data.g}`);
            if (data.p) gpac.push(`P${data.p}`);
            if (data.a) gpac.push(`A${data.a}`);
            if (data.c) gpac.push(`C${data.c}`);
            if (gpac.length > 0) details.push(gpac.join(' '));
        }

        return details;
    };

    const formatDate = (dateVal: any) => {
        if (!dateVal) return 'Fecha no registrada';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return 'Fecha inválida';
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (e) {
            return 'Fecha inválida';
        }
    };

    // Component: Section Header with Roman Numeral
    const SectionHeader = ({ title, numeral }: { title: string, numeral?: string }) => (
        <div className="flex items-center gap-3 mb-4 mt-8 print:mt-4 print:break-before-avoid">
            <div className="p-2 bg-[#083c79] text-white rounded-lg font-bold min-w-10 text-center">
                {numeral || '•'}
            </div>
            <h3 className="text-lg font-bold text-[#083c79] uppercase tracking-wide">{title}</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-[#083c79]/30 to-transparent"></div>
        </div>
    );

    // Component: Condition Card with full details
    const ConditionCard = ({ label, details, color = 'blue' }: { label: string, details: string[], color?: string }) => {
        const colors = {
            blue: 'bg-blue-50 border-blue-200 text-blue-800',
            red: 'bg-red-50 border-red-200 text-red-800',
            amber: 'bg-amber-50 border-amber-200 text-amber-800',
            green: 'bg-green-50 border-green-200 text-green-800',
            purple: 'bg-purple-50 border-purple-200 text-purple-800',
        };
        const colorClass = colors[color as keyof typeof colors] || colors.blue;

        return (
            <div className={`border rounded-lg p-4 ${colorClass}`}>
                <div className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="font-bold block">{label}</span>
                        {details.length > 0 && (
                            <div className="mt-2 text-sm space-y-1">
                                {details.map((detail, idx) => (
                                    <p key={idx} className="bg-white/50 rounded px-2 py-1">{detail}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Component: Text Section
    const TextSection = ({ title, content }: { title: string, content: any }) => {
        if (!content || content === 'No' || content === 'Ninguno') return null;
        return (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200 print:break-inside-avoid">
                <h4 className="font-bold text-[#083c79] mb-2 text-sm uppercase">{title}</h4>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {Array.isArray(content) ? content.join('\n') : content}
                </p>
            </div>
        );
    };

    // Component: Physical Exam System Field
    const SystemField = ({ label, data }: { label: string, data: any }) => {
        const isNormal = data?.normal === true;
        const isAbnormal = data?.abnormal === true;
        const desc = data?.description || '';

        if (!isNormal && !isAbnormal && !desc) return null;

        return (
            <div className={`p-3 rounded-lg border ${isAbnormal ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <span className="font-semibold text-sm block">{label}</span>
                <span className={`text-sm ${isAbnormal ? 'text-red-700' : 'text-green-700'}`}>
                    {isAbnormal ? '⚠️ Anormal' : '✓ Normal'}
                </span>
                {isAbnormal && desc && <p className="text-sm mt-1 text-gray-700">{desc}</p>}
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-100 pb-20 font-sans">
            {/* Navbar Skeleton */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm p-4">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-24 rounded-lg" />
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8 p-8 bg-white shadow-xl rounded-xl">
                <div className="border-b-4 border-gray-200 pb-4 mb-6 flex justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-16 w-16 mb-4" />
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="space-y-2 text-right">
                        <Skeleton className="h-6 w-48 ml-auto" />
                        <Skeleton className="h-4 w-32 ml-auto" />
                    </div>
                </div>

                <div className="space-y-6">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (error || !history) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <div className="text-red-600 font-bold text-lg mb-4">{error || "Historia no disponible"}</div>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#083c79] text-white rounded-lg hover:bg-blue-800 transition">
                Volver
            </button>
        </div>
    );

    const h = history;
    const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`;
    const displayDate = formatDate(h.date);
    const pe = h.physicalExam || {};
    const systems = pe.systems || {};

    // Collect all positive conditions
    const conditionFields = [
        { key: 'preExistingDiseases', label: 'Enfermedades Preexistentes' },
        { key: 'neurological', label: 'Neurológicas' },
        { key: 'metabolic', label: 'Metabólicas' },
        { key: 'dermatologic', label: 'Dermatológicas' },
        { key: 'respiratory', label: 'Respiratorias' },
        { key: 'cardiac', label: 'Cardíacas' },
        { key: 'gastro', label: 'Gastrointestinales' },
        { key: 'hepato', label: 'Hepatobiliopancreáticas' },
        { key: 'renal', label: 'Renales' },
        { key: 'peripheral', label: 'Arterial/Venosa' },
        { key: 'hematological', label: 'Hematológicas' },
        { key: 'rheumatological', label: 'Reumatológicas' },
        { key: 'infectious', label: 'Infecciosas' },
        { key: 'psychiatric', label: 'Psiquiátricas' },
    ];

    if (patient?.sex === 'Femenino') {
        conditionFields.push({ key: 'gynecoPathological', label: 'Gineco-Patológicas' });
        conditionFields.push({ key: 'gyneco', label: 'Gineco-Obstétricos' });
    }

    const positiveConditions = conditionFields
        .filter(({ key }) => isPositive((h as any)[key]))
        .map(({ key, label }) => ({ label, details: getFullDetails((h as any)[key]) }));

    // Collect medical procedures
    const procedureFields = [
        { key: 'regularMeds', label: 'Medicamentos de Uso Crónico' },
        { key: 'naturalMeds', label: 'Medicina Natural / Suplementos' },
        { key: 'surgeries', label: 'Cirugías / Hospitalizaciones' },
        { key: 'endoscopy', label: 'Procedimientos Endoscópicos' },
        { key: 'implants', label: 'Implantes / Prótesis' },
        { key: 'devices', label: 'Dispositivos (Marcapasos, etc.)' },
        { key: 'transfusions', label: 'Transfusiones' },
        { key: 'complications', label: 'Complicaciones Previas' },
    ];

    const positiveProcedures = procedureFields
        .filter(({ key }) => isPositive((h as any)[key]))
        .map(({ key, label }) => ({ label, details: getFullDetails((h as any)[key]) }));

    // Allergies
    const allergies = [];
    if (isPositive(h.allergies)) {
        allergies.push({ label: 'Alergias', details: getFullDetails(h.allergies) });
    }
    if (isPositive(h.foodIntolerances)) {
        allergies.push({ label: 'Intolerancias Alimenticias', details: getFullDetails(h.foodIntolerances) });
    }

    // Non-pathological
    const nonPathFields = [
        { key: 'habits', label: 'Hábitos y Adicciones' },
        { key: 'exposures', label: 'Exposiciones Ocupacionales/Ambientales' },
    ];

    const nonPathological = nonPathFields
        .filter(({ key }) => isPositive((h as any)[key]))
        .map(({ key, label }) => ({ label, details: getFullDetails((h as any)[key]) }));

    // Family history
    const hasFamilyHistory = isPositive(h.familyHistory);
    const familyDetails = hasFamilyHistory ? getFullDetails(h.familyHistory) : [];

    // Physical exam data check

    const hasSystemsData = Object.keys(systems).length > 0;

    // System fields mapping
    const systemLabels: { [key: string]: string } = {
        "Piel y anexos": 'Piel y Anexos',
        "Cabeza": 'Cabeza',
        "Cuello": 'Cuello',
        "Torax": 'Tórax',
        "Cardiaco": 'Cardiovascular',
        "Pulmonar": 'Pulmonar',
        "Abdomen": 'Abdomen',
        "Miembros superiores": 'Miembros Superiores',
        "Miembros inferiores": 'Miembros Inferiores',
        "Neurologico": 'Neurológico',
        "Genitales": 'Genitales',
        "Tacto Rectal": 'Tacto Rectal',
    };

    // MERGE VITALS: Use history data first, fallback to patient current vitals
    const pVital = patient?.vitalSigns || {} as any;
    const displayPe = {
        fc: pe.fc || pVital.fc,
        fr: pe.fr || pVital.fr,
        temp: pe.temp || pVital.temp,
        sat02: pe.sat02 || pVital.sat02,
        pa: pe.pa || pVital.pa,
        pam: pe.pam || pVital.pam,
        weight: pe.weight || pVital.weight,
        height: pe.height || pVital.height,
        imc: pe.imc || pVital.imc
    };

    // Re-evaluate based on merged data
    const hasVitalSigns = displayPe.fc || displayPe.fr || displayPe.temp || displayPe.pa || displayPe.weight || displayPe.imc || displayPe.sat02 || displayPe.height;


    return (
        <PageTransition className="min-h-screen bg-gray-100 pb-20 font-sans print:bg-white">

            {/* Navigation Bar */}
            <div className="bg-white border-b sticky top-0 z-50 print:hidden shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600" aria-label="Volver">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-[#083c79]">Historia Clínica</h1>
                            <div className="flex gap-4 text-xs text-gray-500 font-medium">
                                <span>ID: {h.id?.slice(0, 8) || 'S/N'}</span>
                                <span className="text-green-600 font-bold">✓ Completada</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => navigate(`/app/history/${patientId}`, { state: { history: h } })}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 text-white font-bold hover:bg-amber-600 px-4 sm:px-6 py-2 rounded-lg transition-colors shadow-md"
                        >
                            <Edit size={18} /> Editar
                        </button>
                        <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#083c79] text-white font-bold hover:bg-blue-800 px-4 sm:px-6 py-2 rounded-lg transition-colors shadow-md">
                            <Printer size={18} /> PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Document */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl my-4 sm:my-8 p-4 sm:p-8 lg:p-12 print:shadow-none print:my-0 print:p-8">

                {/* Header */}
                <div className="border-b-4 border-[#083c79] pb-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div className="flex-1">
                            <img
                                src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                                alt="Dr. Milton Mairena Logo"
                                className="h-16 mb-4 object-contain"
                            />
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#083c79] tracking-tight mb-1">HISTORIA CLÍNICA</h1>
                            <div className="text-sm font-medium text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                                <span>📅 {displayDate}</span>
                                <span>🕐 {h.time || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800">{patientName}</h2>
                            <p className="text-sm text-gray-600">{patient?.sex} • {patient?.ageDetails || 'Edad no registrada'}</p>
                        </div>
                    </div>
                </div>

                {/* Motivo de Consulta */}
                <div className="bg-[#083c79]/5 rounded-xl p-4 sm:p-6 mb-6 border border-[#083c79]/20">
                    <h3 className="font-bold text-[#083c79] text-sm uppercase mb-3">Motivo de Consulta</h3>
                    <p className="text-gray-900 font-medium text-lg">
                        {formatCheckboxData(h.motives) || 'No especificado'}
                        {h.motivesCancerDetails && <span className="text-orange-600 font-semibold"> - Detalle Cáncer: {h.motivesCancerDetails}</span>}
                        {h.otherMotive && <span className="text-gray-600"> - {h.otherMotive}</span>}
                    </p>
                    {h.evolutionTime && (
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-semibold">Tiempo de evolución:</span> {h.evolutionTime}
                        </p>
                    )}
                </div>

                {/* Historia de la Enfermedad */}
                {h.historyOfPresentIllness && (
                    <TextSection title="Historia de la Enfermedad Actual" content={h.historyOfPresentIllness} />
                )}

                {/* I. Antecedentes Personales Patológicos */}
                <SectionHeader title="Antecedentes Personales Patológicos" numeral="I" />

                {positiveConditions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {positiveConditions.map((cond, idx) => (
                            <ConditionCard key={idx} label={cond.label} details={cond.details} color="blue" />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg italic">No refiere antecedentes patológicos personales</p>
                )}

                {/* II. Medicamentos y Procedimientos */}
                <SectionHeader title="Medicamentos y Procedimientos" numeral="II" />

                {positiveProcedures.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {positiveProcedures.map((proc, idx) => (
                            <ConditionCard key={idx} label={proc.label} details={proc.details} color="purple" />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg italic">No refiere medicamentos ni procedimientos previos</p>
                )}

                {/* III. Alergias e Intolerancias */}
                <SectionHeader title="Alergias e Intolerancias" numeral="III" />

                {allergies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {allergies.map((allergy, idx) => (
                            <ConditionCard key={idx} label={allergy.label} details={allergy.details} color="red" />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg italic">No refiere alergias ni intolerancias</p>
                )}

                {/* IV. Antecedentes No Patológicos */}
                <SectionHeader title="Antecedentes No Patológicos" numeral="IV" />

                {nonPathological.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {nonPathological.map((item, idx) => (
                            <ConditionCard key={idx} label={item.label} details={item.details} color="amber" />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mb-6 p-3 bg-gray-50 rounded-lg italic">No refiere hábitos ni exposiciones relevantes</p>
                )}


                {/* Antecedentes Heredofamiliares */}
                {hasFamilyHistory && (
                    <>
                        <div className="flex items-center gap-3 mb-4 mt-8">
                            <h3 className="text-lg font-bold text-[#083c79] uppercase">Antecedentes Heredofamiliares</h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-[#083c79]/30 to-transparent"></div>
                        </div>
                        <div className="mb-6">
                            <ConditionCard label="Historia Familiar" details={familyDetails} color="green" />
                        </div>
                    </>
                )}

                {/* V. Signos Vitales */}
                {hasVitalSigns && (
                    <>
                        <SectionHeader title="Signos Vitales" numeral="V" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            {displayPe.fc && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        FC
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.fc}</span>
                                        <span className="text-xs text-gray-400 font-medium">lpm</span>
                                    </div>
                                </div>
                            )}
                            {displayPe.fr && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        FR
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.fr}</span>
                                        <span className="text-xs text-gray-400 font-medium">rpm</span>
                                    </div>
                                </div>
                            )}
                            {displayPe.temp && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        Temperatura
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.temp}</span>
                                        <span className="text-xs text-gray-400 font-medium">°C</span>
                                    </div>
                                </div>
                            )}
                            {displayPe.sat02 && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        SatO2
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.sat02}</span>
                                        <span className="text-xs text-gray-400 font-medium">%</span>
                                    </div>
                                </div>
                            )}
                            {(displayPe.pa || displayPe.pam) && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        PA (mmHg)
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.pa || '--/--'}</span>
                                        {displayPe.pam && <span className="text-xs text-gray-500">({displayPe.pam})</span>}
                                    </div>
                                </div>
                            )}
                            {displayPe.pam && !displayPe.pa && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        PAM (mmHg)
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.pam}</span>
                                    </div>
                                </div>
                            )}

                            {displayPe.weight && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        Peso
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.weight}</span>
                                        <span className="text-xs text-gray-400 font-medium">kg</span>
                                    </div>
                                </div>
                            )}
                            {displayPe.height && (
                                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                        Altura
                                    </div>
                                    <div className="px-4 py-3 bg-white flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-[#083c79]">{displayPe.height}</span>
                                        <span className="text-xs text-gray-400 font-medium">cm</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {displayPe.imc && (
                            <div className="flex gap-4 mb-8">
                                <div className="px-4 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200 font-bold text-sm shadow-sm inline-flex items-center gap-2">
                                    <span>IMC:</span>
                                    <span className="text-lg">{displayPe.imc} <span className="text-xs font-normal opacity-70">kg/m²</span></span>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* VI. Examen Físico - Órganos y Sistemas */}
                <SectionHeader title="Examen Físico - Órganos y Sistemas" numeral={hasVitalSigns ? "VI" : "V"} />

                <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
                        <thead>
                            <tr className="bg-[#083c79] text-white">
                                <th className="px-4 py-3 text-left font-bold">Órgano / Sistema</th>
                                <th className="px-4 py-3 text-center font-bold w-28">Estado</th>
                                <th className="px-4 py-3 text-left font-bold">Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(systemLabels).map(([key, label], idx) => {
                                const sys = systems[key] || {};
                                const isNormal = sys.normal === true;
                                const isAbnormal = sys.abnormal === true;
                                const desc = sys.description || '';

                                return (
                                    <tr key={key} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                        <td className="px-4 py-3 font-medium text-gray-800">{label}</td>
                                        <td className="px-4 py-3 text-center">
                                            {isNormal && (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                                    ✓ Normal
                                                </span>
                                            )}
                                            {isAbnormal && (
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                                    ⚠ Anormal
                                                </span>
                                            )}
                                            {!isNormal && !isAbnormal && (
                                                <span className="text-gray-400 text-sm">No evaluado</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {isAbnormal && desc ? desc : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Estudios Previos (Movido aquí por solicitud del usuario) */}
                {isPositive(h.previousStudies) && (
                    <>
                        <SectionHeader title="Estudios Diagnósticos Previos" numeral="IV.B" />
                        <div className="mb-6">
                            <ConditionCard label="Estudios Previos" details={getFullDetails(h.previousStudies)} color="amber" />
                        </div>
                    </>
                )}

                {/* Comentarios */}
                {(h.notes || h.comments) && (
                    <TextSection title="Comentarios / Observaciones" content={h.notes || h.comments} />
                )}

                {/* Diagnóstico */}
                {(h.diagnosis || h.diagnoses) && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 mb-6">
                        <h3 className="font-bold text-green-800 text-sm uppercase mb-3 flex items-center gap-2">
                            <Check size={18} /> Diagnóstico
                        </h3>
                        <div className="space-y-2">
                            {Array.isArray(h.diagnosis) ? (
                                h.diagnosis.filter(d => d.trim()).map((d, i) => (
                                    <p key={i} className="text-gray-800 leading-relaxed font-medium">
                                        <span className="text-green-700 mr-2">{i + 1}.</span> {d}
                                    </p>
                                ))
                            ) : Array.isArray(h.diagnoses) ? (
                                h.diagnoses.filter(d => d.trim()).map((d, i) => (
                                    <p key={i} className="text-gray-800 leading-relaxed font-medium">
                                        <span className="text-green-700 mr-2">{i + 1}.</span> {d}
                                    </p>
                                ))
                            ) : (
                                <p className="text-gray-800 leading-relaxed whitespace-pre-line font-medium">{h.diagnosis}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* VII. Plan de Tratamiento */}
                {h.treatment && (h.treatment.food || h.treatment.meds || h.treatment.exams || h.treatment.norms) && (
                    <>
                        <SectionHeader title="Plan de Tratamiento" numeral={hasVitalSigns ? "VII" : "VI"} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {h.treatment.food && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <h4 className="font-bold text-orange-800 text-sm uppercase mb-2">🍎 Alimentación / Dieta</h4>
                                    <p className="text-gray-700 text-sm whitespace-pre-line">{h.treatment.food}</p>
                                </div>
                            )}
                            {h.treatment.meds && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-bold text-blue-800 text-sm uppercase mb-2">💊 Medicamentos</h4>
                                    <div className="text-gray-700 text-sm whitespace-pre-line">
                                        {Array.isArray(h.treatment.meds) ? h.treatment.meds.filter(m => m.trim()).join('\n') : h.treatment.meds}
                                    </div>
                                </div>
                            )}
                            {h.treatment.exams && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-bold text-purple-800 text-sm uppercase mb-2">🔬 Exámenes</h4>
                                    <div className="text-gray-700 text-sm whitespace-pre-line">
                                        {Array.isArray(h.treatment.exams) ? h.treatment.exams.filter(e => e.trim()).join('\n') : h.treatment.exams}
                                    </div>
                                </div>
                            )}
                            {h.treatment.norms && (
                                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                    <h4 className="font-bold text-teal-800 text-sm uppercase mb-2">📋 Normas / Recomendaciones</h4>
                                    <div className="text-gray-700 text-sm whitespace-pre-line">
                                        {Array.isArray(h.treatment.norms) ? h.treatment.norms.filter(n => n.trim()).join('\n') : h.treatment.norms}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* VIII. Órdenes Generadas */}
                {Array.isArray(h.medicalOrders) && h.medicalOrders.length > 0 && (
                    <>
                        <SectionHeader title="Órdenes Médicas" numeral={hasVitalSigns ? "VIII" : "VII"} />
                        <div className="space-y-4 mb-6">
                            {h.medicalOrders.map((order: any, idx: number) => {
                                const labels: any = {
                                    prescription: '💊 Receta Médica',
                                    lab_general: '🧪 Laboratorio (General)',
                                    lab_basic: '🧪 Laboratorio (Panel Básico)',
                                    lab_extended: '🧪 Laboratorio (Panel Ampliado)',
                                    lab_feces: '🧪 Laboratorio (Heces)',
                                    image: '🩻 Estudio de Imagen',
                                    endoscopy: '🔬 Endoscopia'
                                };
                                return (
                                    <div key={idx} className="border-2 border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:border-[#083c79]/30 transition-colors">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-[#083c79] text-base">{labels[order.type] || order.type}</h4>
                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase">Orden #{idx + 1}</span>
                                        </div>
                                        {order.diagnosis && (
                                            <div className="mb-3">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Diagnóstico / Razón</p>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">{order.diagnosis}</p>
                                            </div>
                                        )}
                                        {order.content && (
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contenido / Detalles</p>
                                                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{order.content}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Legacy Orders (Fallback) */}
                {(!Array.isArray(h.orders)) && h.orders && Object.values(h.orders).some((o: any) => o.included) && (
                    <>
                        <SectionHeader title="Órdenes Generadas" numeral={hasVitalSigns ? "VIII" : "VII"} />
                        <div className="space-y-3 mb-6">
                            {Object.entries(h.orders).map(([key, value]: [string, any]) => {
                                if (!value.included) return null;
                                const labels: any = {
                                    medical: '📄 Orden Médica',
                                    prescription: '💊 Receta Médica',
                                    labs: '🧪 Orden de Laboratorios',
                                    images: '🩻 Orden de Imagen',
                                    endoscopy: '🔬 Orden de Endoscopia'
                                };
                                return (
                                    <div key={key} className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
                                        <h4 className="font-bold text-[#083c79] text-sm mb-2">{labels[key] || key}</h4>
                                        <p className="text-gray-700 text-sm whitespace-pre-line">{value.details || 'Sin detalles'}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="border-t-2 border-gray-200 pt-8 mt-8 text-center print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white print:p-4">
                    <p className="text-xs text-gray-400 mb-4">
                        Documento generado el {new Date().toLocaleDateString('es-NI')} • Historia Clínica Digital
                    </p>
                </div>
            </div>
        </PageTransition>
    );
};
