import { create } from 'zustand';
import {
    User,
    UserCredential,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export type UserRole = 'admin' | 'doctor' | 'assistant' | 'patient';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    patient: ["patient:read_own", "appointment:read_own"],
    doctor: ["*"],
    assistant: [
        "patient:read",
        "patient:create",
        "patient:update",
        "appointment:manage",
        "consult:create_vitals"
    ],
    admin: ["*"]
};

interface AuthState {
    currentUser: User | null;
    role: UserRole | null;
    loading: boolean;

    // Actions
    signIn: (email: string, pass: string) => Promise<UserCredential>;
    signUp: (email: string, pass: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;

    // Internal actions for the listener
    setUser: (user: User | null, role: UserRole | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    currentUser: null,
    role: null,
    loading: true,

    setUser: (user, role) => set({ currentUser: user, role }),
    setLoading: (loading) => set({ loading }),

    signIn: async (email, pass) => {
        return await signInWithEmailAndPassword(auth, email, pass);
    },

    signUp: async (email, pass) => {
        return await createUserWithEmailAndPassword(auth, email, pass);
    },

    logout: async () => {
        await signOut(auth);
        set({ currentUser: null, role: null });
    },

    hasPermission: (permission: string) => {
        const { role } = get();
        if (!role) return false;
        if (role === 'admin' || role === 'doctor') return true;
        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    }
}));

// Listener setup function (to be called in App.tsx or main.tsx)
export const initializeAuthListener = () => {
    return onAuthStateChanged(auth, async (user) => {
        const { setUser, setLoading } = useAuthStore.getState();

        if (user) {
            // 1. Try to get role from Custom Claims
            const tokenResult = await user.getIdTokenResult();
            let assignedRole = tokenResult.claims.role as UserRole;

            const email = user.email ? user.email.toLowerCase().trim() : '';
            console.log('[AuthStore] Checking role for:', email, 'Current Claim:', assignedRole);

            // FORCE OVERWRITE for specific emails
            if (email === 'dr@cenlae.com') {
                assignedRole = 'doctor';
                console.log('[AuthStore] FORCED ROLE: DOCTOR');
            } else if (email === 'asistente@cenlae.com') {
                assignedRole = 'assistant';
                console.log('[AuthStore] FORCED ROLE: ASSISTANT');
            } else if (!assignedRole) {
                // Default fallback
                assignedRole = 'patient';
                console.warn('[AuthStore] User has no role claim, defaulting to patient. Email:', email);
            }

            setUser(user, assignedRole);
        } else {
            setUser(null, null);
        }
        setLoading(false);
    });
};
