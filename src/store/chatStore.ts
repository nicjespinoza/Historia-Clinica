import { create } from 'zustand';
import { db } from '../lib/firebase';
import { PAGE_SIZES } from '../lib/cache';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    setDoc,
    getDoc,
    limit,
    increment,
    where,
    getDocs
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuthStore } from './authStore';

export interface Message {
    id: string;
    text: string;
    sender: 'visitor' | 'doctor' | 'assistant';
    timestamp: any;
    read: boolean;
    context?: string;
}

export interface ChatSession {
    id: string; // visitorId
    visitorName: string;
    lastMessage: string;
    lastMessageTime: any;
    unreadCount: number;
    status: 'active' | 'archived' | 'deleted';
    isRegistered?: boolean;
    lastSeen?: any;
    visitorEmail?: string;
    visitorPhone?: string;
    metadata?: {
        ip?: string;
        country?: string;
        city?: string;
        userAgent?: string;
        authUid?: string;
        [key: string]: any;
    };
}

interface ChatState {
    // Staff Data
    activeChats: ChatSession[];
    currentChat: ChatSession | null;

    // Visitor Data
    visitorId: string | null;

    // Shared Data
    messages: Message[];
    loading: boolean;
    error: string | null;
    heartbeatInterval?: NodeJS.Timeout;

    // Actions
    selectChat: (chatId: string) => void;
    initializeVisitor: () => Promise<string>;
    sendMessage: (text: string, sender: 'visitor' | 'doctor' | 'assistant', context?: string) => Promise<void>;
    markAsRead: (chatId: string) => Promise<void>;

    deleteChat: (chatId: string) => Promise<void>;

    // Setters
    setActiveChats: (chats: ChatSession[]) => void;
    setMessages: (messages: Message[]) => void;
    setLoading: (loading: boolean) => void;
    setVisitorId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    activeChats: [],
    currentChat: null,
    visitorId: null,
    messages: [],
    loading: false,
    error: null,
    heartbeatInterval: undefined,

    setActiveChats: (activeChats) => set({ activeChats }),
    setMessages: (messages) => set({ messages }),
    setLoading: (loading) => set({ loading }),
    setVisitorId: (visitorId) => set({ visitorId }),

    selectChat: (chatId) => {
        const { activeChats, markAsRead } = get();
        const chat = activeChats.find(c => c.id === chatId);
        if (chat) {
            set({ currentChat: chat });
            markAsRead(chatId);
        }
    },

    markAsRead: async (chatId) => {
        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, { unreadCount: 0 });
        } catch (error) {
            console.error('[ChatStore] Error marking as read:', error);
        }
    },

    deleteChat: async (chatId) => {
        try {
            // Delete messages subcollection first (optional but good practice for cleanup, 
            // though client SDK can't delete collections easily without cloud functions. 
            // We'll just delete the chat doc for now, orphan messages will remain unless a function cleans them.
            // For a "hide" effect, deleting the chat doc is enough for the list).

            // NOTE: To properly delete subcollections from client, we need to delete docs passed one by one.
            // For now, let's just delete the main doc to remove it from the list.
            await import('firebase/firestore').then(mod => mod.deleteDoc(mod.doc(db, 'chats', chatId)));

            // Update local state immediately for responsiveness
            const { activeChats, currentChat } = get();
            set({
                activeChats: activeChats.filter(c => c.id !== chatId),
                currentChat: currentChat?.id === chatId ? null : currentChat
            });
            toast.success('Chat eliminado');
        } catch (error) {
            console.error('[ChatStore] Error deleting chat:', error);
            toast.error('Error al eliminar chat');
        }
    },

    initializeVisitor: async () => {
        try {
            const { signInAnonymously, getAuth } = await import('firebase/auth');
            const auth = getAuth();
            let currentUser = auth.currentUser;

            let id = '';
            let name = '';
            let isRegistered = false;

            // 1. Check Identity
            if (currentUser && !currentUser.isAnonymous) {
                // Registered Patient
                id = currentUser.uid;
                isRegistered = true;

                // Try to get FULL NAME from 'patients' collection
                try {
                    const patientsRef = collection(db, 'patients');
                    const q = query(patientsRef, where('email', '==', currentUser.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const data = querySnapshot.docs[0].data();
                        name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
                    }
                } catch (e) {
                    console.warn('Could not fetch patient name:', e);
                }

                // Fallback if name is still empty
                if (!name) {
                    name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Paciente';
                }
            } else {
                // Anonymous Visitor
                id = localStorage.getItem('cenlae_visitor_id') || '';
                if (!id) {
                    id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2);
                    localStorage.setItem('cenlae_visitor_id', id);
                }

                if (!currentUser) {
                    try {
                        await signInAnonymously(auth);
                        currentUser = auth.currentUser;
                    } catch (authError: any) {
                        console.error('Auth Error:', authError);
                    }
                }
                name = `Visitante ${id.slice(0, 4)}`;
            }

            set({ visitorId: id });

            // 2. Get IP/Location Data
            let locationData = { ip: '', country: '', city: '' };
            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    locationData = {
                        ip: data.ip || 'Unknown',
                        country: data.country_name || 'Unknown',
                        city: data.city || 'Unknown'
                    };
                }
            } catch (e) {
                console.warn('[ChatStore] Could not fetch location data');
            }

            // 3. Upsert Chat Document with simplified logic
            // Use setDoc with merge: true to handle both create and update
            const chatRef = doc(db, 'chats', id);

            await setDoc(chatRef, {
                visitorName: name, // Always update name if user logs in
                isRegistered: isRegistered,
                lastSeen: serverTimestamp(),
                // Keep these if it's new, otherwise ignore? No, merge handles it.
                // But we don't want to overwrite lastMessage if it exists.
                // We'll update metadata and status.
                status: 'active',
                metadata: {
                    visitorId: id,
                    authUid: currentUser?.uid,
                    ...locationData,
                    userAgent: navigator.userAgent
                }
            }, { merge: true });

            // Ensure critical fields exist if it's a new document
            // setDoc with merge won't delete existing fields, but might not create missing ones if not specified.
            // Actually setDoc with merge acts like upsert.
            // But we want to set unreadCount only if document is new.
            const chatSnap = await getDoc(chatRef);
            if (!chatSnap.data()?.lastMessageTime) {
                await updateDoc(chatRef, {
                    lastMessage: 'Iniciando chat...',
                    lastMessageTime: serverTimestamp(),
                    unreadCount: 0
                });
            }

            // 4. Start Heartbeat to keep status "Online"
            // Clear existing interval if set to avoid duplicates
            const currentInterval = (get() as any).heartbeatInterval;
            if (currentInterval) clearInterval(currentInterval);

            const interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    // Silent update
                    updateDoc(chatRef, { lastSeen: serverTimestamp() }).catch(() => { });
                }
            }, 60000); // Update every minute

            set({ heartbeatInterval: interval } as any);

            return id;
        } catch (error) {
            console.error('[ChatStore] Error initializing visitor:', error);
            throw error;
        }
    },

    sendMessage: async (text, sender, context) => {
        const { visitorId, currentChat, initializeVisitor } = get();
        const { role } = useAuthStore.getState();
        const isStaff = role === 'doctor' || role === 'assistant' || role === 'admin';

        try {
            const targetId = isStaff ? currentChat?.id : visitorId;

            if (!targetId && !isStaff) {
                const newId = await initializeVisitor();
                await sendMessageInternal(newId, text, sender, context);
                return;
            }

            if (targetId) {
                await sendMessageInternal(targetId, text, sender, context);
            } else {
                console.warn('[ChatStore] Cannot send message: No target chat selected');
            }
        } catch (error) {
            console.error('[ChatStore] Error sending message:', error);
            toast.error('Error al enviar mensaje');
        }
    }
}));

