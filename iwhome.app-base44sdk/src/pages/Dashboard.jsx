import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
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
  Monitor,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  Bell,
  ArrowRight,
  UserPlus,
  Plus,
  Hammer,
  Trash2,
  Link2,
  Loader2
} from 'lucide-react';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import OnboardingModal from '../components/dashboard/OnboardingModal';
import WelcomeModal from '../components/dashboard/WelcomeModal';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';
import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Dashboard() {
  const { user } = useUser();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeDevices, setActiveDevices] = useState(1);

  // PDF Viewer State
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  // Convex Queries
  const allQuotes = useQuery(api.quotes.get) || [];
  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });
  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'ceo';
  const isClient = convexUser?.role === 'client';
  const isUser = !isAdmin && !isClient;

  // Admin-only comprehensive stats
  const adminStats = useQuery(api.adminStats.getAdminStats) || null;
  const recentActivity = useQuery(api.adminStats.getRecentActivity, { limit: 8 }) || [];
  const cantieriProgress = useQuery(api.adminStats.getCantieriProgress) || [];

  // Conditionally fetch data based on role
  const myAppointments = useQuery(api.appointments.get) || [];
  const allAppointments = useQuery(api.appointments.getAll) || [];

  // Filter out pending appointments if any still exist, or treat them as confirmed
  const appointmentsSource = isAdmin ? allAppointments : myAppointments;
  const appointments = appointmentsSource; // Show all appointments including legacy pending

  // Documents
  const myDocs = useQuery(api.documents.get) || [];
  const allDocs = useQuery(api.documents.getAll) || [];
  const documents = isAdmin ? allDocs : myDocs;

  // Mutations
  const updateQuoteStatusMutation = useMutation(api.quotes.updateStatus);

  // Queries for stats
  const myConversations = useQuery(api.conversations.listClientConversations, { client_email: user?.primaryEmailAddress?.emailAddress || "" });
  const adminConversations = useQuery(api.conversations.listAdminConversations);

  // Determine conversations based on role
  const conversations = isAdmin ? (adminConversations || []) : (myConversations || []);

  useEffect(() => {
    trackDevice();
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
    // pendingAppointments removed
    totalDocuments: documents.length,
    totalPreventivi: preventivi.length,
    totalMessages: conversations.length
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      <AnimatedBackground />

      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}

      {showWelcome && user && (
        <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />
      )}

      {/* PDF Viewer for Documents */}
      {/* Universal PDF Viewer */}
      <UniversalPdfViewer
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
        url={pdfUrl}
        title={pdfTitle}
      />

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
                <p className="text-xs sm:text-sm text-[#dee2e6]">
                  Benvenuto, {user.fullName}
                  <span className="ml-2 text-xs bg-[#f8f9fa]/10 px-2 py-0.5 rounded-full text-[#adb5bd]">
                    {isAdmin ? 'Admin' : isClient ? 'Cliente' : 'Utente'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] hover:bg-[#343a40] hover:text-white transition-all">
                      <Filter size={16} className="mr-2 text-cyan-400" /> Personalizza
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#343a40] border-[#f8f9fa]/10 text-[#f8f9fa]">
                    <DialogHeader>
                      <DialogTitle>Gestione Widget Dashboard</DialogTitle>
                      <DialogDescription className="text-[#adb5bd]">Seleziona quali widget visualizzare sulla tua dashboard.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      {[
                        { id: 'clients', label: 'Clienti Attivi' },
                        { id: 'cantieri', label: 'Cantieri' },
                        { id: 'revenue', label: 'Revenue' },
                        { id: 'today', label: 'Appuntamenti Oggi' },
                        { id: 'messages', label: 'Messaggi Non Letti' },
                        { id: 'quotes', label: 'Preventivi in Attesa' },
                        { id: 'kanban', label: 'Stato Cantieri (Kanban)' },
                        { id: 'activity', label: 'Attività Recente' }
                      ].map((widget) => {
                        const isHidden = (localStorage.getItem('admin_hidden_widgets') || '').includes(widget.id);
                        return (
                          <div key={widget.id} className="flex items-center space-x-2">
                            {/* ... Checkbox logic is same as before, simplified for brevity in this chunk if possible, or just copy it ... */}
                            <Checkbox
                              id={widget.id}
                              checked={!isHidden}
                              onCheckedChange={(checked) => {
                                let hidden = (localStorage.getItem('admin_hidden_widgets') || '').split(',').filter(Boolean);
                                if (!checked) {
                                  hidden.push(widget.id);
                                } else {
                                  hidden = hidden.filter(id => id !== widget.id);
                                }
                                localStorage.setItem('admin_hidden_widgets', hidden.join(','));
                                window.location.reload();
                              }}
                            />
                            <label htmlFor={widget.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                              {widget.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeDevices > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg"
                >
                  <Monitor size={14} className="text-blue-400" />
                  <span className="text-xs text-blue-300">
                    {activeDevices} attivi
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Stats - Conditional Rendering */}
          {/* Stats - Conditional Rendering - Generic Row HIDDEN for Admin to reduce clutter */}
          {!isAdmin && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
              {/* Everyone sees Appointments */}
              <Link to={createPageUrl('MyAppointments')} className="block h-full">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
                  <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                      <CardTitle className="text-xs font-medium text-white/80">Appuntamenti</CardTitle>
                      <Calendar className="h-4 w-4 text-white flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-light text-white">{stats.totalAppointments}</div>
                      <p className="text-xs text-white/60 mt-0.5 hidden sm:block">Programmati</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>

              {/* Everyone sees Documents */}
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
                      <CardTitle className="text-xs font-medium text-white/80">I Miei Documenti</CardTitle>
                      <Upload className="h-4 w-4 text-white flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-light text-white">{stats.totalDocuments}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>

              {/* Client see Messages */}
              {isClient && (
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
          )}

          {/* ADMIN PREMIUM SECTION */}
          {isAdmin && adminStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 lg:mb-8"
            >
              {/* Widget Management moved to Header */}

              {/* Quick Actions - High Relevance */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Link to={createPageUrl('Clienti')}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-900/20">
                    <UserPlus className="h-4 w-4 mr-1" /> Nuovo Cliente
                  </Button>
                </Link>
                <Link to={createPageUrl('Preventivi')}>
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 shadow-lg shadow-cyan-900/20">
                    <FileText className="h-4 w-4 mr-1" /> Crea Preventivo
                  </Button>
                </Link>
                <Link to={createPageUrl('ClientChat')}>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg shadow-purple-900/20">
                    <MessageSquare className="h-4 w-4 mr-1" /> Chat
                  </Button>
                </Link>
                <Link to={createPageUrl('CantieriDashboard')}>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-lg shadow-amber-900/20">
                    <Building2 className="h-4 w-4 mr-1" /> Cantieri
                  </Button>
                </Link>
              </div>

              {/* Premium Stats Grid */}
              {/* Premium Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
                {[
                  {
                    id: 'clients',
                    to: 'Clienti',
                    title: 'Clienti Attivi',
                    value: adminStats.totalClients,
                    icon: Users,
                    gradient: 'from-emerald-600/90 to-emerald-700/90'
                  },
                  {
                    id: 'cantieri',
                    to: 'CantieriDashboard',
                    title: 'Cantieri',
                    value: adminStats.totalCantieri,
                    icon: Building2,
                    gradient: 'from-amber-600/90 to-amber-700/90'
                  },
                  {
                    id: 'revenue',
                    title: 'Revenue Totale',
                    value: `€${(adminStats.totalRevenue / 1000).toFixed(0)}k`,
                    icon: DollarSign,
                    gradient: 'from-green-600/90 to-green-700/90',
                    noLink: true
                  },
                  {
                    id: 'today',
                    to: 'MyAppointments',
                    title: 'Oggi',
                    value: adminStats.todayAppointments,
                    icon: Calendar,
                    gradient: 'from-blue-600/90 to-blue-700/90'
                  },
                  {
                    id: 'messages',
                    to: 'ClientChat',
                    title: 'Non Letti',
                    value: adminStats.unreadMessages,
                    icon: Bell,
                    gradient: adminStats.unreadMessages > 0 ? 'from-red-600/90 to-red-700/90' : 'from-purple-600/90 to-purple-700/90'
                  },
                  {
                    id: 'quotes',
                    to: 'Preventivi',
                    title: 'In Attesa',
                    value: adminStats.pendingQuotes,
                    icon: FileText,
                    gradient: 'from-cyan-600/90 to-cyan-700/90'
                  }
                ].map((stat) => {
                  if ((localStorage.getItem('admin_hidden_widgets') || '').includes(stat.id)) return null;

                  const Content = (
                    <Card className={`bg-gradient-to-br ${stat.gradient} border-0 hover:scale-[1.02] transition-transform cursor-pointer backdrop-blur-xl h-full`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <stat.icon className="h-5 w-5 text-white/80" />
                          <span className="text-xl lg:text-2xl font-light text-white">{stat.value}</span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">{stat.title}</p>
                      </CardContent>
                    </Card>
                  );

                  return stat.noLink ? (
                    <div key={stat.id}>{Content}</div>
                  ) : (
                    <Link key={stat.id} to={createPageUrl(stat.to)}>
                      {Content}
                    </Link>
                  );
                })}
              </div>

              {/* Cantieri Progress + Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cantieri Kanban Mini */}
                {!(localStorage.getItem('admin_hidden_widgets') || '').includes('kanban') && (
                  <Card className="bg-[#343a40]/50 backdrop-blur-xl border-[#f8f9fa]/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-[#f8f9fa] flex items-center gap-2">
                          <Hammer className="h-4 w-4" /> Stato Cantieri
                        </CardTitle>
                        <Link to={createPageUrl('CantieriDashboard')} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                          Vedi tutti <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-yellow-900/40 border border-yellow-500/30 rounded-lg p-2 text-center">
                          <p className="text-lg font-medium text-yellow-500">{adminStats.cantieriByStatus?.in_lavorazione || 0}</p>
                          <p className="text-[10px] text-yellow-200/90 font-medium">In Lavorazione</p>
                        </div>
                        <div className="bg-blue-900/40 border border-blue-500/30 rounded-lg p-2 text-center">
                          <p className="text-lg font-medium text-blue-500">{adminStats.cantieriByStatus?.posa_in_opera || 0}</p>
                          <p className="text-[10px] text-blue-200/90 font-medium">Posa Opera</p>
                        </div>
                        <div className="bg-green-900/40 border border-green-500/30 rounded-lg p-2 text-center">
                          <p className="text-lg font-medium text-green-500">{adminStats.cantieriByStatus?.completato || 0}</p>
                          <p className="text-[10px] text-green-200/90 font-medium">Completati</p>
                        </div>
                      </div>
                      {/* Recent Cantieri with Progress */}
                      <div className="space-y-2">
                        {cantieriProgress.slice(0, 3).map((c) => (
                          <div key={c._id} className="bg-[#495057]/30 rounded-lg p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-[#f8f9fa] truncate max-w-[120px]">{c.nome_cantiere}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.status === 'completato' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                                c.status === 'in_lavorazione' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                  c.status === 'posa_in_opera' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' :
                                    'bg-gray-500/30 text-gray-300 border border-gray-500/50'
                                }`}>{c.status?.replace('_', ' ')}</span>
                            </div>
                            <div className="h-1 bg-[#495057] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${c.progresso_in_lavorazione || 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activity Feed */}
                {!(localStorage.getItem('admin_hidden_widgets') || '').includes('activity') && (
                  <Card className="bg-[#343a40]/50 backdrop-blur-xl border-[#f8f9fa]/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#f8f9fa] flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Attività Recente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                        {recentActivity.length === 0 ? (
                          <div className="text-center py-6">
                            <Clock className="h-8 w-8 text-[#495057] mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-[#adb5bd]">Nessuna attività recente</p>
                          </div>
                        ) : (
                          recentActivity.map((act, i) => {
                            const getActionIcon = (action, type) => {
                              if (action === 'created') return <Plus className="h-3.5 w-3.5 text-blue-400" />;
                              if (action === 'deleted') return <Trash2 className="h-3.5 w-3.5 text-red-400" />;
                              if (action === 'updated' || action === 'updated_status') return <Activity className="h-3.5 w-3.5 text-yellow-400" />;
                              if (action === 'role_promoted' || action === 'role_change') return <TrendingUp className="h-3.5 w-3.5 text-green-400" />;
                              if (action === 'accepted') return <CheckCircle className="h-3.5 w-3.5 text-green-400" />;
                              if (action === 'rejected') return <XCircle className="h-3.5 w-3.5 text-red-400" />;
                              if (action === 'linked_quote') return <Link2 className="h-3.5 w-3.5 text-cyan-400" />;
                              return <Activity className="h-3.5 w-3.5 text-purple-400" />;
                            };

                            const getEntityLabel = (type) => {
                              switch (type) {
                                case 'quote': return 'Preventivo';
                                case 'client': return 'Cliente';
                                case 'cantiere': return 'Cantiere';
                                case 'appointment': return 'Appuntamento';
                                case 'document': return 'Documento';
                                case 'user': return 'Utente';
                                default: return type;
                              }
                            };

                            return (
                              <motion.div
                                key={act._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-start gap-2 bg-[#495057]/30 hover:bg-[#495057]/50 rounded-lg p-2 transition-colors border border-[#f8f9fa]/5"
                              >
                                <div className="w-7 h-7 rounded-full bg-[#f8f9fa]/5 flex items-center justify-center flex-shrink-0 border border-[#f8f9fa]/10">
                                  {getActionIcon(act.action, act.entity_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <p className="text-[11px] font-medium text-[#f8f9fa] truncate">
                                      {act.entity_name || getEntityLabel(act.entity_type)}
                                    </p>
                                    <span className="text-[9px] text-[#6c757d] whitespace-nowrap">
                                      {new Date(act.created_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-[#adb5bd] truncate">
                                    <span className="text-blue-400 font-medium">{act.user_name || 'Sistema'}</span>: {act.details || act.action}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Actions */}
              {/* Quick Actions Moved Up */}
            </motion.div>
          )}

          {/* Tabs - Conditionally Rendered */}
          <Tabs defaultValue={isAdmin ? "quotes" : "appointments"} className="space-y-4 sm:space-y-6">
            <TabsList className={`bg-white border border-[#f8f9fa]/20 w-full grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>

              {isAdmin && (
                <TabsTrigger value="quotes" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500">
                  Richieste Preventivi
                </TabsTrigger>
              )}

              <TabsTrigger value="appointments" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500">
                I Miei Appuntamenti
              </TabsTrigger>

              <TabsTrigger value="preventivi-docs" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500">
                Documenti
              </TabsTrigger>
            </TabsList>

            {/* Quotes Tab - Admin Only */}
            {isAdmin && (
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
                            className="pl-9 bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd]"
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
            )}

            {/* Preventivi Documenti Tab - All Roles */}
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
                            onClick={() => {
                              setPdfUrl(doc.file_url);
                              setPdfTitle(doc.title);
                              setIsPdfOpen(true);
                            }}
                            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold border-0 transition-all shadow-md hover:shadow-cyan-500/20"
                          >
                            <Eye size={16} className="mr-1.5" />
                            Visualizza
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Appointments Tab - All Roles */}
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
                      <div className={`text-sm px-3 py-1 rounded-full font-medium ${(apt.status === 'confirmed' || apt.status === 'pending') ? 'bg-green-500/30 text-green-300 border border-green-500/40' :
                        apt.status === 'cancelled' ? 'bg-red-500/30 text-red-300 border border-red-500/40' :
                          'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                        }`}>
                        {(apt.status === 'confirmed' || apt.status === 'pending') ? 'Confermato' :
                          apt.status === 'cancelled' ? 'Annullato' : apt.status}
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