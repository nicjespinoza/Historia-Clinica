import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AssistantLayout } from '../../layouts/AssistantLayout';
import { AssistantHomeScreen } from './AssistantHomeScreen';
import { PatientListScreen } from './PatientListScreen';
import { RegisterScreen } from '../auth/RegisterScreen';
import { AgendaScreen } from './AgendaScreen';
import { ProfileScreen } from './ProfileScreen';
import { ChatScreen } from './ChatScreen';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export const AssistantDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser: firebaseUser, logout } = useAuth();
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (!firebaseUser) {
            navigate('/auth/login');
        } else {
            const userInfo = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Asistente',
                role: 'assistant'
            };
            setCurrentUser(userInfo);
        }
    }, [firebaseUser, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AssistantLayout onLogout={handleLogout} currentUser={currentUser ? currentUser.name : 'Asistente'}>
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
                        <Routes>
                            <Route path="chat" element={<ChatScreen />} />
                            <Route path="home" element={<AssistantHomeScreen />} />
                            <Route path="/" element={<Navigate to="/app/assistant/home" replace />} />

                            {/* Reusing PatientListScreen with Assistant base path */}
                            <Route path="patients" element={<PatientListScreen basePath="/app/assistant" />} />

                            <Route path="register" element={<RegisterScreen />} />
                            <Route path="agenda" element={<AgendaScreen />} />
                            <Route path="chat" element={<ChatScreen />} />

                            <Route path="profile/:patientId" element={<ProfileScreen />} />

                            {/* Placeholder for Notifications */}
                            <Route path="notifications" element={
                                <div className="p-8 text-center">
                                    <h2 className="text-2xl font-bold text-gray-800">Notificaciones</h2>
                                    <p className="text-gray-600">Módulo en desarrollo</p>
                                </div>
                            } />

                            <Route path="*" element={<Navigate to="/app/assistant/home" replace />} />
                        </Routes>
                    </motion.div>
                </AnimatePresence>
            </ErrorBoundary>
        </AssistantLayout>
    );
};
