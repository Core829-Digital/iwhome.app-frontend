/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import {
    FileText, Download, Share2, Search, Filter, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

export default function Preventivi() {
    const { user } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const userEmail = user?.primaryEmailAddress?.emailAddress || "";

    // Query quotes (Preventivi)
    const quotes = useQuery(api.quotes.getByUser, { email: userEmail }) || [];

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

    const filteredQuotes = quotes.filter(quote => {
        const matchesSearch =
            (quote.notes?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (quote.quote_type?.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

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
                                I Miei Preventivi
                            </h1>
                            <p className="text-[#adb5bd]">Visualizza e gestisci le tue richieste di preventivo</p>
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

                    {/* Quotes List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredQuotes.length === 0 ? (
                            <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                                <FileText size={48} className="text-[#6c757d] mx-auto mb-4" />
                                <h3 className="text-xl text-[#dee2e6]">Nessun preventivo trovato</h3>
                                <p className="text-[#adb5bd] mt-2">Le tue richieste di preventivo appariranno qui.</p>
                            </div>
                        ) : (
                            filteredQuotes.map((quote) => (
                                <motion.div
                                    key={quote._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="bg-[#343a40] border border-[#495057] hover:border-[#6c757d] transition-all">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-medium text-[#f8f9fa]">
                                                            Preventivo: {quote.quote_type === 'finestre' ? 'Infissi e Serramenti' :
                                                                quote.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 'Progetto Completo'}
                                                        </h3>
                                                        {getStatusBadge(quote.status)}
                                                    </div>
                                                    <div className="flex items-center text-sm text-[#adb5bd] gap-4">
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
                                                    <Button variant="ghost" className="text-[#adb5bd] hover:text-[#f8f9fa]">
                                                        Dettagli
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
