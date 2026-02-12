import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { RegisterScreen } from '../../src/screens/auth/RegisterScreen';
import { InitialHistoryScreen } from '../../src/screens/doctor/InitialHistoryScreen';
import { HistoryViewScreen } from '../../src/screens/doctor/HistoryViewScreen';
import { api } from '../../src/lib/api';

// Mock dependencies
vi.mock('../../src/lib/api');
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { email: 'dr@cenlae.com', uid: 'doctor123' },
        hasPermission: () => true
    })
}));

// Mock window.print
window.print = vi.fn();

describe('Full Clinical Flow Integration', () => {
    const mockPatient = {
        id: 'patient123',
        firstName: 'Juan',
        lastName: 'Pérez',
        birthDate: '1990-01-01',
        sex: 'Masculino',
        email: 'juan@test.com'
    };

    const mockHistory = {
        id: 'history456',
        patientId: 'patient123',
        date: new Date().toISOString(),
        motives: { checkup: true }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (api.createPatient as any).mockResolvedValue(mockPatient);
        (api.createHistory as any).mockResolvedValue(mockHistory);
        (api.getPatient as any).mockResolvedValue(mockPatient);
        (api.getHistories as any).mockResolvedValue([mockHistory]);
        // Mock sub and unsubscribe
        (api.subscribeToPatients as any).mockImplementation(() => () => { });
    });

    // Mock Profile Screen to bridge the flow
    const MockProfileScreen = () => (
        <div>
            <h1>Perfil del Paciente</h1>
            <Link to="/app/history-view/patient123/history456">Ver Historia</Link>
        </div>
    );

    it('creates patient, creates history, and generates PDF', async () => {
        render(
            <MemoryRouter initialEntries={['/app/register']}>
                <Routes>
                    <Route path="/app/register" element={<RegisterScreen />} />
                    <Route path="/app/profile/:patientId" element={<MockProfileScreen />} />
                    <Route path="/app/history/:patientId" element={<InitialHistoryScreen />} />
                    <Route path="/app/history-view/:patientId/:historyId" element={<HistoryViewScreen />} />
                </Routes>
            </MemoryRouter>
        );

        // 1. Fill Patient Form
        expect(screen.getByText('Ficha Clínica - Nuevo Paciente')).toBeInTheDocument();

        // Use regex that allows for optional asterisk (required field) and exact start
        fireEvent.change(screen.getByLabelText(/^Nombre\s*\*?$/i), { target: { value: 'Juan' } });
        fireEvent.change(screen.getByLabelText(/^Apellidos\s*\*?$/i), { target: { value: 'Pérez' } });

        // DatePicker should now be accessible by label
        fireEvent.change(screen.getByLabelText(/^Fecha de Nacimiento\s*\*?$/i), { target: { value: '1990-01-01' } });

        fireEvent.change(screen.getByLabelText(/^Sexo\s*\*?$/i), { target: { value: 'Masculino' } });
        fireEvent.change(screen.getByLabelText(/^Email\s*\*?$/i), { target: { value: 'juan@test.com' } });

        // Submit Patient
        const savePatientBtn = screen.getByRole('button', { name: /Guardar y Continuar/i });
        fireEvent.click(savePatientBtn);

        // Verify API call and Navigation to History
        await waitFor(() => {
            expect(api.createPatient).toHaveBeenCalled();
        });

        // 2. Initial History Screen
        // We expect navigation to /app/history/patient123
        // InitialHistoryScreen fetches patient data on load
        await waitFor(() => {
            expect(screen.getByText(/Historia Clínica Inicial/i)).toBeInTheDocument();
        }, { timeout: 5000 });

        expect(api.getPatient).toHaveBeenCalledWith('patient123');

        // Fill History Form
        // Assuming minimal required fields or defaults allow submission
        // We might need to fill "Motivo de Consulta" if validation requires it
        // The snapshot showed checkboxes for motives. 
        // Let's just try to submit, hoping defaults assume empty is valid or we accept alerts.
        // Actually InitialHistoryScreen defaults are mostly empty strings.

        const saveHistoryBtn = screen.getByText(/Guardar/i, { selector: 'button' });
        fireEvent.click(saveHistoryBtn);

        // Verify API call and Navigation to View
        await waitFor(() => {
            expect(api.createHistory).toHaveBeenCalled();
        });

        // 3. Profile Screen (InitialHistoryScreen redirects here after save)
        await waitFor(() => {
            expect(screen.getByText('Perfil del Paciente')).toBeInTheDocument();
        }, { timeout: 3000 });

        // Navigate to History View
        fireEvent.click(screen.getByText('Ver Historia'));

        // 4. History View Screen
        await waitFor(() => {
            expect(screen.getByText('HISTORIA CLÍNICA')).toBeInTheDocument();
        }, { timeout: 5000 });

        // Click PDF (Print)
        console.log("Looking for PDF button...");
        const pdfBtn = screen.getByRole('button', { name: /PDF/i });
        fireEvent.click(pdfBtn);

        expect(window.print).toHaveBeenCalled();
    }, 15000); // Increased timeout
});
