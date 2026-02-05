/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    MessageSquare, Send, User, Clock, CheckCheck, Search, Plus, ArrowLeft,
    Paperclip, Mic, X, Image as ImageIcon, FileText, Loader2, Play, Pause, Square
} from 'lucide-react';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

export default function ClientChat() {
    const { user } = useUser();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [newChatModalOpen, setNewChatModalOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const userName = user?.fullName || userEmail;

    // Queries
    const convexUser = useQuery(api.users.getByEmail, { email: userEmail });
    const adminConversations = useQuery(api.conversations.listAdminConversations, {}) || [];
    const clientConversations = useQuery(api.conversations.listClientConversations, { client_email: userEmail }) || [];
    const clientsList = useQuery(api.clients.listForChat, {}) || [];

    // Determine if user is admin (using Convex role as source of truth)
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'ceo';
    const conversations = isAdmin ? adminConversations : clientConversations;

    // Query messages
    const messages = useQuery(
        api.conversations.getMessages,
        selectedConversation ? { conversation_id: selectedConversation._id } : "skip"
    ) || [];

    // Mutations
    const sendMessageMutation = useMutation(api.conversations.sendMessage);
    const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);
    const markAsRead = useMutation(api.conversations.markAsRead);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    // Mark as read
    useEffect(() => {
        if (selectedConversation) {
            markAsRead({
                conversation_id: selectedConversation._id,
                reader_email: userEmail
            });
        }
    }, [selectedConversation]);

    // Cleanup audio URL on unmount
    useEffect(() => {
        return () => {
            if (selectedFile?.previewUrl) {
                URL.revokeObjectURL(selectedFile.previewUrl);
            }
        };
    }, []);

    // Timer for recording
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleSend = async () => {
        if ((!messageText.trim() && !selectedFile) || !selectedConversation) return;

        setIsUploading(true);

        try {
            let attachments = [];

            if (selectedFile) {
                // Get upload URL
                const postUrl = await generateUploadUrl();

                // Upload to Convex storage
                const result = await fetch(postUrl, {
                    method: "POST",
                    headers: { "Content-Type": selectedFile.file.type },
                    body: selectedFile.file,
                });

                const { storageId } = await result.json();

                attachments.push({
                    file_url: storageId, // Store storageId, backend/frontend can resolve it
                    file_name: selectedFile.file.name,
                    file_type: selectedFile.isAudio ? 'audio/webm' : selectedFile.file.type,
                });
            }

            await sendMessageMutation({
                conversation_id: selectedConversation._id,
                content: messageText.trim(),
                attachments: attachments.length > 0 ? attachments : undefined,
            });

            setMessageText('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const startNewConversation = async (client) => {
        const conversationId = await getOrCreateConversation({
            client_email: client.email,
            admin_email: userEmail,
            client_name: client.full_name,
            admin_name: userName,
        });

        // Optimistically set selected conversation or wait for query update
        // We'll find it in the list after a brief delay or immediately if it exists
        const conv = adminConversations.find(c => c._id === conversationId)
            || { _id: conversationId, client_name: client.full_name, client_email: client.email }; // Temporary obj

        setSelectedConversation(conv);
        setNewChatModalOpen(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile({
            file,
            previewUrl: URL.createObjectURL(file),
            isImage: file.type.startsWith('image/'),
            isAudio: false
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], "voice-message.webm", { type: 'audio/webm' });
                setSelectedFile({
                    file: audioFile,
                    previewUrl: URL.createObjectURL(audioBlob),
                    isImage: false,
                    isAudio: true
                });
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Impossibile accedere al microfono. Verifica i permessi.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            audioChunksRef.current = [];
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const name = isAdmin ? conv.client_name : conv.admin_name;
        return name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    });

    const filteredClients = clientsList.filter(client =>
        client.full_name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        if (isToday) {
            return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Loading state
    if (convexUser === undefined) {
        return (
            <div className="min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="text-[#f8f9fa]">Caricamento...</div>
            </div>
        );
    }

    // Access control - only Admin/CEO can access ClientChat
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2>
                    <p className="text-[#adb5bd]">Solo gli amministratori possono accedere alla Chat Clienti.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#212529] flex">
            <VerticalMenu />
            <AnimatedBackground />

            <main className="flex-1 ml-16 md:ml-[280px] p-4 md:p-6 relative z-10 overflow-hidden h-screen">
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <MessageSquare className="text-blue-400" size={32} />
                            <h1 className="text-2xl md:text-3xl font-bold text-[#f8f9fa]">
                                {isAdmin ? 'Chat Clienti' : 'Messaggi'}
                            </h1>
                        </div>
                    </div>

                    <Card className="bg-[#343a40]/70 backdrop-blur-xl border-[#495057] flex-1 overflow-hidden flex flex-col">
                        <CardContent className="p-0 flex-1 flex overflow-hidden">
                            {/* Conversations List */}
                            <div className={`w-full md:w-80 border-r border-[#495057] flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
                                <div className="p-4 border-b border-[#495057] space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]" size={18} />
                                        <Input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Cerca conversazione..."
                                            className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                        />
                                    </div>
                                    {isAdmin && (
                                        <Dialog open={newChatModalOpen} onOpenChange={setNewChatModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                    <Plus size={18} className="mr-2" /> Nuova Chat
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa]">
                                                <DialogHeader>
                                                    <DialogTitle>Seleziona Cliente</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6c757d]" size={18} />
                                                        <Input
                                                            value={clientSearchTerm}
                                                            onChange={(e) => setClientSearchTerm(e.target.value)}
                                                            placeholder="Cerca cliente..."
                                                            className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                                        />
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                                                        {filteredClients.map(client => (
                                                            <div
                                                                key={client._id}
                                                                onClick={() => startNewConversation(client)}
                                                                className="p-3 bg-[#495057]/30 hover:bg-[#495057] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                                                        <span className="text-white font-medium">{client.full_name?.charAt(0)}</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-[#f8f9fa]">{client.full_name}</p>
                                                                        <p className="text-xs text-[#6c757d]">{client.email}</p>
                                                                    </div>
                                                                </div>
                                                                <MessageSquare size={16} className="text-[#adb5bd]" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {filteredConversations.length === 0 ? (
                                        <div className="text-center py-12 text-[#6c757d]">
                                            <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
                                            <p className="text-sm">Nessuna conversazione</p>
                                        </div>
                                    ) : (
                                        filteredConversations.map((conv) => (
                                            <button
                                                key={conv._id}
                                                onClick={() => setSelectedConversation(conv)}
                                                className={`w-full p-4 flex items-center gap-3 border-b border-[#495057] hover:bg-[#495057]/50 transition-colors ${selectedConversation?._id === conv._id ? 'bg-[#495057]' : ''
                                                    }`}
                                            >
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shrink-0">
                                                        <User className="text-[#adb5bd]" size={20} />
                                                    </div>
                                                    {((conv.unread_admin > 0 && isAdmin) || (conv.unread_client > 0 && !isAdmin)) && (
                                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#343a40]">
                                                            {isAdmin ? conv.unread_admin : conv.unread_client}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-[#f8f9fa] truncate pr-2">
                                                            {isAdmin ? conv.client_name : conv.admin_name}
                                                        </span>
                                                        <span className="text-[10px] text-[#6c757d] shrink-0">
                                                            {formatDate(conv.last_message_date)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[#adb5bd] truncate">
                                                        {conv.last_message || "Nessun messaggio"}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''} bg-[#212529]/30`}>
                                {selectedConversation ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 border-b border-[#495057] flex items-center gap-3 bg-[#343a40]">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="md:hidden text-[#adb5bd]"
                                                onClick={() => setSelectedConversation(null)}
                                            >
                                                <ArrowLeft size={20} />
                                            </Button>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                                <span className="text-white font-medium">
                                                    {(isAdmin ? selectedConversation.client_name : selectedConversation.admin_name)?.charAt(0)}
                                                </span>
                                            </div>
                                            <div>
                                                <h2 className="font-medium text-[#f8f9fa]">
                                                    {isAdmin ? selectedConversation.client_name : selectedConversation.admin_name}
                                                </h2>
                                                <p className="text-xs text-[#adb5bd]">
                                                    {isAdmin ? selectedConversation.client_email : 'Amministrazione'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {messages.map((msg, index) => {
                                                const isMe = msg.sender_email === userEmail;
                                                return (
                                                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe
                                                            ? 'bg-blue-600/20 border border-blue-500/30 rounded-tr-sm'
                                                            : 'bg-[#495057]/50 border border-[#495057] rounded-tl-sm'
                                                            }`}>
                                                            {/* Text Content */}
                                                            {msg.content && <p className="text-[#f8f9fa] mb-2">{msg.content}</p>}

                                                            {/* Attachments */}
                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                <div className="space-y-2 mb-2">
                                                                    {msg.attachments.map((att, i) => (
                                                                        <div key={i}>
                                                                            {att.file_type.startsWith('image/') ? (
                                                                                <img
                                                                                    // Use direct storage URL if full URL, else construct it (simplified here)
                                                                                    src={att.file_url.startsWith('http') ? att.file_url : `${import.meta.env.VITE_CONVEX_URL}/api/storage/${att.file_url}`}
                                                                                    alt="attachment"
                                                                                    className="max-w-full rounded-lg border border-white/10"
                                                                                />
                                                                            ) : att.file_type.startsWith('audio/') ? (
                                                                                <audio controls className="w-full">
                                                                                    <source src={att.file_url.startsWith('http') ? att.file_url : `${import.meta.env.VITE_CONVEX_URL}/api/storage/${att.file_url}`} type={att.file_type} />
                                                                                </audio>
                                                                            ) : (
                                                                                <a
                                                                                    href={att.file_url.startsWith('http') ? att.file_url : `${import.meta.env.VITE_CONVEX_URL}/api/storage/${att.file_url}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-2 p-2 bg-black/20 rounded hover:bg-black/40 transition-colors"
                                                                                >
                                                                                    <FileText size={16} />
                                                                                    <span className="text-xs underline truncate">{att.file_name}</span>
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                                <span className="text-[10px] text-white/50">
                                                                    {formatDate(msg.created_date)}
                                                                </span>
                                                                {isMe && msg.read && (
                                                                    <CheckCheck size={12} className="text-blue-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input Area */}
                                        <div className="p-4 bg-[#343a40] border-t border-[#495057]">
                                            {/* File Preview */}
                                            {selectedFile && (
                                                <div className="mb-2 p-2 bg-[#495057] rounded-lg flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {selectedFile.isImage ? (
                                                            <img src={selectedFile.previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-[#343a40] rounded flex items-center justify-center">
                                                                {selectedFile.isAudio ? <Mic size={20} /> : <FileText size={20} />}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm text-[#f8f9fa] truncate max-w-[200px]">{selectedFile.file.name}</p>
                                                            <p className="text-xs text-[#adb5bd]">{Math.round(selectedFile.file.size / 1024)} KB</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSelectedFile(null)} className="text-[#adb5bd] hover:text-white">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Recording Status */}
                                            {isRecording && (
                                                <div className="mb-2 p-2 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-between border border-red-500/30">
                                                    <div className="flex items-center gap-2">
                                                        <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full" />
                                                        <span className="font-mono">{formatDuration(recordingTime)}</span>
                                                        <span className="text-xs opacity-70">Registrazione in corso...</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" variant="ghost" onClick={cancelRecording} className="h-8 hover:text-white">
                                                            <X size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                // accept="image/*,application/pdf,audio/*" // Optional restriction
                                                />

                                                {!isRecording ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="text-[#adb5bd] hover:text-[#f8f9fa] hover:bg-[#495057]"
                                                            title="Allega file"
                                                        >
                                                            <Paperclip size={20} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={startRecording}
                                                            className="text-[#adb5bd] hover:text-[#f8f9fa] hover:bg-[#495057]"
                                                            title="Registra vocale"
                                                        >
                                                            <Mic size={20} />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={stopRecording}
                                                        className="bg-red-500 text-white hover:bg-red-600 rounded-full w-10 h-10"
                                                        title="Stop e Invia"
                                                    >
                                                        <Square size={16} fill="currentColor" />
                                                    </Button>
                                                )}

                                                <Input
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                                    placeholder={isRecording ? "Registrazione..." : "Scrivi un messaggio..."}
                                                    className="flex-1 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                                    disabled={isRecording || isUploading}
                                                />

                                                <Button
                                                    onClick={handleSend}
                                                    disabled={(!messageText.trim() && !selectedFile) || isUploading || isRecording}
                                                    className="bg-blue-600 hover:bg-blue-700 w-10 h-10 p-0 rounded-full flex items-center justify-center shrink-0"
                                                >
                                                    {isUploading ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Send size={18} />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-[#6c757d] p-6 text-center">
                                        <div className="w-16 h-16 bg-[#343a40] rounded-full flex items-center justify-center mb-4">
                                            <MessageSquare size={32} className="opacity-50" />
                                        </div>
                                        <h3 className="text-xl font-medium text-[#f8f9fa] mb-2">
                                            Seleziona una conversazione
                                        </h3>
                                        <p className="max-w-md">
                                            {isAdmin
                                                ? "Scegli un cliente dalla lista o inizia una nuova chat per comunicare."
                                                : "Seleziona la chat con l'amministrazione per inviare messaggi."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
