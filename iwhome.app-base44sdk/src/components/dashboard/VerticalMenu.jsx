import React, { useState } from 'react';
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
  Receipt,
  Shield,
  Truck,
  QrCode,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useQuery } from "convex/react";
import { api } from "../../../../../Backend/convex/_generated/api";

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
    Admin: '/Admin',
    Fornitori: '/Fornitori',
    Collaboratori: '/Collaboratori',
    StaffQR: '/StaffQR',
    Certificati: '/Certificati',
    Pagamenti: '/Pagamenti',
  };
  return routes[page] || '/Dashboard';
};

const getMenuItems = (user) => {
  const role = user?.role || 'user';
  const isAdmin = role === 'admin' || role === 'ceo';
  const isSupplier = role === 'supplier';
  const isCollaborator = role === 'collaborator_internal' || role === 'collaborator_external';
  const isSupervisor = role === 'supervisor';
  const isClient = role === 'client';

  // Build menu based on role
  const items = [];

  // 1. Dashboard — visible to all
  items.push({ name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard, subItems: [] });

  // 2. Fornitori — admin/ceo/supplier
  if (isAdmin || isSupplier) {
    items.push({ name: 'Fornitori', page: 'Fornitori', icon: Truck, subItems: [] });
  }

  // 3. Collaboratori — admin/ceo
  if (isAdmin) {
    items.push({ name: 'Collaboratori', page: 'Collaboratori', icon: Briefcase, subItems: [] });
  }

  // 4. Staff QR — admin/ceo/supervisor
  if (isAdmin || isSupervisor) {
    items.push({ name: 'Staff QR', page: 'StaffQR', icon: QrCode, subItems: [] });
  }

  // 5. Certificati — admin/ceo/supervisor
  if (isAdmin || isSupervisor) {
    items.push({ name: 'Certificati', page: 'Certificati', icon: Shield, subItems: [] });
  }

  // 6. Pagamenti — admin/ceo + limited view for others
  if (isAdmin || isSupplier || isCollaborator || isClient) {
    items.push({ name: 'Pagamenti', page: 'Pagamenti', icon: CreditCard, subItems: [] });
  }

  // 7. Gestione Cantieri — admin/ceo/supervisor
  if (isAdmin || isSupervisor) {
    items.push({ name: 'Gestione Cantieri', page: 'CantieriDashboard', icon: HardHat, subItems: [] });
  }

  // 8. Clienti — admin/ceo
  if (isAdmin) {
    items.push({ name: 'Clienti', page: 'Clienti', icon: Users, subItems: [] });
  }

  // 9. Preventivi — admin/ceo
  if (isAdmin) {
    items.push({ name: 'Preventivi', page: 'Preventivi', icon: Receipt, subItems: [] });
  }

  // 10. Documenti — all authenticated users
  items.push({
    name: 'Documenti',
    page: 'Documents',
    icon: FileText,
    subItems: [
      { name: 'I Miei Documenti', page: 'Documents', icon: FolderOpen },
      { name: 'Carica Documento', page: 'UploadDocument', icon: Upload },
      { name: 'Condivisi con me', page: 'SharedDocuments', icon: Share2 }
    ]
  });

  // 11. Messages — admin/ceo/client
  if (isAdmin || isClient) {
    items.push({ name: 'Messaggi', page: 'Messages', icon: MessageSquare, subItems: [] });
  }

  // 12. Appuntamenti — all
  items.push({ name: 'Appuntamenti', page: 'MyAppointments', icon: Calendar, subItems: [] });

  // 13. Admin — admin/ceo only
  if (isAdmin) {
    items.push({ name: 'Pannello Admin', page: 'Admin', icon: Shield, subItems: [] });
  }

  // 14. Company Dashboard (legacy)
  if (user?.is_company && user?.company_role === 'admin') {
    items.splice(1, 0, { name: 'Azienda', page: 'CompanyDashboard', icon: Building, subItems: [] });
  }

  // 15. Settings — always last
  items.push({ name: 'Impostazioni', page: 'Settings', icon: Settings, subItems: [] });

  return items;
};




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
              const linkPath = createPageUrl(item.page).toLowerCase();
              const currentPath = location.pathname.toLowerCase();
              const isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
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