import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  ChevronRight,
  ChevronDown,
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
    ClientChat: '/ClientChat',
    CantieriDashboard: '/CantieriDashboard',
    Clienti: '/Clienti',
    Preventivi: '/Preventivi',
    Admin: '/Admin',
    Fornitori: '/Fornitori',
    Collaboratori: '/Collaboratori',
    Certificati: '/Certificati',
    Pagamenti: '/Pagamenti',
    DailyLogs: '/DailyLogs',
  };
  return routes[page] || '/Dashboard';
};

const getMenuItems = (user) => {
  const role = user?.role || 'user';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSupplier = role === 'supplier';
  const isCollaborator = role === 'collaborator_internal' || role === 'collaborator_external' || role === 'collaborator';
  const isSupervisor = false;
  const isClient = role === 'client';

  // Role display config
  const roleConfig = {
    superadmin: { label: 'SuperAdmin', color: 'text-purple-400', ring: 'ring-purple-500', bg: 'bg-purple-500/20' },
    admin: { label: 'Admin', color: 'text-emerald-400', ring: 'ring-emerald-500', bg: 'bg-emerald-500/20' },
    supplier: { label: 'Fornitore', color: 'text-orange-400', ring: 'ring-orange-500', bg: 'bg-orange-500/20' },
    client: { label: 'Cliente', color: 'text-blue-400', ring: 'ring-blue-500', bg: 'bg-blue-500/20' },
    collaborator: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_internal: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_external: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    supervisor: { label: 'Supervisore', color: 'text-yellow-400', ring: 'ring-yellow-500', bg: 'bg-yellow-500/20' },
    worker: { label: 'Operaio', color: 'text-gray-400', ring: 'ring-gray-500', bg: 'bg-gray-500/20' },
    user: { label: 'Utente Base', color: 'text-gray-400', ring: 'ring-gray-500', bg: 'bg-gray-500/20' },
  };
  const rc = roleConfig[role] || roleConfig.user;

  // Build menu based on role
  const items = [];

  // 1. Dashboard — visible to all
  items.push({ name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard });

  // 2. Area Operativa
  const opGroup = [];
  if (isAdmin || isSupplier) opGroup.push({ name: 'Fornitori', page: 'Fornitori', icon: Truck });
  if (isAdmin || isSupervisor || isCollaborator) opGroup.push({ name: 'Cantieri', page: 'CantieriDashboard', icon: HardHat });
  if (isAdmin) opGroup.push({ name: 'Preventivi', page: 'Preventivi', icon: Receipt });
  if (isAdmin || isSupplier || isCollaborator || isClient) opGroup.push({ name: 'Pagamenti', page: 'Pagamenti', icon: CreditCard });
  if (isCollaborator) opGroup.push({ name: 'Log Ore', page: 'DailyLogs', icon: Briefcase });
  opGroup.push({ name: 'Appuntamenti', page: 'MyAppointments', icon: Calendar });

  if (opGroup.length > 0) items.push({ name: 'Area Operativa', icon: Briefcase, isGroup: true, subItems: opGroup });

  // 3. CRM & Admin
  const crmGroup = [];
  if (isAdmin) crmGroup.push({ name: 'Clienti', page: 'Clienti', icon: Users });
  if (isAdmin) crmGroup.push({ name: 'Collaboratori', page: 'Collaboratori', icon: Briefcase });
  if (isAdmin || isSupervisor || isCollaborator) crmGroup.push({ name: 'Certificati', page: 'Certificati', icon: Shield });
  if (isAdmin) crmGroup.push({ name: 'Pannello Admin', page: 'Admin', icon: Shield });

  if (crmGroup.length > 0) items.push({ name: 'CRM & Admin', icon: Shield, isGroup: true, subItems: crmGroup });

  // 4. Archivio & Chat
  const docGroup = [
    { name: 'I Miei Documenti', page: 'Documents', icon: FolderOpen },
    { name: 'Carica Documento', page: 'UploadDocument', icon: Upload },
    { name: 'Condivisi con me', page: 'SharedDocuments', icon: Share2 }
  ];
  if (isAdmin || isClient || isCollaborator) docGroup.push({ name: 'Messaggi', page: 'Messages', icon: MessageSquare });

  items.push({ name: 'Archivio & Chat', icon: FileText, isGroup: true, subItems: docGroup });


  // 5. Settings
  items.push({ name: 'Impostazioni', page: 'Settings', icon: Settings, subItems: [] });

  return items;
};




