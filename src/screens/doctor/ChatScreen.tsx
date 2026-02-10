import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
    MessageCircle,
    Search,
    MoreVertical,
    Phone,
    Video,
    Send,
    Paperclip,
    Check,
    CheckCheck,
    Archive,
    Trash2,
    User,
    Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ChatScreen = () => {
    const { activeChats, currentChat, selectChat, messages, sendMessage, markAsRead, loading } = useChat();
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !currentChat) return;

        const text = inputText;
        setInputText('');

        await sendMessage(text, 'doctor'); // Or 'assistant', context handles logic but here it's staff
    };

    const filteredChats = activeChats.filter(chat => {
        try {
            const name = (chat?.visitorName || '').toLowerCase();
            const msg = (chat?.lastMessage || '').toLowerCase();
            const search = (searchTerm || '').toLowerCase();
            return name.includes(search) || msg.includes(search);
        } catch (err) {
            console.error('[ChatScreen] Error filtering chat:', chat, err);
            return false;
        }
    });

    return (
        <div className="flex h-[calc(100vh-theme(spacing.24))] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Sidebar - Chat List */}
            <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/30">
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MessageCircle className="text-blue-600" /> Mensajes
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar conversación..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredChats.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No hay conversaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredChats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => selectChat(chat.id)}
                                    className={cn(
                                        "w-full p-4 flex items-start gap-3 hover:bg-blue-50/50 transition-colors text-left",
                                        currentChat?.id === chat.id ? "bg-blue-50 border-r-4 border-blue-500" : ""
                                    )}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                                            {(chat?.visitorName || 'V').charAt(0).toUpperCase()}
                                        </div>
                                        {chat.status === 'active' && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={cn(
                                                "font-semibold text-sm truncate",
                                                chat.unreadCount > 0 ? "text-gray-900" : "text-gray-700"
                                            )}>
                                                {chat.visitorName}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {chat.lastMessageTime?.toDate ?
                                                    format(chat.lastMessageTime.toDate(), 'HH:mm', { locale: es }) :
                                                    ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={cn(
                                                "text-xs truncate max-w-[140px]",
                                                chat.unreadCount > 0 ? "font-medium text-gray-800" : "text-gray-500"
                                            )}>
                                                {chat.lastMessage}
                                            </p>
                                            {chat.unreadCount > 0 && (
                                                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {currentChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">{currentChat.visitorName}</h2>
                                    <div className="flex items-center gap-2 text-xs text-green-600">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        Visitante Activo
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Archivar">
                                    <Archive size={20} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender !== 'visitor';
                                const showAvatar = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);

                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-3 max-w-[80%]",
                                            isMe ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        {!isMe && (
                                            <div className="w-8 h-8 flex-shrink-0">
                                                {showAvatar && (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
                                                        V
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className={cn(
                                            "group relative p-3 rounded-2xl shadow-sm text-sm",
                                            isMe
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                        )}>
                                            <p className="leading-relaxed">{msg.text}</p>
                                            <div className={cn(
                                                "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                                isMe ? "text-blue-100" : "text-gray-400"
                                            )}>
                                                <span>
                                                    {msg.timestamp?.toDate ?
                                                        format(msg.timestamp.toDate(), 'HH:mm') :
                                                        ''}
                                                </span>
                                                {isMe && (
                                                    msg.read ? <CheckCheck size={12} /> : <Check size={12} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form
                                onSubmit={handleSend}
                                className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 transition-all"
                            >
                                <button type="button" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-200 rounded-full transition-colors">
                                    <Paperclip size={20} />
                                </button>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 py-2 text-sm text-gray-700 placeholder-gray-400"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
                            <MessageCircle size={48} className="text-blue-200" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Mensajería Interna</h3>
                        <p className="max-w-md text-center text-sm">
                            Selecciona una conversación de la lista para comenzar a chatear con los visitantes de la página web.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
