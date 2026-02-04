import React, { useEffect } from 'react';
import { LoginScreen } from './LoginScreen';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            // Check roles or user data in Firestore later
            // For now, redirect to main app
            navigate('/app');
        }
    }, [currentUser, navigate]);

    const handlePatientAccess = () => {
        navigate('/app/patient/login');
    };

    const roleParam = searchParams.get('role');
    // Map URL param to LoginScreen props (using 'any' to bypass strict 'clinic'|'doctor' type if needed or update type)
    const initialRole = (roleParam === 'doctor' || roleParam === 'assistant') ? roleParam : undefined;

    return (
        <LoginScreen
            onLogin={() => { }}
            onPatientAccess={handlePatientAccess}
            initialRole={initialRole as any}
        />
    );
};
