import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Image as ImageIcon, X, AlertCircle, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { db, storage } from '../../lib/firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    doc,
    setDoc,
    updateDoc,
    where,
    getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { debounce } from '../../lib/cache';

interface Message {
    id: string;
    senderId: string;
    senderName?: string;
    content: string;
    type: 'text' | 'image';
    createdAt: Timestamp | null;
    read?: boolean;
    readAt?: Timestamp | null;
    context?: string;
}

interface TypingStatus {
    [oderId: string]: {
        isTyping: boolean;
        userName: string;
        lastUpdate: Timestamp;
    };
}

interface ChatInterfaceProps {
    patientId: string;
    chatRoomId: string;
    isPremium: boolean;
    currentUserId: string;
    userName?: string;
    otherUserName?: string;
}


export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    patientId,
    chatRoomId,
    isPremium,
    currentUserId,
    userName = "Usuario",
    otherUserName = "Doctor"
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [showPremiumAlert, setShowPremiumAlert] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [typingUserName, setTypingUserName] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Listen to messages in realtime using Firestore onSnapshot
    useEffect(() => {
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const newMessages: Message[] = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as Message));
            setMessages(newMessages);

            // Mark unread messages as read
            for (const msg of newMessages) {
                if (msg.senderId !== currentUserId && !msg.read) {
                    try {
                        const msgRef = doc(db, 'chatRooms', chatRoomId, 'messages', msg.id);
                        await updateDoc(msgRef, {
                            read: true,
                            readAt: serverTimestamp()
                        });
                    } catch (e) {
                        // Ignore errors if user doesn't have permission
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [chatRoomId, currentUserId]);

    // Listen to typing indicator
    useEffect(() => {
        const typingRef = doc(db, 'chatRooms', chatRoomId, 'typing', 'status');

        const unsubscribe = onSnapshot(typingRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                // Check if someone else is typing
                for (const [oderId, status] of Object.entries(data)) {
                    if (oderId !== currentUserId && (status as any).isTyping) {
                        const lastUpdate = (status as any).lastUpdate?.toDate?.();
                        // Only show if update was within last 3 seconds
                        if (lastUpdate && (Date.now() - lastUpdate.getTime()) < 3000) {
                            setIsOtherTyping(true);
                            setTypingUserName((status as any).userName || otherUserName);
                            return;
                        }
                    }
                }
            }
            setIsOtherTyping(false);
        });

        return () => unsubscribe();
    }, [chatRoomId, currentUserId, otherUserName]);

    // Update typing status (debounced)
    const updateTypingStatus = useCallback(
        debounce(async (isTyping: boolean) => {
            try {
                const typingRef = doc(db, 'chatRooms', chatRoomId, 'typing', 'status');
                await setDoc(typingRef, {
                    [currentUserId]: {
                        isTyping,
                        userName,
                        lastUpdate: serverTimestamp()
                    }
                }, { merge: true });
            } catch (e) {
                // Ignore errors
            }
        }, 300),
        [chatRoomId, currentUserId, userName]
    );


    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isSending) return;

        setIsSending(true);
        try {
            const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUserId,
                senderName: userName,
                content: inputValue.trim(),
                type: 'text',
                createdAt: serverTimestamp(),
                read: false
            });
            setInputValue('');
            updateTypingStatus(false);

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error al enviar el mensaje');
        } finally {
            setIsSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isPremium) {
            setShowPremiumAlert(true);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => setShowPremiumAlert(false), 4000);
            return;
        }

        setIsSending(true);
        try {
            // Upload image to Firebase Storage
            const storageRef = ref(storage, `chat/${chatRoomId}/${Date.now()}_${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // Send image message to Firestore
            const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
            await addDoc(messagesRef, {
                senderId: currentUserId,
                content: downloadURL,
                type: 'image',
                createdAt: serverTimestamp()
            });

            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Upload failed', error);
            alert('Error al subir la imagen');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp: Timestamp | null) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-md mx-auto bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden font-sans relative">

            {/* Header */}
            <div className="px-6 py-4 bg-white/50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between backdrop-blur-md z-10">
                <div>
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg">Chat Médico</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-neutral-500 font-medium">Conectado (Firestore)</span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={clsx(
                                "flex w-full",
                                isMe ? "justify-end" : "justify-start"
                            )}
                        >
                            <div className={clsx(
                                "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative",
                                isMe
                                    ? "bg-gradient-to-br from-teal-600 to-blue-600 text-white rounded-br-none"
                                    : "bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 rounded-bl-none"
                            )}>
                                {msg.type === 'image' ? (
                                    <img
                                        src={msg.content}
                                        alt="Shared"
                                        className="rounded-lg max-h-48 object-cover border border-white/20"
                                    />
                                ) : (
                                    <p className="leading-relaxed">{msg.content}</p>
                                )}
                                {msg.context && (
                                    <div className="mt-1 mb-1 p-1 bg-black/5 dark:bg-white/10 rounded text-[10px] italic opacity-80 flex items-start gap-1">
                                        <span className="shrink-0">📍</span>
                                        <span>{msg.context}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className={clsx(
                                        "text-[10px] opacity-70",
                                        isMe ? "text-blue-100" : "text-gray-400"
                                    )}>
                                        {formatTime(msg.createdAt)}
                                    </span>
                                    {/* Read receipts for own messages */}
                                    {isMe && (
                                        <span className="ml-1">
                                            {msg.read ? (
                                                <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5 text-blue-200/50" />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>

                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />

                {/* Typing Indicator */}
                <AnimatePresence>
                    {isOtherTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center gap-2 px-4 py-2"
                        >
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs text-gray-500 italic">
                                {typingUserName} está escribiendo...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Alert Toast */}

            <AnimatePresence>
                {showPremiumAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-20 left-4 right-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border border-red-100 dark:border-red-900/30 p-4 rounded-xl shadow-xl z-20 flex items-start gap-3"
                    >
                        <div className="p-2 bg-red-100 text-red-600 rounded-full shrink-0">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Funcionalidad Premium</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Reserva tu cita y realiza el pago para compartir imágenes médicas de alta resolución con tu doctor.
                            </p>
                        </div>
                        <button onClick={() => setShowPremiumAlert(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">

                    {/* Image Upload Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"
                        title="Adjuntar imagen"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            // Update typing status
                            updateTypingStatus(e.target.value.length > 0);
                        }}
                        onKeyDown={handleKeyPress}
                        onBlur={() => updateTypingStatus(false)}
                        placeholder="Escribe un mensaje..."
                        disabled={isSending}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 disabled:opacity-50"
                    />


                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isSending}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
