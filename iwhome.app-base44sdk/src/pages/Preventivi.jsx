/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import {
    FileText, Download, Search, CheckCircle, XCircle, Clock, HardHat, Link2, Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

export default function Preventivi() {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [selectedCantiere, setSelectedCantiere] = useState(undefined);

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // Get role from Convex (source of truth)
    const convexUser = useQuery(api.users.getByEmail, { email: userEmail });
    const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'ceo';

    // Query quotes - admin sees all, users see their own
    const allQuotes = useQuery(api.quotes.getAll, {}) || [];
    const userQuotes = useQuery(api.quotes.getByUser, { email: userEmail }) || [];
    const quotes = isAdmin ? allQuotes : userQuotes;

    // Query cantieri for linking
    const cantieri = useQuery(api.cantieri.listCantieri, { company_email: userEmail }) || [];

    // Mutations
    const linkToCantiereMutation = useMutation(api.quotes.linkToCantiere);
    const unlinkFromCantiereMutation = useMutation(api.quotes.unlinkFromCantiere);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none"><CheckCircle size={12} className="mr-1" /> Accettato</Badge>;
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-none"><XCircle size={12} className="mr-1" /> Rifiutato</Badge>;
            case 'sent':
                return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-none"><FileText size={12} className="mr-1" /> Inviato</Badge>;
            default:
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-none"><Clock size={12} className="mr-1" /> In Attesa</Badge>;
        }
    };

    const getCantiereInfo = (cantiereId) => {
        if (!cantiereId) return null;
        return cantieri.find(c => c._id === cantiereId);
    };

    const handleLink = async () => {
        if (!selectedQuote || !selectedCantiere) return;
        await linkToCantiereMutation({
            quote_id: selectedQuote._id,
            cantiere_id: selectedCantiere
        });
        setLinkModalOpen(false);
        setSelectedQuote(null);
        setSelectedCantiere(undefined);
    };

    const handleUnlink = async (quoteId) => {
        await unlinkFromCantiereMutation({ quote_id: quoteId });
    };

    const filteredQuotes = quotes.filter(quote => {
        const matchesSearch =
            (quote.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.quote_type?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.email?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Loading state
    if (convexUser === undefined) {
        return (
            <div className="min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="text-[#f8f9fa]">Caricamento...</div>
            </div>
        );
    }

    // Access control - only Admin/CEO can access Preventivi management
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#212529] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2>
                    <p className="text-[#adb5bd]">Solo gli amministratori possono accedere alla gestione preventivi.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
            <AnimatedBackground />
            <VerticalMenu />

            <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-light text-[#f8f9fa] mb-2 flex items-center gap-3">
                                <FileText className="text-[#f8f9fa]" />
                                {isAdmin ? 'Gestione Preventivi' : 'I Miei Preventivi'}
                            </h1>
                            <p className="text-[#adb5bd]">
                                {isAdmin ? 'Visualizza e collega preventivi ai cantieri' : 'Visualizza e gestisci le tue richieste di preventivo'}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-8">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                <Input
                                    placeholder="Cerca preventivi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                <Button
                                    variant={statusFilter === 'all' ? "default" : "outline"}
                                    onClick={() => setStatusFilter('all')}
                                    className={statusFilter === 'all' ? "bg-[#f8f9fa] text-black" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                >
                                    Tutti
                                </Button>
                                <Button
                                    variant={statusFilter === 'pending' ? "default" : "outline"}
                                    onClick={() => setStatusFilter('pending')}
                                    className={statusFilter === 'pending' ? "bg-yellow-500 text-white border-none" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                >
                                    In Attesa
                                </Button>
                                <Button
                                    variant={statusFilter === 'accepted' ? "default" : "outline"}
                                    onClick={() => setStatusFilter('accepted')}
                                    className={statusFilter === 'accepted' ? "bg-green-500 text-white border-none" : "bg-transparent text-[#adb5bd] border-[#6c757d]"}
                                >
                                    Accettati
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Link to Cantiere Modal */}
                    <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
                        <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-[#f8f9fa]">Collega a Cantiere</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {selectedQuote && (
                                    <div className="bg-[#495057]/50 rounded-lg p-3">
                                        <p className="text-sm text-[#adb5bd]">Preventivo selezionato:</p>
                                        <p className="text-[#f8f9fa] font-medium">{selectedQuote.quote_type}</p>
                                        <p className="text-xs text-[#6c757d]">{selectedQuote.email}</p>
                                    </div>
                                )}

                                <Select value={selectedCantiere} onValueChange={setSelectedCantiere}>
                                    <SelectTrigger className="bg-[#495057] border-[#6c757d] text-[#f8f9fa]">
                                        <SelectValue placeholder="Seleziona cantiere..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#343a40] border-[#495057]">
                                        {cantieri.map(cantiere => (
                                            <SelectItem key={cantiere._id} value={cantiere._id} className="text-[#f8f9fa] focus:bg-[#495057]">
                                                <div className="flex items-center gap-2">
                                                    <HardHat size={14} />
                                                    {cantiere.nome_cantiere}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button onClick={handleLink} disabled={!selectedCantiere} className="w-full bg-blue-600 hover:bg-blue-700">
                                    <Link2 size={16} className="mr-2" /> Collega
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Quotes List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredQuotes.length === 0 ? (
                            <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                <FileText size={48} className="text-[#6c757d] mx-auto mb-4" />
                                <h3 className="text-xl text-[#dee2e6]">Nessun preventivo trovato</h3>
                                <p className="text-[#adb5bd] mt-2">Le tue richieste di preventivo appariranno qui.</p>
                            </div>
                        ) : (
                            filteredQuotes.map((quote) => {
                                const linkedCantiere = getCantiereInfo(quote.cantiere_id);
                                return (
                                    <motion.div
                                        key={quote._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h3 className="text-lg font-medium text-[#f8f9fa]">
                                                                Preventivo: {quote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                                    quote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'}
                                                            </h3>
                                                            {getStatusBadge(quote.status)}
                                                            {linkedCantiere && (
                                                                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-none">
                                                                    <HardHat size={12} className="mr-1" />
                                                                    {linkedCantiere.nome_cantiere}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-sm text-[#adb5bd] gap-4 flex-wrap">
                                                            {isAdmin && quote.full_name && (
                                                                <span className="text-[#f8f9fa]">{quote.full_name}</span>
                                                            )}
                                                            {isAdmin && (
                                                                <span className="text-[#6c757d]">{quote.email}</span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                {new Date(quote.created_date).toLocaleDateString('it-IT')}
                                                            </span>
                                                            {quote.estimated_price && (
                                                                <span className="text-[#f8f9fa] font-medium">
                                                                    € {quote.estimated_price.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {quote.notes && (
                                                            <p className="text-sm text-[#adb5bd] mt-2 line-clamp-2">{quote.notes}</p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {quote.files && quote.files.length > 0 && (
                                                            <Button variant="outline" className="text-[#f8f9fa] border-[#6c757d] hover:bg-[#495057]">
                                                                <Download size={16} className="mr-2" /> Scarica
                                                            </Button>
                                                        )}

                                                        {/* Admin linking controls */}
                                                        {isAdmin && (
                                                            linkedCantiere ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={() => handleUnlink(quote._id)}
                                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                                                >
                                                                    <Unlink size={16} className="mr-1" /> Scollega
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedQuote(quote);
                                                                        setLinkModalOpen(true);
                                                                    }}
                                                                    className="text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
                                                                >
                                                                    <Link2 size={16} className="mr-1" /> Collega a Cantiere
                                                                </Button>
                                                            )
                                                        )}

                                                        <Button variant="ghost" className="text-[#adb5bd] hover:text-[#f8f9fa]">
                                                            Dettagli
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
