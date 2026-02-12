import '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock HTMLCanvasElement.prototype.getContext for 3D tests
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({
        currentUser: null,
        onAuthStateChanged: vi.fn(),
    })),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    initializeFirestore: vi.fn(() => ({})),
    persistentLocalCache: vi.fn(),
    persistentMultipleTabManager: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    Timestamp: {
        now: () => ({ toDate: () => new Date(), toMillis: () => Date.now() }),
        fromDate: (date: Date) => ({ toDate: () => date, toMillis: () => date.getTime() }),
    },
}));

vi.mock('firebase/app-check', () => ({
    initializeAppCheck: vi.fn(),
    ReCaptchaEnterpriseProvider: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(),
    httpsCallable: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));
