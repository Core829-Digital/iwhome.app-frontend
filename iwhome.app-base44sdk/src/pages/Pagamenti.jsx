/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import { useUser } from "@clerk/clerk-react";
import {
    CreditCard, DollarSign, Search, Plus, Loader2,
    CheckCircle, Clock, AlertTriangle, TrendingUp,
    Users, Truck, Briefcase, Calendar, Eye, ExternalLink, Building2,
    Settings, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';



const paymentStatusConfig = {
    in_attesa: { label: 'In Attesa', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    in_verifica: { label: 'In Verifica', icon: Search, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    pagato: { label: 'Pagato', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    in_ritardo: { label: 'In Ritardo', icon: AlertTriangle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    parziale: { label: 'Parziale', icon: TrendingUp, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const typeConfig = {
    supplier: { label: 'Fornitori', icon: Truck, color: 'from-orange-600 to-orange-700' },
    collaborator: { label: 'Collaboratori', icon: Briefcase, color: 'from-indigo-600 to-indigo-700' },
    client: { label: 'Clienti', icon: Users, color: 'from-emerald-600 to-emerald-700' },
};

export default function Pagamenti() {
    const { isAdmin, canView, isLoading: rbacLoading, role } = useRBAC();
    const isClient = role === 'client';
    const isSupplier = role === 'supplier';
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('supplier');
    const [statusFilter, setStatusFilter] = useState('all');

    React.useEffect(() => {
        if (role === 'client') setActiveTab('client');
        else if (role === 'collaborator_internal' || role === 'collaborator_external') setActiveTab('collaborator');
    }, [role]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState(() => {
        try { return JSON.parse(localStorage.getItem('iwhome_payment_settings') || '{}'); }
        catch { return {}; }
    });
    const [settingsForm, setSettingsForm] = useState({ acconto_pct: '30', intermedio_pct: '30', saldo_pct: '40' });
    const [formData, setFormData] = useState({
        type: 'supplier', reference_id: '', reference_name: '', description: '',
        amount: '', payment_type: 'fattura', due_date: '', notes: '', cantiere_id: '', order_id: '', use_split: false
    });

    const payments = useQuery(api.payments.list, { type: activeTab }) || [];
    const stats = useQuery(api.payments.getStats) || null;
    const createMutation = useMutation(api.payments.create);
    const updateMutation = useMutation(api.payments.update);
    const removeMutation = useMutation(api.payments.remove);
    const confirmPaymentMutation = useMutation(api.payments.confirmPayment);
    const uploadPaymentProofMutation = useMutation(api.payments.uploadPaymentProof);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    // PDF State
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTitle, setPdfTitle] = useState('');
    const [isPdfOpen, setIsPdfOpen] = useState(false);

    // Supplier/Collaborator lists for linking
    const suppliers = useQuery(api.suppliers.list) || [];
    const collaborators = useQuery(api.collaborators.list, {}) || [];
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];
    const allOrders = useQuery(api.suppliers.listOrders, {}) || [];

    const availableOrders = allOrders.filter(o => {
        if (formData.type === 'supplier') return o.supplier_id === formData.reference_id;
        if (formData.type === 'client') {
            const cantiere = cantieri.find(c => c._id === o.cantiere_id);
            return cantiere && (cantiere.client_id === formData.reference_id || cantiere.cliente === formData.reference_name);
        }
        return false;
    });

    if (rbacLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>);
    }

    if (!canView('pagamenti')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">

                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    const handleCreate = async () => {
        if (!formData.description || !formData.amount) return;
        try {
            const payload = /** @type {any} */ ({
                type: formData.type,
                reference_id: formData.reference_id || 'N/A',
                reference_name: formData.reference_name || undefined,
                description: formData.description,
                amount: parseFloat(formData.amount),
                payment_type: formData.payment_type || undefined,
                due_date: formData.due_date || undefined,
                notes: formData.notes || undefined,
                cantiere_id: formData.cantiere_id || undefined,
                order_id: formData.order_id || undefined,
                supplier_id: formData.type === 'supplier' && formData.reference_id ? formData.reference_id : undefined,
                collaborator_id: formData.type === 'collaborator' && formData.reference_id ? formData.reference_id : undefined,
                client_id: formData.type === 'client' && formData.reference_id ? formData.reference_id : undefined,
            });

            if (formData.use_split) {
                const total = parseFloat(formData.amount);
                const acconto_pct = parseFloat(paymentSettings.acconto_pct) || 30;
                const intermedio_pct = parseFloat(paymentSettings.intermedio_pct) || 30;
                const saldo_pct = parseFloat(paymentSettings.saldo_pct) || 40;

                const splits = [
                    { type: 'acconto', pct: acconto_pct, name: 'Acconto Iniziale' },
                    { type: 'rata', pct: intermedio_pct, name: 'Pagamento Intermedio' },
                    { type: 'saldo', pct: saldo_pct, name: 'Saldo Finale' }
                ];

                for (const split of splits) {
                    if (split.pct > 0) {
                        const splitAmt = (total * split.pct) / 100;
                        await createMutation({
                            ...payload,
                            description: `${payload.description} - ${split.name}`,
                            amount: splitAmt,
                            payment_type: split.type
                        });
                    }
                }
            } else {
                await createMutation(payload);
            }

            setShowCreateModal(false);
            setFormData({ type: 'supplier', reference_id: '', reference_name: '', description: '', amount: '', payment_type: 'fattura', due_date: '', notes: '', cantiere_id: '', order_id: '', use_split: false });
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare definitivamente questo pagamento?')) return;
        try { await removeMutation({ id }); } catch (err) { console.error(err); }
    };

    const handleMarkPaid = async (id) => {
        try { await updateMutation({ id, data: { status: 'pagato', paid_date: new Date().toISOString() } }); }
        catch (err) { console.error(err); }
    };

    const handleConfirmPayment = async (id) => {
        try {
            await confirmPaymentMutation({ payment_id: id });
            alert("✅ Pagamento confermato! Fattura, Contratto e PDF generati automaticamente e inviati.");
        } catch (err) {
            console.error(err);
            alert("Errore nella conferma del pagamento.");
        }
    };

    const handleUploadPaymentProof = async (paymentId, file) => {
        if (!file) return;
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!result.ok) throw new Error("Upload fallito");
            const { storageId } = await result.json();
            await uploadPaymentProofMutation({
                payment_id: paymentId,
                storage_id: storageId
            });
            alert("Prova di pagamento caricata con successo!");
        } catch (err) {
            console.error(err);
            alert("Errore durante il caricamento della prova di pagamento.");
        }
    };

    const filteredPayments = payments.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return p.description.toLowerCase().includes(s) || p.reference_name?.toLowerCase().includes(s) || p.invoice_number?.toLowerCase().includes(s);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">


            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <CreditCard className="text-emerald-400" /> Pagamenti
                            </h1>
                            <p className="text-[#adb5bd]">
                                {role === 'supplier' ? 'I pagamenti incassati da IWHome per i tuoi servizi' :
                                 role === 'client' ? 'I tuoi pagamenti e le tue ricevute' :
                                 'Dashboard pagamenti unificata — Gestione spese e incassi'}
                            </p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <Button onClick={() => {
                                    setSettingsForm({
                                        acconto_pct: paymentSettings.acconto_pct || '30',
                                        intermedio_pct: paymentSettings.intermedio_pct || '30',
                                        saldo_pct: paymentSettings.saldo_pct || '40',
                                    });
                                    setShowSettingsModal(true);
                                }} variant="outline" className="border-[#495057] text-[#adb5bd] hover:text-white hover:bg-[#495057]">
                                    <Settings size={16} className="mr-2" /> Impostazioni
                                </Button>
                                <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Plus size={16} className="mr-2" /> Nuovo Pagamento
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats Overview */}
                    {stats && isAdmin && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                            {[
                                { label: 'Totale', value: stats.total, color: 'from-emerald-600/80 to-emerald-700/80' },
                                { label: 'Pagati', value: `€${stats.totalPaid?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-green-600/80 to-green-700/80' },
                                { label: 'In Attesa', value: `€${stats.totalPending?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-yellow-600/80 to-yellow-700/80' },
                                { label: 'In Ritardo', value: `€${stats.totalOverdue?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'from-red-600/80 to-red-700/80' },
                                { label: 'Fornitori', value: stats.supplierCount, color: 'from-orange-600/80 to-orange-700/80' },
                                { label: 'Collaboratori', value: stats.collaboratorCount, color: 'from-indigo-600/80 to-indigo-700/80' },
                                { label: 'Clienti', value: stats.clientCount, color: 'from-blue-600/80 to-blue-700/80' },
                            ].map(s => (
                                <Card key={s.label} className={`bg-gradient-to-br ${s.color} border-0`}>
                                    <CardContent className="p-3 text-center">
                                        <span className="text-xl font-light text-white">{s.value}</span>
                                        <p className="text-[10px] text-white/70 mt-0.5">{s.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                <Input placeholder="Cerca pagamenti..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]" />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-44 bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Stato" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="all" className="text-[#f8f9fa]">Tutti gli stati</SelectItem>
                                    <SelectItem value="in_attesa" className="text-[#f8f9fa]">In Attesa</SelectItem>
                                    <SelectItem value="pagato" className="text-[#f8f9fa]">Pagato</SelectItem>
                                    <SelectItem value="in_ritardo" className="text-[#f8f9fa]">In Ritardo</SelectItem>
                                    <SelectItem value="parziale" className="text-[#f8f9fa]">Parziale</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Type Tabs */}
                    {isAdmin && (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-[#343a40] border border-[#495057] w-full grid grid-cols-3 mb-6">
                                <TabsTrigger value="supplier" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-[#adb5bd]">
                                    <Truck size={16} className="mr-2" /> Fornitori <span className="ml-1.5 text-[10px] opacity-70">(Uscite)</span>
                                </TabsTrigger>
                                <TabsTrigger value="collaborator" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-[#adb5bd]">
                                    <Briefcase size={16} className="mr-2" /> Collaboratori <span className="ml-1.5 text-[10px] opacity-70">(Uscite)</span>
                                </TabsTrigger>
                                <TabsTrigger value="client" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#adb5bd]">
                                    <Users size={16} className="mr-2" /> Clienti <span className="ml-1.5 text-[10px] opacity-70">(Entrate)</span>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {!isAdmin && activeTab === 'client' && (
                        <Card className="bg-emerald-600/10 border border-emerald-600/30 mb-6">
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[#f8f9fa] font-medium">Coordinate Bancarie IWHome</h3>
                                        <p className="text-xs text-[#adb5bd]">Utilizza questi dati per i tuoi bonifici</p>
                                    </div>
                                </div>
                                <div className="text-right font-mono text-sm bg-black/20 p-3 rounded-lg border border-[#495057] w-full md:w-auto">
                                    <p className="text-[#f8f9fa]"><span className="text-[#adb5bd] mr-2">IBAN:</span> IT 99 X 01234 56789 000000123456</p>
                                    <p className="text-[#f8f9fa]"><span className="text-[#adb5bd] mr-2">BIC:</span> ABCITM1RXXX</p>
                                    <p className="text-[#f8f9fa]"><span className="text-[#adb5bd] mr-2">BANCA:</span> IWHome Financial Services</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payments List */}
                    {filteredPayments.length === 0 ? (
                        <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                            <DollarSign size={48} className="text-[#6c757d] mx-auto mb-4" />
                            <h3 className="text-xl text-[#dee2e6]">Nessun pagamento trovato</h3>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPayments.map(payment => {
                                const sts = paymentStatusConfig[payment.status] || paymentStatusConfig.in_attesa;
                                const StatusIcon = sts.icon;
                                return (
                                    <motion.div key={payment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="text-lg font-medium text-[#f8f9fa]">{payment.description}</h3>
                                                            {payment.payment_type && (
                                                                <Badge variant="default" className="bg-[#495057] text-[#adb5bd] text-xs capitalize">{payment.payment_type}</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-[#adb5bd] mt-1">
                                                            {payment.reference_name && <span>{payment.reference_name}</span>}
                                                            {payment.invoice_number && <span>Fattura: {payment.invoice_number}</span>}
                                                            {payment.cantiere_id && (() => {
                                                                const cantiere = cantieri.find(c => c._id === payment.cantiere_id);
                                                                return cantiere ? <span className="flex items-center gap-1 text-emerald-400 font-medium"><Building2 size={12} /> {cantiere.nome_cantiere}</span> : null;
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-[#6c757d] mt-2">
                                                            {payment.due_date && <span className="flex items-center gap-1"><Calendar size={12} /> Scadenza: {new Date(payment.due_date).toLocaleDateString('it-IT')}</span>}
                                                            {payment.paid_date && <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-400" /> Pagato: {new Date(payment.paid_date).toLocaleDateString('it-IT')}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xl font-medium text-[#f8f9fa]">€{payment.amount?.toLocaleString()}</span>
                                                        <Badge variant="default" className={`${sts.color} border flex items-center gap-1`}>
                                                            <StatusIcon size={14} /> {sts.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {/* Cross-navigation: link to source entity */}
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#495057]">
                                                    <div className="flex gap-2">
                                                        {payment.type === 'supplier' && payment.reference_name && (
                                                            <button onClick={() => navigate('/Fornitori')} className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md hover:bg-orange-500/20 transition-all">
                                                                <Truck size={10} /> {payment.reference_name}
                                                            </button>
                                                        )}
                                                        {payment.type === 'collaborator' && payment.reference_name && (
                                                            <button onClick={() => navigate('/Collaboratori')} className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md hover:bg-indigo-500/20 transition-all">
                                                                <Briefcase size={10} /> {payment.reference_name}
                                                            </button>
                                                        )}
                                                        {payment.type === 'client' && payment.reference_name && (
                                                            <button onClick={() => navigate('/Clienti')} className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-all">
                                                                <Users size={10} /> {payment.reference_name}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {isAdmin && (
                                                            <Button size="sm" variant="ghost" onClick={() => handleDelete(payment._id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-8 mr-1">
                                                                ×
                                                            </Button>
                                                        )}
                                                        {( (isAdmin && payment.type === 'supplier' && payment.status === 'in_attesa') || 
                                                           (isClient && payment.type === 'client' && payment.status === 'in_attesa') ) && (
                                                            <div className="flex items-center gap-2 mr-1">
                                                                <Input type="file" id={`proof-${payment._id}`} className="hidden" onChange={(e) => handleUploadPaymentProof(payment._id, e.target.files[0])} />
                                                                <Button size="sm" onClick={() => document.getElementById(`proof-${payment._id}`).click()} className="bg-blue-600 hover:bg-blue-700 text-xs h-8">
                                                                    <Upload size={14} className="mr-1" /> Carica Prova
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {payment.proof_url && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setPdfUrl(payment.proof_url);
                                                                    setPdfTitle(`Prova: ${payment.description}`);
                                                                    setIsPdfOpen(true);
                                                                }}
                                                                className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 h-8 text-xs mr-1"
                                                            >
                                                                <Eye size={14} className="mr-1" /> Vedi Prova
                                                            </Button>
                                                        )}
                                                        {( (isAdmin && payment.status === 'in_verifica' && payment.type === 'client') || 
                                                           (isSupplier && payment.status === 'in_verifica' && payment.type === 'supplier') ||
                                                           (isAdmin && payment.status === 'in_verifica' && payment.type === 'supplier')
                                                        ) && (
                                                            <Button size="sm" onClick={() => handleConfirmPayment(payment._id)} className="bg-cyan-600 hover:bg-cyan-700 text-xs h-8 mr-1">
                                                                <CheckCircle size={14} className="mr-1" /> {isSupplier ? 'Conferma Ricezione' : 'Conferma'}
                                                            </Button>
                                                        )}
                                                        {isAdmin && payment.status !== 'pagato' && payment.status !== 'in_verifica' && (
                                                            <Button size="sm" onClick={() => handleMarkPaid(payment._id)} className="bg-green-600 hover:bg-green-700 text-xs h-8 text-nowrap">
                                                                <CheckCircle size={14} className="mr-1" /> Segna Pagato
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE MODAL */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa]">Nuovo Pagamento</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v, reference_id: '', reference_name: '' })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="supplier" className="text-[#f8f9fa]">Fornitore</SelectItem>
                                <SelectItem value="collaborator" className="text-[#f8f9fa]">Collaboratore</SelectItem>
                                <SelectItem value="client" className="text-[#f8f9fa]">Cliente</SelectItem>
                            </SelectContent>
                        </Select>

                        {formData.type === 'supplier' && (
                            <Select value={formData.reference_id} onValueChange={v => { const s = suppliers.find(x => x._id === v); setFormData({ ...formData, reference_id: v, reference_name: s?.name }); }}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Fornitore" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {suppliers.map(s => <SelectItem key={s._id} value={s._id} className="text-[#f8f9fa]">{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {formData.type === 'collaborator' && (
                            <Select value={formData.reference_id} onValueChange={v => { const c = collaborators.find(x => x._id === v); setFormData({ ...formData, reference_id: v, reference_name: c?.full_name }); }}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Seleziona Collaboratore" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {collaborators.map(c => <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.full_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                        {formData.type === 'client' && (
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Nome Cliente" value={formData.reference_name} onChange={e => setFormData({ ...formData, reference_name: e.target.value, reference_id: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                                <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Cantiere" /></SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        {cantieri.filter(c => c.status !== 'completato').map(c => (
                                            <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.nome_cantiere}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {formData.type !== 'client' && (
                            <Select value={formData.cantiere_id} onValueChange={v => setFormData({ ...formData, cantiere_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega Cantiere (Opzionale)" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    {cantieri.filter(c => c.status !== 'completato').map(c => (
                                        <SelectItem key={c._id} value={c._id} className="text-[#f8f9fa]">{c.nome_cantiere}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(formData.type === 'supplier' || (formData.type === 'client' && formData.cantiere_id)) && availableOrders.length > 0 && (
                            <Select value={formData.order_id} onValueChange={v => setFormData({ ...formData, order_id: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue placeholder="Collega ad un Ordine" /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="" className="text-[#adb5bd]">Nessun ordine collegato</SelectItem>
                                    {availableOrders.map(o => <SelectItem key={o._id} value={o._id} className="text-[#f8f9fa]">Ordine #{o.order_number || o._id.slice(-6)} - €{o.total_amount?.toLocaleString()}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}

                        <Input placeholder="Descrizione *" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Importo (€) *" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        
                        <div className="flex items-center gap-2 mt-2">
                           <input type="checkbox" id="split-toggle" checked={formData.use_split} onChange={e => setFormData({ ...formData, use_split: e.target.checked })} className="w-4 h-4 bg-[#495057] border-[#6c757d] rounded cursor-pointer" />
                           <label htmlFor="split-toggle" className="text-sm text-[#dee2e6] cursor-pointer">
                              Dividi automaticamente in rate ({paymentSettings.acconto_pct || 30}% / {paymentSettings.intermedio_pct || 30}% / {paymentSettings.saldo_pct || 40}%)
                           </label>
                        </div>
                        
                        {!formData.use_split && (
                            <Select value={formData.payment_type} onValueChange={v => setFormData({ ...formData, payment_type: v })}>
                                <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-[#343a40] border-[#495057]">
                                    <SelectItem value="acconto" className="text-[#f8f9fa]">Acconto</SelectItem>
                                    <SelectItem value="saldo" className="text-[#f8f9fa]">Saldo</SelectItem>
                                    <SelectItem value="rata" className="text-[#f8f9fa]">Rata</SelectItem>
                                    <SelectItem value="fattura" className="text-[#f8f9fa]">Fattura</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <div>
                            <label className="text-xs text-[#adb5bd] block mb-1">Data Scadenza</label>
                            <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        <Textarea placeholder="Note" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreate} disabled={!formData.description || !formData.amount} className="w-full bg-emerald-600 hover:bg-emerald-700">Crea Pagamento</Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* PDF VIEWER */}
            <UniversalPdfViewer
                isOpen={isPdfOpen}
                onClose={() => setIsPdfOpen(false)}
                url={pdfUrl}
                title={pdfTitle}
            />

            {/* SETTINGS MODAL */}
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#f8f9fa] flex items-center gap-2">
                            <Settings size={18} className="text-emerald-400" /> Impostazioni Pagamenti
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-[#adb5bd]">Configura le percentuali di default per lo split dei pagamenti. La somma deve essere 100%.</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Acconto Iniziale %</label>
                                <Input type="number" min="0" max="100" value={settingsForm.acconto_pct} onChange={e => setSettingsForm({ ...settingsForm, acconto_pct: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Acconto 1 %</label>
                                <Input type="number" min="0" max="100" value={settingsForm.intermedio_pct} onChange={e => setSettingsForm({ ...settingsForm, intermedio_pct: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                            <div>
                                <label className="text-xs text-[#adb5bd] block mb-1">Saldo Finale %</label>
                                <Input type="number" min="0" max="100" value={settingsForm.saldo_pct} onChange={e => setSettingsForm({ ...settingsForm, saldo_pct: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                            </div>
                        </div>
                        {(() => {
                            const sum = (parseFloat(settingsForm.acconto_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                            return (
                                <div className={`text-sm font-medium text-center p-2 rounded-lg ${sum === 100 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    Totale: {sum}% {sum === 100 ? '✓' : '(deve essere 100%)'}
                                </div>
                            );
                        })()}
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setShowSettingsModal(false)} className="text-[#adb5bd] hover:text-white">Annulla</Button>
                            <Button
                                onClick={() => {
                                    const sum = (parseFloat(settingsForm.acconto_pct) || 0) + (parseFloat(settingsForm.intermedio_pct) || 0) + (parseFloat(settingsForm.saldo_pct) || 0);
                                    if (sum !== 100) { alert('La somma delle percentuali deve essere 100%.'); return; }
                                    const newSettings = { ...paymentSettings, ...settingsForm };
                                    localStorage.setItem('iwhome_payment_settings', JSON.stringify(newSettings));
                                    setPaymentSettings(newSettings);
                                    setShowSettingsModal(false);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                Salva Impostazioni
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
