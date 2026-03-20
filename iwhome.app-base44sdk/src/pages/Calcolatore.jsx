import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";
import { useUser, useClerk } from "@clerk/clerk-react";
import WindowCalculator from '../components/calculator/WindowCalculator';
import ProjectCalculator from '../components/calculator/ProjectCalculator';
import CalcolatoreEdilizia from '../components/calculator/CalcolatoreEdilizia';
import CalcolatoreRender3D from '../components/calculator/CalcolatoreRender3D';
import QuoteDownload from '../components/quote/QuoteDownload';
import {
  Layers,
  Home,
  HardHat,
  Box,
  ArrowRight,
  Mail,
  Phone,
  User,
  Send,
  Check,
  Calendar,
  LogIn,
  Gift
} from 'lucide-react';

export default function Calcolatore() {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const createQuote = useMutation(api.quotes.create);
  const upgradeToCliente = useMutation(api.users.upgradeToCliente);

  // 'finestre' | 'chiavi_in_mano'
  const [quoteType, setQuoteType] = useState('chiavi_in_mano');
  // sub-tab dentro chiavi_in_mano: 'infissi' | 'edilizia' | 'render3d'
  const [chiavSubTab, setChiavSubTab] = useState('infissi');
  const [includeWindows, setIncludeWindows] = useState(true);
  const [windowConfig, setWindowConfig] = useState(null);
  const [projectConfig, setProjectConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: '',
    files: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      }));
    }
  }, [user]);

  const handleRequestQuote = () => {
    // Form always accessible — login optional (fields pre-filled if logged in)
    setShowForm(true);
  };

  const getTotalPrice = () => {
    if (quoteType === 'finestre') {
      return windowConfig?.estimatedPrice || 0;
    } else {
      const windowsPrice = includeWindows ? (windowConfig?.estimatedPrice || 0) : 0;
      return projectConfig?.estimatedPrice || windowsPrice;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const quoteData = {
      ...formData,
      quote_type: quoteType === 'finestre' ? 'finestre' : (includeWindows ? 'completo' : 'chiavi_in_mano'),
      window_config: quoteType === 'finestre' || includeWindows ? windowConfig : null,
      project_config: quoteType === 'chiavi_in_mano' ? projectConfig : null,
      estimated_price: getTotalPrice(),
      status: 'draft',
      created_date: new Date().toISOString()
    };

    try {
      await createQuote(quoteData);
      if (user) await upgradeToCliente();
      setSubmitted(true);
    } catch (error) {
      console.error("Error creating quote", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOTE: File upload disabled for now until Convex storage is implemented
  const handleFileUpload = async (e) => {
    console.log("File upload not yet implemented");
  };

  // Show bottom PDF/submit section only for finestre, or chiavi_in_mano with infissi sub-tab
  const showBottomSection = quoteType === 'finestre' || (quoteType === 'chiavi_in_mano' && chiavSubTab === 'infissi');

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] flex items-center justify-center overflow-hidden relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-12 text-center max-w-md mx-6 shadow-2xl z-10"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, ease: 'linear' }}
            className="w-20 h-20 rounded-full bg-[#f8f9fa]/10 flex items-center justify-center mx-auto mb-6"
          >
            <Check size={40} className="text-[#f8f9fa]" />
          </motion.div>
          <h2 className="text-2xl font-medium text-[#f8f9fa] mb-4">
            Preventivo Inviato!
          </h2>
          <p className="text-[#dee2e6] mb-8">
            Grazie per la tua richiesta. Ti contatteremo presto per discutere i dettagli del tuo progetto.
          </p>
          <div className="flex flex-col gap-4">
            <Link to="/MyAppointments">
              <Button className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full font-medium transition-all">
                <Calendar className="mr-2" size={18} />
                Prenota Appuntamento
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full rounded-full border-[#f8f9fa]/40 text-[#212529] bg-[#f8f9fa]/20 hover:bg-[#f8f9fa]/30 backdrop-blur-sm font-medium">
                Torna alla Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/10 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-[#e9ecef]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Calcolatore Online</span>
            <h1 className="text-4xl lg:text-6xl font-light text-[#f8f9fa] mt-4 mb-6">
              Calcola il tuo <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">preventivo</span>
            </h1>
            <p className="text-[#dee2e6] max-w-2xl mx-auto text-lg">
              Configura il tuo progetto e ottieni un preventivo dettagliato.
              I prezzi potranno essere perfezionati durante la consulenza.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Type Selection — 2 top-level tabs */}
      <section className="relative py-12 bg-gradient-to-b from-[#495057] to-[#6c757d] border-b border-[#f8f9fa]/10 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center">

            {/* Solo Infissi */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setQuoteType('finestre')}
              className={`flex items-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all shadow-xl hover-lift ${quoteType === 'finestre'
                ? 'border-[#f8f9fa] bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 backdrop-blur-sm'
                : 'border-[#f8f9fa]/20 bg-[#495057]/50 backdrop-blur-sm hover:border-[#f8f9fa]/40'
                }`}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${quoteType === 'finestre' ? 'bg-[#f8f9fa]/30' : 'bg-[#f8f9fa]/10'}`}
              >
                <Layers size={24} className={quoteType === 'finestre' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'} />
              </motion.div>
              <div className="text-left">
                <div className={`font-medium ${quoteType === 'finestre' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'}`}>
                  Solo Infissi
                </div>
                <div className="text-sm text-[#adb5bd]">Finestre e Porte Finestre in PVC</div>
              </div>
            </motion.button>

            {/* Progetto Chiavi in Mano — tab principale */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setQuoteType('chiavi_in_mano')}
              className={`flex items-center gap-4 px-8 py-5 rounded-2xl border-2 transition-all shadow-xl hover-lift ${quoteType === 'chiavi_in_mano'
                ? 'border-[#f8f9fa] bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 backdrop-blur-sm'
                : 'border-[#f8f9fa]/20 bg-[#495057]/50 backdrop-blur-sm hover:border-[#f8f9fa]/40'
                }`}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${quoteType === 'chiavi_in_mano' ? 'bg-[#f8f9fa]/30' : 'bg-[#f8f9fa]/10'}`}
              >
                <Home size={24} className={quoteType === 'chiavi_in_mano' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'} />
              </motion.div>
              <div className="text-left">
                <div className={`font-medium ${quoteType === 'chiavi_in_mano' ? 'text-[#f8f9fa]' : 'text-[#dee2e6]'}`}>
                  Progetto Chiavi in Mano
                </div>
                <div className="text-sm text-[#adb5bd]">Ristrutturazione completa, edilizia e render 3D</div>
              </div>
            </motion.button>

          </div>
        </div>
      </section>

      {/* Calculators */}
      <section className="relative py-12 lg:py-20 bg-gradient-to-b from-[#6c757d] via-[#495057] to-[#343a40] overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f8f9fa]/5 to-transparent rounded-full blur-3xl"
        />
        <div className="max-w-5xl mx-auto px-6">
          <AnimatePresence mode="wait">

            {/* Solo Infissi */}
            {quoteType === 'finestre' && (
              <motion.div
                key="windows"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <WindowCalculator onQuoteChange={setWindowConfig} />
              </motion.div>
            )}

            {/* Progetto Chiavi in Mano — con sub-tab interni */}
            {quoteType === 'chiavi_in_mano' && (
              <motion.div
                key="project"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Sub-tab navigation */}
                <div className="flex gap-1.5 bg-[#212529]/60 border border-[#f8f9fa]/10 rounded-2xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('infissi')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'infissi'
                        ? 'bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 text-[#f8f9fa] border border-[#f8f9fa]/20'
                        : 'text-[#adb5bd] hover:text-[#dee2e6] hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <Layers size={15} />
                    <span className="hidden sm:inline">Infissi &amp; Progetto</span>
                    <span className="sm:hidden">Progetto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('edilizia')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'edilizia'
                        ? 'bg-gradient-to-br from-orange-400/20 to-orange-500/10 text-orange-200 border border-orange-400/30'
                        : 'text-[#adb5bd] hover:text-[#dee2e6] hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <HardHat size={15} />
                    <span className="hidden sm:inline">Calcola Edilizia</span>
                    <span className="sm:hidden">Edilizia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChiavSubTab('render3d')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      chiavSubTab === 'render3d'
                        ? 'bg-gradient-to-br from-blue-400/20 to-blue-500/10 text-blue-200 border border-blue-400/30'
                        : 'text-[#adb5bd] hover:text-[#dee2e6] hover:bg-[#f8f9fa]/5'
                    }`}
                  >
                    <Box size={15} />
                    <span className="hidden sm:inline">Render 3D</span>
                    <span className="sm:hidden">Render</span>
                  </button>
                </div>

                {/* Sub-tab content */}
                <AnimatePresence mode="wait">

                  {/* Infissi & Progetto */}
                  {chiavSubTab === 'infissi' && (
                    <motion.div
                      key="sub-infissi"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      className="space-y-8"
                    >
                      {/* Include Windows Toggle */}
                      <div className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#f8f9fa]/10 flex items-center justify-center">
                              <Layers size={24} className="text-[#f8f9fa]" />
                            </div>
                            <div>
                              <div className="font-medium text-[#f8f9fa]">Includi Infissi</div>
                              <div className="text-sm text-[#dee2e6]">Aggiungi infissi al progetto</div>
                            </div>
                          </div>
                          <Switch
                            checked={includeWindows}
                            onCheckedChange={setIncludeWindows}
                          />
                        </div>
                      </div>

                      {/* Windows Calculator if included */}
                      {includeWindows && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <WindowCalculator onQuoteChange={setWindowConfig} />
                        </motion.div>
                      )}

                      {/* Project Calculator */}
                      <ProjectCalculator
                        onQuoteChange={setProjectConfig}
                        windowsPrice={includeWindows ? (windowConfig?.estimatedPrice || 0) : 0}
                      />
                    </motion.div>
                  )}

                  {/* Calcola Edilizia */}
                  {chiavSubTab === 'edilizia' && (
                    <motion.div
                      key="sub-edilizia"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                    >
                      <CalcolatoreEdilizia />
                    </motion.div>
                  )}

                  {/* Render 3D */}
                  {chiavSubTab === 'render3d' && (
                    <motion.div
                      key="sub-render3d"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                    >
                      <CalcolatoreRender3D />
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Download & Request Quote — visible only for finestre tab and chiavi_in_mano > infissi sub-tab */}
          {showBottomSection && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-6"
            >
              {/* Download PDF Button */}
              <QuoteDownload
                quoteData={{
                  quote_type: quoteType === 'finestre' ? 'finestre' : (includeWindows ? 'completo' : 'chiavi_in_mano'),
                  window_config: quoteType === 'finestre' || includeWindows ? windowConfig : null,
                  project_config: quoteType === 'chiavi_in_mano' ? projectConfig : null,
                  notes: formData.notes
                }}
                totalPrice={getTotalPrice()}
              />

              {/* Request Quote Button */}
              <div className="text-center">
                {!showForm && !showLoginPrompt ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRequestQuote}
                    className="px-10 py-5 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] rounded-full font-medium text-lg flex items-center gap-3 mx-auto hover:shadow-2xl transition-all"
                  >
                    Richiedi Preventivo Dettagliato
                    <ArrowRight size={20} />
                  </motion.button>
                ) : showLoginPrompt ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl"
                  >
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 flex items-center justify-center">
                        <Gift size={32} className="text-[#f8f9fa]" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-medium text-[#f8f9fa] mb-3 text-center">
                      Accedi per Continuare
                    </h3>
                    <p className="text-[#dee2e6] mb-6 text-center">
                      Registrati o accedi per ricevere il preventivo via email e salvare le tue configurazioni
                    </p>

                    <div className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-xl p-6 mb-6">
                      <p className="text-[#f8f9fa] font-medium mb-3 flex items-center gap-2">
                        <Check className="text-green-400" size={18} />
                        Vantaggi della registrazione:
                      </p>
                      <ul className="space-y-2 text-sm text-[#dee2e6]">
                        <li className="flex items-start gap-2">
                          <span className="text-[#f8f9fa] mt-0.5">✓</span>
                          <span>Ricevi il preventivo dettagliato via email</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#f8f9fa] mt-0.5">✓</span>
                          <span>Salva e confronta multiple configurazioni</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#f8f9fa] mt-0.5">✓</span>
                          <span>Prenota appuntamenti direttamente online</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[#f8f9fa] mt-0.5">✓</span>
                          <span>Ricevi aggiornamenti sul tuo progetto</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={() => openSignIn()}
                        className="w-full py-6 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full text-lg font-medium transition-all"
                      >
                        <LogIn size={20} className="mr-2" />
                        Accedi o Registrati
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowLoginPrompt(false)}
                        className="w-full rounded-full border-[#f8f9fa]/30 text-[#f8f9fa] hover:bg-[#f8f9fa]/10"
                      >
                        Torna Indietro
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#495057] to-[#6c757d] backdrop-blur-sm border border-[#f8f9fa]/20 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl"
                  >
                    <h3 className="text-2xl font-medium text-[#f8f9fa] mb-2">
                      Completa la richiesta
                    </h3>
                    <p className="text-[#dee2e6] mb-4">
                      Inserisci i tuoi dati per ricevere il preventivo dettagliato
                    </p>

                    <div className="bg-[#343a40]/50 backdrop-blur-sm border border-[#f8f9fa]/10 rounded-xl p-4 mb-8">
                      <Label className="text-[#f8f9fa] mb-3 block">
                        Carica Immagini del Progetto (opzionale)
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#f8f9fa]/10 file:text-[#f8f9fa] hover:file:bg-[#f8f9fa]/20"
                      />
                      {formData.files?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formData.files.map((url, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#f8f9fa]/20">
                              <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {user && (
                      <div className="bg-[#343a40]/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <Check className="text-green-400" size={20} />
                        <div>
                          <p className="text-[#f8f9fa] font-medium">Account Collegato</p>
                          <p className="text-sm text-[#dee2e6]">{user.primaryEmailAddress?.emailAddress}</p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                            <User size={16} /> Nome e Cognome <span className="text-[#adb5bd] text-xs">(opzionale)</span>
                          </Label>
                          <Input
                            value={formData.full_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                            placeholder="Mario Rossi"
                            disabled={!!user?.fullName}
                            className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa] disabled:opacity-70"
                          />
                        </div>
                        <div>
                          <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                            <Phone size={16} /> Telefono <span className="text-[#adb5bd] text-xs">(opzionale)</span>
                          </Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+39 333 000 0000"
                            className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa]"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[#f8f9fa] mb-2 flex items-center gap-2">
                          <Mail size={16} /> Email <span className="text-[#adb5bd] text-xs">(opzionale — per ricevere il preventivo)</span>
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="mario@email.it"
                          disabled={!!user}
                          className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa] disabled:opacity-70"
                        />
                      </div>

                      <div>
                        <Label className="text-[#f8f9fa] mb-2">Note Aggiuntive</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Descrivi il tuo progetto o aggiungi dettagli..."
                          className="rounded-xl bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa] placeholder:text-[#adb5bd] focus:border-[#f8f9fa] focus:ring-[#f8f9fa] min-h-[100px]"
                        />
                      </div>

                      <div className="bg-gradient-to-r from-[#343a40] to-[#495057] rounded-xl p-4 flex items-center justify-between border border-[#f8f9fa]/20">
                        <span className="text-[#dee2e6]">Preventivo</span>
                        <span className="text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">
                          €{getTotalPrice().toLocaleString()}
                        </span>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-6 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-2xl rounded-full text-lg font-medium transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              ⏳
                            </motion.div>
                            Invio in corso...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send size={18} />
                            Invia Richiesta
                          </span>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
