import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Check, MessageSquare, FileText, Calendar, X, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import NotificationCenter from './NotificationCenter';


export default function NotificationBell({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCenter, setShowCenter] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.Notification.filter(
        { user_email: user.email },
        '-created_date',
        50
      );
    },
    enabled: !!user,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const readNotifs = notifications.filter(n => n.read);
      await Promise.all(readNotifs.map(n => base44.entities.Notification.delete(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-blue-400" />;
      case 'document': return <FileText size={16} className="text-purple-400" />;
      case 'appointment': return <Calendar size={16} className="text-green-400" />;
      default: return <Bell size={16} className="text-[#f8f9fa]" />;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-[#f8f9fa]/10 transition-all"
        >
          <Bell size={20} className="text-[#f8f9fa]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium shadow-lg"
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.7)', '0 0 0 6px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0)']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed sm:absolute right-0 left-0 sm:left-auto top-16 sm:top-full sm:mt-2 mx-2 sm:mx-0 w-[calc(100%-1rem)] sm:w-96 max-h-[70vh] sm:max-h-96 overflow-y-auto bg-[#343a40]/95 backdrop-blur-xl border border-[#f8f9fa]/20 rounded-2xl shadow-2xl z-[200]"
          >
            <div className="p-4 border-b border-[#f8f9fa]/10">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#f8f9fa]">Notifiche</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-[#adb5bd]">{unreadCount} nuove</span>
                )}
              </div>
            </div>

            <div className="divide-y divide-[#f8f9fa]/5">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[#adb5bd]">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-[#f8f9fa]/5 transition-all ${
                      !notif.read ? 'bg-[#f8f9fa]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={notif.link || createPageUrl('Dashboard')}
                          onClick={() => {
                            markAsReadMutation.mutate(notif.id);
                            setIsOpen(false);
                          }}
                          className="block"
                        >
                          <h4 className="text-sm font-medium text-[#f8f9fa] mb-1">
                            {notif.title}
                          </h4>
                          <p className="text-xs text-[#dee2e6] line-clamp-2">
                            {notif.message}
                          </p>
                          <span className="text-xs text-[#adb5bd] mt-1 block">
                            {new Date(notif.created_date).toLocaleDateString('it-IT')}
                          </span>
                        </Link>
                      </div>
                      <button
                        onClick={() => deleteNotificationMutation.mutate(notif.id)}
                        className="text-[#adb5bd] hover:text-[#f8f9fa] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-[#f8f9fa]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      notifications.forEach(n => {
                        if (!n.read) markAsReadMutation.mutate(n.id);
                      });
                    }}
                    className="text-xs text-[#f8f9fa] hover:underline"
                  >
                    Segna tutte come lette
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowCenter(true);
                    }}
                    className="flex items-center gap-1 text-xs text-[#f8f9fa] hover:underline"
                  >
                    <Maximize2 size={12} />
                    Mostra tutto
                  </button>
                </div>
                {notifications.filter(n => n.read).length > 0 && (
                  <button
                    onClick={() => deleteAllReadMutation.mutate()}
                    className="text-xs text-red-400 hover:text-red-300 w-full text-left"
                  >
                    Elimina tutte le lette
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Notification Center Modal */}
      <AnimatePresence>
        {showCenter && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowCenter(false)}
            />
            <NotificationCenter user={user} onClose={() => setShowCenter(false)} />
          </>
        )}
      </AnimatePresence>
    </>
  );
}