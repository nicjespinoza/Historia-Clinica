import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { ChatScreen } from './ChatScreen';
import { User } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const DoctorDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser: firebaseUser, logout } = useAuth();
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

                // Set user info from Firebase Auth (instant - no Firestore needed)
                const userInfo = {
                    email: firebaseUser.email || '',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Doctor',
                    role: 'doctor'
                };
                setCurrentUser(userInfo as any);
                localStorage.setItem('currentUser', JSON.stringify(userInfo));

                // Pre-warm cache in background (non-blocking)
                api.getPatients().catch(e => console.warn('Cache pre-warm failed:', e));
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [firebaseUser]);

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('currentUser');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
                {/* Navbar Skeleton */}
                <div className="h-16 bg-white border-b flex items-center px-4 md:px-8 justify-between sticky top-0 z-50">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                </div>

                <div className="flex flex-1">
                    {/* Sidebar Skeleton */}
                    <div className="w-20 lg:w-64 bg-white border-r hidden md:block shrink-0">
                        <div className="p-4 space-y-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" />
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse hidden lg:block" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="flex-1 p-4 md:p-8 bg-gray-50/50">
                        <div className="max-w-7xl mx-auto space-y-8">
                            <div className="h-32 w-full bg-gray-200 rounded-3xl animate-pulse" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-40 w-full bg-gray-200 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DoctorLayout onLogout={handleLogout} currentUser={currentUser ? currentUser.name : 'Doctor'}>
            {/* KEY FIX: key={location.pathname} forces ErrorBoundary to reset on every navigation.
                Without this, once ANY child throws an error, ErrorBoundary stays in error state 
                and ALL subsequent pages appear blank. */}
            <ErrorBoundary key={location.pathname} onError={(err) => console.error('[DoctorDashboard] Route error:', err)}>
                <Routes>
                    <Route path="chat" element={<ChatScreen />} />
                    <Route path="home" element={<DoctorHomeScreen />} />
                    <Route path="/" element={<Navigate to="/app/home" replace />} />

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
                        <SpecialtyHistoryScreen />
                    } />
                    <Route path="consult/:patientId" element={
                        <ConsultScreen />
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

                    {/* Catch-all 404 */}
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
            </ErrorBoundary>
        </DoctorLayout>
    );
};