// Helper function outside the store to avoid clutter
const sendMessageInternal = async (chatId: string, text: string, sender: string, context?: string) => {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        sender,
        timestamp: serverTimestamp(),
        read: false,
        context: context || null // Save Page Context
    });

    const chatRef = doc(db, 'chats', chatId);
    const updates: any = {
        lastMessage: text,
        lastMessageTime: serverTimestamp()
    };

    if (sender === 'visitor') {
        updates.unreadCount = increment(1);
    }

    await setDoc(chatRef, updates, { merge: true });
};

// --- Listeners ---

let staffUnsubscribe: (() => void) | null = null;
let messagesUnsubscribe: (() => void) | null = null;

export const initializeChatListeners = () => {
    // Handler logic extracted to run both immediately and on subscription
    const handleAuthChange = (state: ChatState | any) => {
        const { role, currentUser } = state;
        const isStaff = role === 'doctor' || role === 'assistant' || role === 'admin';

        // --- STAFF LISTENER ---
        if (isStaff && !staffUnsubscribe) {

            // Sort by lastMessageTime DESC (Newest on top)
            const q = query(
                collection(db, 'chats'),
                orderBy('lastMessageTime', 'desc')
            );

            staffUnsubscribe = onSnapshot(q, (snapshot) => {
                const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatSession[];
                useChatStore.getState().setActiveChats(chats);

                // Toast logic for new messages
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        const data = change.doc.data() as ChatSession;
                        const { activeChats, selectChat, currentChat } = useChatStore.getState();
                        const prevData = activeChats.find(c => c.id === change.doc.id);

                        if (data.unreadCount > 0 && data.unreadCount > (prevData?.unreadCount || 0)) {
                            if (currentChat?.id !== change.doc.id) {
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
            });
        } else if (!isStaff && staffUnsubscribe) {

            staffUnsubscribe();
            staffUnsubscribe = null;
            useChatStore.getState().setActiveChats([]);
        }
    };

    // 1. Run immediately with current state
    handleAuthChange(useAuthStore.getState());

    // 2. Subscribe to changes
    return useAuthStore.subscribe(handleAuthChange);
};

// Specialized listener for messages that subscribes to store changes
export const initializeMessageListener = () => {
    return useChatStore.subscribe((state, prevState) => {
        const { currentChat, visitorId } = state;
        const { role } = useAuthStore.getState();
        const isStaff = role === 'doctor' || role === 'assistant' || role === 'admin';

        const targetId = isStaff ? currentChat?.id : visitorId;
        const prevTargetId = isStaff ? prevState.currentChat?.id : prevState.visitorId;

        if (targetId === prevTargetId) return;

        if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
        }

        if (!targetId) {
            useChatStore.getState().setMessages([]);
            return;
        }


        const q = query(
            collection(db, 'chats', targetId, 'messages'),
            orderBy('timestamp', 'asc'),
            // Cost Optimization: Limit initial message load
            limit(PAGE_SIZES.messages)
        );

        messagesUnsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
            useChatStore.getState().setMessages(msgs);

            // Mark as read if staff
            if (isStaff && useChatStore.getState().currentChat?.id === targetId) {
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.sender === 'visitor' && !lastMsg.read) {
                    useChatStore.getState().markAsRead(targetId);
                }
            }
        });
    });
};
