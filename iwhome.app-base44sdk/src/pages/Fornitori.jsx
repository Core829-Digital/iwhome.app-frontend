/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import {
    Truck, Package, Factory, CreditCard, MapPin, Search, Plus, Edit, Trash2,
    ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Loader2,
    FileText, Send, Eye, Calendar, MessageCircle, Phone, UserPlus,
    Copy, Mail, Shield, Star, PhoneCall, User, Hash, Building2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

// ─── Status Helpers ──────────────────────────────────────
const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    archived: 'bg-red-500/20 text-red-400 border-red-500/30',
    partito: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_transito: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    consegnato: 'bg-green-500/20 text-green-400 border-green-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_production: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ready: 'bg-green-500/20 text-green-400 border-green-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    received: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    quoted: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const statusLabels = {
    active: 'Attivo', inactive: 'Inattivo', archived: 'Archiviato',
    partito: 'Partito', in_transito: 'In Transito', consegnato: 'Consegnato',
    confirmed: 'Confermato', in_production: 'In Produzione', ready: 'Pronto',
    shipped: 'Spedito', delivered: 'Consegnato', sent: 'Inviata',
    received: 'Ricevuta', quoted: 'Preventivata', accepted: 'Accettata',
    rejected: 'Rifiutata', draft: 'Bozza', pending: 'In Attesa',
    in_progress: 'In Corso', completed: 'Completato',
};

const invitationStatusLabels = {
    pending: 'Invito Inviato', accepted: 'Accettato', expired: 'Scaduto',
};

// ─── Mini Chat Component ──────────────────────────────────────
function MiniChat({ channelType, channelId, channelName }) {
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    const messages = useQuery(api.internal_messages.list, { channel_type: channelType, channel_id: channelId }) || [];
    const sendMessage = useMutation(api.internal_messages.send);
    const markAsRead = useMutation(api.internal_messages.markAsRead);

    useEffect(() => {
        if (messages.length > 0) {
            markAsRead({ channel_type: channelType, channel_id: channelId }).catch(() => { });
        }
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages.length]);

    const handleSend = async () => {
        if (!message.trim()) return;
        try {
            await sendMessage({
                channel_type: channelType,
                channel_id: channelId,
                channel_name: channelName,
                message: message.trim(),
            });
            setMessage('');
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex flex-col h-[300px]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 p-3 bg-[#212529] rounded-lg">
                {messages.length === 0 && (
                    <p className="text-xs text-[#6c757d] text-center py-8">Nessun messaggio. Scrivi per comunicare con questo contatto.</p>
                )}
                {messages.map(msg => (
                    <div key={msg._id} className={`flex ${msg.sender_role === 'system' ? 'justify-center' : msg.sender_email ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${msg.message_type === 'system' ? 'bg-[#343a40] text-[#6c757d] italic' :
                            'bg-orange-600/20 text-[#f8f9fa]'
                            }`}>
                            {msg.sender_name && <p className="text-[10px] text-orange-400 mb-0.5 font-medium">{msg.sender_name}</p>}
                            <p>{msg.message}</p>
                            <p className="text-[9px] text-[#6c757d] mt-1">{new Date(msg.created_date).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-2">
                <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    className="bg-[#495057] border-[#6c757d] text-[#f8f9fa] text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <Button size="sm" onClick={handleSend} disabled={!message.trim()} className="bg-orange-600 hover:bg-orange-700">
                    <Send size={14} />
                </Button>
            </div>
        </div>
    );
}

export default function Fornitori() {
    const { role, isAdmin, isSupplier, canView, isLoading: rbacLoading } = useRBAC();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('anagrafica');
    const [searchTerm, setSearchTerm] = useState('');
    // Modals
    const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(null); // supplier ID for chat
    // Forms
    const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', address: '', piva: '', type: 'subprod', notes: '', contact_person: '' });
    const [newRequest, setNewRequest] = useState({ supplier_id: undefined, title: '', description: '', fixture_type: '' });
    const [newDelivery, setNewDelivery] = useState({ order_id: undefined, supplier_id: undefined, driver_name: '', driver_phone: '', driver_vehicle: '', tracking_number: '', estimated_arrival: '', notes: '' });

    // Data queries
    const suppliers = useQuery(api.suppliers.list) || [];
    const requests = useQuery(api.suppliers.listRequests, {}) || [];
    const orders = useQuery(api.suppliers.listOrders, {}) || [];
    const deliveries = useQuery(api.suppliers.listDeliveries, {}) || [];
    const allPayments = useQuery(api.payments.list, { type: 'supplier' }) || [];
    const allCertificates = useQuery(api.certificates.list, {}) || [];

    // Mutations
    const createSupplier = useMutation(api.suppliers.create);
    const createRequest = useMutation(api.suppliers.createRequest);
    const removeRequest = useMutation(api.suppliers.removeRequest);
    const createDelivery = useMutation(api.suppliers.createDelivery);
    const removeOrder = useMutation(api.suppliers.removeOrder);
    const removeDelivery = useMutation(api.suppliers.removeDelivery);
    const updateDelivery = useMutation(api.suppliers.updateDelivery);
    const removeSupplier = useMutation(api.suppliers.remove);
    const updateSupplier = useMutation(api.suppliers.update);
    const generateInvitation = useMutation(api.suppliers.generateInvitation);

    if (rbacLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
        );
    }

    if (!canView('fornitori')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
                <AnimatedBackground /><VerticalMenu />
                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    // ─── Handlers ──────────────────────────────────
    const handleCreateSupplier = async () => {
        if (!newSupplier.name || !newSupplier.email) return;
        try {
            await createSupplier(newSupplier);
            setShowNewSupplierModal(false);
            setNewSupplier({ name: '', email: '', phone: '', address: '', piva: '', type: 'subprod', notes: '', contact_person: '' });
        } catch (err) { console.error(err); }
    };

    const handleCreateRequest = async () => {
        if (!newRequest.supplier_id || !newRequest.title) return;
        try {
            await createRequest({
                supplier_id: newRequest.supplier_id,
                title: newRequest.title,
                description: newRequest.description,
                fixture_type: newRequest.fixture_type,
            });
            setShowNewRequestModal(false);
            setNewRequest({ supplier_id: undefined, title: '', description: '', fixture_type: '' });
        } catch (err) { console.error(err); }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa richiesta? L'operazione non è reversibile.")) return;
        try { await removeRequest({ id }); } catch (err) { console.error(err); }
    };

    const handleDeleteOrder = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questo ordine?")) return;
        try { await removeOrder({ id }); } catch (err) { console.error(err); }
    };

    const handleDeleteDelivery = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa consegna?")) return;
        try { await removeDelivery({ id }); } catch (err) { console.error(err); }
    };

    const handleCreateDelivery = async () => {
        if (!newDelivery.order_id || !newDelivery.supplier_id) return;
        try {
            await createDelivery({
                order_id: newDelivery.order_id,
                supplier_id: newDelivery.supplier_id,
                driver_name: newDelivery.driver_name || undefined,
                driver_phone: newDelivery.driver_phone || undefined,
                driver_vehicle: newDelivery.driver_vehicle || undefined,
                tracking_number: newDelivery.tracking_number || undefined,
                estimated_arrival: newDelivery.estimated_arrival || undefined,
                notes: newDelivery.notes || undefined,
            });
            setShowDeliveryModal(false);
            setNewDelivery({ order_id: undefined, supplier_id: undefined, driver_name: '', driver_phone: '', driver_vehicle: '', tracking_number: '', estimated_arrival: '', notes: '' });
        } catch (err) { console.error(err); }
    };

    const handleConfirmDelivery = async (deliveryId) => {
        try { await updateDelivery({ id: deliveryId, data: { status: 'consegnato', delivery_date: new Date().toISOString() } }); }
        catch (err) { console.error(err); }
    };

    const handleInvite = async (supplierId) => {
        try {
            const code = await generateInvitation({ id: supplierId });
            if (code) {
                navigator.clipboard.writeText(code).catch(() => { });
                alert(`Codice invito copiato: ${code}`);
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Eliminare questo fornitore? Tutti i dati correlati verranno persi.')) return;
        try { await removeSupplier({ id }); } catch (err) { console.error(err); }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try { await updateSupplier({ id, data: { status: newStatus } }); } catch (err) { console.error(err); }
    };

    const filtered = (items) => items.filter(item => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return JSON.stringify(item).toLowerCase().includes(s);
    });

    const tabConfig = [
        { key: 'anagrafica', label: 'Anagrafica', icon: Building2 },
        { key: 'richieste', label: 'Richieste', icon: FileText },
        { key: 'ordini', label: 'Ordini', icon: Package },
        { key: 'produzione', label: 'Produzione', icon: Factory },
        { key: 'consegne', label: 'Consegne', icon: MapPin },
        { key: 'comunicazioni', label: 'Chat', icon: MessageCircle },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            <AnimatedBackground />
            <VerticalMenu />
            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header — Command Center feel */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                                    <Truck size={20} className="text-white" />
                                </div>
                                Centro Controllo Fornitori
                            </h1>
                            <p className="text-[#adb5bd] text-sm">Gestione completa: anagrafica, richieste, ordini, produzione, consegne e comunicazioni</p>
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2 flex-wrap">
                                <Button onClick={() => setShowNewSupplierModal(true)} className="bg-orange-600 hover:bg-orange-700 text-sm">
                                    <Plus size={14} className="mr-1" /> Nuovo Fornitore
                                </Button>
                                <Button onClick={() => setShowNewRequestModal(true)} className="bg-blue-600 hover:bg-blue-700 text-sm">
                                    <Send size={14} className="mr-1" /> Nuova Richiesta
                                </Button>
                                <Button onClick={() => setShowDeliveryModal(true)} className="bg-green-600 hover:bg-green-700 text-sm">
                                    <MapPin size={14} className="mr-1" /> Nuova Consegna
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats Row — at a glance */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                        {[
                            { label: 'Fornitori', count: suppliers.length, color: 'from-orange-600/80 to-orange-700/80', icon: Truck },
                            { label: 'Attivi', count: suppliers.filter(s => s.status === 'active').length, color: 'from-green-600/80 to-green-700/80', icon: CheckCircle },
                            { label: 'Richieste', count: requests.length, color: 'from-blue-600/80 to-blue-700/80', icon: FileText },
                            { label: 'Ordini', count: orders.length, color: 'from-purple-600/80 to-purple-700/80', icon: Package },
                            { label: 'In Consegna', count: deliveries.filter(d => d.status !== 'consegnato').length, color: 'from-yellow-600/80 to-yellow-700/80', icon: MapPin },
                            { label: 'Consegnati', count: deliveries.filter(d => d.status === 'consegnato').length, color: 'from-emerald-600/80 to-emerald-700/80', icon: CheckCircle },
                        ].map((stat) => (
                            <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border-0`}>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <stat.icon className="h-4 w-4 text-white/70" />
                                        <span className="text-xl font-light text-white">{stat.count}</span>
                                    </div>
                                    <p className="text-[10px] text-white/60 mt-0.5">{stat.label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Search */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-5">
                        <CardContent className="p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={16} />
                                <Input placeholder="Cerca fornitori, ordini, consegne..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd] text-sm" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-[#343a40] border border-[#495057] w-full grid grid-cols-6 mb-5">
                            {tabConfig.map(tab => (
                                <TabsTrigger key={tab.key} value={tab.key} className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-[#adb5bd] text-xs gap-1">
                                    <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* ═══ TAB: ANAGRAFICA ═══ */}
                        <TabsContent value="anagrafica">
                            <div className="space-y-3">
                                {filtered(suppliers).length === 0 ? (
                                    <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                        <Truck size={48} className="text-[#6c757d] mx-auto mb-4" />
                                        <h3 className="text-xl text-[#dee2e6]">Nessun fornitore registrato</h3>
                                        <p className="text-[#adb5bd] mt-2">Aggiungi il primo fornitore per iniziare.</p>
                                    </div>
                                ) : filtered(suppliers).map(supplier => (
                                    <motion.div key={supplier._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-orange-500/40 transition-all duration-300">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    {/* Left: Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 flex items-center justify-center border border-orange-500/20">
                                                                <Building2 size={18} className="text-orange-400" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-medium text-[#f8f9fa]">{supplier.name}</h3>
                                                                <div className="flex items-center gap-3 text-xs text-[#adb5bd]">
                                                                    <span className="flex items-center gap-1"><Mail size={11} /> {supplier.email}</span>
                                                                    {supplier.phone && <span className="flex items-center gap-1"><Phone size={11} /> {supplier.phone}</span>}
                                                                    {supplier.piva && <span className="flex items-center gap-1"><Hash size={11} /> {supplier.piva}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Tags row */}
                                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                            <Badge variant="default" className={statusColors[supplier.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[supplier.status]}</Badge>
                                                            <Badge variant="default" className="bg-[#495057] text-[#adb5bd] text-xs">{supplier.type === 'subprod' ? 'Infissi' : 'Edilizia'}</Badge>
                                                            {supplier.contact_person && <Badge variant="default" className="bg-blue-500/20 text-blue-400 text-xs"><User size={10} className="mr-1" />{supplier.contact_person}</Badge>}
                                                            {supplier.invitation_status && (
                                                                <Badge variant="default" className={`text-xs ${supplier.invitation_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                                                    supplier.invitation_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                        'bg-red-500/20 text-red-400'
                                                                    }`}>
                                                                    {invitationStatusLabels[supplier.invitation_status] || supplier.invitation_status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {supplier.notes && <p className="text-xs text-[#6c757d] mt-2 line-clamp-1">{supplier.notes}</p>}
                                                        {/* Cross-reference stats */}
                                                        {(() => {
                                                            const supplierOrders = orders.filter(o => o.supplier_id === supplier._id);
                                                            const supplierPayments = allPayments.filter(p => p.supplier_id === supplier._id);
                                                            const pendingPayments = supplierPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo');
                                                            const supplierCerts = allCertificates.filter(c => c.supplier_id === supplier._id);
                                                            const pendingTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
                                                            return (
                                                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                                                    {supplierOrders.length > 0 && (
                                                                        <button onClick={() => setActiveTab('ordini')} className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md hover:bg-purple-500/20 transition-all">
                                                                            <Package size={10} /> {supplierOrders.length} ordini
                                                                        </button>
                                                                    )}
                                                                    {pendingPayments.length > 0 && (
                                                                        <button onClick={() => navigate('/Pagamenti')} className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-md hover:bg-red-500/20 transition-all">
                                                                            <CreditCard size={10} /> {pendingPayments.length} pagamenti (€{pendingTotal.toLocaleString()})
                                                                        </button>
                                                                    )}
                                                                    {supplierCerts.length > 0 && (
                                                                        <button onClick={() => navigate('/Certificati')} className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md hover:bg-amber-500/20 transition-all">
                                                                            <Shield size={10} /> {supplierCerts.length} certificati
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    {/* Right: Actions */}
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {supplier.phone && (
                                                            <a href={`tel:${supplier.phone}`}>
                                                                <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20 h-8 w-8 p-0">
                                                                    <PhoneCall size={16} />
                                                                </Button>
                                                            </a>
                                                        )}
                                                        <Button variant="ghost" size="sm" onClick={() => setShowChatModal(supplier)} className="text-blue-400 hover:bg-blue-500/20 h-8 w-8 p-0">
                                                            <MessageCircle size={16} />
                                                        </Button>
                                                        {isAdmin && !supplier.invitation_status && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleInvite(supplier._id)} className="text-yellow-400 hover:bg-yellow-500/20 h-8 w-8 p-0" title="Genera codice invito">
                                                                <UserPlus size={16} />
                                                            </Button>
                                                        )}
                                                        {isAdmin && (
                                                            <>
                                                                <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(supplier._id, supplier.status)} className="text-orange-400 hover:bg-orange-500/20 h-8 w-8 p-0" title={supplier.status === 'active' ? 'Disattiva' : 'Attiva'}>
                                                                    {supplier.status === 'active' ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                                </Button>
                                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier._id)} className="text-red-400 hover:bg-red-500/20 h-8 w-8 p-0">
                                                                    <Trash2 size={16} />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* ═══ TAB: RICHIESTE ═══ */}
                        <TabsContent value="richieste">
                            <div className="space-y-3">{filtered(requests).length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><Send size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessuna richiesta</h3><p className="text-[#adb5bd] mt-2">Crea una nuova richiesta per un fornitore.</p></div>
                            ) : filtered(requests).map(req => {
                                const supplier = suppliers.find(s => s._id === req.supplier_id);
                                return (
                                    <motion.div key={req._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">{req.title}</h3>
                                                        <p className="text-sm text-[#adb5bd]">{supplier?.name || 'Fornitore'} • {req.fixture_type || 'Generico'}</p>
                                                        {req.description && <p className="text-sm text-[#6c757d] mt-1 line-clamp-2">{req.description}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {req.quoted_price && <span className="text-[#f8f9fa] font-medium">€{req.quoted_price?.toLocaleString()}</span>}
                                                        <Badge variant="default" className={statusColors[req.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[req.status] || req.status}</Badge>
                                                        {isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(req._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 ml-2">
                                                                <Trash2 size={14} className="mr-1" /> Elimina
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: ORDINI ═══ */}
                        <TabsContent value="ordini">
                            <div className="space-y-3">{filtered(orders).length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><Package size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessun ordine</h3></div>
                            ) : filtered(orders).map(order => {
                                const supplier = suppliers.find(s => s._id === order.supplier_id);
                                return (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">Ordine #{order.order_number || order._id.slice(-6)}</h3>
                                                        <p className="text-sm text-[#adb5bd]">{supplier?.name || 'Fornitore'}</p>
                                                        {order.delivery_date && <p className="text-xs text-[#6c757d] mt-1 flex items-center gap-1"><Calendar size={12} /> Consegna: {new Date(order.delivery_date).toLocaleDateString('it-IT')}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {order.total_amount && <span className="text-[#f8f9fa] font-medium text-lg">€{order.total_amount?.toLocaleString()}</span>}
                                                        <Badge variant="default" className={statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}>{statusLabels[order.status] || order.status}</Badge>
                                                        {isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 ml-2">
                                                                <Trash2 size={14} className="mr-1" /> Elimina
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Linked payment status */}
                                                {(() => {
                                                    const linkedPayment = allPayments.find(p => p.order_id === order._id);
                                                    return linkedPayment ? (
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#495057]">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <CreditCard size={12} className="text-emerald-400" />
                                                                <span className="text-[#adb5bd]">Pagamento:</span>
                                                                <Badge variant="default" className={`text-[10px] ${linkedPayment.status === 'pagato' ? 'bg-green-500/20 text-green-400' : linkedPayment.status === 'in_ritardo' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                                    {linkedPayment.status === 'pagato' ? 'Pagato' : linkedPayment.status === 'in_ritardo' ? 'In Ritardo' : 'In Attesa'}
                                                                </Badge>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => navigate('/Pagamenti')} className="text-emerald-400 hover:bg-emerald-500/20 h-7 text-xs gap-1">
                                                                <ExternalLink size={12} /> Vai a Pagamenti
                                                            </Button>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: PRODUZIONE ═══ */}
                        <TabsContent value="produzione">
                            <div className="space-y-3">{orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><Factory size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessun ordine in produzione</h3></div>
                            ) : orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').map(order => {
                                const supplier = suppliers.find(s => s._id === order.supplier_id);
                                return (
                                    <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057]">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">Ordine #{order.order_number || order._id.slice(-6)}</h3>
                                                        <p className="text-sm text-[#adb5bd]">{supplier?.name}</p>
                                                    </div>
                                                    <Badge variant="default" className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                                                </div>
                                                <div className="flex items-center gap-1 mt-3">
                                                    {['Materiali', 'Taglio', 'Assemblaggio', 'Verniciatura', 'QC', 'Pronto'].map((phase, i) => (
                                                        <div key={phase} className="flex-1">
                                                            <div className={`h-2 rounded-full ${i < 2 ? 'bg-green-500' : i === 2 ? 'bg-yellow-500 animate-pulse' : 'bg-[#495057]'}`} />
                                                            <p className="text-[9px] text-[#6c757d] mt-1 text-center">{phase}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: CONSEGNE (with driver info) ═══ */}
                        <TabsContent value="consegne">
                            <div className="space-y-3">{filtered(deliveries).length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]"><MapPin size={48} className="text-[#6c757d] mx-auto mb-4" /><h3 className="text-xl text-[#dee2e6]">Nessuna consegna</h3></div>
                            ) : filtered(deliveries).map(delivery => {
                                const supplier = suppliers.find(s => s._id === delivery.supplier_id);
                                return (
                                    <motion.div key={delivery._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">{supplier?.name || 'Fornitore'}</h3>
                                                        {delivery.tracking_number && <p className="text-sm text-[#adb5bd]">Tracking: {delivery.tracking_number}</p>}
                                                        {delivery.estimated_arrival && <p className="text-xs text-[#6c757d]">Arrivo stimato: {new Date(delivery.estimated_arrival).toLocaleDateString('it-IT')}</p>}

                                                        {/* Driver Info Card */}
                                                        {(delivery.driver_name || delivery.driver_phone) && (
                                                            <div className="mt-3 bg-[#212529] rounded-lg p-3 border border-[#495057]">
                                                                <p className="text-xs text-orange-400 font-medium mb-1 flex items-center gap-1"><Truck size={12} /> Autista</p>
                                                                <div className="flex items-center gap-4">
                                                                    {delivery.driver_name && <span className="text-sm text-[#f8f9fa] flex items-center gap-1"><User size={12} className="text-[#6c757d]" /> {delivery.driver_name}</span>}
                                                                    {delivery.driver_phone && (
                                                                        <a href={`tel:${delivery.driver_phone}`} className="text-sm text-green-400 flex items-center gap-1 hover:underline">
                                                                            <PhoneCall size={12} /> {delivery.driver_phone}
                                                                        </a>
                                                                    )}
                                                                    {delivery.driver_vehicle && <span className="text-xs text-[#adb5bd]">{delivery.driver_vehicle}</span>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {/* 3 State Progress */}
                                                        <div className="flex items-center gap-1">
                                                            {[
                                                                { key: 'partito', label: 'P' },
                                                                { key: 'in_transito', label: 'T' },
                                                                { key: 'consegnato', label: 'C' },
                                                            ].map((state, i) => {
                                                                const phases = ['partito', 'in_transito', 'consegnato'];
                                                                const isPast = phases.indexOf(delivery.status) >= i;
                                                                const colors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
                                                                return (
                                                                    <React.Fragment key={state.key}>
                                                                        {i > 0 && <div className={`w-4 h-0.5 ${isPast ? colors[i] : 'bg-[#495057]'}`} />}
                                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isPast ? `${colors[i]}/30 text-white border border-white/20` : 'bg-[#495057] text-[#6c757d]'}`}>
                                                                            {state.label}
                                                                        </div>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {delivery.driver_phone && (
                                                                <a href={`tel:${delivery.driver_phone}`}>
                                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-7 px-2">
                                                                        <PhoneCall size={12} className="mr-1" /> Chiama
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            {isAdmin && delivery.status !== 'consegnato' && (
                                                                <Button size="sm" onClick={() => handleConfirmDelivery(delivery._id)} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7">
                                                                    <CheckCircle size={12} className="mr-1" /> Conferma
                                                                </Button>
                                                            )}
                                                            {isAdmin && (
                                                                <Button size="sm" onClick={() => handleDeleteDelivery(delivery._id)} className="bg-red-600/80 hover:bg-red-700 text-xs h-7 ml-1">
                                                                    <Trash2 size={12} className="mr-1" /> Elimina
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}</div>
                        </TabsContent>

                        {/* ═══ TAB: COMUNICAZIONI ═══ */}
                        <TabsContent value="comunicazioni">
                            {suppliers.length === 0 ? (
                                <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                    <MessageCircle size={48} className="text-[#6c757d] mx-auto mb-4" />
                                    <h3 className="text-xl text-[#dee2e6]">Nessun fornitore</h3>
                                    <p className="text-[#adb5bd] mt-2">Aggiungi fornitori per comunicare con loro.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {suppliers.map(supplier => (
                                        <Card key={supplier._id} className="bg-[#343a40] border border-[#495057]">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm text-[#f8f9fa] flex items-center justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center"><Building2 size={14} className="text-orange-400" /></div>
                                                        {supplier.name}
                                                    </span>
                                                    {supplier.phone && (
                                                        <a href={`tel:${supplier.phone}`}>
                                                            <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/20 h-7 px-2 text-xs">
                                                                <PhoneCall size={12} className="mr-1" /> Chiama
                                                            </Button>
                                                        </a>
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <MiniChat channelType="supplier" channelId={supplier._id} channelName={supplier.name} />
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* ═══ MODAL: Nuovo Fornitore ═══ */}
            <Dialog open={showNewSupplierModal} onOpenChange={setShowNewSupplierModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuovo Fornitore</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Input placeholder="Nome Azienda *" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Email *" value={newSupplier.email} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Telefono" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Referente" value={newSupplier.contact_person} onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="P.IVA" value={newSupplier.piva} onChange={e => setNewSupplier({ ...newSupplier, piva: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Indirizzo" value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Select value={newSupplier.type} onValueChange={v => setNewSupplier({ ...newSupplier, type: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="subprod" className="text-[#f8f9fa]">Subprodotti (Infissi)</SelectItem>
                                <SelectItem value="subeng" className="text-[#f8f9fa]">Subeng (Edilizia)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea placeholder="Note" value={newSupplier.notes} onChange={e => setNewSupplier({ ...newSupplier, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreateSupplier} disabled={!newSupplier.name || !newSupplier.email} className="w-full bg-orange-600 hover:bg-orange-700">Crea Fornitore</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Nuova Richiesta ═══ */}
            <Dialog open={showNewRequestModal} onOpenChange={setShowNewRequestModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuova Richiesta</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={newRequest.supplier_id} onValueChange={v => setNewRequest({ ...newRequest, supplier_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Fornitore *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Input placeholder="Titolo Richiesta *" value={newRequest.title} onChange={e => setNewRequest({ ...newRequest, title: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Select value={newRequest.fixture_type} onValueChange={v => setNewRequest({ ...newRequest, fixture_type: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Tipo Infisso" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="finestra" className="text-[#f8f9fa]">Finestra</SelectItem>
                                <SelectItem value="porta" className="text-[#f8f9fa]">Porta</SelectItem>
                                <SelectItem value="portafinestra" className="text-[#f8f9fa]">Portafinestra</SelectItem>
                                <SelectItem value="persiana" className="text-[#f8f9fa]">Persiana</SelectItem>
                                <SelectItem value="scorrevole" className="text-[#f8f9fa]">Scorrevole</SelectItem>
                                <SelectItem value="altro" className="text-[#f8f9fa]">Altro</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea placeholder="Descrizione e specifiche" value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreateRequest} disabled={!newRequest.supplier_id || !newRequest.title} className="w-full bg-blue-600 hover:bg-blue-700">Invia Richiesta</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Nuova Consegna ═══ */}
            <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuova Consegna</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={newDelivery.supplier_id} onValueChange={v => setNewDelivery({ ...newDelivery, supplier_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Fornitore *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={newDelivery.order_id} onValueChange={v => setNewDelivery({ ...newDelivery, order_id: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Ordine *" /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                {orders.filter(o => !newDelivery.supplier_id || o.supplier_id === newDelivery.supplier_id).map(o => (
                                    <SelectItem key={o._id} value={o._id} className="text-[#f8f9fa]">Ordine #{o.order_number || o._id.slice(-6)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-orange-400 font-medium flex items-center gap-1"><Truck size={12} /> Info Autista</p>
                        <Input placeholder="Nome Autista" value={newDelivery.driver_name} onChange={e => setNewDelivery({ ...newDelivery, driver_name: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Telefono Autista" value={newDelivery.driver_phone} onChange={e => setNewDelivery({ ...newDelivery, driver_phone: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Veicolo (Targa)" value={newDelivery.driver_vehicle} onChange={e => setNewDelivery({ ...newDelivery, driver_vehicle: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Nr. Tracking" value={newDelivery.tracking_number} onChange={e => setNewDelivery({ ...newDelivery, tracking_number: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <div>
                            <label className="text-xs text-[#adb5bd] block mb-1">Arrivo Stimato</label>
                            <Input type="date" value={newDelivery.estimated_arrival} onChange={e => setNewDelivery({ ...newDelivery, estimated_arrival: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        <Textarea placeholder="Note" value={newDelivery.notes} onChange={e => setNewDelivery({ ...newDelivery, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreateDelivery} disabled={!newDelivery.order_id || !newDelivery.supplier_id} className="w-full bg-green-600 hover:bg-green-700">Crea Consegna</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ═══ MODAL: Chat con Fornitore ═══ */}
            <Dialog open={!!showChatModal} onOpenChange={() => setShowChatModal(null)}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <MessageCircle size={18} className="text-orange-400" /> Chat con {showChatModal?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {showChatModal && (
                        <MiniChat channelType="supplier" channelId={showChatModal._id} channelName={showChatModal.name} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
