import React, { useState } from 'react';
import { User, FileText, Stethoscope, ArrowLeft, Plus, Calendar, Edit, X, Save, Trash2, Eye, Video, Clock, CheckCircle, Brain, Lightbulb, AlertTriangle, ClipboardList, Loader2, PenTool, FileDown, StickyNote, Activity, Bell } from 'lucide-react';
import { Patient, InitialHistory, SubsequentConsult } from '../types';
import { calculateAge } from '../lib/helpers';
import { api } from '../lib/api';
import { InputGroup } from '../components/ui/InputGroup';
import { AppointmentModal } from '../components/AppointmentModal';
import { JitsiMeetModal } from '../components/premium-ui/JitsiMeetModal';
import { useParams, useNavigate } from 'react-router-dom';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import ReactSignatureCanvas from 'react-signature-canvas';
import { generateHistoryPDF, generateOrderPDF, generateReceiptPDF } from '../lib/pdfGenerator';
import { PatientHeader } from '../components/profile/PatientHeader';
import { PatientInfoCard } from '../components/profile/PatientInfoCard';
import { HistoryList } from '../components/profile/HistoryList';
import { ConsultList } from '../components/profile/ConsultList';

const INPUT_CLASS = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block transition-all duration-200 outline-none placeholder-gray-400 hover:bg-white";

import { uploadProfilePicture, validateFileSize, isImageFile } from '../lib/storage';

