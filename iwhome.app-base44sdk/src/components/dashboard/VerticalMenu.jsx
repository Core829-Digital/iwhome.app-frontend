import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  ChevronRight,
  Calendar,
  Users,
  Building,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import NotificationBell from './NotificationBell';

const getMenuItems = (user) => {
  // Utenti standard: solo Dashboard, Appuntamenti, Impostazioni
  if (!user?.is_company && user?.access_level !== 'azienda') {
    return [
      {
        name: 'Dashboard',
        page: 'Dashboard',
        icon: LayoutDashboard
      },
      {
        name: 'Appuntamenti',
        page: 'MyAppointments',
        icon: Calendar
      },
      {
        name: 'Impostazioni',
        page: 'Settings',
        icon: Settings
      }
    ];
  }

  // Utenti azienda: menu completo
  const baseItems = [
    {
      name: 'Dashboard',
      page: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'Documenti',
      page: 'Documents',
      icon: FileText
    },
    {
      name: 'Messaggi',
      page: 'Messages',
      icon: MessageSquare
    },
    {
      name: 'Appuntamenti',
      page: 'MyAppointments',
      icon: Calendar
    },
    {
      name: 'Impostazioni',
      page: 'Settings',
      icon: Settings
    }
  ];

  if (user?.is_company && user?.company_role === 'admin') {
    baseItems.splice(1, 0, {
      name: 'Azienda',
      page: 'CompanyDashboard',
      icon: Building
    });
    baseItems.splice(2, 0, {
      name: 'Editor PDF',
      page: 'PdfEditor',
      icon: FileText
    });
  }

  if (user?.role === 'admin') {
    baseItems.splice(4, 0, {
      name: 'Gestione',
      page: 'AdminAppointments',
      icon: Users
    });
  }

  return baseItems;
};

export default function VerticalMenu() {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  // Auto-close menu on mobile when clicking a link
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  }, [location]);

  const menuItems = getMenuItems(user);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[150] p-3 bg-[#343a40] rounded-xl shadow-2xl hover:bg-[#495057] transition-all"
      >
        {isMobileOpen ? <X size={20} className="text-[#f8f9fa]" /> : <Menu size={20} className="text-[#f8f9fa]" />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-[140]"
          />
        )}
      </AnimatePresence>

      {/* Vertical Menu */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
          x: isMobileOpen || window.innerWidth >= 1024 ? 0 : -280
        }}
        className={`fixed left-0 top-0 lg:top-[76px] h-screen lg:h-[calc(100vh-76px)] bg-gradient-to-b from-[#212529] to-[#343a40] border-r border-[#f8f9fa]/10 z-[145] shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform lg:transition-none`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 lg:p-4 pt-20 lg:pt-4 border-b border-[#f8f9fa]/10 flex items-center justify-between">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f8f9fa] truncate">
                    {user?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-[#adb5bd] truncate">
                    {user?.is_company ? 'Azienda' : 'Utente'}
                  </p>
                </div>
              </motion.div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 hover:bg-[#f8f9fa]/10 rounded-lg transition-all"
            >
              <ChevronRight
                size={20}
                className={`text-[#f8f9fa] transition-transform ${
                  isCollapsed ? '' : 'rotate-180'
                }`}
              />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.includes(item.page.toLowerCase());

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-[#dee2e6] hover:bg-[#f8f9fa]/10'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-[#f8f9fa]/10">
            {user && !isCollapsed && (
              <div className="mb-2">
                <NotificationBell user={user} />
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#dee2e6] hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <LogOut size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}