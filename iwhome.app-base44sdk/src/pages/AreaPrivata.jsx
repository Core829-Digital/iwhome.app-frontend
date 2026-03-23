/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import {
    FileText, CreditCard, HardHat, FolderOpen, Clock, CheckCircle, XCircle,
    Upload, Loader2, AlertTriangle, Calendar, Eye, Download, RefreshCw, Activity,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';

const quoteStatusBadge = (status) => {
    switch (status) {
        case 'accepted': return <Badge className="bg-green-500/20 text-green-400 border-none text-xs"><CheckCircle size={11} className="mr-1" />Accettato</Badge>;
        case 'rejected': return <Badge className="bg-red-500/20 text-red-400 border-none text-xs"><XCircle size={11} className="mr-1" />Rifiutato</Badge>;
        case 'sent':     return <Badge className="bg-blue-500/20 text-blue-400 border-none text-xs"><FileText size={11} className="mr-1" />Preventivo Inviato</Badge>;
        case 'request':  return <Badge className="bg-cyan-500/20 text-cyan-400 border-none text-xs"><Clock size={11} className="mr-1" />In Valutazione</Badge>;
        case 'in_lavorazione': return <Badge className="bg-purple-500/20 text-purple-400 border-none text-xs"><Activity size={11} className="mr-1" />In Lavorazione</Badge>;
        case 'scaduto':  return <Badge className="bg-gray-500/20 text-gray-400 border-none text-xs"><XCircle size={11} className="mr-1" />Scaduto</Badge>;
        default:         return <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-xs"><Clock size={11} className="mr-1" />In Attesa</Badge>;
    }
};

const paymentStatusBadge = (status) => {
    switch (status) {
        case 'confirmed': return <Badge className="bg-green-500/20 text-green-400 border-none text-xs"><CheckCircle size={11} className="mr-1" />Confermato</Badge>;
        case 'pending':   return <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-xs"><Clock size={11} className="mr-1" />In Attesa</Badge>;
        case 'overdue':   return <Badge className="bg-red-500/20 text-red-400 border-none text-xs"><AlertTriangle size={11} className="mr-1" />Scaduto</Badge>;
        default:          return <Badge className="bg-gray-500/20 text-gray-400 border-none text-xs">{status}</Badge>;
    }
};

const cantiereStatusBadge = (status) => {
    switch (status) {
        case 'attivo':      return <Badge className="bg-blue-500/20 text-blue-400 border-none text-xs"><Activity size={11} className="mr-1" />Attivo</Badge>;
        case 'in_pausa':    return <Badge className="bg-yellow-500/20 text-yellow-400 border-none text-xs"><Clock size={11} className="mr-1" />In Pausa</Badge>;
        case 'completato':  return <Badge className="bg-green-500/20 text-green-400 border-none text-xs"><CheckCircle size={11} className="mr-1" />Completato</Badge>;
        case 'pianificato': return <Badge className="bg-purple-500/20 text-purple-400 border-none text-xs"><Calendar size={11} className="mr-1" />Pianificato</Badge>;
        default:            return <Badge className="bg-gray-500/20 text-gray-400 border-none text-xs">{status}</Badge>;
    }
};

function EmptyState({ icon: Icon, title, text }) {
    return (
        <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
            <Icon size={40} className="text-[#6c757d] mx-auto mb-3" />
            <h3 className="text-lg text-[#dee2e6] mb-1">{title}</h3>
            <p className="text-[#adb5bd] text-sm">{text}</p>
        </div>
    );
}

export default function AreaPrivata() {
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress || '';

    const [viewPdfUrl, setViewPdfUrl] = useState(null);
    const [uploadingPaymentId, setUploadingPaymentId] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('preventivi');

    const convexUser = useQuery(api.users.getByEmail, email ? { email } : 'skip');
    const myQuotes = useQuery(api.quotes.getByUser, email ? { email } : 'skip') || [];
    const myPayments = useQuery(api.payments.list, {}) || [];
    const myDocuments = useQuery(api.documents.get, {}) || [];

    const allCantieri = useQuery(
        api.cantieri.listCantieri,
        email ? { company_email: email } : 'skip'
    ) || [];

    const myCantieri = convexUser?._id
        ? allCantieri.filter(c => c.client_id === convexUser._id || c.company_email === email)
        : [];

    const clientPayments = myPayments.filter(p => p.type === 'client');
    const pendingPayments = clientPayments.filter(p => p.status === 'pending');

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const uploadPaymentProof = useMutation(api.payments.uploadProof);

    const handleProofUpload = async (paymentId) => {
        if (!uploadFile) return;
        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: 'POST',
                headers: { 'Content-Type': uploadFile.type },
                body: uploadFile,
            });
            if (!result.ok) throw new Error('Upload failed');
            const { storageId } = await result.json();
            await uploadPaymentProof({ payment_id: paymentId, proof_url: storageId });
            setUploadingPaymentId(null);
            setUploadFile(null);
            alert('Prova di pagamento inviata! IWHome la verificherà a breve.');
        } catch (err) {
            console.error(err);
            alert('Errore durante il caricamento. Riprova.');
        } finally {
            setIsUploading(false);
        }
    };

    if (convexUser === undefined) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={36} />
            </div>
        );
    }

    if (convexUser?.role !== 'client' && convexUser?.role !== 'admin' && convexUser?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2>
                    <p className="text-[#adb5bd]">Questa pagina è riservata ai clienti.</p>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'preventivi', label: 'Preventivi',  icon: FileText, count: myQuotes.length },
        { id: 'pagamenti',  label: 'Pagamenti',   icon: CreditCard, count: pendingPayments.length, alert: pendingPayments.length > 0 },
        { id: 'cantieri',   label: 'Cantieri',    icon: HardHat, count: myCantieri.length },
        { id: 'documenti',  label: 'Documenti',   icon: FolderOpen, count: myDocuments.length },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            <UniversalPdfViewer
                isOpen={!!viewPdfUrl}
                onClose={() => setViewPdfUrl(null)}
                url={viewPdfUrl}
                title="Documento"
            />

            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-light text-[#f8f9fa]">
                                    Benvenuto, {convexUser?.full_name || user?.firstName || 'Cliente'}
                                </h1>
                                <p className="text-[#adb5bd] text-sm flex items-center gap-1">
                                    <RefreshCw size={11} className="text-green-400" /> Area Privata · Aggiornata in tempo reale
                                </p>
                            </div>
                        </div>

                        {/* Summary stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            <StatCard label="Preventivi" value={myQuotes.length} color="blue" />
                            <StatCard label="Pagamenti in attesa" value={pendingPayments.length} color={pendingPayments.length > 0 ? 'amber' : 'green'} />
                            <StatCard label="Cantieri Attivi" value={myCantieri.filter(c => c.status === 'attivo').length} color="purple" />
                            <StatCard label="Documenti" value={myDocuments.length} color="cyan" />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-[#343a40]/50 rounded-xl p-1 mb-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                                    activeTab === tab.id
                                        ? 'bg-[#f8f9fa] text-[#212529]'
                                        : 'text-[#adb5bd] hover:text-[#f8f9fa]'
                                }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        tab.alert ? 'bg-amber-500 text-white' :
                                        activeTab === tab.id ? 'bg-[#343a40] text-[#f8f9fa]' : 'bg-[#495057] text-[#f8f9fa]'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── PREVENTIVI ── */}
                    {activeTab === 'preventivi' && (
                        <div className="space-y-3">
                            {myQuotes.length === 0
                                ? <EmptyState icon={FileText} title="Nessun preventivo" text="Le tue richieste di preventivo appariranno qui." />
                                : myQuotes.map(quote => (
                                    <motion.div key={quote._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057]">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <p className="font-medium text-[#f8f9fa]">
                                                                {quote.title || (
                                                                    quote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                                    quote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'
                                                                )}
                                                            </p>
                                                            {quoteStatusBadge(quote.status)}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-[#adb5bd] flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {new Date(quote.created_date).toLocaleDateString('it-IT')}
                                                            </span>
                                                            {quote.estimated_price && (
                                                                <span className="text-[#f8f9fa] font-medium">
                                                                    € {quote.estimated_price.toLocaleString('it-IT')}
                                                                </span>
                                                            )}
                                                            {quote.client_quote_expires_at && quote.status === 'sent' && (() => {
                                                                const diff = new Date(quote.client_quote_expires_at) - new Date();
                                                                const hours = Math.floor(diff / 3600000);
                                                                if (diff > 0 && hours <= 24) return (
                                                                    <span key="expiry-urgent" className="text-red-400 flex items-center gap-1 animate-pulse">
                                                                        <AlertTriangle size={12} /> Scade tra {hours}h
                                                                    </span>
                                                                );
                                                                if (diff > 0) return (
                                                                    <span key="expiry" className="text-amber-400 flex items-center gap-1">
                                                                        <Calendar size={12} /> Scade il {new Date(quote.client_quote_expires_at).toLocaleDateString('it-IT')}
                                                                    </span>
                                                                );
                                                                return null;
                                                            })()}
                                                        </div>
                                                        {quote.notes && (
                                                            <p className="text-xs text-[#6c757d] mt-2 line-clamp-2">{quote.notes}</p>
                                                        )}
                                                    </div>
                                                    {quote.files && quote.files.length > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                                                            onClick={() => setViewPdfUrl(quote.files[0])}
                                                        >
                                                            <Eye size={13} className="mr-1" /> Allegato
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}

                    {/* ── PAGAMENTI ── */}
                    {activeTab === 'pagamenti' && (
                        <div className="space-y-3">
                            {clientPayments.length === 0
                                ? <EmptyState icon={CreditCard} title="Nessun pagamento" text="I pagamenti relativi ai tuoi progetti appariranno qui." />
                                : clientPayments.map(payment => (
                                    <motion.div key={payment._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className={`border ${payment.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#495057] bg-[#343a40]'}`}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <p className="font-medium text-[#f8f9fa]">{payment.description || 'Pagamento'}</p>
                                                            {paymentStatusBadge(payment.status)}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-[#adb5bd] flex-wrap">
                                                            {payment.amount && (
                                                                <span className="text-xl font-bold text-[#f8f9fa]">€ {payment.amount.toLocaleString('it-IT')}</span>
                                                            )}
                                                            {payment.due_date && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} /> Scadenza: {new Date(payment.due_date).toLocaleDateString('it-IT')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {payment.payment_instructions && (
                                                            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300 whitespace-pre-wrap">
                                                                {payment.payment_instructions}
                                                            </div>
                                                        )}
                                                        {payment.proof_url && payment.status === 'pending' && (
                                                            <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                                                <CheckCircle size={11} /> Prova inviata – in verifica
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2">
                                                        {payment.status === 'pending' && !payment.proof_url && (
                                                            uploadingPaymentId === payment._id ? (
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*,.pdf"
                                                                        className="text-xs text-[#adb5bd] max-w-[180px]"
                                                                        onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-[#adb5bd] h-7 text-xs"
                                                                            onClick={() => { setUploadingPaymentId(null); setUploadFile(null); }}
                                                                        >
                                                                            Annulla
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                                                                            disabled={!uploadFile || isUploading}
                                                                            onClick={() => handleProofUpload(payment._id)}
                                                                        >
                                                                            {isUploading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Upload size={12} className="mr-1" />}
                                                                            Invia
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-amber-600 hover:bg-amber-700"
                                                                    onClick={() => setUploadingPaymentId(payment._id)}
                                                                >
                                                                    <Upload size={13} className="mr-1" /> Carica Prova Pagamento
                                                                </Button>
                                                            )
                                                        )}
                                                        {payment.proof_url && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                                                                onClick={() => setViewPdfUrl(payment.proof_url)}
                                                            >
                                                                <Eye size={13} className="mr-1" /> Prova
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}

                    {/* ── CANTIERI (Real-time) ── */}
                    {activeTab === 'cantieri' && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <RefreshCw size={13} className="text-green-400" style={{ animation: 'spin 3s linear infinite' }} />
                                <span className="text-xs text-green-400">Aggiornamento in tempo reale</span>
                            </div>
                            {myCantieri.length === 0
                                ? <EmptyState icon={HardHat} title="Nessun cantiere" text="I tuoi cantieri attivi appariranno qui con aggiornamenti in tempo reale." />
                                : myCantieri.map(cantiere => (
                                    <motion.div key={cantiere._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057]">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <HardHat size={16} className="text-purple-400" />
                                                    <p className="font-medium text-[#f8f9fa]">{cantiere.nome_cantiere}</p>
                                                    {cantiereStatusBadge(cantiere.status)}
                                                </div>

                                                {cantiere.indirizzo && (
                                                    <p className="text-xs text-[#adb5bd] mb-3">{cantiere.indirizzo}</p>
                                                )}

                                                {cantiere.progress_percentage !== undefined && (
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-[#adb5bd] mb-1">
                                                            <span>Avanzamento lavori</span>
                                                            <span className="font-medium text-[#f8f9fa]">{cantiere.progress_percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-[#495057] rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(100, cantiere.progress_percentage)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-4 flex-wrap">
                                                    {cantiere.data_inizio && (
                                                        <div>
                                                            <p className="text-[10px] text-[#6c757d] uppercase">Inizio</p>
                                                            <p className="text-xs text-[#dee2e6]">{new Date(cantiere.data_inizio).toLocaleDateString('it-IT')}</p>
                                                        </div>
                                                    )}
                                                    {cantiere.data_fine_prevista && (
                                                        <div>
                                                            <p className="text-[10px] text-[#6c757d] uppercase">Fine Prevista</p>
                                                            <p className="text-xs text-[#dee2e6]">{new Date(cantiere.data_fine_prevista).toLocaleDateString('it-IT')}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {cantiere.fase_corrente && (
                                                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                                                        <p className="text-[10px] text-blue-400 uppercase mb-1">Fase Corrente</p>
                                                        <p className="text-sm text-[#f8f9fa]">{cantiere.fase_corrente}</p>
                                                    </div>
                                                )}

                                                {cantiere.note_cliente && (
                                                    <div className="mt-2 bg-[#495057]/30 rounded p-2">
                                                        <p className="text-[10px] text-[#adb5bd] uppercase mb-1">Note</p>
                                                        <p className="text-xs text-[#dee2e6]">{cantiere.note_cliente}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}

                    {/* ── DOCUMENTI ── */}
                    {activeTab === 'documenti' && (
                        <div className="space-y-3">
                            {myDocuments.length === 0
                                ? <EmptyState icon={FolderOpen} title="Nessun documento" text="I documenti condivisi con te appariranno qui." />
                                : myDocuments.map(doc => (
                                    <motion.div key={doc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                        <Card className="bg-[#343a40] border border-[#495057]">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FileText size={15} className="text-blue-400 shrink-0" />
                                                            <p className="font-medium text-[#f8f9fa] truncate">{doc.title}</p>
                                                        </div>
                                                        {doc.description && <p className="text-xs text-[#adb5bd] truncate">{doc.description}</p>}
                                                        {doc.created_date && (
                                                            <p className="text-xs text-[#6c757d] mt-1">{new Date(doc.created_date).toLocaleDateString('it-IT')}</p>
                                                        )}
                                                    </div>
                                                    {doc.file_url && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-400 border-blue-500/30 hover:bg-blue-500/20 shrink-0"
                                                            onClick={() => setViewPdfUrl(doc.file_url)}
                                                        >
                                                            <Download size={13} className="mr-1" /> Apri
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colorMap = {
        blue:  { bg: 'bg-blue-500/10',  border: 'border-blue-500/20',  text: 'text-blue-400' },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
        green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
        purple:{ bg: 'bg-purple-500/10',border: 'border-purple-500/20',text: 'text-purple-400'},
        cyan:  { bg: 'bg-cyan-500/10',  border: 'border-cyan-500/20',  text: 'text-cyan-400' },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className={`${c.bg} border ${c.border} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
            <p className="text-xs text-[#adb5bd] mt-1">{label}</p>
        </div>
    );
}
