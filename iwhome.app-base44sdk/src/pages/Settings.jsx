import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import { Card } from '@/components/ui/card';
import { User, Mail, Phone, Building, Save, Check } from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../Backend/convex/_generated/api";

export default function Settings() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company_name: '',
    company_code: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const upgradeToCompany = useMutation(api.users.upgradeToCompany);
  const convexUser = useQuery(api.users.getByEmail, { email: user?.primaryEmailAddress?.emailAddress || "" });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.fullName || '',
        phone: `${user.unsafeMetadata?.phone || ''}`,
        company_name: `${user.unsafeMetadata?.company_name || ''}`,
        company_code: `${user.unsafeMetadata?.company_code || ''}`
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Verifica codice di accesso se modificato
      // Verifica codice di accesso se modificato o presente
      if (formData.company_code) {
        try {
          await upgradeToCompany({ accessCode: formData.company_code });
        } catch (err) {
          console.error("Upgrade failed:", err);
          // Optional: alert('Codice non valido'); 
        }
      }

      // Salva le modifiche
      await user.update({
        firstName: formData.full_name.split(' ')[0],
        lastName: formData.full_name.split(' ').slice(1).join(' '),
        unsafeMetadata: {
          phone: formData.phone,
          company_name: formData.company_name,
          company_code: formData.company_code
        }
      });

      setIsSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving:', error);
      setIsSaving(false);
      alert('Errore nel salvataggio: ' + error.message);
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#f8f9fa]">Caricamento...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      <VerticalMenu />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1 sm:mb-2">Impostazioni</h1>
            <p className="text-xs sm:text-sm text-[#dee2e6]">Gestisci il tuo profilo</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden hover:bg-[#343a40]/40 transition-all duration-300"
          >
            <form onSubmit={handleSave} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              {/* Account Info */}
              <div className="space-y-6">
                <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                  <User size={20} />
                  Informazioni Account
                </h2>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                    <Input
                      value={user.primaryEmailAddress?.emailAddress}
                      disabled
                      className="pl-10 bg-[#495057]/20 backdrop-blur-sm border-[#f8f9fa]/10 text-[#adb5bd]"
                    />
                  </div>
                  <p className="text-xs text-[#adb5bd]">L'email non può essere modificata</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="pl-10 bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Telefono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb5bd]" size={18} />
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+39 123 456 7890"
                      className="pl-10 bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="pt-6 border-t border-[#f8f9fa]/10 space-y-6">
                <h2 className="text-xl font-medium text-[#f8f9fa] flex items-center gap-2">
                  <Building size={20} />
                  Informazioni Azienda (Opzionale)
                </h2>

                {convexUser?.is_company && (
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                    <Check className="text-green-400" size={20} />
                    <div>
                      <p className="text-green-300 font-medium">Account Aziendale Verificato</p>
                      <p className="text-sm text-green-300/80">Hai accesso alle funzionalità B2B</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Nome Azienda</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Es: ABC S.r.l."
                    className="bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#f8f9fa]">Codice di Accesso</Label>
                  <Input
                    value={formData.company_code}
                    onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                    placeholder="IWSHOWROOMAZIENDE@AREAPRIVATA"
                    className="bg-[#495057]/30 backdrop-blur-sm border-[#f8f9fa]/20 text-[#f8f9fa] focus:bg-[#495057]/50 transition-all font-mono text-sm"
                  />
                  <Card className="bg-blue-500/10 border-blue-500/30 p-3">
                    <p className="text-xs text-blue-300 font-medium mb-2">💡 Codice Standard:</p>
                    <code className="text-xs text-blue-200 bg-black/20 px-2 py-1 rounded block">
                      IWSHOWROOMAZIENDE@AREAPRIVATA
                    </code>
                    <p className="text-xs text-blue-300 mt-2">Usa questo codice per attivare l'accesso all'area privata</p>
                  </Card>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] text-[#212529] hover:shadow-xl disabled:opacity-50"
                >
                  {saved ? (
                    <>
                      <Check size={18} className="mr-2" />
                      Salvato!
                    </>
                  ) : isSaving ? (
                    'Salvataggio...'
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Salva Modifiche
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}