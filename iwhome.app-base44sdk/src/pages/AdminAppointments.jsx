import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VerticalMenu from '../components/dashboard/VerticalMenu';
import AnimatedBackground from '../components/dashboard/AnimatedBackground';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function AdminAppointments() {
  const [user, setUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const currentUser = await base44.auth.me();
    if (currentUser.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    setUser(currentUser);
  };

  const { data: allAppointments = [], isLoading } = useQuery({
    queryKey: ['admin-appointments', statusFilter],
    queryFn: async () => {
      const query = statusFilter !== 'all' ? { status: statusFilter } : {};
      return await base44.asServiceRole.entities.Appointment.filter(query, '-appointment_date');
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, email, full_name, appointment_date, appointment_time }) => {
      await base44.asServiceRole.entities.Appointment.update(id, { status });
      
      // Send email notification
      const emailSubject = status === 'confirmed' 
        ? 'Appuntamento Confermato - IwHome'
        : 'Appuntamento Non Disponibile - IwHome';
      
      const emailBody = status === 'confirmed'
        ? `Gentile ${full_name},\n\nSiamo lieti di confermare il tuo appuntamento presso IwHome Showroom.\n\nData: ${format(new Date(appointment_date), 'EEEE d MMMM yyyy', { locale: it })}\nOra: ${appointment_time}\nIndirizzo: Via Montefiorino 10/E, Reggio Emilia\n\nTi aspettiamo!\n\nCordiali saluti,\nTeam IwHome`
        : `Gentile ${full_name},\n\nCi dispiace informarti che l'appuntamento richiesto per il ${format(new Date(appointment_date), 'd MMMM yyyy', { locale: it })} alle ore ${appointment_time} non è disponibile.\n\nTi invitiamo a prenotare un altro appuntamento sul nostro sito.\n\nCordiali saluti,\nTeam IwHome`;

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: emailSubject,
        body: emailBody
      });

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: email,
        type: 'appointment',
        title: status === 'confirmed' ? 'Appuntamento Confermato' : 'Appuntamento Rifiutato',
        message: status === 'confirmed' 
          ? `Il tuo appuntamento del ${format(new Date(appointment_date), 'd MMMM', { locale: it })} è stato confermato`
          : `Il tuo appuntamento del ${format(new Date(appointment_date), 'd MMMM', { locale: it })} non è disponibile`,
        link: '/my-appointments'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="text-green-400" size={20} />;
      case 'pending': return <AlertCircle className="text-yellow-400" size={20} />;
      case 'cancelled': return <XCircle className="text-red-400" size={20} />;
      default: return <Clock className="text-[#adb5bd]" size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confermato';
      case 'pending': return 'In Attesa';
      case 'cancelled': return 'Rifiutato';
      case 'completed': return 'Completato';
      default: return status;
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#f8f9fa]">Caricamento...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057] relative overflow-hidden">
      <AnimatedBackground />
      <VerticalMenu />

      <div className="lg:ml-[280px] pt-[76px] relative z-10 min-h-screen pb-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium text-[#f8f9fa] mb-1">
              Gestione Appuntamenti
            </h1>
            <p className="text-xs sm:text-sm text-[#dee2e6]">Conferma o rifiuta</p>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#495057] border-[#f8f9fa]/20">
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="pending">In Attesa</SelectItem>
              <SelectItem value="confirmed">Confermati</SelectItem>
              <SelectItem value="cancelled">Rifiutati</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-[#dee2e6]">Caricamento...</div>
        ) : allAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={64} className="text-[#6c757d] mx-auto mb-4" />
            <p className="text-[#dee2e6] text-lg">Nessun appuntamento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {allAppointments.map((apt) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-[#343a40]/30 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl hover:bg-[#343a40]/50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(apt.status)}
                    <span className="text-sm px-3 py-1 rounded-full bg-[#f8f9fa]/10 text-[#f8f9fa] backdrop-blur-sm">
                      {getStatusText(apt.status)}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                    {apt.project_type}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-medium text-[#f8f9fa] mb-1">{apt.full_name}</h3>
                  <p className="text-sm text-[#dee2e6] flex items-center gap-2">
                    <Mail size={14} />
                    {apt.email}
                  </p>
                  {apt.phone && (
                    <p className="text-sm text-[#dee2e6]">Tel: {apt.phone}</p>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3 text-[#f8f9fa] text-sm">
                    <Calendar size={16} className="text-[#adb5bd]" />
                    <span>{format(new Date(apt.appointment_date), 'EEEE d MMMM yyyy', { locale: it })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#f8f9fa] text-sm">
                    <Clock size={16} className="text-[#adb5bd]" />
                    <span>ore {apt.appointment_time}</span>
                  </div>
                </div>

                {apt.notes && (
                  <div className="mb-4 p-3 bg-[#495057]/30 rounded-lg">
                    <p className="text-sm text-[#dee2e6]">{apt.notes}</p>
                  </div>
                )}

                {apt.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t border-[#f8f9fa]/10">
                    <Button
                      onClick={() => updateStatusMutation.mutate({
                        id: apt.id,
                        status: 'confirmed',
                        email: apt.email,
                        full_name: apt.full_name,
                        appointment_date: apt.appointment_date,
                        appointment_time: apt.appointment_time
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Conferma
                    </Button>
                    <Button
                      onClick={() => updateStatusMutation.mutate({
                        id: apt.id,
                        status: 'cancelled',
                        email: apt.email,
                        full_name: apt.full_name,
                        appointment_date: apt.appointment_date,
                        appointment_time: apt.appointment_time
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    >
                      <XCircle size={16} className="mr-2" />
                      Rifiuta
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}