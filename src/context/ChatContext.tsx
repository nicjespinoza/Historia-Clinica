import React from 'react';
import { useChatStore } from '../store/chatStore';

// Deprecated: ChatContext is no longer used
const ChatContext = React.createContext<any>(undefined);

// Bridge Hook: Uses Zustand Store
export const useChat = () => {
    return useChatStore();
};

// Deprecated Provider: Just renders children
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};
