/// <reference types="vite/client" />
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useNavigate } from 'react-router-dom';
import useRBAC from '../hooks/useRBAC';
import {
    QrCode, Search, Loader2, MapPin, Phone, Mail, Briefcase,
    Clock, Eye, CheckCircle, Scan, ExternalLink, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';

const liveStatusConfig = {
    in_cantiere: { label: 'In Cantiere', dot: 'bg-green-400 animate-pulse' },
    in_ufficio: { label: 'In Ufficio', dot: 'bg-blue-400' },
    disponibile: { label: 'Disponibile', dot: 'bg-yellow-400' },
    non_disponibile: { label: 'Non Disponibile', dot: 'bg-gray-400' },
};

export default function StaffQR() {
    const { isAdmin, canView, isLoading: rbacLoading } = useRBAC();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);

    const collaborators = useQuery(api.collaborators.list, {}) || [];

    if (rbacLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>);
    }

    if (!canView('staff_qr')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
                <AnimatedBackground /><VerticalMenu />
                <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen flex items-center justify-center">
                    <div className="text-center"><h2 className="text-xl text-[#f8f9fa] mb-2">Accesso Negato</h2><p className="text-[#adb5bd]">Non hai i permessi per accedere a questa sezione.</p></div>
                </div>
            </div>
        );
    }

    const handleShowQR = (collab) => {
        setSelectedCollab(collab);
        setShowQRModal(true);
    };

    const filteredCollaborators = collaborators.filter(c => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return c.full_name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.job_title.toLowerCase().includes(s);
    });

    // Generate a simple QR code SVG (using data pattern)
    const generateQRSvg = (data) => {
        const size = 200;
        const modules = 25;
        const cellSize = size / modules;
        // Simple hash-based pattern generation (visual placeholder)
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash |= 0;
        }
        const cells = [];
        for (let r = 0; r < modules; r++) {
            for (let c = 0; c < modules; c++) {
                // Position detection patterns (corners)
                const isCorner = (r < 7 && c < 7) || (r < 7 && c >= modules - 7) || (r >= modules - 7 && c < 7);
                const isCornerBorder = isCorner && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= modules - 7 && (r === modules - 7 || r === modules - 1)) || (c >= modules - 7 && (c === modules - 7 || c === modules - 1)));
                const isCornerCenter = isCorner && r >= 2 && r <= 4 && c >= 2 && c <= 4;
                const isCornerCenterR = isCorner && r >= 2 && r <= 4 && c >= modules - 5 && c <= modules - 3;
                const isCornerCenterB = isCorner && r >= modules - 5 && r <= modules - 3 && c >= 2 && c <= 4;

                const shouldFill = isCornerBorder || isCornerCenter || isCornerCenterR || isCornerCenterB ||
                    (!isCorner && ((hash * (r * modules + c + 1)) % 3 === 0));

                if (shouldFill) {
                    cells.push(`<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#f8f9fa" />`);
                }
            }
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#212529" />${cells.join('')}</svg>`;
    };

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
                                <QrCode className="text-cyan-400" /> Staff QR
                            </h1>
                            <p className="text-[#adb5bd]">Codici QR per accesso rapido ai dati del personale e presenza cantieri</p>
                        </div>
                        <Button onClick={() => navigate('/Collaboratori')} variant="outline" className="border-[#495057] text-[#adb5bd] hover:bg-[#495057]/50 gap-2">
                            <Users size={16} /> Vai a Collaboratori
                        </Button>
                    </div>

                    {/* Search */}
                    <Card className="bg-[#343a40]/50 backdrop-blur-xl border border-[#495057] mb-6">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                                <Input placeholder="Cerca collaboratore..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-[#495057] border-[#6c757d] text-[#f8f9fa] placeholder:text-[#adb5bd]" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Staff Grid */}
                    {filteredCollaborators.length === 0 ? (
                        <div className="text-center py-12 bg-[#343a40]/50 rounded-2xl border border-[#495057]">
                            <QrCode size={48} className="text-[#6c757d] mx-auto mb-4" />
                            <h3 className="text-xl text-[#dee2e6]">Nessun collaboratore trovato</h3>
                            <p className="text-[#adb5bd] mt-2">Aggiungi collaboratori dalla sezione Collaboratori</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredCollaborators.map((collab) => {
                                const liveConfig = liveStatusConfig[collab.live_status] || liveStatusConfig.non_disponibile;
                                return (
                                    <motion.div key={collab._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }}>
                                        <Card className="bg-[#343a40] border border-[#495057] hover:border-cyan-500/50 transition-all cursor-pointer" onClick={() => handleShowQR(collab)}>
                                            <CardContent className="p-5 text-center">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 relative">
                                                    {collab.full_name[0]}
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#343a40] ${liveConfig.dot}`} />
                                                </div>
                                                <h3 className="text-[#f8f9fa] font-medium mb-1">{collab.full_name}</h3>
                                                <p className="text-xs text-[#adb5bd] mb-3">{collab.job_title}</p>
                                                <Badge variant="default" className={`text-xs ${collab.type === 'internal' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                    {collab.type === 'internal' ? 'Dipendente' : 'Esterno'}
                                                </Badge>
                                                {/* Mini QR */}
                                                <div className="mt-4 p-3 bg-[#212529] rounded-xl border border-[#495057] w-24 h-24 mx-auto flex items-center justify-center">
                                                    <QrCode size={48} className="text-cyan-400/60" />
                                                </div>
                                                <p className="text-[10px] text-[#6c757d] mt-2">Tocca per QR completo</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* QR MODAL */}
            <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
                <DialogContent className="bg-[#343a40] border-[#495057] text-[#f8f9fa] max-w-sm">
                    <DialogHeader><DialogTitle className="text-[#f8f9fa] text-center">Codice QR</DialogTitle></DialogHeader>
                    {selectedCollab && (
                        <div className="text-center py-4">
                            {/* QR Code */}
                            <div className="bg-[#212529] rounded-2xl p-6 border border-[#495057] inline-block mb-4">
                                <div dangerouslySetInnerHTML={{ __html: generateQRSvg(selectedCollab.qr_code_data || selectedCollab._id) }} />
                            </div>
                            <h3 className="text-lg font-medium text-[#f8f9fa] mb-1">{selectedCollab.full_name}</h3>
                            <p className="text-sm text-[#adb5bd] mb-2">{selectedCollab.job_title}</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-[#6c757d]">
                                <Mail size={14} /> {selectedCollab.email}
                            </div>
                            {selectedCollab.phone && (
                                <div className="flex items-center justify-center gap-2 text-sm text-[#6c757d] mt-1">
                                    <Phone size={14} /> {selectedCollab.phone}
                                </div>
                            )}
                            <p className="text-[10px] text-[#6c757d] mt-4 border-t border-[#495057] pt-3">
                                ID: {selectedCollab.qr_code_data || selectedCollab._id}
                            </p>
                            <Button onClick={() => { setShowQRModal(false); navigate('/Collaboratori'); }} variant="outline" size="sm" className="mt-3 border-[#495057] text-[#adb5bd] hover:bg-[#495057]/50 gap-1 text-xs w-full">
                                <ExternalLink size={12} /> Apri Profilo Completo
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
