import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  FolderOpen,
  Upload,
  Share2,
  Calendar,
  Users,
  Building,
  HardHat,
  MessagesSquare,
  Receipt,
  Shield
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';

// Helper function to create page URLs (simplified for now)
const createPageUrl = (page) => {
  const routes = {
    Dashboard: '/Dashboard',
    Documents: '/Documents',
    UploadDocument: '/UploadDocument',
    SharedDocuments: '/SharedDocuments',
    Messages: '/Messages',
    MyAppointments: '/MyAppointments',
    Settings: '/Settings',
    CompanyDashboard: '/CompanyDashboard',
    ClientChat: '/ClientChat',
    CantieriDashboard: '/CantieriDashboard',
    Clienti: '/Clienti',
    Preventivi: '/Preventivi',
    Admin: '/Admin'
  };
  return routes[page] || '/Dashboard';
};

const getMenuItems = (user) => {
  // 1. Basic items available to everyone (User, Client, Admin)
  const baseItems = [
    {
      name: 'Dashboard',
      page: 'Dashboard',
      icon: LayoutDashboard,
      subItems: []
    },
    {
      name: 'Documenti',
      page: 'Documents',
      icon: FileText,
      subItems: [
        { name: 'I Miei Documenti', page: 'Documents', icon: FolderOpen },
        { name: 'Carica Documento', page: 'UploadDocument', icon: Upload },
        { name: 'Condivisi con me', page: 'SharedDocuments', icon: Share2 }
      ]
    },
    {
      name: 'Appuntamenti',
      page: 'MyAppointments',
      icon: Calendar,
      subItems: []
    },
    {
      name: 'Impostazioni',
      page: 'Settings',
      icon: Settings,
      subItems: []
    }
  ];

  // 2. Client & Admin only items
  if (user?.role === 'client' || user?.role === 'admin' || user?.role === 'ceo') {
    // Insert Messages after Documents (index 2)
    baseItems.splice(2, 0, {
      name: 'Messaggi',
      page: 'Messages',
      icon: MessageSquare,
      subItems: []
    });
  }

  // 3. Admin only items
  if (user?.role === 'admin' || user?.role === 'ceo') {
    // Insert Admin items after Messages (or at the end of the main block)
    // Current indices after splice: Dashboard(0), Docs(1), Messages(2), Appointments(3), Settings(4)
    // We want Admin items to appear before Settings usually, or grouped. 
    // Let's add them before 'Impostazioni' (last item) or specifically ordered.

    // Admin specific pages: CantieriDashboard, Clienti, ClientChat, Preventivi
    const adminItems = [
      {
        name: 'Gestione Cantieri',
        page: 'CantieriDashboard',
        icon: HardHat,
        subItems: []
      },
      {
        name: 'Clienti',
        page: 'Clienti',
        icon: Users,
        subItems: []
      },
      {
        name: 'Chat Clienti',
        page: 'ClientChat',
        icon: MessagesSquare,
        subItems: []
      },
      {
        name: 'Preventivi',
        page: 'Preventivi',
        icon: Receipt,
        subItems: []
      },
      {
        name: 'Pannello Admin',
        page: 'Admin',
        icon: Shield,
        subItems: []
      }
    ];

    // Find index of Settings to insert before it
    const settingsIndex = baseItems.findIndex(item => item.page === 'Settings');
    baseItems.splice(settingsIndex, 0, ...adminItems);
  }

  // Legacy Company Dashboard check (preserving existing logic just in case)
  if (user?.is_company && user?.company_role === 'admin') {
    baseItems.splice(1, 0, {
      name: 'Azienda',
      page: 'CompanyDashboard',
      icon: Building,
      subItems: []
    });
  }

  return baseItems;
};


import { useQuery } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";

export default function VerticalMenu() {
  const location = useLocation();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch user role from Convex database (source of truth for roles)
  const convexUser = useQuery(api.users.getByEmail, {
    email: clerkUser?.primaryEmailAddress?.emailAddress || ""
  });

  // Map user data for getMenuItems - using Convex role instead of Clerk metadata
  const user = clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    role: convexUser?.role || 'user', // Get role from Convex, default to 'user'
    is_company: convexUser?.is_company || false,
    profile_image: convexUser?.profile_image,
  } : null;

  // Auto-close menu on mobile when clicking a link
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  }, [location]);


  const menuItems = getMenuItems(user);

  const handleLogout = async () => {
    await signOut();
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
        className={`fixed left-0 top-0 lg:top-[76px] h-screen lg:h-[calc(100vh-76px)] bg-gradient-to-b from-[#212529] to-[#343a40] border-r border-[#f8f9fa]/10 z-[145] shadow-2xl ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden border border-[#f8f9fa]/20 shadow-md">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.[0] || user?.email?.[0] || 'U'
                  )}
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
            {/* Notification Bell Moved to Header */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 hover:bg-[#f8f9fa]/10 rounded-lg transition-all"
            >
              <ChevronRight
                size={20}
                className={`text-[#f8f9fa] transition-transform ${isCollapsed ? '' : 'rotate-180'
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
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