import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api"; // Adjust path if needed
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  MessageSquare,
  Upload,
  Monitor
} from 'lucide-react';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import OnboardingModal from '../components/dashboard/OnboardingModal';
import WelcomeModal from '../components/dashboard/WelcomeModal';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeDevices, setActiveDevices] = useState(1);

  // Convex Queries
  const allQuotes = useQuery(api.quotes.get) || [];
  const appointments = useQuery(api.appointments.get) || [];
  const documents = useQuery(api.documents.get) || [];
  const conversations = useQuery(api.chat_channels.get) || []; // Assuming mapping to chat_channels
  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });

  // Mutations
  const updateQuoteStatusMutation = useMutation(api.quotes.updateStatus);

  useEffect(() => {
    trackDevice();
    // Auth check is handled by Clerk/Convex provider now
  }, []);

  const trackDevice = () => {
    const deviceId = localStorage.getItem('device_id') || `device_${Date.now()}_${Math.random()}`;
    localStorage.setItem('device_id', deviceId);
    localStorage.setItem('last_active', Date.now().toString());

    setInterval(() => {
      localStorage.setItem('last_active', Date.now().toString());
      const allDevices = Object.keys(localStorage)
        .filter(key => key.startsWith('device_') && key !== 'device_id')
        .map(key => parseInt(localStorage.getItem(key)))
        .filter(time => Date.now() - time < 60000);
      setActiveDevices(allDevices.length + 1);
    }, 10000);
  };

  // Filter Logic
  const quotes = allQuotes.filter(q => {
    let match = true;
    if (statusFilter !== 'all' && q.status !== statusFilter) match = false;
    if (typeFilter !== 'all' && q.quote_type !== typeFilter) match = false;

    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (!q.created_date.startsWith(today)) match = false;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      if (q.created_date < weekAgo) match = false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        q.full_name?.toLowerCase().includes(search) ||
        q.email?.toLowerCase().includes(search) ||
        // q.id.toLowerCase().includes(search); // ID might be different in Convex
        false;
      if (!matchesSearch) match = false;
    }

    return match;
  });

  const preventivi = documents.filter(doc => doc.category === 'preventivo');

  const updateQuoteStatus = async (quoteId, newStatus) => {
    await updateQuoteStatusMutation({ id: quoteId, status: newStatus });
  };

  const filteredQuotes = quotes.filter(quote => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      quote.full_name?.toLowerCase().includes(search) ||
      quote.email?.toLowerCase().includes(search) ||
      quote._id.toLowerCase().includes(search)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const stats = {
    totalQuotes: quotes.length,
    pendingQuotes: quotes.filter(q => q.status === 'draft' || q.status === 'sent').length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter(a => a.status === 'pending').length,
    totalDocuments: documents.length,
    totalPreventivi: preventivi.length,
    totalMessages: conversations.length
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212529] to-[#495057] flex items-center justify-center">
        <div className="text-[#f8f9fa]">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      <AnimatedBackground />

      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      {showWelcome && user && (
        <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />
      )}

      <VerticalMenu />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-[#f8f9fa] mb-1">
                  Area Privata
                </h1>
                <p className="text-xs sm:text-sm text-[#dee2e6]">Benvenuto, {user.fullName}</p>
              </div>
              {activeDevices > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg"
                >
                  <Monitor size={16} className="text-blue-400" />
                  <span className="text-sm text-blue-300">
                    {activeDevices} dispositivi attivi
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                  <CardTitle className="text-xs font-medium text-white/80">Preventivi</CardTitle>
                  <FileText className="h-4 w-4 text-white flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-light text-white">{stats.totalQuotes}</div>
                  <p className="text-xs text-white/60 mt-0.5 hidden sm:block">Form richieste</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                  <CardTitle className="text-xs font-medium text-white/80">Prev. Doc</CardTitle>
                  <FileText className="h-4 w-4 text-white flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-light text-white">{stats.totalPreventivi}</div>
                  <p className="text-xs text-white/60 mt-0.5 hidden sm:block">File caricati</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                  <CardTitle className="text-xs font-medium text-white/80">Appuntamenti</CardTitle>
                  <Calendar className="h-4 w-4 text-white flex-shrink-0" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-2xl font-light text-white">{stats.totalAppointments}</div>
                </CardContent>
              </Card>
            </motion.div>

            <Link to={createPageUrl('Documents')} className="block h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ y: -4 }}
                className="h-full"
              >
                <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                    <CardTitle className="text-xs font-medium text-white/80">Documenti</CardTitle>
                    <Upload className="h-4 w-4 text-white flex-shrink-0" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="text-2xl font-light text-white">{stats.totalDocuments}</div>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>

            {convexUser?.is_company && (
              <Link to={createPageUrl('Messages')} className="block h-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                      <CardTitle className="text-xs font-medium text-white/80">Messaggi</CardTitle>
                      <MessageSquare className="h-4 w-4 text-white flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-light text-white">{stats.totalMessages}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="quotes" className="space-y-4 sm:space-y-6">
            <TabsList className="bg-[#343a40] border border-[#f8f9fa]/20 w-full grid grid-cols-3">
              <TabsTrigger value="quotes" className="data-[state=active]:bg-[#f8f9fa]/20 text-xs sm:text-sm">
                Form
              </TabsTrigger>
              <TabsTrigger value="preventivi-docs" className="data-[state=active]:bg-[#f8f9fa]/20 text-xs sm:text-sm">
                Docs
              </TabsTrigger>
              <TabsTrigger value="appointments" className="data-[state=active]:bg-[#f8f9fa]/20 text-xs sm:text-sm">
                Appunt.
              </TabsTrigger>
            </TabsList>

            {/* Quotes Tab */}
            <TabsContent value="quotes" className="space-y-4 sm:space-y-6">
              {/* Filters */}
              <Card className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-[#f8f9fa] flex items-center gap-2 text-base sm:text-lg">
                    <Filter size={18} className="sm:w-5 sm:h-5" />
                    Filtri
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-[#dee2e6]">Cerca</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-[#adb5bd]" />
                        <Input
                          placeholder="Nome, email, ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#dee2e6]">Stato</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="draft">Bozza</SelectItem>
                          <SelectItem value="sent">Inviato</SelectItem>
                          <SelectItem value="accepted">Accettato</SelectItem>
                          <SelectItem value="rejected">Rifiutato</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[#dee2e6]">Tipo</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="finestre">Finestre</SelectItem>
                          <SelectItem value="chiavi_in_mano">Chiavi in Mano</SelectItem>
                          <SelectItem value="completo">Completo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[#dee2e6]">Data</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutte</SelectItem>
                          <SelectItem value="today">Oggi</SelectItem>
                          <SelectItem value="week">Ultima Settimana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quotes List */}
              <div className="space-y-4">
                {filteredQuotes.map((quote) => (
                  <Card key={quote._id} className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(quote.status)}
                            <h3 className="font-medium text-[#f8f9fa]">{quote.full_name || 'N/A'}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-[#f8f9fa]/10 text-[#dee2e6]">
                              {quote.quote_type}
                            </span>
                          </div>
                          <p className="text-sm text-[#dee2e6]">{quote.email}</p>
                          <p className="text-sm text-[#adb5bd]">
                            Prezzo: €{quote.estimated_price?.toLocaleString() || 'N/A'}
                          </p>
                          {quote.files && quote.files.length > 0 && (
                            <p className="text-xs text-[#adb5bd] mt-1">
                              📎 {quote.files.length} file allegati
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Select
                            value={quote.status}
                            onValueChange={(value) => updateQuoteStatus(quote._id, value)}
                          >
                            <SelectTrigger className="w-32 bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Bozza</SelectItem>
                              <SelectItem value="sent">Inviato</SelectItem>
                              <SelectItem value="accepted">Accettato</SelectItem>
                              <SelectItem value="rejected">Rifiutato</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredQuotes.length === 0 && (
                  <div className="text-center py-12 text-[#adb5bd]">
                    Nessun preventivo trovato
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Preventivi Documenti Tab */}
            <TabsContent value="preventivi-docs" className="space-y-4">
              {preventivi.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={64} className="text-[#6c757d] mx-auto mb-4" />
                  <p className="text-[#dee2e6] text-lg">Nessun preventivo caricato</p>
                  <p className="text-[#adb5bd] text-sm mt-2">Carica i tuoi preventivi dalla sezione Documenti</p>
                </div>
              ) : (
                preventivi.map((doc) => (
                  <Card key={doc._id} className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20">
                    <CardContent className="pt-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-cyan-400" />
                            <h3 className="font-medium text-[#f8f9fa]">{doc.title}</h3>
                          </div>
                          {doc.description && (
                            <p className="text-sm text-[#dee2e6] mb-2">{doc.description}</p>
                          )}
                          <p className="text-sm text-[#adb5bd]">
                            {doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-[#6c757d] mt-1">
                            Caricato il {new Date(doc.created_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                          >
                            <Eye size={14} className="mr-1" />
                            Visualizza
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-4">
              {appointments.map((apt) => (
                <Card key={apt._id} className="bg-gradient-to-br from-[#495057] to-[#6c757d] border-[#f8f9fa]/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-[#f8f9fa]">{apt.full_name}</h3>
                        <p className="text-sm text-[#dee2e6]">{apt.email}</p>
                        <p className="text-sm text-[#adb5bd]">
                          {new Date(apt.appointment_date).toLocaleDateString('it-IT')} - {apt.appointment_time}
                        </p>
                        <p className="text-xs text-[#adb5bd]">{apt.project_type}</p>
                      </div>
                      <div className="text-sm px-3 py-1 rounded-full bg-[#f8f9fa]/10 text-[#dee2e6]">
                        {apt.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}