// Props removed as it fetches its own data
export const ProfileScreen = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    // Internal state for self-fetching
    const [patient, setPatient] = useState<Patient | null>(null);
    const [histories, setHistories] = useState<InitialHistory[]>([]);
    const [consults, setConsults] = useState<SubsequentConsult[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Partial<Patient>>({});
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [deleteSnapshotId, setDeleteSnapshotId] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Video consultation state
    const [appointments, setAppointments] = useState<any[]>([]);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [videoAppointment, setVideoAppointment] = useState<any>(null);
    const [creatingRoom, setCreatingRoom] = useState<string | null>(null);

    // Notes feature state
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showViewNotesModal, setShowViewNotesModal] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Endoscopic Control state
    const [showEndoscopicModal, setShowEndoscopicModal] = useState(false);
    const [showViewEndoscopicModal, setShowViewEndoscopicModal] = useState(false);
    const [endoscopicNotes, setEndoscopicNotes] = useState('');
    const [endoscopicDate, setEndoscopicDate] = useState('');
    const [savingEndoscopic, setSavingEndoscopic] = useState(false);

    // Delete History Modal state
    const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null);
    const [deleteConsultId, setDeleteConsultId] = useState<string | null>(null); // Added this line
    const [deletingHistory, setDeletingHistory] = useState(false);

    React.useEffect(() => {
        const loadPatientData = async () => {
            if (patientId) {
                try {
                    const [p, h, c, snaps, allApts] = await Promise.all([
                        api.getPatient(patientId),
                        api.getHistories(patientId),
                        api.getConsults(patientId),
                        api.getSnapshots(patientId),
                        api.getAppointments()
                    ]);

                    if (p) {
                        setPatient(p);
                    }
                    setHistories(h);
                    setConsults(c);
                    setSnapshots(snaps);

                    const patientApts = allApts.filter((a: any) => a.patientId === patientId);
                    setAppointments(patientApts);
                } catch (error) {
                    console.error("Error loading profile data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadPatientData();
    }, [patientId]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !patient) return;

        if (!isImageFile(file)) {
            alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP)');
            return;
        }

        if (!validateFileSize(file, 2)) { // 2MB max
            alert('La imagen no debe pesar más de 2MB');
            return;
        }

        try {
            setUploadingImage(true);
            const url = await uploadProfilePicture(file, patient.id);
            await api.updatePatient(patient.id, { profileImage: url });
            setPatient(prev => prev ? { ...prev, profileImage: url } : null);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen. Inténtalo de nuevo.');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEditClick = () => {
        if (patient) {
            setEditingPatient(patient);
            setIsEditModalOpen(true);
        }
    };

    const handleUpdatePatient = async () => {
        if (!patient || !editingPatient) return;
        try {
            const updated = await api.updatePatient(patient.id, editingPatient);
            setPatient(updated); // Update local state
            // onPatientUpdate(updated); // Removed prop call
            setIsEditModalOpen(false);
            alert('Paciente actualizado correctamente');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar paciente');
        }
    };

    // Create video room and open Jitsi for doctor
    const handleCreateVideoRoom = async (apt: any) => {
        setCreatingRoom(apt.id);
        try {
            // Update appointment to mark video room as active
            await api.updateAppointment(apt.id, {
                videoRoomActive: true,
                videoRoomCreatedAt: new Date().toISOString(),
                videoRoomId: `HistoriaClinica_${apt.id} `
            } as any);

            // Update local state
            setAppointments(prev => prev.map(a =>
                a.id === apt.id
                    ? { ...a, videoRoomActive: true, videoRoomCreatedAt: new Date().toISOString() }
                    : a
            ));

            // Open video modal for doctor
            setVideoAppointment(apt);
            setShowVideoModal(true);
        } catch (error) {
            console.error('Error creating video room:', error);
            alert('Error al crear la sala de video');
        } finally {
            setCreatingRoom(null);
        }
    };

    // AI Analysis State
    const [showAIModal, setShowAIModal] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);

    // Consent Manager State
    const [activeTab, setActiveTab] = useState<'general' | 'consents'>('general');
    const [selectedConsent, setSelectedConsent] = useState<any>(null);
    const [signatureRef, setSignatureRef] = useState<any>(null);
    const [signedDocs, setSignedDocs] = useState<string[]>([]);

    const CONSENTS_LIST = [
        { id: '1', title: 'Consentimiento para Endoscopia' },
        { id: '2', title: 'Consentimiento para Cirugía Menor' },
        { id: '3', title: 'Consentimiento para Telemedicina' },
        { id: '4', title: 'Consentimiento de Tratamiento de Datos' },
        { id: '5', title: 'Consentimiento Informado General' },
        { id: '6', title: 'Autorización de Procedimientos' },
        { id: '7', title: 'Consentimiento para Anestesia' },
        { id: '8', title: 'Consentimiento para Transfusión' },
        { id: '9', title: 'Rechazo de Tratamiento' },
        { id: '10', title: 'Consentimiento COVID-19' },
    ];

    const handleSaveConsent = () => {
        if (signatureRef && !signatureRef.isEmpty()) {
            const signatureImage = signatureRef.toDataURL();
            console.log("Firma guardada:", signatureImage);

            // Simulation of saving
            if (selectedConsent) {
                setSignedDocs(prev => [...prev, selectedConsent.id]);
                alert('Documento firmado correctamente');
                signatureRef.clear();
            }
        } else {
            alert('Por favor firme el documento antes de guardar');
        }
    };

    const handleAIAnalysis = async () => {
        if (aiResult) {
            setShowAIModal(true);
            return;
        }

        if (!patient) return;

        setShowAIModal(true);
        setIsAnalyzing(true);

        try {
            const generateAI = httpsCallable(functions, 'generateAIAnalysis');
            const result = await generateAI({ patientId: patient.id });
            const data = result.data as any;
            setAiResult({
                summary: data.summary,
                risks: data.risks,
                recommendations: data.recommendations
            });
        } catch (error) {
            console.error("Error AI:", error);
            alert("Error al generar análisis IA");
            setShowAIModal(false);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Save new note
    const handleSaveNote = async () => {
        if (!patient || !currentNote.trim()) return;
        setSavingNote(true);
        try {
            const existingNotes = (patient as any).notes || [];
            const newNote = {
                id: Date.now().toString(),
                text: currentNote.trim(),
                createdAt: new Date().toISOString()
            };
            const updatedNotes = [...existingNotes, newNote];
            await api.updatePatient(patient.id, { notes: updatedNotes } as any);
            setPatient({ ...patient, notes: updatedNotes } as any);
            setCurrentNote('');
            setShowNotesModal(false);
            alert('Nota guardada correctamente');
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Error al guardar la nota');
        } finally {
            setSavingNote(false);
        }
    };

    // Calculate reminder dates based on control date
    const calculateReminders = (controlDate: Date) => {
        const today = new Date();
        const diffMs = controlDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const reminders: { date: Date; type: string }[] = [];

        if (diffDays <= 45) {
            // 1 month: 2 reminders (15 days and 5 days before)
            const reminder15 = new Date(controlDate);
            reminder15.setDate(reminder15.getDate() - 15);
            if (reminder15 > today) reminders.push({ date: reminder15, type: '15_days_before' });

            const reminder5 = new Date(controlDate);
            reminder5.setDate(reminder5.getDate() - 5);
            if (reminder5 > today) reminders.push({ date: reminder5, type: '5_days_before' });
        } else if (diffDays <= 120) {
            // 3 months: 1 reminder (30 days before)
            const reminder = new Date(controlDate);
            reminder.setDate(reminder.getDate() - 30);
            if (reminder > today) reminders.push({ date: reminder, type: '30_days_before' });
        } else if (diffDays <= 210) {
            // 6 months: 1 reminder (60 days before)
            const reminder = new Date(controlDate);
            reminder.setDate(reminder.getDate() - 60);
            if (reminder > today) reminders.push({ date: reminder, type: '60_days_before' });
        } else if (diffDays <= 300) {
            // 9 months: 1 reminder (90 days before)
            const reminder = new Date(controlDate);
            reminder.setDate(reminder.getDate() - 90);
            if (reminder > today) reminders.push({ date: reminder, type: '90_days_before' });
        } else {
            // 12 months: 1 reminder (120 days before)
            const reminder = new Date(controlDate);
            reminder.setDate(reminder.getDate() - 120);
            if (reminder > today) reminders.push({ date: reminder, type: '120_days_before' });
        }

        return reminders;
    };

    // Save endoscopic control and schedule reminders
    const handleSaveEndoscopicControl = async () => {
        if (!patient || !endoscopicDate) {
            alert('Por favor seleccione una fecha para el control');
            return;
        }

        setSavingEndoscopic(true);
        try {
            const controlDate = new Date(endoscopicDate + 'T12:00:00');
            const reminders = calculateReminders(controlDate);

            const newControl = {
                id: Date.now().toString(),
                notes: endoscopicNotes.trim(),
                controlDate: endoscopicDate,
                reminders: reminders.map(r => ({
                    date: r.date.toISOString(),
                    type: r.type,
                    sent: false
                })),
                createdAt: new Date().toISOString()
            };

            const existingControls = (patient as any).endoscopicControls || [];
            const updatedControls = [...existingControls, newControl];

            await api.updatePatient(patient.id, { endoscopicControls: updatedControls } as any);

            // Call Cloud Function to schedule email reminders
            try {
                const scheduleReminders = httpsCallable(functions, 'scheduleEndoscopicReminders');
                await scheduleReminders({
                    patientId: patient.id,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    patientEmail: patient.email,
                    controlDate: endoscopicDate,
                    notes: endoscopicNotes,
                    reminders: newControl.reminders
                });
            } catch (fnError) {
                console.log('Cloud function not available, reminders stored locally');
            }

            setPatient({ ...patient, endoscopicControls: updatedControls } as any);
            setEndoscopicNotes('');
            setEndoscopicDate('');
            setShowEndoscopicModal(false);
            alert(`Control endoscópico guardado. Se programaron ${reminders.length} recordatorio(s).`);
        } catch (error) {
            console.error('Error saving endoscopic control:', error);
            alert('Error al guardar el control endoscópico');
        } finally {
            setSavingEndoscopic(false);
        }
    };

    // Delete endoscopic control
    const handleDeleteEndoscopicControl = async (controlId: string) => {
        if (!patient) return;
        if (!confirm('¿Está seguro de eliminar este control endoscópico? Esta acción no se puede deshacer.')) return;

        try {
            const existingControls = (patient as any).endoscopicControls || [];
            const updatedControls = existingControls.filter((c: any) => c.id !== controlId);
            await api.updatePatient(patient.id, { endoscopicControls: updatedControls } as any);
            setPatient({ ...patient, endoscopicControls: updatedControls } as any);
            alert('Control eliminado correctamente');
        } catch (error) {
            console.error('Error deleting control:', error);
            alert('Error al eliminar el control');
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando perfil...</div>;

    if (!patient) {
        return <div className="p-8 text-center text-gray-500">Paciente no encontrado.</div>;
    }

    const patientHistories = histories; // Already filtered by efficiency API call
    const patientConsults = consults;   // Already filtered by efficiency API call

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Banner Minimalista */}
            <PatientHeader
                patient={patient}
                navigate={navigate}
                onAIAnalysis={handleAIAnalysis}
                onShowAppointment={() => setShowAppointmentModal(true)}
                onShowNotes={() => setShowNotesModal(true)}
                onViewNotes={() => setShowViewNotesModal(true)}
                onShowEndoscopic={() => setShowEndoscopicModal(true)}
                onViewEndoscopic={() => setShowViewEndoscopicModal(true)}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* TAB: General Profile Content */}
            {
                activeTab === 'general' && (
                    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                            {/* 1. Patient Info Card - Compact */}
                            <PatientInfoCard
                                patient={patient}
                                onEdit={handleEditClick}
                                fileInputRef={fileInputRef}
                                onImageUpload={handleImageUpload}
                                uploadingImage={uploadingImage}
                                navigate={navigate}
                                snapshots={snapshots}
                                onDeleteSnapshot={setDeleteSnapshotId}
                            />

                            <div className="md:col-span-2 space-y-6">
                                {/* Clinical Histories & Consults Grid */}
                                <div className="space-y-8">
                                    {/* 1. Clinical Histories */}
                                    {/* 1. Clinical Histories */}
                                    <HistoryList
                                        patient={patient}
                                        histories={patientHistories}
                                        navigate={navigate}
                                        onDelete={setDeleteHistoryId}
                                    />

                                    {/* 2. Medical Consults */}
                                    {/* 2. Medical Consults */}
                                    <ConsultList
                                        patient={patient}
                                        consults={patientConsults}
                                        navigate={navigate}
                                        onDelete={setDeleteConsultId}
                                    />
                                </div>

                                <div className="bg-[#083c79] rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                            <span className="bg-white/20 p-1.5 rounded-lg">🧬</span> Diseñar Enfermedad
                                        </h3>
                                        <p className="text-blue-100 mb-4 text-sm max-w-md">
                                            Utiliza nuestra herramienta de modelado 3D para visualizar y marcar áreas afectadas en el cuerpo humano.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const newSnap = await api.createSnapshot(patient.id);
                                                    navigate(`/app/crearimagen/${patient.id}/${newSnap.id}`);
                                                } catch (e) {
                                                    alert('Error al crear nueva imagen');
                                                }
                                            }}
                                            className="bg-white text-blue-900 px-6 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2 mb-6"
                                        >
                                            <span>Crear imagen 3D</span>
                                            <ArrowLeft className="rotate-180" size={18} />
                                        </button >

                                        {
                                            snapshots.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="font-bold text-sm text-blue-200 uppercase tracking-widest border-b border-white/20 pb-1 mb-2">Imágenes Guardadas</h4>
                                                    {snapshots.map(snap => (
                                                        <div key={snap.id} className="bg-white/10 p-3 rounded-lg border border-white/10 flex justify-between items-center group hover:bg-white/20 transition-colors">
                                                            <div>
                                                                <p className="font-bold text-sm">{snap.name}</p>
                                                                <p className="text-xs text-blue-200">{new Date(snap.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => navigate(`/app/crearimagen/${patient.id}/${snap.id}`)}
                                                                    className="bg-blue-500 hover:bg-blue-600 p-1.5 rounded-md transition-colors" title="Ver"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteSnapshotId(snap.id)}
                                                                    className="bg-red-500 hover:bg-red-600 p-1.5 rounded-md transition-colors" title="Eliminar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        }
                                    </div >
                                </div >


                            </div>
                        </div>

                        {/* Upcoming Appointments Section */}
                        {
                            appointments.filter(a => a.type === 'virtual' && (a.paymentStatus === 'paid' || a.paid)).length > 0 && (
                                <div className="rounded-2xl shadow-xl p-6 mb-8 text-white overflow-hidden relative" style={{ backgroundColor: '#083c79' }}>
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Video className="text-white" size={24} />
                                            Consultas Virtuales Pendientes
                                        </h3>
                                        <div className="space-y-3">
                                            {appointments
                                                .filter(a => a.type === 'virtual' && (a.paymentStatus === 'paid' || a.paid))
                                                .map(apt => (
                                                    <div key={apt.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Calendar size={16} style={{ color: '#083c79' }} />
                                                                    <span className="font-bold" style={{ color: '#083c79' }}>{apt.date}</span>
                                                                    <Clock size={16} style={{ color: '#083c79' }} className="ml-2" />
                                                                    <span className="font-bold" style={{ color: '#083c79' }}>{apt.time}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    {apt.videoRoomActive ? (
                                                                        <>
                                                                            <CheckCircle size={14} className="text-green-500" />
                                                                            <span className="text-green-600 font-medium">Sala activa - El paciente puede unirse</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Clock size={14} className="text-gray-400" />
                                                                            <span className="text-gray-500">Sala no iniciada</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {apt.videoRoomActive ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setVideoAppointment(apt);
                                                                            setShowVideoModal(true);
                                                                        }}
                                                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105"
                                                                    >
                                                                        <Video size={18} />
                                                                        Entrar a la Sala
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleCreateVideoRoom(apt)}
                                                                        disabled={creatingRoom === apt.id}
                                                                        className="bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 disabled:opacity-70"
                                                                    >
                                                                        {creatingRoom === apt.id ? (
                                                                            <>
                                                                                <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
                                                                                Creando...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Video size={18} />
                                                                                Crear Video Llamada
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                    </div>
                )
            }

            {/* TAB: Consent Manager */}
            {
                activeTab === 'consents' && (
                    <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sidebar: List */}
                        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <FileText size={18} className="text-gray-500" /> Documentos Disponibles
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {CONSENTS_LIST.map(consent => {
                                    const isSigned = signedDocs.includes(consent.id);
                                    return (
                                        <button
                                            key={consent.id}
                                            onClick={() => {
                                                setSelectedConsent(consent);
                                                // Reset signature when switching? Maybe better to keep if unsaved? For now, simple switch.
                                                if (signatureRef) signatureRef.clear();
                                            }}
                                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 group ${selectedConsent?.id === consent.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                                        >
                                            <div className={`mt-0.5 ${selectedConsent?.id === consent.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                {isSigned ? <CheckCircle size={18} className="text-green-500" /> : <Edit size={18} />}
                                            </div>
                                            <div>
                                                <p className={`font-medium ${selectedConsent?.id === consent.id ? 'text-blue-900' : 'text-gray-700'}`}>
                                                    {consent.title}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {isSigned ? 'Firmado el 18/12/2025' : 'Pendiente de firma'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main: Viewer & Signature */}
                        <div className="lg:col-span-2 space-y-6">
                            {selectedConsent ? (
                                <>
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                <Eye size={18} className="text-gray-500" /> Visualizando: {selectedConsent.title}
                                            </h3>
                                            {signedDocs.includes(selectedConsent.id) && (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle size={12} /> Documento Firmado
                                                </span>
                                            )}
                                        </div>
                                        {/* Mock PDF Viewer */}
                                        <div className="h-[400px] bg-gray-100 p-8 overflow-y-auto">
                                            <div className="bg-white shadow-lg min-h-full p-8 mx-auto max-w-2xl">
                                                <div className="text-center mb-8">
                                                    <h1 className="text-xl font-bold uppercase mb-2">Consentimiento Informado</h1>
                                                    <h2 className="text-lg text-gray-600">{selectedConsent.title}</h2>
                                                </div>
                                                <div className="space-y-4 text-gray-800 text-sm leading-relaxed text-justify">
                                                    <p>
                                                        Yo, <strong>{patient.firstName} {patient.lastName}</strong>, identificado con la historia clínica número <strong>{patient.id}</strong>, declaro que he sido informado/a detalladamente sobre el procedimiento.
                                                    </p>
                                                    <p>
                                                        Entiendo los beneficios, riesgos y alternativas del mismo. He tenido la oportunidad de hacer preguntas y éstas han sido respondidas a mi satisfacción.
                                                    </p>
                                                    <p>
                                                        Autorizo al equipo médico a realizar el procedimiento y cualquier intervención adicional que se considere necesaria durante el proceso por mi bienestar.
                                                    </p>
                                                    <p className="mt-8 font-bold">
                                                        Mediante mi firma a continuación, expreso mi consentimiento libre y voluntario.
                                                    </p>
                                                    <div className="mt-12 pt-8 border-t border-gray-300">
                                                        <p className="mb-2">Firmado digitalmente:</p>
                                                        {signedDocs.includes(selectedConsent.id) ? (
                                                            <div className="border-2 border-green-500 border-dashed bg-green-50 p-4 text-center text-green-700 font-bold rounded-xl">
                                                                FIRMA REGISTRADA
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-400 italic">Espacio para firma digital abajo...</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature Pad */}
                                    {!signedDocs.includes(selectedConsent.id) && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4">
                                            <div className="p-4 border-b border-gray-100 bg-blue-50/30">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <PenTool size={18} className="text-blue-600" /> Panel de Firma
                                                </h3>
                                            </div>
                                            <div className="p-6">
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Firme dentro del recuadro punteado usando su mouse o pantalla táctil.
                                                </p>
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 transition-colors cursor-crosshair relative">
                                                    <ReactSignatureCanvas
                                                        ref={(ref) => setSignatureRef(ref)}
                                                        canvasProps={{
                                                            className: 'signature-canvas w-full h-[200px] rounded-xl',
                                                            style: { width: '100%', height: '200px' }
                                                        }}
                                                        backgroundColor="rgba(255,255,255,0)"
                                                    />
                                                    <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none select-none">
                                                        Powered by Medirecord
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-4">
                                                    <button
                                                        onClick={() => signatureRef?.clear()}
                                                        className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                                                    >
                                                        <Trash2 size={16} /> Borrar Firma
                                                    </button>
                                                    <button
                                                        onClick={handleSaveConsent}
                                                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                                    >
                                                        <Save size={18} /> Guardar Documento
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
                                    <div className="p-6 bg-gray-50 rounded-full mb-4">
                                        <FileText size={48} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-600 mb-2">Seleccione un documento</h3>
                                    <p className="max-w-xs mx-auto">
                                        Elija un consentimiento de la lista lateral para visualizarlo y habilitar el panel de firma.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Jitsi Video Modal for Doctor */}
            {
                showVideoModal && videoAppointment && (
                    <JitsiMeetModal
                        isOpen={showVideoModal}
                        onClose={() => {
                            setShowVideoModal(false);
                            setVideoAppointment(null);
                        }}
                        appointmentId={videoAppointment.id}
                        roomName={`HistoriaClinica_${videoAppointment.id}`}
                        displayName="Doctor"
                    />
                )
            }

            <AppointmentModal
                isOpen={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                onSuccess={() => {
                    // Optional: Refresh data if needed, but appointments are not shown here yet
                    alert('Cita agendada correctamente');
                }}
                patients={[patient]}
                preSelectedPatientId={patient.id}
            />


            {/* AI Analysis Modal */}
            {
                showAIModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowAIModal(false)}
                        />

                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 p-6 flex justify-between items-center z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Brain size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Análisis IA</h2>
                                        <p className="text-sm text-gray-500">Asistente Clínico Inteligente</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAIModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
                                            <Loader2 size={48} className="text-indigo-600 animate-spin relative z-10" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analizando Historia Clínica...</h3>
                                        <p className="text-gray-500 max-w-md mx-auto">
                                            Nuestra IA está procesando los antecedentes, consultas y signos vitales del paciente para generar insights médicos.
                                        </p>
                                    </div>
                                ) : aiResult ? (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {/* Summary Card */}
                                        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
                                            <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                                <ClipboardList size={20} className="text-indigo-600" />
                                                Resumen Clínico
                                            </h3>
                                            <p className="text-gray-700 leading-relaxed text-lg">
                                                {aiResult.summary}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Risks Card */}
                                            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm ring-1 ring-orange-50">
                                                <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                                                    <AlertTriangle size={20} className="text-orange-500" />
                                                    Riesgos Detectados
                                                </h3>
                                                <ul className="space-y-3">
                                                    {aiResult.risks?.map((risk: string, i: number) => (
                                                        <li key={i} className="flex gap-3 text-gray-700 bg-orange-50/50 p-3 rounded-xl">
                                                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2.5 flex-shrink-0" />
                                                            <span className="leading-snug">{risk}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Recommendations Card */}
                                            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
                                                <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                                                    <Lightbulb size={20} className="text-emerald-500" />
                                                    Recomendaciones
                                                </h3>
                                                <ul className="space-y-3">
                                                    {aiResult.recommendations?.map((rec: string, i: number) => (
                                                        <li key={i} className="flex gap-3 text-gray-700 bg-emerald-50/50 p-3 rounded-xl">
                                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2.5 flex-shrink-0" />
                                                            <span className="leading-snug">{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                onClick={() => setShowAIModal(false)}
                                                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                                            >
                                                Cerrar Análisis
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Patient Modal */}
            {
                isEditModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-900">Editar Información del Paciente</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="Nombre">
                                    <input
                                        className={INPUT_CLASS}
                                        value={editingPatient.firstName || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Apellido">
                                    <input
                                        className={INPUT_CLASS}
                                        value={editingPatient.lastName || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Fecha de Nacimiento">
                                    <input
                                        type="date"
                                        className={INPUT_CLASS}
                                        value={editingPatient.birthDate || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, birthDate: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Sexo">
                                    <select
                                        className={INPUT_CLASS}
                                        value={editingPatient.sex || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, sex: e.target.value as any })}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </InputGroup>
                                <InputGroup label="Profesión">
                                    <input
                                        className={INPUT_CLASS}
                                        value={editingPatient.profession || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, profession: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Email">
                                    <input
                                        className={INPUT_CLASS}
                                        value={editingPatient.email || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, email: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Teléfono">
                                    <input
                                        className={INPUT_CLASS}
                                        value={editingPatient.phone || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                    />
                                </InputGroup>
                                <InputGroup label="Dirección">
                                    <input
                                        className={INPUT_CLASS}
                                        value={editingPatient.address || ''}
                                        onChange={e => setEditingPatient({ ...editingPatient, address: e.target.value })}
                                    />
                                </InputGroup>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdatePatient}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <Save size={20} /> Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                deleteSnapshotId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-red-600 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-red-500 animate-in zoom-in-95 duration-200">
                            <h3 className="text-white font-bold text-lg mb-6 text-center leading-snug">
                                ¿Estás seguro de que deseas eliminar permanentemente esta imagen?
                            </h3>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => setDeleteSnapshotId(null)}
                                    className="bg-white/90 text-red-600 px-6 py-2 rounded-xl font-bold transition-all shadow-md hover:bg-white hover:shadow-lg hover:scale-105"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await api.deleteSnapshot(patient.id, deleteSnapshotId);
                                            setSnapshots(prev => prev.filter(s => s.id !== deleteSnapshotId));
                                            setDeleteSnapshotId(null);
                                        } catch (e) {
                                            alert('Error al eliminar imagen');
                                            console.error(e);
                                        }
                                    }}
                                    className="bg-white text-red-600 px-6 py-2 rounded-xl font-bold transition-all shadow-md hover:bg-gray-100 hover:shadow-lg hover:scale-105 border-b-4 border-gray-200 hover:border-gray-300"
                                >
                                    Aceptar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Note Modal */}
            {
                showNotesModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <StickyNote className="text-amber-500" /> Agregar Nota
                                </h3>
                                <button onClick={() => setShowNotesModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <textarea
                                value={currentNote}
                                onChange={(e) => setCurrentNote(e.target.value)}
                                placeholder="Escriba una nota sobre este paciente..."
                                className="w-full h-40 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none resize-none text-gray-800"
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowNotesModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    disabled={savingNote || !currentNote.trim()}
                                    className="flex-1 px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} /> {savingNote ? 'Guardando...' : 'Guardar Nota'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Notes Modal */}
            {
                showViewNotesModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Eye className="text-gray-600" /> Notas del Paciente
                                </h3>
                                <button onClick={() => setShowViewNotesModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {((patient as any).notes && (patient as any).notes.length > 0) ? (
                                    <div className="space-y-4">
                                        {(patient as any).notes.slice().reverse().map((note: any) => (
                                            <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative group">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('¿Está seguro de eliminar esta nota?')) return;
                                                        try {
                                                            const existingNotes = (patient as any).notes || [];
                                                            const updatedNotes = existingNotes.filter((n: any) => n.id !== note.id);
                                                            await api.updatePatient(patient.id, { notes: updatedNotes } as any);
                                                            setPatient({ ...patient, notes: updatedNotes } as any);
                                                        } catch (error) {
                                                            console.error('Error deleting note:', error);
                                                            alert('Error al eliminar la nota');
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Eliminar nota"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <p className="text-gray-800 whitespace-pre-wrap pr-8">{note.text}</p>
                                                <p className="text-xs text-amber-600 mt-2">
                                                    {new Date(note.createdAt).toLocaleDateString('es-NI', {
                                                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <StickyNote size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">No hay notas registradas</p>
                                        <button
                                            onClick={() => {
                                                setShowViewNotesModal(false);
                                                setShowNotesModal(true);
                                            }}
                                            className="mt-4 text-amber-600 font-bold hover:underline"
                                        >
                                            + Agregar primera nota
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Endoscopic Control Modal */}
            {
                showEndoscopicModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="text-teal-600" /> Programar Control Endoscópico
                                </h3>
                                <button onClick={() => setShowEndoscopicModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-teal-50 rounded-xl p-4 mb-4 border border-teal-200">
                                <p className="text-sm text-teal-800 flex items-center gap-2">
                                    <Bell size={16} />
                                    <span>Se enviarán recordatorios automáticos al email del paciente según la fecha programada.</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Fecha del Control</label>
                                    <input
                                        type="date"
                                        value={endoscopicDate}
                                        onChange={(e) => setEndoscopicDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none text-gray-800 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">📝 Notas del Doctor</label>
                                    <textarea
                                        value={endoscopicNotes}
                                        onChange={(e) => setEndoscopicNotes(e.target.value)}
                                        placeholder="Indicaciones especiales, preparación, tipo de estudio..."
                                        className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none resize-none text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowEndoscopicModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEndoscopicControl}
                                    disabled={savingEndoscopic || !endoscopicDate}
                                    className="flex-1 px-4 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Bell size={18} /> {savingEndoscopic ? 'Guardando...' : 'Programar Control'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Endoscopic Controls Modal */}
            {
                showViewEndoscopicModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
                            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Activity size={24} /> Controles Endoscópicos
                                </h3>
                                <button onClick={() => setShowViewEndoscopicModal(false)} className="p-2 hover:bg-white/20 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {((patient as any).endoscopicControls && (patient as any).endoscopicControls.length > 0) ? (
                                    <div className="space-y-4">
                                        {(patient as any).endoscopicControls.slice().reverse().map((control: any) => {
                                            const controlDate = new Date(control.controlDate + 'T12:00:00');
                                            const isPast = controlDate < new Date();
                                            return (
                                                <div key={control.id} className={`rounded-xl p-4 border-2 ${isPast ? 'bg-gray-50 border-gray-200' : 'bg-teal-50 border-teal-200'}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className={isPast ? 'text-gray-400' : 'text-teal-600'} size={20} />
                                                            <span className={`font-bold text-lg ${isPast ? 'text-gray-500' : 'text-teal-800'}`}>
                                                                {controlDate.toLocaleDateString('es-NI', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isPast ? 'bg-gray-200 text-gray-600' : 'bg-teal-200 text-teal-800'}`}>
                                                            {isPast ? 'Completado' : 'Pendiente'}
                                                        </span>
                                                    </div>
                                                    {control.notes && (
                                                        <p className="text-gray-700 whitespace-pre-wrap mb-2">{control.notes}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Bell size={12} />
                                                        <span>{control.reminders?.length || 0} recordatorio(s) programados</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-xs text-gray-400">
                                                            Creado el {new Date(control.createdAt).toLocaleDateString('es-NI')}
                                                        </p>
                                                        <button
                                                            onClick={() => handleDeleteEndoscopicControl(control.id)}
                                                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition flex items-center gap-1"
                                                        >
                                                            <Trash2 size={12} /> Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 font-medium">No hay controles programados</p>
                                        <button
                                            onClick={() => {
                                                setShowViewEndoscopicModal(false);
                                                setShowEndoscopicModal(true);
                                            }}
                                            className="mt-4 text-teal-600 font-bold hover:underline"
                                        >
                                            + Programar primer control
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Delete History Confirmation Modal */}
            {
                deleteHistoryId && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Red Header */}
                            <div className="bg-red-600 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-3 rounded-full">
                                        <AlertTriangle size={28} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">⚠️ Eliminar Historia Clínica</h3>
                                        <p className="text-red-100 text-sm">Esta acción es irreversible</p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                                    <p className="text-red-800 font-medium mb-2">
                                        ¿Está seguro de eliminar esta historia clínica?
                                    </p>
                                    <ul className="text-red-700 text-sm space-y-1">
                                        <li>• Se eliminará toda la información de la base de datos</li>
                                        <li>• No se podrá recuperar después de eliminar</li>
                                        <li>• Incluye diagnósticos, tratamientos y comentarios</li>
                                    </ul>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteHistoryId(null)}
                                        disabled={deletingHistory}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!deleteHistoryId) return;
                                            setDeletingHistory(true);
                                            try {
                                                await api.deleteHistory(deleteHistoryId, patientId);
                                                setHistories(prev => prev.filter(h => h.id !== deleteHistoryId));
                                                setDeleteHistoryId(null);
                                                alert('Historia eliminada correctamente');
                                            } catch (error) {
                                                console.error('Error deleting history:', error);
                                                alert('Error al eliminar la historia');
                                            } finally {
                                                setDeletingHistory(false);
                                            }
                                        }}
                                        disabled={deletingHistory}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {deletingHistory ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Eliminando...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                Sí, Eliminar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )
            }
        </div >
    );
};



export default ProfileScreen;
