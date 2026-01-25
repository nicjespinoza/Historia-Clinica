import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DoctorLayout } from '../../layouts/DoctorLayout';
import { PatientListScreen } from './PatientListScreen';
import { RegisterScreen } from '../auth/RegisterScreen';
import { AgendaScreen } from './AgendaScreen';
import { ProfileScreen } from './ProfileScreen';
import { InitialHistoryScreen } from './InitialHistoryScreen';
import { HistoryViewScreen } from './HistoryViewScreen';
import { SpecialtyHistoryScreen } from './SpecialtyHistoryScreen';
import { ConsultScreen } from './ConsultScreen';
import { ReportScreen } from './ReportScreen';
import { Body3DDesigner } from './Body3DDesigner';
import { DoctorHomeScreen } from './DoctorHomeScreen';
import { Patient, InitialHistory, SubsequentConsult, ModalContent, User } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const DoctorDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser: firebaseUser, logout } = useAuth();
    // const [patients, setPatients] = useState<Patient[]>([]);
    // Optimized: removed global histories/consults state that caused massive downloads
    // const [histories, setHistories] = useState<InitialHistory[]>([]);
    // const [consults, setConsults] = useState<SubsequentConsult[]>([]);
    const [modalContent, setModalContent] = useState<ModalContent | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check Firebase authentication
    useEffect(() => {
        if (!firebaseUser) {
            navigate('/app/doctor/login');
        }
    }, [firebaseUser, navigate]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (!firebaseUser) {
                setLoading(false);
                return;
            }
            try {
                // Clear any corrupted localStorage data
                localStorage.removeItem('patients');
                localStorage.removeItem('histories');
                localStorage.removeItem('consults');

                // Optimized: Only fetch patients list. Histories/Consults are loaded on demand.
                const [p] = await Promise.all([
                    api.getPatients()
                ]);

                // Filter out corrupted patients (those without valid IDs)
                const validPatients = p.filter(patient => patient.id && patient.id.trim() !== '');



                console.log('Loaded patients from Firestore:', validPatients.length);
                if (p.length !== validPatients.length) {
                    console.warn(`Filtered out ${p.length - validPatients.length} corrupted patient(s) with empty IDs`);
                }

                // setPatients(validPatients);
                // setHistories(h); // Optimization: removed
                // setConsults(c);  // Optimization: removed

                // Set user info from Firebase Auth
                const userInfo = {
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Doctor',
                    role: 'doctor'
                };
                setCurrentUser(userInfo as any);
                localStorage.setItem('currentUser', JSON.stringify(userInfo));
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [firebaseUser]);

    // Load initial data - OPTIMIZED: Remove blocking global fetch
    // Components verify their own data requirements

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('currentUser');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <DoctorLayout onLogout={handleLogout} currentUser={currentUser ? currentUser.name : 'Doctor'}>

            <ErrorBoundary>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="h-full w-full"
                    >
                        <Routes location={location}>
                            <Route path="/" element={<Navigate to="/app/home" replace />} />

                            {/* NEW: Doctor Home Dashboard */}
                            <Route path="home" element={<DoctorHomeScreen />} />

                            {/* Patient List now manages its own data fetching */}
                            <Route path="patients" element={<PatientListScreen />} />
                            <Route path="patients-specialty" element={<PatientListScreen />} />

                            <Route path="register" element={<RegisterScreen />} />
                            <Route path="agenda" element={<AgendaScreen />} />

                            {/* Profile now manages its own data fetching */}
                            <Route path="profile/:patientId" element={<ProfileScreen />} />

                            {/* RESTORED: Legacy History View */}
                            <Route path="historiaclinica2025/:patientId" element={
                                <React.Suspense fallback={<div>Cargando...</div>}>
                                    {React.createElement(React.lazy(() => import('./LegacyHistoryScreen').then(module => ({ default: module.LegacyHistoryScreen }))))}
                                </React.Suspense>
                            } />

                            {/* Consolidated Consult View */}
                            <Route path="consult-view/:patientId/:consultId" element={
                                <React.Suspense fallback={<div>Cargando...</div>}>
                                    {/* Lazy loaded to avoid circular dependencies if any */}
                                    {React.createElement(React.lazy(() => import('./ConsultViewScreen').then(module => ({ default: module.ConsultViewScreen }))))}
                                </React.Suspense>
                            } />

                            <Route path="history/:patientId" element={
                                <InitialHistoryScreen />
                            } />
                            <Route path="history-view/:patientId/:historyId" element={
                                <HistoryViewScreen />
                            } />
                            <Route path="history-specialty/:patientId" element={
                                <SpecialtyHistoryScreen /> // Updated to self-managed
                            } />
                            <Route path="consult/:patientId" element={
                                <ConsultScreen /> // Updated to self-managed
                            } />
                            <Route path="createsubsecuente/:patientId" element={
                                <React.Suspense fallback={<div>Cargando...</div>}>
                                    {React.createElement(React.lazy(() => import('./CreateSubsecuenteScreen').then(module => ({ default: module.CreateSubsecuenteScreen }))))}
                                </React.Suspense>
                            } />

                            <Route path="reports" element={
                                <ReportScreen />
                            } />
                            <Route path="body-designer" element={<Body3DDesigner />} />
                            <Route path="crearimagen/:patientId" element={<Body3DDesigner />} />
                            <Route path="crearimagen/:patientId/:snapshotId" element={<Body3DDesigner />} />

                            {/* DEBUG: Show 404 instead of redirect to catch routing errors */}
                            <Route path="*" element={
                                <div className="p-8 text-center">
                                    <h2 className="text-2xl font-bold text-gray-800">404 - Página no encontrada</h2>
                                    <p className="text-gray-600 mb-4">La ruta solicitada no existe dentro del Dashboard.</p>
                                    <p className="text-sm font-mono text-gray-400 mb-6">Path: {window.location.pathname}</p>
                                    <button
                                        onClick={() => navigate('/app/patients')}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700"
                                    >
                                        Volver al Inicio
                                    </button>
                                </div>
                            } />
                        </Routes>
                    </motion.div>
                </AnimatePresence>
            </ErrorBoundary>
        </DoctorLayout>
    );
};
