import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    setDoc,
    getDoc,
    limit,
    increment
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Message {
    id: string;
    text: string;
    sender: 'visitor' | 'doctor' | 'assistant';
    timestamp: any;
    read: boolean;
}

interface ChatSession {
    id: string; // visitorId
    visitorName: string;
    lastMessage: string;
    lastMessageTime: any;
    unreadCount: number;
    status: 'active' | 'archived';
    visitorEmail?: string;
    visitorPhone?: string;
}

interface ChatContextType {
    // For Doctor/Assistant
    activeChats: ChatSession[];
    currentChat: ChatSession | null;
    selectChat: (chatId: string) => void;

    // For Visitor
    visitorId: string | null;
    initializeVisitor: () => Promise<string>;

    // Shared
    messages: Message[];
    sendMessage: (text: string, sender: 'visitor' | 'doctor' | 'assistant') => Promise<void>;
    markAsRead: (chatId: string) => Promise<void>;
    loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, role } = useAuth();
    const isStaff = role === 'doctor' || role === 'assistant' || role === 'admin';

    const [activeChats, setActiveChats] = useState<ChatSession[]>([]);
    const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const activeChatsRef = useRef<ChatSession[]>([]);
    const currentChatIdRef = useRef<string | null>(null);

    // Sync refs with state
    useEffect(() => {
        activeChatsRef.current = activeChats;
    }, [activeChats]);

    useEffect(() => {
        currentChatIdRef.current = currentChat?.id || null;
    }, [currentChat]);

    const markAsRead = useCallback(async (chatId: string) => {
        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                unreadCount: 0
            });
        } catch (error) {
            console.error('[ChatContext] Error marking as read:', error);
        }
    }, []);

    const initializeVisitor = useCallback(async () => {
        try {
            let id = localStorage.getItem('cenlae_visitor_id');
            if (!id) {
                id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
                localStorage.setItem('cenlae_visitor_id', id);
            }
            setVisitorId(id);

            const chatRef = doc(db, 'chats', id);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                await setDoc(chatRef, {
                    visitorName: `Visitante ${id.slice(0, 4)}`,
                    lastMessage: 'Iniciando chat...',
                    lastMessageTime: serverTimestamp(),
                    unreadCount: 0,
                    status: 'active'
                });
            }
            return id;
        } catch (error) {
            console.error('[ChatContext] Error initializing visitor:', error);
            throw error;
        }
    }, []);

    const selectChat = useCallback((chatId: string) => {
        const chat = activeChatsRef.current.find(c => c.id === chatId);
        if (chat) {
            setCurrentChat(chat);
            markAsRead(chatId);
        }
    }, [markAsRead]);

    const sendMessageInternal = useCallback(async (chatId: string, text: string, sender: 'visitor' | 'doctor' | 'assistant') => {
        try {
            console.log(`[ChatContext] Sending message to chat ${chatId} from ${sender}`);
            // 1. Add message to subcollection
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
                text,
                sender,
                timestamp: serverTimestamp(),
                read: false
            });
            console.log('[ChatContext] Message added to subcollection');

            // 2. Update chat session metadata
            const chatRef = doc(db, 'chats', chatId);
            const updates: any = {
                lastMessage: text,
                lastMessageTime: serverTimestamp()
            };

            if (sender === 'visitor') {
                // Use increment to update count atomically
                updates.unreadCount = increment(1);
            }

            // Use setDoc with merge: true to ensure document exists (creates it if missing)
            await setDoc(chatRef, updates, { merge: true });
            console.log('[ChatContext] Chat document updated/created successfully');
        } catch (error) {
            console.error('[ChatContext] Error in sendMessageInternal:', error);
            throw error;
        }
    }, []);

    const sendMessage = useCallback(async (text: string, sender: 'visitor' | 'doctor' | 'assistant') => {
        try {
            console.log('[ChatContext] sendMessage calling with:', { text, sender });
            const targetId = isStaff ? currentChat?.id : visitorId;
            console.log('[ChatContext] targetId determined as:', targetId);

            if (!targetId && !isStaff) {
                console.log('[ChatContext] No targetId for visitor, initializing...');
                const newId = await initializeVisitor();
                await sendMessageInternal(newId, text, sender);
                return;
            }

            if (targetId) {
                await sendMessageInternal(targetId, text, sender);
            } else {
                console.warn('[ChatContext] Cannot send message: No target chat selected (staff) or visitor not initialized');
            }
        } catch (error) {
            console.error('[ChatContext] Error in sendMessage:', error);
            toast.error('Error al enviar el mensaje. Revisa tu conexión.');
        }
    }, [isStaff, currentChat, visitorId, initializeVisitor, sendMessageInternal]);

    // Initial visitor setup
    useEffect(() => {
        const checkVisitor = () => {
            const storedId = localStorage.getItem('cenlae_visitor_id');
            if (storedId) {
                setVisitorId(storedId);
            }
        };
        checkVisitor();
    }, []);

    // STAFF: Listen to all active chats and handle notifications
    useEffect(() => {
        if (!isStaff) return;

        console.log('[ChatContext] Setting up staff listener for /chats (no order)...');
        const q = query(
            collection(db, 'chats')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                console.log(`[ChatContext] Staff snapshot update: ${snapshot.size} docs`);
                const chats = snapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log(`[ChatContext] Raw chat doc ${doc.id}:`, data);
                    return {
                        id: doc.id,
                        ...data
                    };
                }) as ChatSession[];

                setActiveChats(chats);
                setLoading(false);

                // Check for new unread messages to trigger toast
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        const data = change.doc.data() as ChatSession;
                        // Use Ref to avoid infinite loop
                        const prevData = activeChatsRef.current.find(c => c.id === change.doc.id);

                        if (data.unreadCount > 0 && data.unreadCount > (prevData?.unreadCount || 0)) {
                            // Use ref to check if we are already viewing it
                            if (currentChatIdRef.current !== change.doc.id) {
                                toast.info(`Nuevo mensaje de ${data.visitorName}`, {
                                    description: data.lastMessage,
                                    action: {
                                        label: 'Responder',
                                        onClick: () => {
                                            selectChat(change.doc.id);
                                            const basePath = role === 'assistant' ? '/app/assistant' : '/app';
                                            window.location.href = `${basePath}/chat`;
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            },
            (error) => {
                console.error('[ChatContext] Staff listener error:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [isStaff, role, selectChat]); // No more currentChat.id or activeChats!

    // CONSOLIDATED MESSAGES LISTENER: Handles both Visitor (own chat) and Staff (current selected chat)
    useEffect(() => {
        const targetId = isStaff ? currentChat?.id : visitorId;
        console.log('[ChatContext] Messages listener effect. isStaff:', isStaff, 'targetId:', targetId);

        if (!targetId) {
            console.log('[ChatContext] No targetId, clearing messages');
            setMessages([]);
            return;
        }

        console.log('[ChatContext] Setting up messages listener for chatId:', targetId);
        const q = query(
            collection(db, 'chats', targetId, 'messages'),
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`[ChatContext] Messages update for ${targetId}: ${snapshot.size} messages`);
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);

            // Auto-mark as read if staff is viewing OR visitor is viewing receipts (future)
            if (isStaff && currentChat?.id === targetId) {
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.sender === 'visitor' && !lastMsg.read) {
                    markAsRead(targetId);
                }
            }
        }, (error) => {
            console.error(`[ChatContext] Messages listener error for ${targetId}:`, error);
        });

        return () => {
            console.log('[ChatContext] Cleaning up messages listener for:', targetId);
            unsubscribe();
        };
    }, [isStaff, currentChat?.id, visitorId, markAsRead]);

    // VISITOR: Mark messages as read when visitor opens chat widget
    useEffect(() => {
        if (!isStaff && visitorId && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.sender !== 'visitor' && !lastMsg.read) {
                // Mark doctor's message as read by visitor
                // In a real app we might track doctor_read vs visitor_read separately
                // For now, simplicity: 'read' usually implies Staff read it. 
                // Let's assume 'read' status in DB is primarily for Staff consumption (unread count).
                // Visitor doesn't really need a 'read' receipt for now in this MVP spec.
            }
        }
    }, [isStaff, visitorId, messages]);


    return (
        <ChatContext.Provider value={{
            activeChats,
            currentChat,
            selectChat,
            visitorId,
            initializeVisitor,
            messages,
            sendMessage,
            markAsRead,
            loading
        }}>
            {children}
        </ChatContext.Provider>
    );
};
