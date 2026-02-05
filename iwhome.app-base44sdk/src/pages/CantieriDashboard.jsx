/// <reference types="vite/client" />
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import {
    Search, Plus, Building, Calendar, CheckCircle, Clock,
    HardHat, X, Users, MessageSquare, ChevronRight, Send, Paperclip,
    GripVertical, ArrowRight, Mic, MicOff, Image, FileText, Play, Pause,
    Volume2, UserPlus, Mail, Loader2, ClipboardList, Check, Trash2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

// Kanban phases (3 phases only)
const KANBAN_PHASES = [
    { id: 'in_lavorazione', label: 'In Lavorazione', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    { id: 'posa_in_opera', label: 'Posa In Opera', color: 'bg-purple-500', textColor: 'text-purple-400' },
    { id: 'completato', label: 'Completato', color: 'bg-green-500', textColor: 'text-green-400' },
];

export default function CantieriDashboard() {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedCantiere, setSelectedCantiere] = useState(null);
    const [activeTab, setActiveTab] = useState('kanban');
    const [detailTab, setDetailTab] = useState('details');
    const [newCantiere, setNewCantiere] = useState({
        nome_cantiere: '',
        cliente: '',
        client_id: null,
        indirizzo: '',
        status: 'in_lavorazione',
        valore_contratto: '',
        valore_progetto: '',
    });

    // Drag state
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverPhase, setDragOverPhase] = useState(null);

    // Team invite state
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteSending, setInviteSending] = useState(false);

    // Message state
    const [newMessage, setNewMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const recordingIntervalRef = useRef(null);



    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // Queries
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];
    const clientsList = useQuery(api.clients.list) || []; // For client dropdown
    const cantiereTeam = useQuery(
        api.cantieri.getCantiereTeam,
        selectedCantiere ? { cantiere_id: selectedCantiere._id } : "skip"
    ) || [];

    // Get messages for selected cantiere
    const messages = useQuery(
        api.chat.getChannelMessages,
        selectedCantiere ? { channel_id: selectedCantiere._id } : "skip"
    ) || [];

    // Mutations
    const createCantiereMutation = useMutation(api.cantieri.createCantiere);
    const updateCantiereMutation = useMutation(api.cantieri.updateCantiere);
    const sendMessageMutation = useMutation(api.chat.sendCantiereMessage);
    const inviteTeamMemberMutation = useMutation(api.cantieri.inviteTeamMember);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // Phase Tasks - NEW
    const phaseTasks = useQuery(
        api.phase_tasks.listByPhase,
        selectedCantiere ? { cantiere_id: selectedCantiere._id } : "skip"
    ) || [];
    const createPhaseTaskMutation = useMutation(api.phase_tasks.create);
    const updatePhaseTaskMutation = useMutation(api.phase_tasks.update);
    const removePhaseTaskMutation = useMutation(api.phase_tasks.remove);

    // Legacy task queries (keep for compatibility)
    const tasksList = useQuery(
        api.tasks.list,
        selectedCantiere ? { cantiere_id: selectedCantiere._id } : "skip"
    ) || [];
    const createTaskMutation = useMutation(api.tasks.create);
    const updateTaskMutation = useMutation(api.tasks.update);
    const removeTaskMutation = useMutation(api.tasks.remove);

    // Phase task state
    const [expandedPhase, setExpandedPhase] = useState('in_lavorazione');
    const [newPhaseTask, setNewPhaseTask] = useState({ title: '', phase: 'in_lavorazione', priority: 'media', assigned_to: '' });

    // Actions
    const sendInviteEmail = useAction(api.actions.sendTeamInviteEmail);


    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleCreate = async () => {
        try {
            await createCantiereMutation({
                nome_cantiere: newCantiere.nome_cantiere,
                cliente: newCantiere.cliente,
                client_id: newCantiere.client_id || undefined,
                indirizzo: newCantiere.indirizzo || undefined,
                status: newCantiere.status,
                valore_contratto: parseFloat(newCantiere.valore_contratto) || 0,
                valore_progetto: parseFloat(newCantiere.valore_progetto) || 0,
                company_email: userEmail,
                created_date: new Date().toISOString()
            });
            setCreateModalOpen(false);
            setNewCantiere({ nome_cantiere: '', cliente: '', client_id: null, indirizzo: '', status: 'in_lavorazione', valore_contratto: '', valore_progetto: '' });
        } catch (error) {
            console.error("Error creating cantiere:", error);
            alert("Errore durante la creazione del cantiere");
        }
    };

    const handlePhaseChange = async (cantiereId, newPhase) => {
        try {
            await updateCantiereMutation({
                id: cantiereId,
                data: { status: newPhase }
            });
            // Update selected cantiere if it's the one being changed
            if (selectedCantiere && selectedCantiere._id === cantiereId) {
                setSelectedCantiere(prev => ({ ...prev, status: newPhase }));
            }
        } catch (error) {
            console.error("Error updating phase:", error);
        }
    };


    // Drag and Drop handlers
    const handleDragStart = (e, cantiere) => {
        setDraggedItem(cantiere);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cantiere._id);
    };

    const handleDragOver = (e, phaseId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverPhase(phaseId);
    };

    const handleDragLeave = () => {
        setDragOverPhase(null);
    };

    const handleDrop = async (e, targetPhase) => {
        e.preventDefault();
        setDragOverPhase(null);

        if (draggedItem && draggedItem.status !== targetPhase) {
            await handlePhaseChange(draggedItem._id, targetPhase);
        }
        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverPhase(null);
    };

    // Voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error starting recording:", error);
            alert("Impossibile accedere al microfono");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    // File upload helper
    const uploadFile = async (file) => {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        return `${import.meta.env.VITE_CONVEX_URL}/api/storage/${storageId}`;
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !audioBlob && !selectedFile) || !selectedCantiere) return;

        try {
            let fileUrl = null;
            let fileName = null;
            let messageType = 'text';

            // Upload audio if present
            if (audioBlob) {
                fileUrl = await uploadFile(new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' }));
                fileName = 'Messaggio vocale';
                messageType = 'voice';
            }
            // Upload file if present
            else if (selectedFile) {
                fileUrl = await uploadFile(selectedFile);
                fileName = selectedFile.name;
                messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
            }

            await sendMessageMutation({
                channel_id: selectedCantiere._id,
                sender_email: userEmail,
                sender_name: user?.fullName || 'Utente',
                content: newMessage || fileName || '',
                file_url: fileUrl,
                file_name: fileName,
                message_type: messageType,
            });

            setNewMessage('');
            setAudioBlob(null);
            setSelectedFile(null);
            setRecordingTime(0);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Errore durante l'invio del messaggio");
        }
    };

    const handleInviteTeamMember = async () => {
        if (!inviteEmail.trim() || !selectedCantiere) return;
        setInviteSending(true);

        try {
            // Add to database
            await inviteTeamMemberMutation({
                cantiere_id: selectedCantiere._id,
                email: inviteEmail,
                role: 'worker',
                invited_by: userEmail,
            });

            // Send email
            await sendInviteEmail({
                to: inviteEmail,
                cantiereNome: selectedCantiere.nome_cantiere,
                inviterName: user?.fullName || 'Admin',
                inviterEmail: userEmail,
            });

            alert(`Invito inviato a ${inviteEmail}`);
            setInviteEmail('');
            setInviteModalOpen(false);
        } catch (error) {
            console.error("Error inviting team member:", error);
            alert("Errore durante l'invio dell'invito");
        } finally {
            setInviteSending(false);
        }
    };

    const getPhaseLabel = (status) => {
        const phase = KANBAN_PHASES.find(p => p.id === status);
        return phase?.label || status?.toUpperCase() || 'N/A';
    };

    const getPhaseColor = (status) => {
        const phase = KANBAN_PHASES.find(p => p.id === status);
        return phase?.color || 'bg-gray-500';
    };

    const filteredCantieri = cantieri.filter(c =>
        c.nome_cantiere?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group cantieri by phase for Kanban
    const cantieriByPhase = KANBAN_PHASES.reduce((acc, phase) => {
        acc[phase.id] = filteredCantieri.filter(c => c.status === phase.id);
        return acc;
    }, {});

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Convex user for role check
    const convexUser = useQuery(api.users.getByEmail, { email: userEmail });

    // Loading state
    if (!user || convexUser === undefined) {
        return <div className="min-h-screen grid place-items-center bg-[#212529] text-white">Caricamento...</div>;
    }

    // Access control - only Admin/CEO can access CantieriDashboard
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'ceo';
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2>
                    <p className="text-[#adb5bd]">Solo gli amministratori possono accedere alla gestione cantieri.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            <AnimatedBackground />
            <VerticalMenu />

            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <HardHat className="text-[#f8f9fa]" />
                                Gestione Cantieri
                            </h1>
                            <p className="text-[#adb5bd]">Trascina i cantieri per cambiare fase</p>
                        </div>

                        <div className="flex gap-3">
                            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] shadow-lg hover:shadow-xl">
                                        <Plus size={20} className="mr-2" />
                                        Nuovo Cantiere
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa]">
                                    <DialogHeader>
                                        <DialogTitle className="text-[#f8f9fa]">Crea Nuovo Cantiere</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#dee2e6]">Nome Cantiere</Label>
                                            <Input
                                                value={newCantiere.nome_cantiere}
                                                onChange={e => setNewCantiere({ ...newCantiere, nome_cantiere: e.target.value })}
                                                placeholder="Es. Ristrutturazione Villa Rossi"
                                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                            />
                                        </div>

                                        {/* Client Selection Dropdown */}
                                        <div className="space-y-2">
                                            <Label className="text-[#dee2e6]">Seleziona Cliente (da Clienti)</Label>
                                            <Select
                                                value={newCantiere.client_id || "manual"}
                                                onValueChange={(v) => {
                                                    if (v === "manual") {
                                                        setNewCantiere({ ...newCantiere, client_id: null });
                                                    } else {
                                                        const client = clientsList.find(c => c._id === v);
                                                        setNewCantiere({
                                                            ...newCantiere,
                                                            client_id: v,
                                                            cliente: client?.full_name || newCantiere.cliente
                                                        });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                    <SelectValue placeholder="Seleziona cliente..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa]">
                                                    <SelectItem value="manual" className="text-[#f8f9fa] focus:bg-[#495057] focus:text-[#f8f9fa]">
                                                        ✍️ Inserisci manualmente
                                                    </SelectItem>
                                                    {clientsList.filter(c => c.status === 'active').map(client => (
                                                        <SelectItem key={client._id} value={client._id} className="text-[#f8f9fa] focus:bg-[#495057] focus:text-[#f8f9fa]">
                                                            {client.full_name} {client.company_name && `(${client.company_name})`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {!newCantiere.client_id && (
                                            <div className="space-y-2">
                                                <Label className="text-[#dee2e6]">Nome Cliente (manuale)</Label>
                                                <Input
                                                    value={newCantiere.cliente}
                                                    onChange={e => setNewCantiere({ ...newCantiere, cliente: e.target.value })}
                                                    placeholder="Nome Cliente"
                                                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                                />
                                            </div>
                                        )}

                                        {/* Address */}
                                        <div className="space-y-2">
                                            <Label className="text-[#dee2e6]">Indirizzo Cantiere</Label>
                                            <Input
                                                value={newCantiere.indirizzo}
                                                onChange={e => setNewCantiere({ ...newCantiere, indirizzo: e.target.value })}
                                                placeholder="Via, Numero, Città"
                                                className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[#dee2e6]">Valore Contratto (€)</Label>
                                                <Input
                                                    type="number"
                                                    value={newCantiere.valore_contratto}
                                                    onChange={e => setNewCantiere({ ...newCantiere, valore_contratto: e.target.value })}
                                                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[#dee2e6]">Valore Progetto (€)</Label>
                                                <Input
                                                    type="number"
                                                    value={newCantiere.valore_progetto}
                                                    onChange={e => setNewCantiere({ ...newCantiere, valore_progetto: e.target.value })}
                                                    placeholder="Stima progetto"
                                                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#dee2e6]">Fase Iniziale</Label>
                                            <Select
                                                value={newCantiere.status}
                                                onValueChange={v => setNewCantiere({ ...newCantiere, status: v })}
                                            >
                                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa]">
                                                    {KANBAN_PHASES.map(phase => (
                                                        <SelectItem key={phase.id} value={phase.id} className="text-[#f8f9fa] focus:bg-[#495057] focus:text-[#f8f9fa]">
                                                            {phase.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            onClick={handleCreate}
                                            disabled={!newCantiere.nome_cantiere || !newCantiere.cliente}
                                            className="w-full bg-[#f8f9fa] text-[#212529] hover:bg-[#e9ecef] mt-4"
                                        >
                                            Crea Cantiere
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Search and View Toggle */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                <Input
                                    placeholder="Cerca cantiere..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                />
                            </div>
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="bg-[#495057]">
                                    <TabsTrigger value="kanban" className="text-[#adb5bd] data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-[#212529]">
                                        Kanban
                                    </TabsTrigger>
                                    <TabsTrigger value="grid" className="text-[#adb5bd] data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-[#212529]">
                                        Griglia
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Kanban View */}
                    {activeTab === 'kanban' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {KANBAN_PHASES.map(phase => (
                                <div
                                    key={phase.id}
                                    className={`min-w-[280px] transition-all duration-200 ${dragOverPhase === phase.id ? 'scale-[1.02]' : ''
                                        }`}
                                    onDragOver={(e) => handleDragOver(e, phase.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, phase.id)}
                                >
                                    {/* Phase Header */}
                                    <div className={`flex items-center gap-2 mb-3 p-3 rounded-lg bg-[#343a40]/80 border ${dragOverPhase === phase.id ? 'border-[#f8f9fa]' : 'border-[#495057]'
                                        }`}>
                                        <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                                        <h3 className="font-medium text-[#f8f9fa]">{phase.label}</h3>
                                        <span className="ml-auto text-xs bg-[#495057] px-2 py-1 rounded-full text-[#dee2e6]">
                                            {cantieriByPhase[phase.id]?.length || 0}
                                        </span>
                                    </div>

                                    {/* Cantieri Cards */}
                                    <div className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${dragOverPhase === phase.id ? 'bg-[#495057]/30' : ''
                                        }`}>
                                        {(cantieriByPhase[phase.id] || []).map(cantiere => (
                                            <motion.div
                                                key={cantiere._id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{
                                                    opacity: draggedItem?._id === cantiere._id ? 0.5 : 1,
                                                    y: 0
                                                }}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, cantiere)}
                                                onDragEnd={handleDragEnd}
                                                className={`bg-[#343a40] border border-[#495057] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-[#6c757d] transition-all ${draggedItem?._id === cantiere._id ? 'ring-2 ring-[#f8f9fa]' : ''
                                                    }`}
                                                onClick={() => setSelectedCantiere(cantiere)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-[#f8f9fa] text-sm line-clamp-1">
                                                        {cantiere.nome_cantiere}
                                                    </h4>
                                                    <GripVertical size={14} className="text-[#6c757d] flex-shrink-0" />
                                                </div>
                                                <p className="text-xs text-[#adb5bd] mb-3 flex items-center gap-1">
                                                    <Building size={12} />
                                                    {cantiere.cliente}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#dee2e6]">
                                                        € {cantiere.valore_contratto?.toLocaleString() || '0'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-[#495057] rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${phase.color} rounded-full transition-all`}
                                                                style={{ width: `${cantiere.progresso || 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[#dee2e6]">{cantiere.progresso || 0}%</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {(!cantieriByPhase[phase.id] || cantieriByPhase[phase.id].length === 0) && (
                                            <div className="text-center py-8 text-[#6c757d] text-sm border-2 border-dashed border-[#495057] rounded-lg">
                                                Trascina qui
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Grid View */}
                    {activeTab === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCantieri.length === 0 ? (
                                <div className="col-span-full text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <Building size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun cantiere trovato</h3>
                                    <p className="text-[#adb5bd] mt-2">Crea il tuo primo cantiere per iniziare.</p>
                                </div>
                            ) : (
                                filteredCantieri.map(cantiere => (
                                    <motion.div
                                        key={cantiere._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -5 }}
                                        onClick={() => setSelectedCantiere(cantiere)}
                                        className="cursor-pointer"
                                    >
                                        <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] h-full hover:border-[#6c757d] transition-all overflow-hidden">
                                            <CardHeader className="p-5 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(cantiere.status)} text-white`}>
                                                        {getPhaseLabel(cantiere.status)}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-medium text-[#f8f9fa] mt-3 line-clamp-1">
                                                    {cantiere.nome_cantiere}
                                                </CardTitle>
                                                <p className="text-sm text-[#adb5bd] flex items-center gap-1 mt-1">
                                                    <Building size={14} />
                                                    {cantiere.cliente}
                                                </p>
                                            </CardHeader>
                                            <CardContent className="p-5 pt-2">
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-[#adb5bd]">Valore</span>
                                                        <span className="text-[#f8f9fa] font-medium">€ {cantiere.valore_contratto?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-[#adb5bd]">Avanzamento</span>
                                                        <span className="text-[#f8f9fa] font-medium">{cantiere.progresso || 0}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-[#495057] rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all rounded-full" style={{ width: `${cantiere.progresso || 0}%` }} /></div>
                                                </div>
                                                <div className="mt-6 pt-4 border-t border-[#495057] flex justify-between items-center text-xs text-[#adb5bd]">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {new Date(cantiere.created_date).toLocaleDateString('it-IT')}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-blue-400">
                                                        Dettagli <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cantiere Detail Sidebar */}
            <AnimatePresence>
                {selectedCantiere && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={() => setSelectedCantiere(null)}
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#212529] border-l border-[#495057] z-50 overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-[#495057] bg-[#343a40]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-medium text-[#f8f9fa]">{selectedCantiere.nome_cantiere}</h2>
                                        <p className="text-sm text-[#adb5bd] mt-1">{selectedCantiere.cliente}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setSelectedCantiere(null)}
                                        className="text-[#adb5bd] hover:text-[#f8f9fa] hover:bg-[#495057]"
                                    >
                                        <X size={20} />
                                    </Button>
                                </div>

                                {/* Phase Selector */}
                                <div className="mt-4">
                                    <Label className="text-xs text-[#adb5bd] mb-2 block">Fase Corrente</Label>
                                    <Select
                                        value={selectedCantiere.status}
                                        onValueChange={(v) => handlePhaseChange(selectedCantiere._id, v)}
                                    >
                                        <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa]">
                                            {KANBAN_PHASES.map(phase => (
                                                <SelectItem key={phase.id} value={phase.id} className="text-[#f8f9fa] focus:bg-[#495057] focus:text-[#f8f9fa]">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${phase.color}`} />
                                                        {phase.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col overflow-hidden">
                                <TabsList className="bg-transparent border-b border-[#495057] rounded-none px-6 justify-start">
                                    <TabsTrigger value="details" className="text-[#adb5bd] data-[state=active]:bg-transparent data-[state=active]:text-[#f8f9fa] data-[state=active]:border-b-2 data-[state=active]:border-[#f8f9fa] rounded-none">
                                        Dettagli
                                    </TabsTrigger>
                                    <TabsTrigger value="tasks" className="text-[#adb5bd] data-[state=active]:bg-transparent data-[state=active]:text-[#f8f9fa] data-[state=active]:border-b-2 data-[state=active]:border-[#f8f9fa] rounded-none">
                                        Tasks
                                    </TabsTrigger>
                                    <TabsTrigger value="team" className="text-[#adb5bd] data-[state=active]:bg-transparent data-[state=active]:text-[#f8f9fa] data-[state=active]:border-b-2 data-[state=active]:border-[#f8f9fa] rounded-none">
                                        Team
                                    </TabsTrigger>
                                    <TabsTrigger value="messages" className="text-[#adb5bd] data-[state=active]:bg-transparent data-[state=active]:text-[#f8f9fa] data-[state=active]:border-b-2 data-[state=active]:border-[#f8f9fa] rounded-none">
                                        Messaggi
                                    </TabsTrigger>
                                </TabsList>

                                {/* Details Tab */}
                                <TabsContent value="details" className="flex-1 overflow-y-auto p-6 m-0">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[#343a40] rounded-xl p-4 border border-[#495057]">
                                                <p className="text-xs text-[#adb5bd] mb-1">Valore Contratto</p>
                                                <p className="text-lg font-medium text-[#f8f9fa]">
                                                    € {selectedCantiere.valore_contratto?.toLocaleString() || '0'}
                                                </p>
                                            </div>
                                            <div className="bg-[#343a40] rounded-xl p-4 border border-[#495057]">
                                                <p className="text-xs text-[#adb5bd] mb-1">Avanzamento (auto)</p>
                                                <p className="text-lg font-medium text-[#f8f9fa]">
                                                    {selectedCantiere.progresso || 0}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Auto-calculated progress based on tasks */}
                                        <div className="bg-[#343a40] rounded-xl p-4 border border-[#495057]">
                                            <p className="text-xs text-[#adb5bd] mb-3">Progresso Lavori (automatico)</p>
                                            <div className="space-y-3">
                                                <div className="h-3 bg-[#495057] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all rounded-full"
                                                        style={{ width: `${selectedCantiere.progresso || 0}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-[#adb5bd]">
                                                    <span>0%</span>
                                                    <span className="text-[#f8f9fa] font-medium">{selectedCantiere.progresso || 0}% completato</span>
                                                    <span>100%</span>
                                                </div>
                                                <p className="text-xs text-[#6c757d] italic">
                                                    Calcolato automaticamente dal completamento delle task
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-[#343a40] rounded-xl p-4 border border-[#495057]">
                                            <p className="text-xs text-[#adb5bd] mb-3">Flusso di Lavoro</p>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {KANBAN_PHASES.map((phase, idx) => (
                                                    <React.Fragment key={phase.id}>
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${selectedCantiere.status === phase.id
                                                            ? `${phase.color} text-white font-medium`
                                                            : 'bg-[#495057] text-[#adb5bd]'
                                                            }`}>
                                                            {phase.label}
                                                        </div>
                                                        {idx < KANBAN_PHASES.length - 1 && (
                                                            <ArrowRight size={12} className="text-[#6c757d]" />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Tasks Tab - Phase Based */}
                                <TabsContent value="tasks" className="flex-1 overflow-y-auto p-6 m-0">
                                    <div className="space-y-6">
                                        {/* Overall Progress */}
                                        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-medium text-[#f8f9fa]">Progresso Totale</h3>
                                                <span className="text-sm text-blue-400 font-medium">
                                                    {phaseTasks.filter(t => t.status === 'completato').length}/{phaseTasks.length} task completate
                                                </span>
                                            </div>
                                            <div className="h-3 bg-[#495057] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all rounded-full"
                                                    style={{ width: `${phaseTasks.length > 0 ? Math.round((phaseTasks.filter(t => t.status === 'completato').length / phaseTasks.length) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Phase Sections */}
                                        {KANBAN_PHASES.map((phase) => {
                                            const phaseName = phase.id;
                                            const tasksInPhase = phaseTasks.filter(t => t.phase === phaseName);
                                            const completedInPhase = tasksInPhase.filter(t => t.status === 'completato').length;
                                            const phaseProgress = tasksInPhase.length > 0 ? Math.round((completedInPhase / tasksInPhase.length) * 100) : 0;
                                            const isExpanded = expandedPhase === phaseName;

                                            return (
                                                <div key={phase.id} className="bg-[#343a40] rounded-xl border border-[#495057] overflow-hidden">
                                                    {/* Phase Header */}
                                                    <button
                                                        onClick={() => setExpandedPhase(isExpanded ? null : phaseName)}
                                                        className="w-full flex items-center justify-between p-4 hover:bg-[#495057]/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                                                            <span className="font-medium text-[#f8f9fa]">{phase.label}</span>
                                                            <span className="text-xs text-[#6c757d]">({tasksInPhase.length} task)</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-24 h-2 bg-[#495057] rounded-full overflow-hidden">
                                                                <div className={`h-full ${phase.color} transition-all rounded-full`} style={{ width: `${phaseProgress}%` }} />
                                                            </div>
                                                            <span className="text-sm text-[#adb5bd] min-w-[3rem] text-right">{phaseProgress}%</span>
                                                            <ChevronDown size={16} className={`text-[#6c757d] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </button>

                                                    {/* Expanded Content */}
                                                    {isExpanded && (
                                                        <div className="border-t border-[#495057] p-4 space-y-4">
                                                            {/* Add Task Form for this phase */}
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={newPhaseTask.phase === phaseName ? newPhaseTask.title : ''}
                                                                    onChange={(e) => setNewPhaseTask({ ...newPhaseTask, title: e.target.value, phase: phaseName })}
                                                                    placeholder={`Nuova task per ${phase.label}...`}
                                                                    className="flex-1 bg-[#495057] border-[#6c757d] text-[#f8f9fa]"
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === 'Enter' && newPhaseTask.title.trim()) {
                                                                            createPhaseTaskMutation({
                                                                                cantiere_id: selectedCantiere._id,
                                                                                phase: phaseName,
                                                                                title: newPhaseTask.title.trim(),
                                                                                priority: newPhaseTask.priority,
                                                                                assigned_to: newPhaseTask.assigned_to || undefined
                                                                            });
                                                                            setNewPhaseTask({ title: '', phase: phaseName, priority: 'media', assigned_to: '' });
                                                                        }
                                                                    }}
                                                                />
                                                                <Select
                                                                    value={newPhaseTask.priority}
                                                                    onValueChange={(v) => setNewPhaseTask({ ...newPhaseTask, priority: v })}
                                                                >
                                                                    <SelectTrigger className="w-24 bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                                                        <SelectItem value="alta" className="text-red-400">Alta</SelectItem>
                                                                        <SelectItem value="media" className="text-yellow-400">Media</SelectItem>
                                                                        <SelectItem value="bassa" className="text-blue-400">Bassa</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button
                                                                    onClick={() => {
                                                                        if (newPhaseTask.title.trim()) {
                                                                            createPhaseTaskMutation({
                                                                                cantiere_id: selectedCantiere._id,
                                                                                phase: phaseName,
                                                                                title: newPhaseTask.title.trim(),
                                                                                priority: newPhaseTask.priority,
                                                                                assigned_to: newPhaseTask.assigned_to || undefined
                                                                            });
                                                                            setNewPhaseTask({ title: '', phase: phaseName, priority: 'media', assigned_to: '' });
                                                                        }
                                                                    }}
                                                                    size="sm"
                                                                    className="bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Plus size={16} />
                                                                </Button>
                                                            </div>

                                                            {/* Tasks List */}
                                                            {tasksInPhase.length === 0 ? (
                                                                <div className="text-center py-6 text-[#6c757d]">
                                                                    <ClipboardList size={28} className="mx-auto mb-2 opacity-50" />
                                                                    <p className="text-sm">Nessuna task in questa fase</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {tasksInPhase.map((task) => (
                                                                        <div
                                                                            key={task._id}
                                                                            className={`flex items-center gap-3 p-3 bg-[#495057]/50 rounded-lg ${task.status === 'completato' ? 'opacity-60' : ''}`}
                                                                        >
                                                                            <button
                                                                                onClick={() => updatePhaseTaskMutation({
                                                                                    id: task._id,
                                                                                    data: { status: task.status === 'completato' ? 'da_fare' : 'completato' }
                                                                                })}
                                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${task.status === 'completato'
                                                                                    ? 'bg-green-500 border-green-500'
                                                                                    : 'border-[#6c757d] hover:border-green-500'
                                                                                    }`}
                                                                            >
                                                                                {task.status === 'completato' && <Check size={12} className="text-white" />}
                                                                            </button>
                                                                            <span className={`flex-1 text-sm ${task.status === 'completato' ? 'line-through text-[#6c757d]' : 'text-[#f8f9fa]'}`}>
                                                                                {task.title}
                                                                            </span>
                                                                            {task.assigned_to && (
                                                                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                                                                    {task.assigned_to.split('@')[0]}
                                                                                </span>
                                                                            )}
                                                                            <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'alta' ? 'bg-red-500/20 text-red-400' :
                                                                                task.priority === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                    'bg-blue-500/20 text-blue-400'
                                                                                }`}>
                                                                                {task.priority}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => removePhaseTaskMutation({ id: task._id })}
                                                                                className="text-[#6c757d] hover:text-red-400 transition-colors"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                {/* Team Tab */}
                                <TabsContent value="team" className="flex-1 overflow-y-auto p-6 m-0">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-[#f8f9fa]">Team Assegnato</h3>
                                            <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                                        <UserPlus size={14} className="mr-1" />
                                                        Invita
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa]">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-[#f8f9fa]">Invita Membro del Team</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[#dee2e6]">Email del lavoratore</Label>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={16} />
                                                                <Input
                                                                    type="email"
                                                                    value={inviteEmail}
                                                                    onChange={e => setInviteEmail(e.target.value)}
                                                                    placeholder="email@example.com"
                                                                    className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#495057]/50 rounded-lg p-3">
                                                            <p className="text-xs text-[#adb5bd]">
                                                                Il membro riceverà un'email con un link per accedere a questo cantiere.
                                                                Potrà visualizzare i dettagli, modificare il progresso e comunicare tramite la chat.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            onClick={handleInviteTeamMember}
                                                            disabled={!inviteEmail.trim() || inviteSending}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            {inviteSending ? (
                                                                <>
                                                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                                                    Invio...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send size={16} className="mr-2" />
                                                                    Invia Invito
                                                                </>
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {/* Team Members */}
                                        <div className="space-y-2">
                                            {/* Owner */}
                                            <div className="flex items-center gap-3 p-3 bg-[#343a40] rounded-lg border border-[#495057]">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                                    {user?.fullName?.[0] || 'A'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-[#f8f9fa] truncate">{user?.fullName || 'Admin'}</p>
                                                    <p className="text-xs text-[#adb5bd] truncate">{userEmail}</p>
                                                </div>
                                                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded flex-shrink-0">
                                                    Proprietario
                                                </span>
                                            </div>

                                            {/* Team Members from DB */}
                                            {cantiereTeam.map((member) => (
                                                <div key={member._id} className="flex items-center gap-3 p-3 bg-[#343a40] rounded-lg border border-[#495057]">
                                                    <div className="w-10 h-10 rounded-full bg-[#495057] flex items-center justify-center">
                                                        <Users size={18} className="text-[#adb5bd]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-[#f8f9fa] truncate">{member.email}</p>
                                                        <p className="text-xs text-[#adb5bd]">
                                                            {member.status === 'pending' ? 'Invito in attesa' : 'Membro attivo'}
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${member.status === 'pending'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {member.role === 'worker' ? 'Lavoratore' : member.role}
                                                    </span>
                                                </div>
                                            ))}

                                            {cantiereTeam.length === 0 && (
                                                <div className="text-center py-8 text-[#6c757d]">
                                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">Nessun membro del team</p>
                                                    <p className="text-xs">Invita lavoratori per collaborare</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Messages Tab */}
                                <TabsContent value="messages" className="flex-1 flex flex-col overflow-hidden m-0">
                                    {/* Messages List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MessageSquare size={32} className="text-[#6c757d] mx-auto mb-2" />
                                                <p className="text-sm text-[#adb5bd]">Nessun messaggio</p>
                                                <p className="text-xs text-[#6c757d]">Inizia una conversazione con il team</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg._id}
                                                    className={`flex ${msg.sender_email === userEmail ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-[80%] rounded-xl p-3 ${msg.sender_email === userEmail
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-[#343a40] text-[#f8f9fa] border border-[#495057]'
                                                        }`}>
                                                        <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>

                                                        {/* Voice Message */}
                                                        {msg.message_type === 'voice' && msg.file_url && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Volume2 size={16} />
                                                                <audio controls src={msg.file_url} className="h-8 max-w-[200px]" />
                                                            </div>
                                                        )}

                                                        {/* Image */}
                                                        {msg.message_type === 'image' && msg.file_url && (
                                                            <img
                                                                src={msg.file_url}
                                                                alt="Immagine"
                                                                className="max-w-full rounded-lg mb-1 cursor-pointer"
                                                                onClick={() => window.open(msg.file_url, '_blank')}
                                                            />
                                                        )}

                                                        {/* File */}
                                                        {msg.message_type === 'file' && msg.file_url && (
                                                            <a
                                                                href={msg.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 bg-white/10 rounded mb-1 hover:bg-white/20"
                                                            >
                                                                <FileText size={16} />
                                                                <span className="text-sm truncate">{msg.file_name || 'File'}</span>
                                                            </a>
                                                        )}

                                                        {/* Text Content */}
                                                        {msg.content && msg.message_type !== 'voice' && (
                                                            <p className="text-sm">{msg.content}</p>
                                                        )}

                                                        <p className="text-[10px] opacity-50 mt-1">
                                                            {new Date(msg.created_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Recording UI */}
                                    {(isRecording || audioBlob) && (
                                        <div className="px-4 py-2 bg-[#343a40] border-t border-[#495057]">
                                            <div className="flex items-center gap-3">
                                                {isRecording ? (
                                                    <>
                                                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                                        <span className="text-[#f8f9fa] text-sm">Registrazione... {formatTime(recordingTime)}</span>
                                                        <Button size="sm" variant="ghost" onClick={stopRecording} className="ml-auto text-[#f8f9fa]">
                                                            <MicOff size={16} className="mr-1" />
                                                            Stop
                                                        </Button>
                                                    </>
                                                ) : audioBlob && (
                                                    <>
                                                        <Volume2 size={16} className="text-[#adb5bd]" />
                                                        <span className="text-[#f8f9fa] text-sm">Messaggio vocale ({formatTime(recordingTime)})</span>
                                                        <Button size="sm" variant="ghost" onClick={cancelRecording} className="ml-auto text-red-400">
                                                            <X size={16} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected File Preview */}
                                    {selectedFile && (
                                        <div className="px-4 py-2 bg-[#343a40] border-t border-[#495057]">
                                            <div className="flex items-center gap-3">
                                                {selectedFile.type.startsWith('image/') ? (
                                                    <Image size={16} className="text-[#adb5bd]" />
                                                ) : (
                                                    <FileText size={16} className="text-[#adb5bd]" />
                                                )}
                                                <span className="text-[#f8f9fa] text-sm truncate flex-1">{selectedFile.name}</span>
                                                <Button size="sm" variant="ghost" onClick={() => setSelectedFile(null)} className="text-red-400">
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-[#495057] bg-[#343a40]">
                                        <div className="flex gap-2">
                                            {/* File Upload */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*,.pdf,.doc,.docx"
                                                className="hidden"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[#adb5bd] hover:text-[#f8f9fa] hover:bg-[#495057]"
                                                disabled={isRecording}
                                            >
                                                <Paperclip size={18} />
                                            </Button>

                                            {/* Voice Record */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={`${isRecording ? 'text-red-500 bg-red-500/10' : 'text-[#adb5bd] hover:text-[#f8f9fa]'} hover:bg-[#495057]`}
                                                disabled={!!audioBlob}
                                            >
                                                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                            </Button>

                                            {/* Text Input */}
                                            <Input
                                                value={newMessage}
                                                onChange={e => setNewMessage(e.target.value)}
                                                placeholder="Scrivi un messaggio..."
                                                className="flex-1 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                                disabled={isRecording}
                                            />

                                            {/* Send Button */}
                                            <Button
                                                onClick={handleSendMessage}
                                                disabled={(!newMessage.trim() && !audioBlob && !selectedFile) || isRecording}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Send size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
