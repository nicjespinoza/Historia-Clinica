import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential // Importamos esto
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export type UserRole = 'admin' | 'doctor' | 'assistant' | 'patient';

// Frontend definitions of permissions (synced with Backend)
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    patient: ["patient:read_own", "appointment:read_own"],
    doctor: ["*"], // Wildcard for super admin
    assistant: [
        "patient:read",
        "patient:create",
        "patient:update",
        "appointment:manage",
        "consult:create_vitals"
    ],
    admin: ["*"]
};

interface AuthContextType {
    currentUser: User | null;
    role: UserRole | null; // New
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<UserCredential>;
    signUp: (email: string, pass: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean; // New
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);

            if (user) {
                // 1. Try to get role from Custom Claims
                const tokenResult = await user.getIdTokenResult();
                let assignedRole = tokenResult.claims.role as UserRole;

                // 2. FALLBACK: Hardcoded emails for immediate testing
                if (!assignedRole) {
                    if (user.email === 'dr@cenlae.com') assignedRole = 'doctor';
                    else if (user.email === 'asistente@cenlae.com') assignedRole = 'assistant';
                    else assignedRole = 'patient';
                }
                setRole(assignedRole);
            } else {
                setRole(null);
            }

            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // Ahora devolvemos el resultado de la promesa (return await)
    const signIn = async (email: string, pass: string) => {
        return await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUp = async (email: string, pass: string) => {
        return await createUserWithEmailAndPassword(auth, email, pass);
    };

    const logout = async () => {
        await signOut(auth);
        setRole(null);
    };

    const hasPermission = (permission: string): boolean => {
        if (!role) return false;

        // Admin/Doctor wildcard
        if (role === 'admin' || role === 'doctor') return true;

        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    };

    const value = {
        currentUser,
        role,
        loading,
        signIn,
        signUp,
        logout,
        hasPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
