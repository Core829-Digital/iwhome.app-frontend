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
    Users, Truck, Briefcase, Calendar, Eye, ExternalLink, Building2
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

const paymentStatusConfig = {
    in_attesa: { label: 'In Attesa', icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
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
    const { user } = useUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || "";
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('supplier');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        type: 'supplier', reference_id: '', reference_name: '', description: '',
        amount: '', payment_type: 'fattura', due_date: '', notes: '', cantiere_id: '',
    });

    const payments = useQuery(api.payments.list, { type: activeTab }) || [];
    const stats = useQuery(api.payments.getStats) || null;
    const createMutation = useMutation(api.payments.create);
    const updateMutation = useMutation(api.payments.update);
    const removeMutation = useMutation(api.payments.remove);

    // Supplier/Collaborator lists for linking
    const suppliers = useQuery(api.suppliers.list) || [];
    const collaborators = useQuery(api.collaborators.list, {}) || [];
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];

    if (rbacLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>);
    }

    if (!canView('pagamenti')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
                <AnimatedBackground /><VerticalMenu />
                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    const handleCreate = async () => {
        if (!formData.description || !formData.amount) return;
        try {
            await createMutation({
                type: formData.type,
                reference_id: formData.reference_id || 'N/A',
                reference_name: formData.reference_name || undefined,
                description: formData.description,
                amount: parseFloat(formData.amount),
                payment_type: formData.payment_type || undefined,
                due_date: formData.due_date || undefined,
                notes: formData.notes || undefined,
                cantiere_id: formData.cantiere_id || undefined,
                supplier_id: formData.type === 'supplier' && formData.reference_id ? formData.reference_id : undefined,
                collaborator_id: formData.type === 'collaborator' && formData.reference_id ? formData.reference_id : undefined,
            });
            setShowCreateModal(false);
            setFormData({ type: 'supplier', reference_id: '', reference_name: '', description: '', amount: '', payment_type: 'fattura', due_date: '', notes: '', cantiere_id: '' });
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

    const filteredPayments = payments.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return p.description.toLowerCase().includes(s) || p.reference_name?.toLowerCase().includes(s) || p.invoice_number?.toLowerCase().includes(s);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            <AnimatedBackground />
            <VerticalMenu />
            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <CreditCard className="text-emerald-400" /> Pagamenti
                            </h1>
                            <p className="text-[#adb5bd]">Dashboard pagamenti unificata — fornitori, collaboratori e clienti</p>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                                <Plus size={16} className="mr-2" /> Nuovo Pagamento
                            </Button>
                        )}
                    </div>

                    {/* Stats Overview */}
                    {stats && isAdmin && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                            {[
                                { label: 'Totale', value: stats.total, color: 'from-emerald-600/80 to-emerald-700/80' },
                                { label: 'Pagati', value: `€${(stats.totalPaid / 1000).toFixed(0)}k`, color: 'from-green-600/80 to-green-700/80' },
                                { label: 'In Attesa', value: `€${(stats.totalPending / 1000).toFixed(0)}k`, color: 'from-yellow-600/80 to-yellow-700/80' },
                                { label: 'In Ritardo', value: `€${(stats.totalOverdue / 1000).toFixed(0)}k`, color: 'from-red-600/80 to-red-700/80' },
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
                                {Object.entries(typeConfig).map(([key, conf]) => (
                                    <TabsTrigger key={key} value={key} className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[#adb5bd]">
                                        <conf.icon size={16} className="mr-2" /> {conf.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
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
                                                        {isAdmin && payment.status !== 'pagato' && (
                                                            <Button size="sm" onClick={() => handleMarkPaid(payment._id)} className="bg-green-600 hover:bg-green-700 text-xs h-8">
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

                        <Input placeholder="Descrizione *" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Input placeholder="Importo (€) *" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Select value={formData.payment_type} onValueChange={v => setFormData({ ...formData, payment_type: v })}>
                            <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#343a40] border-[#495057]">
                                <SelectItem value="acconto" className="text-[#f8f9fa]">Acconto</SelectItem>
                                <SelectItem value="saldo" className="text-[#f8f9fa]">Saldo</SelectItem>
                                <SelectItem value="rata" className="text-[#f8f9fa]">Rata</SelectItem>
                                <SelectItem value="fattura" className="text-[#f8f9fa]">Fattura</SelectItem>
                            </SelectContent>
                        </Select>
                        <div>
                            <label className="text-xs text-[#adb5bd] block mb-1">Data Scadenza</label>
                            <Input type="date" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        </div>
                        <Textarea placeholder="Note" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]" />
                        <Button onClick={handleCreate} disabled={!formData.description || !formData.amount} className="w-full bg-emerald-600 hover:bg-emerald-700">Crea Pagamento</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
