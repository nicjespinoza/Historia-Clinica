import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CenlaePage from './screens/cenlae/CenlaePage';

// Lazy Loaded Components for Critical Performance Optimization
const LandingPage = lazy(() => import('./screens/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./screens/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const DoctorDashboard = lazy(() => import('./screens/doctor/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const PatientPortalRoutes = lazy(() => import('./screens/patient/PatientPortalRoutes').then(m => ({ default: m.PatientPortalRoutes })));
const PaymentCallbackScreen = lazy(() => import('./screens/shared/PaymentCallbackScreen').then(m => ({ default: m.PaymentCallbackScreen })));
const AssistantDashboard = lazy(() => import('./screens/doctor/AssistantDashboard').then(m => ({ default: m.AssistantDashboard })));
const DoctorProfilePage = lazy(() => import('./screens/cenlae/DoctorProfilePage').then(m => ({ default: m.DoctorProfilePage })));
const SurgicalProceduresPage = lazy(() => import('./screens/cenlae/SurgicalProceduresPage').then(m => ({ default: m.SurgicalProceduresPage })));
const EndoscopicProceduresPage = lazy(() => import('./screens/cenlae/EndoscopicProceduresPage').then(m => ({ default: m.EndoscopicProceduresPage })));
const ContactPage = lazy(() => import('./screens/cenlae/ContactPage').then(m => ({ default: m.ContactPage })));
const StaffPortalScreen = lazy(() => import('./screens/auth/StaffPortalScreen').then(m => ({ default: m.StaffPortalScreen })));

// Loading Component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

import { NetworkStatus } from './components/ui/NetworkStatus';

const App = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <NetworkStatus />
            <Routes>
                {/* Public Routes - Eager Loaded */}
                <Route path="/" element={<CenlaePage />} />

                {/* Lazy Loaded Routes */}
                <Route path="/webdesignje" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/perfil" element={<DoctorProfilePage />} />
                <Route path="/servicios/quirurgicos" element={<SurgicalProceduresPage />} />
                <Route path="/servicios/endoscopicos" element={<EndoscopicProceduresPage />} />
                <Route path="/contacto" element={<ContactPage />} />

                {/* Doctor Login Route - Now Points to Staff Portal */}
                <Route path="/app/doctor/login" element={<StaffPortalScreen />} />
                <Route path="/app/staff" element={<StaffPortalScreen />} />
                <Route path="/auth/login" element={<AuthPage />} /> {/* Legacy/Fallback */}

                {/* Payment Callback Route (for 3DS return) */}
                <Route path="/app/payment/callback" element={<PaymentCallbackScreen />} />

                {/* Patient Portal Routes */}
                <Route path="/app/patient/*" element={<PatientPortalRoutes />} />

                {/* Assistant Dashboard Routes */}
                <Route path="/app/assistant/*" element={<AssistantDashboard />} />

                {/* Doctor Dashboard Routes (Protected) */}
                <Route path="/app/*" element={<DoctorDashboard />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default App;
