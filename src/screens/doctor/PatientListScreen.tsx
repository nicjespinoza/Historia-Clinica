import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, ArrowLeft, Trash2, AlertTriangle, X, MessageCircle, Activity, User, CheckCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Patient } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageTransition } from '../../components/ui/PageTransition';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientListScreenProps {
    basePath?: string;
}

export const PatientListScreen = ({ basePath = '/app' }: PatientListScreenProps) => {
    const [allPatients, setAllPatients] = useState<Patient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

    // View Mode state
    const [viewMode, setViewMode] = useState<'active' | 'process'>('active');
    const PAGE_SIZE = 9;

    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    // Vital Signs Modal State
    const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
    const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<Patient | null>(null);
    const [vitalSigns, setVitalSigns] = useState({
        fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: ''
    });

    // Calculate IMC and get WHO classification
    const calculateIMC = (weight: string, height: string) => {
        const w = parseFloat(weight);
        const h = parseFloat(height) / 100; // Convert cm to m
        if (w > 0 && h > 0) {
            return (w / (h * h)).toFixed(2);
        }
        return '';
    };

    const getIMCClassification = (imc: number): string => {
        if (imc < 18.5) return 'Bajo peso';
        if (imc < 25) return 'Peso normal';
        if (imc < 30) return 'Sobrepeso';
        if (imc < 35) return 'Obesidad de clase I';
        if (imc < 40) return 'Obesidad de clase II';
        return 'Obesidad de clase III (mórbida)';
    };

    // Handle vital signs input change
    const handleVitalChange = (field: string, value: string) => {
        const newVitals = { ...vitalSigns, [field]: value };
        // Auto-calculate IMC when weight or height changes
        if (field === 'weight' || field === 'height') {
            const weight = field === 'weight' ? value : newVitals.weight;
            const height = field === 'height' ? value : newVitals.height;
            newVitals.imc = calculateIMC(weight, height);
        }
        setVitalSigns(newVitals);
    };


    // Status definitions
    const ACTIVE_STATUSES = ['Paciente', 'paciente', 'Activo', 'activo', ''];
    const PROCESS_STATUSES = ['Proceso1', 'Proceso2', 'Proceso3', 'proceso1', 'proceso2', 'proceso3'];

    // Load all patients once (cached for 15 min)
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const all = await api.getPatients();
                setAllPatients(all);
            } catch (e) {
                console.error('Error loading patients:', e);
                toast.error('Error al cargar pacientes');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Reset to page 0 when viewMode or searchTerm changes
    useEffect(() => {
        setCurrentPage(0);
    }, [viewMode, searchTerm]);

    // Client-side filtering by status tab and search term
    const filteredPatients = allPatients.filter(p => {
        const status = (p.registrationStatus || '').toLowerCase();
        const activeStatuses = ACTIVE_STATUSES.map(s => s.toLowerCase());
        const processStatuses = PROCESS_STATUSES.map(s => s.toLowerCase());

        const matchesTab = viewMode === 'active'
            ? activeStatuses.includes(status)
            : processStatuses.includes(status);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = (p.firstName || '').toLowerCase().includes(term) ||
                (p.lastName || '').toLowerCase().includes(term) ||
                (p.id || '').includes(searchTerm) ||
                (p.email || '').toLowerCase().includes(term);
            return matchesTab && matchesSearch;
        }

        return matchesTab;
    });

    // Pagination derived values
    const totalPages = Math.ceil(filteredPatients.length / PAGE_SIZE);
    const hasMore = currentPage < totalPages - 1;
    const startIdx = currentPage * PAGE_SIZE;
    const filteredAndRenderedPatients = filteredPatients.slice(startIdx, startIdx + PAGE_SIZE);

    const nextPage = () => {
        if (hasMore) setCurrentPage(prev => prev + 1);
    };

    const prevPage = () => {
        if (currentPage > 0) setCurrentPage(prev => prev - 1);
    };

    // Update local state after delete or save
    const handleSaveVitalSignsLocal = async () => {
        if (!selectedPatientForVitals) return;
        try {
            await api.updatePatient(selectedPatientForVitals.id, {
                registrationStatus: 'Paciente',
                registrationMessage: 'Paciente activo',
                vitalSigns: vitalSigns
            });

            setAllPatients(prev => prev.map(p =>
                p.id === selectedPatientForVitals.id
                    ? { ...p, registrationStatus: 'Paciente' }
                    : p
            ));

            toast.success('Signos vitales guardados', {
                description: `Paciente ${selectedPatientForVitals.firstName} activado correctamente.`
            });
            setShowVitalSignsModal(false);
            setSelectedPatientForVitals(null);
            setVitalSigns({ fc: '', fr: '', temp: '', pa: '', pam: '', sat02: '', weight: '', height: '', imc: '' });
        } catch (error) {
            console.error('Error saving vital signs:', error);
            toast.error('Error al guardar', { description: 'No se pudieron guardar los signos vitales.' });
        }
    };

    const handleDelete = async () => {
        if (!patientToDelete) return;
        try {
            await api.deletePatient(patientToDelete.id);
            setAllPatients(prev => prev.filter(p => p.id !== patientToDelete.id));
            toast.success('Paciente eliminado', {
                description: `${patientToDelete.firstName} ${patientToDelete.lastName} ha sido eliminado permanentemente.`
            });
            setPatientToDelete(null);
        } catch (error) {
            console.error('Error deleting patient:', error);
            toast.error('Error al eliminar', { description: 'Hubo un problema al intentar eliminar el paciente.' });
        }
    };

    return (
        <PageTransition className="min-h-screen bg-[#084286] p-4 md:p-8">
            <div className="bg-white rounded-3xl p-4 md:p-10 max-w-7xl mx-auto shadow-2xl relative overflow-hidden min-h-[80vh] flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-6">
                    <h2 className="text-3xl font-bold text-[#084286] flex items-center gap-3">
                        <Users className="text-[#084286]" /> Pacientes
                    </h2>
                    <div className="flex w-full md:w-auto gap-3">
                        <button
                            onClick={() => navigate(`${basePath}/register`)}
                            className="bg-[#084286] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-900 transition shadow-lg shadow-blue-900/20 w-full md:w-auto justify-center font-medium"
                            aria-label="Crear nuevo paciente"
                        >
                            <UserPlus size={20} /> Crear Nuevo
                        </button>
                    </div>
                </div>

                {/* TABS DE NAVEGACIÓN */}
                <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`pb-3 px-4 text-base font-bold transition-colors relative ${viewMode === 'active' ? 'text-[#083c79]' : 'text-gray-400 hover:text-gray-600'}`}
                        role="tab"
                        aria-selected={viewMode === 'active'}
                    >
                        Pacientes Activos
                        {viewMode === 'active' && <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 w-full h-1 bg-[#083c79] rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('process')}
                        className={`pb-3 px-4 text-base font-bold transition-colors relative ${viewMode === 'process' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}
                        role="tab"
                        aria-selected={viewMode === 'process'}
                    >
                        En Proceso (Pendientes)
                        {viewMode === 'process' && <motion.div layoutId="tabIndicator" className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full" />}
                    </button>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, apellido, ID o email..."
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-black rounded-xl shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-700"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        aria-label="Buscar pacientes"
                    />
                </div>

                {/* CONTENT AREA: Skeletons or Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <Skeleton key={i} variant="card" className="h-[200px]" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredAndRenderedPatients.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        layout
                                        className="bg-white p-6 rounded-2xl shadow-sm border-2 border-black hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                {/* Profile Image */}
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                    {(p as any).profileImage ? (
                                                        <img
                                                            src={(p as any).profileImage}
                                                            alt={`${p.firstName} ${p.lastName}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <User size={24} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">{p.firstName} {p.lastName}</h3>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500 mt-1">{p.ageDetails}</p>
                                                    {p.legacyIdSistema ? (
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 tracking-wider">MIGRADO: {p.legacyIdSistema}</span>
                                                            {hasPermission('patient:delete') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPatientToDelete(p);
                                                                    }}
                                                                    className="p-1 text-[#084286] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                                    title="Eliminar paciente"
                                                                    aria-label={`Eliminar a ${p.firstName} ${p.lastName}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : p.registrationSource === 'online' ? (
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <span className="text-[10px] font-bold tracking-wider text-gray-500">ONLINE</span>
                                                            {p.isOnline && (
                                                                <div title="Conectado ahora" className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50 animate-pulse"></div>
                                                            )}
                                                            {!p.isOnline && (
                                                                <div title="Desconectado" className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                                            )}
                                                            {hasPermission('patient:delete') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPatientToDelete(p);
                                                                    }}
                                                                    className="ml-2 p-1 text-[#084286] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                                    title="Eliminar paciente"
                                                                    aria-label={`Eliminar a ${p.firstName} ${p.lastName}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 tracking-wider">MANUAL</span>
                                                            {hasPermission('patient:delete') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPatientToDelete(p);
                                                                    }}
                                                                    className="p-1 text-[#084286] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                                    title="Eliminar paciente"
                                                                    aria-label={`Eliminar a ${p.firstName} ${p.lastName}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {viewMode === 'process' && p.registrationStatus && (
                                                        <div className="mt-2 text-red-600 text-sm font-bold">
                                                            <p>
                                                                {p.registrationStatus.toLowerCase().includes('proceso1') && 'Ficha clínica no completada'}
                                                                {p.registrationStatus.toLowerCase().includes('proceso2') && 'Historia Clínica pendiente'}
                                                                {p.registrationStatus.toLowerCase().includes('proceso3') && 'Signos vitales pendientes'}
                                                            </p>
                                                            {/* WhatsApp buttons for Proceso1 and Proceso2 */}
                                                            {(p.registrationStatus.toLowerCase().includes('proceso1') || p.registrationStatus.toLowerCase().includes('proceso2')) && (
                                                                <a
                                                                    href={`https://wa.me/50587893709?text=${encodeURIComponent(
                                                                        p.registrationStatus.toLowerCase().includes('proceso1')
                                                                            ? `Hola ${p.firstName} ${p.lastName}, hemos notado que te has registrado en nuestra plataforma médica y no has completado tu perfil clínico, me encantaría ayudarte con tus dudas.`
                                                                            : `Hola ${p.firstName} ${p.lastName}, hemos notado que todavía no has completado tu historia clínica, me encantaría ayudarte con tus dudas.`
                                                                    )}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="mt-2 inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors shadow-md"
                                                                    aria-label="Contactar por WhatsApp"
                                                                >
                                                                    <MessageCircle size={14} /> WhatsApp
                                                                </a>
                                                            )}
                                                            {/* Vital Signs button for Proceso3 */}
                                                            {p.registrationStatus.toLowerCase().includes('proceso3') && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedPatientForVitals(p);
                                                                        setShowVitalSignsModal(true);
                                                                    }}
                                                                    className="mt-2 inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-md"
                                                                    aria-label="Ingresar signos vitales"
                                                                >
                                                                    <Activity size={14} /> Ingresar Signos Vitales
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                to={`${basePath}/profile/${p.id}`}
                                                className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-center group-hover:shadow-md"
                                                aria-label={`Ver perfil de ${p.firstName} ${p.lastName}`}
                                            >
                                                <ArrowLeft className="rotate-180 mx-auto" size={20} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* PAGINATION CONTROLS */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-4">
                            <p className="text-sm text-gray-500 font-medium">
                                Página <span className="text-[#084286] font-bold">{currentPage + 1}</span> de <span className="text-[#084286] font-bold">{totalPages || 1}</span>
                                <span className="ml-3 text-gray-400">({filteredPatients.length} pacientes)</span>
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 0 || loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed border-2 border-gray-200 hover:border-[#084286] hover:text-[#084286]"
                                >
                                    <ArrowLeft size={18} /> Anterior
                                </button>
                                <button
                                    onClick={nextPage}
                                    disabled={!hasMore || loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#084286] text-white rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-900 shadow-lg shadow-blue-900/20"
                                >
                                    Siguiente <ArrowLeft size={18} className="rotate-180" />
                                </button>
                            </div>
                        </div>

                        {!loading && filteredAndRenderedPatients.length === 0 && (
                            <div className="text-center py-20">
                                <div className="inline-block p-4 rounded-full bg-gray-100 mb-4 text-gray-400">
                                    <Search size={40} />
                                </div>
                                <p className="text-gray-500 font-medium">No se encontraron pacientes registrados en esta categoría.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {patientToDelete && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            >
                                <div className="p-6 bg-red-50 border-b border-red-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                                        <AlertTriangle /> Advertencia
                                    </h3>
                                    <button onClick={() => setPatientToDelete(null)} className="text-red-400 hover:text-red-600" aria-label="Cerrar modal">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="bg-red-600 text-white p-4 rounded-xl mb-6 shadow-inner">
                                        <p className="font-medium text-center">
                                            Se eliminará de forma permanente al paciente, junto con sus historias clínicas, consultas, imágenes, recetas y citas agendadas.
                                        </p>
                                    </div>
                                    <p className="text-gray-600 text-center mb-6">
                                        ¿Estás seguro que deseas eliminar a <strong>{patientToDelete.firstName} {patientToDelete.lastName}</strong>?
                                        <br />Esta acción no se puede deshacer.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setPatientToDelete(null)}
                                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                        >
                                            Eliminación completa
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Vital Signs Modal */}
                <AnimatePresence>
                    {showVitalSignsModal && selectedPatientForVitals && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            >
                                <div className="p-6 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                                        <Activity /> Signos Vitales
                                    </h3>
                                    <button onClick={() => { setShowVitalSignsModal(false); setSelectedPatientForVitals(null); }} className="text-purple-400 hover:text-purple-600" aria-label="Cerrar modal">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-600 mb-4 font-medium">
                                        Paciente: <strong>{selectedPatientForVitals.firstName} {selectedPatientForVitals.lastName}</strong>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">FC (lpm)</label>
                                            <input type="text" value={vitalSigns.fc} onChange={(e) => handleVitalChange('fc', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="60-100" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">FR (rpm)</label>
                                            <input type="text" value={vitalSigns.fr} onChange={(e) => handleVitalChange('fr', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="12-20" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Temp (°C)</label>
                                            <input type="text" value={vitalSigns.temp} onChange={(e) => handleVitalChange('temp', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="36.5" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">PA (mmHg)</label>
                                            <input type="text" value={vitalSigns.pa} onChange={(e) => handleVitalChange('pa', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="120/80" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">PAM (mmHg)</label>
                                            <input type="text" value={vitalSigns.pam} onChange={(e) => handleVitalChange('pam', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="70-105" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">SatO2 (%)</label>
                                            <input type="text" value={vitalSigns.sat02} onChange={(e) => handleVitalChange('sat02', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="95-100" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Peso (kg)</label>
                                            <input type="number" value={vitalSigns.weight} onChange={(e) => handleVitalChange('weight', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="70" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Altura (cm)</label>
                                            <input type="number" value={vitalSigns.height} onChange={(e) => handleVitalChange('height', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" placeholder="170" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">IMC</label>
                                            <input type="text" value={vitalSigns.imc} readOnly className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-bold" placeholder="Auto" />
                                        </div>
                                    </div>
                                    {/* IMC Classification */}
                                    {vitalSigns.imc && (
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-blue-800 font-bold text-sm">
                                                {vitalSigns.imc} - {getIMCClassification(parseFloat(vitalSigns.imc))}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => { setShowVitalSignsModal(false); setSelectedPatientForVitals(null); }}
                                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveVitalSignsLocal}
                                            className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20"
                                        >
                                            Guardar y Activar Paciente
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};
