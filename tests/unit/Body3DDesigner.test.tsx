import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Body3DDesigner } from '../../src/screens/doctor/Body3DDesigner';
import { api } from '../../src/lib/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock dependencies
vi.mock('../../src/lib/api', () => ({
    api: {
        getObservations: vi.fn(),
        createObservation: vi.fn(),
        deleteObservation: vi.fn(),
    },
}));

// Mock React Three Fiber and Drei
vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
    useThree: () => ({ camera: { position: [0, 0, 5] }, gl: { domElement: document.createElement('canvas') } }),
    useFrame: vi.fn(),
}));

vi.mock('@react-three/drei', () => ({
    OrbitControls: () => null,
    useGLTF: Object.assign(vi.fn(() => ({
        scene: {
            traverse: vi.fn(),
        },
    })), { preload: vi.fn() }),
    Environment: () => null,
    ContactShadows: () => null,
    Center: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Body3DDesigner', () => {
    const mockObservations = [
        { id: '1', coordinates: { x: 1, y: 1, z: 1 }, note: 'Test Note 1', organ: 'stomach' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (api.getObservations as any).mockResolvedValue(mockObservations);
        // Suppress console errors for R3F intrinsic elements
        vi.spyOn(console, 'error').mockImplementation((msg) => {
            if (msg.includes('is using incorrect casing') || msg.includes('unrecognized in this browser')) return;
            // console.warn(msg); // Optional: keep other errors
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders correctly and fetches observations', async () => {
        render(
            <MemoryRouter initialEntries={['/app/body-3d/123/456']}>
                <Routes>
                    <Route path="/app/body-3d/:patientId/:snapshotId" element={<Body3DDesigner />} />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Visor Anatómico')).toBeInTheDocument();
        expect(screen.getByTestId('canvas')).toBeInTheDocument();

        await waitFor(() => {
            expect(api.getObservations).toHaveBeenCalledWith('123', '456');
        });
    });

    it('displays existing observations', async () => {
        render(
            <MemoryRouter initialEntries={['/app/body-3d/123/456']}>
                <Routes>
                    <Route path="/app/body-3d/:patientId/:snapshotId" element={<Body3DDesigner />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            // Check if the note from mockObservations is displayed
            // The Html mock renders it into the DOM
            expect(screen.getByText('Test Note 1')).toBeInTheDocument();
        });
    });
});
