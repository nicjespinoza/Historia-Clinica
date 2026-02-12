import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../context/ChatContext';
import { cn } from '../../lib/utils';

export const VisitorChatWidget = () => {
    const { messages, sendMessage, visitorId, initializeVisitor } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        // Auto-scroll to bottom of messages
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    useEffect(() => {
        // Check if there's a new message from doctor while closed
        if (!isOpen && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.sender !== 'visitor' && !lastMsg.read) {
                setHasUnread(true);
            }
        }
    }, [messages, isOpen]);

    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || isSending) return;

        setIsSending(true);
        const text = inputText;

        try {
            const context = `Página: ${window.document.title} (${window.location.pathname})`;
            await sendMessage(text, 'visitor', context);
            setInputText(''); // Only clear on success
        } catch (error) {
            console.error('[VisitorChatWidget] Error sending:', error);
        } finally {
            setIsSending(false);
        }
    };

    const toggleChat = () => {
        if (!visitorId) {
            initializeVisitor();
        }
        setIsOpen(!isOpen);
        setHasUnread(false);
        setIsMinimized(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[380px] h-[500px] flex flex-col overflow-hidden border border-gray-100 mb-4"
                    >
                        {/* Header */}
                        <div className="bg-cenlae-primary p-4 flex justify-between items-center text-white">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Dr. Milton Mairena</h3>
                                    <p className="text-xs text-white/80">En línea</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <ChevronDown size={18} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
                            {/* Welcome Message */}
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[80%]">
                                    <p className="text-sm text-gray-700">
                                        ¡Hola! 👋 Bienvenido a CENLAE. ¿En qué podemos ayudarte hoy con tu salud digestiva?
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-1 block">
                                        Asistente Virtual
                                    </span>
                                </div>
                            </div>

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex",
                                        msg.sender === 'visitor' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "rounded-2xl p-3 shadow-sm max-w-[80%] text-sm",
                                            msg.sender === 'visitor'
                                                ? "bg-cenlae-primary text-white rounded-tr-none"
                                                : "bg-white border border-gray-100 rounded-tl-none text-gray-700"
                                        )}
                                    >
                                        <p>{msg.text}</p>
                                        <span
                                            className={cn(
                                                "text-[10px] mt-1 block",
                                                msg.sender === 'visitor' ? "text-white/70" : "text-gray-400"
                                            )}
                                        >
                                            {msg.timestamp?.toDate ?
                                                msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                                'Justo ahora'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100">
                            <form
                                onSubmit={handleSend}
                                className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all"
                            >
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isSending}
                                    className="p-2 bg-cenlae-primary text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center min-w-[36px] min-h-[36px]"
                                >
                                    {isSending ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Send size={16} />
                                    )}
                                </button>
                            </form>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">
                                    Respondemos usualmente en unos minutos
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChat}
                className={cn(
                    "bg-cenlae-primary text-white p-4 rounded-full shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all relative flex items-center justify-center",
                    isOpen && !isMinimized ? "bg-red-500 hover:bg-red-600 rotate-90" : ""
                )}
            >
                {isOpen && !isMinimized ? <X size={28} /> : <MessageCircle size={28} />}

                {/* Notification Badge */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                )}
            </motion.button>
        </div>
    );
};
