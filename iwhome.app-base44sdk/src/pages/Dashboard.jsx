import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import useRBAC from '../hooks/useRBAC';
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
  Loader2,
  Truck,
  Package,
  MapPin,
  CreditCard,
  Send,
  X
} from 'lucide-react';

import OnboardingModal from '../components/dashboard/OnboardingModal';
import WelcomeModal from '../components/dashboard/WelcomeModal';

import UniversalPdfViewer from '../components/dashboard/UniversalPdfViewer';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { convertToWebP } from '../utils/imageConverter';
import { Textarea } from '@/components/ui/textarea';

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

  // Quote Request State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestFiles, setRequestFiles] = useState([]);
  const [requestData, setRequestData] = useState({
    title: '',
    notes: '',
    quote_type: 'infissi'
  });

  // Convex Queries
  const allQuotes = useQuery(api.quotes.get) || [];
  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });
  const isAdmin = convexUser?.role === 'admin' || convexUser?.role === 'ceo';
  const isClient = convexUser?.role === 'client';
  const isSupplier = convexUser?.role === 'supplier';
  const isUser = !isAdmin && !isClient && !isSupplier;

  // RBAC: Get linked supplier record for supplier self-view
  const { supplierRecord, supplierId } = useRBAC();

  // Admin-only comprehensive stats
  const adminStats = useQuery(api.adminStats.getAdminStats) || null;
  const recentActivity = useQuery(api.adminStats.getRecentActivity, { limit: 8 }) || [];
  const cantieriProgress = useQuery(api.adminStats.getCantieriProgress) || [];

  // Task 2-3: Supplier operational data for Dashboard
  const dashboardSuppliers = useQuery(api.suppliers.list) || [];
  const dashboardOrders = useQuery(api.suppliers.listOrders, {}) || [];
  const dashboardDeliveries = useQuery(api.suppliers.listDeliveries, {}) || [];
  const paymentStats = useQuery(api.payments.getStats) || null;

  // Supplier self-view queries (only load when role is supplier)
  const mySupplierRequests = useQuery(
    api.suppliers.listRequests,
    isSupplier && supplierId ? { supplier_id: supplierId } : "skip"
  ) || [];
  const mySupplierOrders = useQuery(
    api.suppliers.listOrders,
    isSupplier && supplierId ? { supplier_id: supplierId } : "skip"
  ) || [];
  const mySupplierDeliveries = useQuery(
    api.suppliers.listDeliveries,
    isSupplier && supplierId ? { supplier_id: supplierId } : "skip"
  ) || [];
  const mySupplierPayments = useQuery(
    api.payments.list,
    isSupplier ? { type: 'supplier' } : "skip"
  ) || [];

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
  const uploadPaymentProofMutation = useMutation(api.payments.uploadPaymentProof);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updateAppointmentStatus = useMutation(api.appointments.updateStatus);

  const clientPayments = useQuery(
    api.payments.list,
    isClient ? { type: 'client' } : "skip"
  ) || [];

  const clientOrders = useQuery(
    api.suppliers.listClientOrders,
    isClient ? { client_email: user?.primaryEmailAddress?.emailAddress || "" } : "skip"
  ) || [];

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

  const createRequestMutation = useMutation(api.quotes.createRequest);

  const handleCreateRequest = async () => {
    if (!requestData.title) {
      alert("Inserisci un titolo per la richiesta");
      return;
    }
    setRequestLoading(true);
    try {
      const storageIds = [];

      // 1. Process and upload files
      for (const file of requestFiles) {
        let fileToUpload = file;

        // Convert to WebP if image
        if (file.type.startsWith('image/') && (file.type === 'image/jpeg' || file.type === 'image/png')) {
          try {
            const webpBlob = await convertToWebP(file);
            fileToUpload = new File([webpBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
          } catch (err) {
            console.error("WebP conversion failed, uploading original:", err);
          }
        }

        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload,
        });
        if (!result.ok) throw new Error("File upload failed");
        const { storageId } = await result.json();
        storageIds.push(storageId);
      }

      // 2. Create Request
      await createRequestMutation({
        title: requestData.title,
        full_name: user?.fullName || user?.primaryEmailAddress?.emailAddress || "Cliente",
        email: user?.primaryEmailAddress?.emailAddress || "",
        phone: String(user?.unsafeMetadata?.phone || ""),
        notes: requestData.notes,
        quote_type: requestData.quote_type,
        files: storageIds
      });

      alert("Richiesta inviata con successo! Verrai contattato presto dall'amministrazione.");
      setIsRequestModalOpen(false);
      setRequestData({ title: '', notes: '', quote_type: 'infissi' });
      setRequestFiles([]);
    } catch (err) {
      console.error("Error creating request:", err);
      alert("Errore durante l'invio della richiesta.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUploadPaymentProof = async (paymentId, file) => {
    if (!file) return;
    try {
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload fallito");
      const { storageId } = await result.json();
      await uploadPaymentProofMutation({ payment_id: paymentId, storage_id: storageId });
      alert("Prova di pagamento caricata con successo! In attesa di verifica.");
    } catch (error) {
      console.error("Error uploading proof:", error);
      alert("Errore nel caricamento della prova.");
    }
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

      {/* Quote Request Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="bg-[#343a40] border-[#f8f9fa]/10 text-[#f8f9fa] max-w-lg scrollbar-hide overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nuova Richiesta Preventivo</DialogTitle>
            <DialogDescription className="text-[#adb5bd]">
              Invia foto e dettagli per ricevere un preventivo personalizzato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Oggetto della richiesta</Label>
              <Input
                id="title"
                placeholder="es: Sostituzione Finestre Salone"
                value={requestData.title}
                onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                className="bg-[#212529] border-[#495057] text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo Intervento</Label>
              <Select
                value={requestData.quote_type}
                onValueChange={(val) => setRequestData({ ...requestData, quote_type: val })}
              >
                <SelectTrigger className="bg-[#212529] border-[#495057]">
                  <SelectValue placeholder="Seleziona tipo..." />
                </SelectTrigger>
                <SelectContent className="bg-[#343a40] border-[#495057]">
                  <SelectItem value="infissi">Infissi e Serramenti</SelectItem>
                  <SelectItem value="porte">Porte Interne/Blindate</SelectItem>
                  <SelectItem value="ristrutturazione">Ristrutturazione</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Descrizione Dettagliata</Label>
              <Textarea
                id="notes"
                placeholder="Descrivi cosa ti occorre..."
                rows={4}
                value={requestData.notes}
                onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                className="bg-[#212529] border-[#495057] text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label>Allegati (Foto/Documenti)</Label>
              <div
                className="border-2 border-dashed border-[#495057] rounded-xl p-6 text-center hover:border-blue-500/50 transition-all cursor-pointer bg-[#212529]/30"
                onClick={() => document.getElementById('request-files').click()}
              >
                <Upload size={24} className="mx-auto mb-2 text-[#adb5bd]" />
                <p className="text-sm text-[#adb5bd]">Trascina qui i file o clicca per caricare</p>
                <p className="text-[10px] text-[#6c757d] mt-1">Sottoponiamo a backup automatico JPG/PNG {"->"} WebP</p>
              </div>
              <Input
                id="request-files"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setRequestFiles([...requestFiles, ...Array.from(e.target.files)])}
              />

              {requestFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requestFiles.map((file, idx) => (
                    <div key={idx} className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-1 rounded-md flex items-center gap-2 border border-blue-500/30">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <X size={12} className="cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        setRequestFiles(requestFiles.filter((_, i) => i !== idx));
                      }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsRequestModalOpen(false)}>Annulla</Button>
            <Button
              onClick={handleCreateRequest}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={requestLoading}
            >
              {requestLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send className="mr-2" size={16} />}
              Invia Richiesta
            </Button>
          </div>
        </DialogContent>
      </Dialog>



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
                    {isAdmin ? 'Admin' : isClient ? 'Cliente' : isSupplier ? 'Fornitore' : 'Utente'}
                  </span>
                </p>
                {!isClient && (
                  <p className="text-[10px] text-[#adb5bd] mt-1 opacity-60">
                    Dashboard pagamenti unificata — fornitori, collaboratori e clienti
                  </p>
                )}
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
          {/* Stats - Conditional Rendering - Generic Row HIDDEN for Admin/Supplier to reduce clutter */}
          {!isAdmin && !isSupplier && (
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

              {/* Client see Messages & Request */}
              {isClient && (
                <>
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

                  <div className="block h-full" onClick={() => setIsRequestModalOpen(true)}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full border-2 border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
                          <CardTitle className="text-xs font-medium text-white/80">Richiedi Preventivo</CardTitle>
                          <Plus className="h-4 w-4 text-white flex-shrink-0" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-lg font-light text-white">Nuova Foto/Richiesta</div>
                          <p className="text-[10px] text-white/60">Contatta l'ufficio tecnico</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ SUPPLIER PRIVATE AREA ═══ */}
          {isSupplier && supplierRecord && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 lg:mb-8"
            >
              {/* Supplier Welcome Card */}
              <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border border-orange-500/30 mb-6">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                        <Truck className="text-orange-400" size={22} /> {supplierRecord.name}
                      </h2>
                      <p className="text-sm text-[#adb5bd] mt-1">Area Fornitore — IWHome</p>
                    </div>
                    <div className="text-right">
                      {supplierRecord.supplier_code && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md font-mono">
                          {supplierRecord.supplier_code}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Link to={createPageUrl('Fornitori')}>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white border-0">
                    <FileText className="h-4 w-4 mr-1" /> I Miei Ordini
                  </Button>
                </Link>
                <Link to={createPageUrl('Pagamenti')}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                    <DollarSign className="h-4 w-4 mr-1" /> Pagamenti
                  </Button>
                </Link>
                <Link to={createPageUrl('Documents')}>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-0">
                    <Upload className="h-4 w-4 mr-1" /> Documenti
                  </Button>
                </Link>
              </div>

              {/* Supplier KPI Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <Link to={createPageUrl('Fornitori')}>
                  <Card className="bg-gradient-to-br from-orange-600/80 to-orange-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <FileText className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{mySupplierOrders.filter(o => o.status === 'confirmed' || o.status === 'in_production').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Ordini Attivi</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Fornitori')}>
                  <Card className="bg-gradient-to-br from-blue-600/80 to-blue-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Truck className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{mySupplierDeliveries.filter(d => d.status !== 'consegnato').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Consegne in Corso</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Pagamenti')}>
                  <Card className="bg-gradient-to-br from-green-600/80 to-green-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <DollarSign className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{mySupplierPayments.filter(p => p.status === 'pagato').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Pagati</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Pagamenti')}>
                  <Card className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Clock className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{mySupplierPayments.filter(p => p.status === 'in_attesa' || p.status === 'in_ritardo').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Pagamenti in Attesa</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Two-Column: Orders + Deliveries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* My Active Orders */}
                <Card className="bg-[#343a40]/50 backdrop-blur-xl border-[#f8f9fa]/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-[#f8f9fa] flex items-center gap-2">
                        <FileText className="h-4 w-4" /> I Miei Ordini
                      </CardTitle>
                      <Link to={createPageUrl('Fornitori')} className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                        Vedi tutti <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {mySupplierOrders.length === 0 ? (
                        <p className="text-xs text-[#6c757d] text-center py-6">Nessun ordine</p>
                      ) : mySupplierOrders.slice(0, 5).map(order => (
                        <div key={order._id} className="bg-[#495057]/30 rounded-lg p-2.5 border border-[#495057]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#f8f9fa] font-medium truncate max-w-[180px]">{order.order_number || 'Ordine'}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'completed' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                              order.status === 'in_production' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                              }`}>{order.status?.replace('_', ' ')}</span>
                          </div>
                          {order.workflow_step !== undefined && (
                            <div className="flex gap-0.5 mt-1">
                              {Array.from({ length: 9 }, (_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full ${i < order.workflow_step ? 'bg-green-500' :
                                  i === order.workflow_step ? 'bg-orange-400' : 'bg-[#495057]'
                                  }`} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* My Deliveries */}
                <Card className="bg-[#343a40]/50 backdrop-blur-xl border-[#f8f9fa]/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-[#f8f9fa] flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Prossime Consegne
                      </CardTitle>
                      <Link to={createPageUrl('Fornitori')} className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                        Calendario <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {mySupplierDeliveries.length === 0 ? (
                        <p className="text-xs text-[#6c757d] text-center py-6">Nessuna consegna programmata</p>
                      ) : mySupplierDeliveries.filter(d => d.status !== 'consegnato').slice(0, 5).map(delivery => {
                        const displayDate = delivery.confirmed_arrival || delivery.estimated_arrival;
                        return (
                          <div key={delivery._id} className="bg-[#495057]/30 rounded-lg p-2.5 border border-[#495057]">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#f8f9fa] font-medium">
                                {delivery.tracking_number || 'Consegna'}
                              </span>
                              {displayDate && (
                                <span className="text-[10px] text-[#adb5bd] flex items-center gap-1">
                                  <Calendar size={10} /> {new Date(displayDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded ${delivery.confirmed_arrival ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                              {delivery.confirmed_arrival ? 'Confermata' : 'Stimata'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
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
                <Link to={createPageUrl('Messages')}>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg shadow-purple-900/20">
                    <MessageSquare className="h-4 w-4 mr-1" /> Chat
                  </Button>
                </Link>
                <Link to={createPageUrl('CantieriDashboard')}>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-lg shadow-amber-900/20">
                    <Building2 className="h-4 w-4 mr-1" /> Cantieri
                  </Button>
                </Link>
                {/* Task 2-3: Fornitori quick action */}
                <Link to={createPageUrl('Fornitori')}>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg shadow-orange-900/20">
                    <Truck className="h-4 w-4 mr-1" /> Fornitori
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
                    value: `€${adminStats.totalRevenue?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
                    to: 'Messages',
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

              {/* Task 2-3: Supplier Operational KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <Link to={createPageUrl('Fornitori')}>
                  <Card className="bg-gradient-to-br from-orange-600/80 to-orange-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Truck className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{dashboardSuppliers.length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Fornitori</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Fornitori')}>
                  <Card className="bg-gradient-to-br from-purple-600/80 to-purple-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Package className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{dashboardOrders.filter(o => o.status === 'confirmed' || o.status === 'in_production').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Ordini Attivi</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Fornitori')}>
                  <Card className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <MapPin className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{dashboardDeliveries.filter(d => d.status !== 'consegnato').length}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">In Consegna</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={createPageUrl('Pagamenti')}>
                  <Card className="bg-gradient-to-br from-red-600/80 to-red-700/80 border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <CreditCard className="h-5 w-5 text-white/80" />
                        <span className="text-xl font-light text-white">{paymentStats?.overdue || 0}</span>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Pagamenti Scaduti</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Task 2-3: Revenue Overview */}
              {paymentStats && (
                <Card className="bg-[#343a40]/50 backdrop-blur-xl border-[#f8f9fa]/10 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-[#f8f9fa] flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Revenue Overview
                      </h3>
                      <Link to={createPageUrl('Pagamenti')} className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                        Dettagli <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-medium text-green-400">€{paymentStats.totalPaid?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-green-300/70">Incassato</p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-medium text-yellow-400">€{paymentStats.totalPending?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-yellow-300/70">In Attesa</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-medium text-red-400">€{paymentStats.totalOverdue?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-red-300/70">Scaduti</p>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                        <p className="text-lg font-medium text-blue-400">€{paymentStats.grossContractRevenue?.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-blue-300/70">Contratti Lordi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                      {/* Animated Donut Chart */}
                      {(() => {
                        const inLav = adminStats.cantieriByStatus?.in_lavorazione || 0;
                        const posa = adminStats.cantieriByStatus?.posa_in_opera || 0;
                        const compl = adminStats.cantieriByStatus?.completato || 0;
                        // @ts-ignore — in_pausa may not be in schema type yet
                        const pausa = adminStats.cantieriByStatus?.in_pausa || 0;
                        const total = inLav + posa + compl + pausa || 1;
                        const segments = [
                          { count: inLav, color: '#eab308', label: 'In Lavorazione' },
                          { count: posa, color: '#3b82f6', label: 'Posa Opera' },
                          { count: compl, color: '#22c55e', label: 'Completati' },
                          { count: pausa, color: '#6b7280', label: 'In Pausa' },
                        ];
                        let offset = 0;
                        const radius = 40;
                        const circum = 2 * Math.PI * radius;
                        return (
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative w-28 h-28 flex-shrink-0">
                              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                {segments.map((seg, i) => {
                                  const pct = seg.count / total;
                                  const dashLen = pct * circum;
                                  const gap = circum - dashLen;
                                  const o = offset;
                                  offset += dashLen;
                                  return (
                                    <circle
                                      key={i}
                                      cx="50" cy="50" r={radius}
                                      fill="none"
                                      stroke={seg.color}
                                      strokeWidth="10"
                                      strokeDasharray={`${dashLen} ${gap}`}
                                      strokeDashoffset={-o}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                      style={{ opacity: seg.count > 0 ? 1 : 0 }}
                                    />
                                  );
                                })}
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-[#f8f9fa]">{total}</span>
                                <span className="text-[9px] text-[#adb5bd]">Cantieri</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1">
                              {segments.map((seg, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                                  <div>
                                    <p className="text-sm font-medium text-[#f8f9fa]">{seg.count}</p>
                                    <p className="text-[9px] text-[#adb5bd] leading-none">{seg.label}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
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
                            <div className="h-1.5 bg-[#495057] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${c.progresso_in_lavorazione || 0}%`,
                                  background: c.status === 'completato' ? '#22c55e' : c.status === 'posa_in_opera' ? '#3b82f6' : '#eab308'
                                }}
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
          <Tabs defaultValue={isAdmin ? "quotes" : isSupplier ? "supplier-requests" : "appointments"} className="space-y-4 sm:space-y-6">
            <TabsList className={`bg-white border border-[#f8f9fa]/20 w-full grid ${isAdmin ? 'grid-cols-3' : isClient ? 'grid-cols-4' : isSupplier ? 'grid-cols-3' : 'grid-cols-3'} flex-wrap h-auto`}>

              {isAdmin && (
                <TabsTrigger value="quotes" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500 py-2">
                  Richieste Preventivi
                </TabsTrigger>
              )}

              {isSupplier && (
                <TabsTrigger value="supplier-requests" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500 py-2">
                  Richieste (live)
                </TabsTrigger>
              )}

              {isClient && (
                <TabsTrigger value="client-quotes" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500">
                  I Miei Preventivi
                </TabsTrigger>
              )}

              {isClient && (
                <TabsTrigger value="client-payments" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500 py-2">
                  Pagamenti
                </TabsTrigger>
              )}

              {isSupplier && (
                <TabsTrigger value="preventivi-docs" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500 py-2">
                  Documenti
                </TabsTrigger>
              )}

              <TabsTrigger value="appointments" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500 py-2">
                I Miei Appuntamenti
              </TabsTrigger>

              {!isSupplier && (
                  <TabsTrigger value="preventivi-docs" className="data-[state=active]:bg-[#f8f9fa] data-[state=active]:text-black text-xs sm:text-sm text-gray-500 py-2">
                    Documenti
                  </TabsTrigger>
              )}
            </TabsList>

            {/* Supplier Requests Tab - Supplier Only */}
            {isSupplier && (
              <TabsContent value="supplier-requests" className="space-y-4">
                <div className="grid gap-4">
                  {mySupplierRequests.length === 0 ? (
                    <div className="text-center py-12 bg-[#343a40]/30 rounded-xl border border-[#f8f9fa]/10">
                      <FileText size={48} className="text-[#6c757d] mx-auto mb-4" />
                      <p className="text-[#dee2e6]">Nessuna richiesta live al momento</p>
                    </div>
                  ) : (
                    mySupplierRequests.map(req => (
                      <Card key={req._id} className="bg-gradient-to-br from-[#343a40] to-[#212529] border-[#f8f9fa]/10">
                        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-[#f8f9fa] text-lg">{req.title}</h3>
                            <p className="text-sm text-[#adb5bd]">{req.fixture_category || req.fixture_type || "Categoria non specificata"}</p>
                            <p className="text-xs text-[#6c757d] mt-1">Status: {req.status}</p>
                          </div>
                          <Button asChild onClick={() => createPageUrl('Fornitori')} className="bg-orange-600 hover:bg-orange-700">
                            <Link to={createPageUrl('Fornitori')}>Vai su Fornitori</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}

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

            {/* Client Quotes Tab - Client Only */}
            {isClient && (
              <TabsContent value="client-quotes" className="space-y-4">
                <div className="grid gap-4">
                  {quotes.filter(q => q.email === user?.primaryEmailAddress?.emailAddress).length === 0 ? (
                    <div className="text-center py-12 bg-[#343a40]/30 rounded-xl border border-[#f8f9fa]/10">
                      <FileText size={48} className="text-[#6c757d] mx-auto mb-4" />
                      <p className="text-[#dee2e6]">Non hai ancora richiesto preventivi</p>
                      <Button
                        variant="link"
                        className="text-blue-400 mt-2"
                        onClick={() => setIsRequestModalOpen(true)}
                      >
                        Invia la tua prima richiesta
                      </Button>
                    </div>
                  ) : (
                    quotes
                      .filter(q => q.email === user?.primaryEmailAddress?.emailAddress)
                      .map((quote) => (
                        <Card key={quote._id} className="bg-gradient-to-br from-[#343a40] to-[#212529] border-[#f8f9fa]/10 overflow-hidden">
                          <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-[#f8f9fa] text-lg">{quote.full_name || 'Richiesta'}</h3>
                                    <p className="text-xs text-[#adb5bd] uppercase tracking-wider">{quote.quote_type}</p>
                                  </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                  <div className="flex items-center gap-2 text-sm text-[#dee2e6]">
                                    <Clock size={14} className="text-orange-400" />
                                    <span>Richiesto il: {new Date(quote._creationTime).toLocaleDateString('it-IT')}</span>
                                  </div>
                                  {quote.estimated_price && (
                                    <div className="flex items-center gap-2 text-sm text-[#dee2e6]">
                                      <DollarSign size={14} className="text-green-400" />
                                      <span className="font-bold">Prezzo Stimato: €{quote.estimated_price.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col justify-between items-end gap-3">
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${quote.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  quote.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  }`}>
                                  {quote.status === 'draft' ? 'In Lavorazione' :
                                    quote.status === 'sent' ? 'Inviato' :
                                      quote.status === 'accepted' ? 'Accettato' :
                                        quote.status === 'rejected' ? 'Rifiutato' : quote.status}
                                </div>

                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent border-white/10 text-white hover:bg-white/5"
                                >
                                  <Link to={createPageUrl('Messages')}>
                                    <MessageSquare size={14} className="mr-2" />
                                    Vai alla Chat
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            {/* Workflow Visualizer */}
                            <div className="mt-6 pt-6 border-t border-white/5">
                              <div className="flex items-center justify-between relative px-2">
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2 z-0" />
                                {[
                                  { step: 'Richiesto', active: true },
                                  { step: 'Valutazione', active: ['sent', 'accepted', 'rejected'].includes(quote.status) },
                                  { step: 'In Produzione', active: quote.status === 'accepted' },
                                  { step: 'Consegna', active: false }
                                ].map((s, i) => (
                                  <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full border-2 ${s.active ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[#16191c] border-white/10'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${s.active ? 'text-blue-400' : 'text-[#6c757d]'}`}>{s.step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </TabsContent>
            )}

            {/* Client Payments Tab - Client Only */}
            {isClient && (
              <TabsContent value="client-payments" className="space-y-4">
                <div className="grid gap-4">
                  {clientPayments.length === 0 ? (
                    <div className="text-center py-12 bg-[#343a40]/30 rounded-xl border border-[#f8f9fa]/10">
                      <DollarSign size={48} className="text-[#6c757d] mx-auto mb-4" />
                      <p className="text-[#dee2e6]">Non ci sono pagamenti in attesa</p>
                    </div>
                  ) : (
                    clientPayments.map((payment) => (
                      <Card key={payment._id} className="bg-gradient-to-br from-[#343a40] to-[#212529] border-[#f8f9fa]/10 overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-[#f8f9fa] text-lg">{payment.description}</h3>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-[#dee2e6]">Importo: <span className="font-bold text-green-400">€{payment.amount.toLocaleString()}</span></p>
                                <p className="text-xs text-[#adb5bd]">Scadenza: {new Date(payment.due_date).toLocaleDateString('it-IT')}</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase border ${payment.status === 'pagato' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  payment.status === 'in_verifica' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                }`}>
                                {payment.status === 'in_attesa' ? 'Da Pagare' :
                                  payment.status === 'in_verifica' ? 'In Verifica' :
                                    payment.status === 'pagato' ? 'Confermato' : payment.status}
                              </div>

                              {payment.status === 'in_attesa' && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    id={`proof-${payment._id}`}
                                    className="hidden"
                                    onChange={(e) => handleUploadPaymentProof(payment._id, e.target.files[0])}
                                  />
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                                    onClick={() => document.getElementById(`proof-${payment._id}`).click()}
                                  >
                                    <Upload size={14} className="mr-1" />
                                    Carica Prova Pagamento
                                  </Button>
                                </div>
                              )}

                              {payment.proof_url && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-blue-400 text-xs p-0 h-auto"
                                  onClick={() => {
                                    setPdfUrl(payment.proof_url);
                                    setPdfTitle("Prova di Pagamento");
                                    setIsPdfOpen(true);
                                  }}
                                >
                                  <Eye size={14} className="mr-1" />
                                  Vedi Prova
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
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
                      <div className="flex flex-wrap gap-2 items-center">
                        {isAdmin ? (
                          <Select
                            value={apt.status}
                            onValueChange={(value) => updateAppointmentStatus({ id: apt._id, status: value })}
                          >
                            <SelectTrigger className={`w-36 text-xs h-8 ${
                              (apt.status === 'confirmed' || apt.status === 'pending') ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                              apt.status === 'cancelled' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                              apt.status === 'rejected' ? 'bg-red-600/10 text-red-400 border-red-600/20' :
                              'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">In Attesa</SelectItem>
                              <SelectItem value="confirmed">Confermato</SelectItem>
                              <SelectItem value="cancelled">Annullato</SelectItem>
                              <SelectItem value="rejected">Rifiutato</SelectItem>
                              <SelectItem value="completed">Completato</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                            apt.status === 'confirmed' ? 'bg-green-500/30 text-green-300 border border-green-500/40' :
                            apt.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40' :
                            (apt.status === 'cancelled' || apt.status === 'rejected') ? 'bg-red-500/30 text-red-300 border border-red-500/40' :
                              'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                            }`}>
                            {apt.status === 'confirmed' ? 'Confermato' :
                             apt.status === 'pending' ? 'In Attesa' :
                              apt.status === 'cancelled' ? 'Annullato' : 
                              apt.status === 'rejected' ? 'Rifiutato' : 
                              apt.status}
                          </div>
                        )}
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