export default function VerticalMenu() {
  const location = useLocation();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState([]);


  // Fetch user role from Convex database (source of truth for roles)
  const convexUser = useQuery(api.users.getByEmail, {
    email: clerkUser?.primaryEmailAddress?.emailAddress || ""
  });

  // Map user data for getMenuItems - using Convex role instead of Clerk metadata
  const user = clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    role: convexUser?.role || 'user', // Get role from Convex, default to 'user'
    profile_image: convexUser?.profile_image,
  } : null;

  // Role display config for the UI badge
  const roleConfig = {
    superadmin: { label: 'SuperAdmin', color: 'text-purple-400', ring: 'ring-purple-500', bg: 'bg-purple-500/20' },
    admin: { label: 'Admin', color: 'text-emerald-400', ring: 'ring-emerald-500', bg: 'bg-emerald-500/20' },
    supplier: { label: 'Fornitore', color: 'text-orange-400', ring: 'ring-orange-500', bg: 'bg-orange-500/20' },
    client: { label: 'Cliente', color: 'text-blue-400', ring: 'ring-blue-500', bg: 'bg-blue-500/20' },
    collaborator: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_internal: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    collaborator_external: { label: 'Collaboratore', color: 'text-indigo-400', ring: 'ring-indigo-500', bg: 'bg-indigo-500/20' },
    supervisor: { label: 'Supervisore', color: 'text-yellow-400', ring: 'ring-yellow-500', bg: 'bg-yellow-500/20' },
    worker: { label: 'Operaio', color: 'text-gray-400', ring: 'ring-gray-500', bg: 'bg-gray-500/20' },
    user: { label: 'Utente Base', color: 'text-gray-400', ring: 'ring-gray-500', bg: 'bg-gray-500/20' },
  };
  const rc = roleConfig[user?.role || 'user'] || roleConfig.user;

  // Auto-close menu on mobile when clicking a link
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  }, [location]);

  // Sincronizza il gruppo aperto in base alla route (pagina) corrente
  React.useEffect(() => {
    const currentPath = location.pathname.toLowerCase();
    const items = getMenuItems(user);
    const activeGroup = items.find(g =>
      g.isGroup && g.subItems?.some(sub => {
        const sp = createPageUrl(sub.page).toLowerCase();
        return currentPath === sp || (sp !== '/' && currentPath.startsWith(sp));
      })
    );
    // Se stiamo navigando su una pagina che fa parte di un gruppo e 
    // quel gruppo non è attualmente aperto, lo aggiungiamo a quelli aperti.
    if (activeGroup && !openGroups.includes(activeGroup.name)) {
      setOpenGroups(prev => [...prev, activeGroup.name]);
    }
  }, [location.pathname, user?.role]);


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
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden ring-2 ${rc.ring} shadow-md`}>
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
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${rc.bg} ${rc.color}`}>
                    {rc.label}
                  </span>
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

              if (item.isGroup) {
                const isOpen = openGroups.includes(item.name);
                const hasActiveSub = item.subItems.some(sub => {
                  const sp = createPageUrl(sub.page).toLowerCase();
                  const cp = location.pathname.toLowerCase();
                  return cp === sp || (sp !== '/' && cp.startsWith(sp));
                });

                return (
                  <div key={item.name} className="mb-1 text-[#dee2e6]">
                    <button
                      onClick={() => {
                        if (isCollapsed) setIsCollapsed(false);
                        setOpenGroups(prev =>
                          prev.includes(item.name)
                            ? prev.filter(g => g !== item.name)
                            : [...prev, item.name]
                        );
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${hasActiveSub ? 'bg-[#f8f9fa]/5' : 'hover:bg-[#f8f9fa]/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium text-sm">{item.name}</span>}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && !isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-4 mt-1 border-l border-[#495057] pl-2 space-y-1"
                        >
                          {item.subItems.map(subItem => {
                            const SubIcon = subItem.icon;
                            const linkPath = createPageUrl(subItem.page).toLowerCase();
                            const currentPath = location.pathname.toLowerCase();
                            const isActive = currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath));
                            return (
                              <Link
                                key={subItem.page}
                                to={createPageUrl(subItem.page)}
                                onClick={() => setIsMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs ${isActive
                                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                                  : 'text-[#adb5bd] hover:bg-[#f8f9fa]/10 hover:text-[#f8f9fa]'
                                  }`}
                              >
                                <SubIcon size={16} className="flex-shrink-0" />
                                <span>{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              } else {
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
              }
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