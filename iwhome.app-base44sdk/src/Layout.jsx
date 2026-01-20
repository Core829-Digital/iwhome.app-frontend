import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Mail, MapPin, Instagram, Facebook, Linkedin, User, LogOut, LayoutDashboard } from 'lucide-react';
import ChatWidget from './components/chat/ChatWidget';
import PageTransition from './components/PageTransition';
import GDPRBanner from './components/GDPRBanner';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import GlobalSearch from './components/dashboard/GlobalSearch';
import { Search } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);
      setAtTop(scrollY === 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    setUser(null);
  };

  const navItems = [
    { name: 'Home', page: 'Home' },
    { name: 'Chi Siamo', page: 'ChiSiamo' },
    { name: 'Servizi', page: 'Servizi' },
    { name: 'Calcolatore', page: 'Calcolatore' },
    { name: 'Appuntamenti', page: 'Appuntamenti' },
    { name: 'Blog', page: 'Blog' },
  ];

  const legalPages = [
    { name: 'Privacy Policy', page: 'Privacy' },
    { name: 'Cookie Policy', page: 'Cookie' },
    { name: 'Termini di Servizio', page: 'Termini' },
  ];

  const [showChat, setShowChat] = React.useState(true);

  return (
    <div className="min-h-screen bg-[#E8E8E4] font-sans relative overflow-x-hidden">
      {/* Animated Background - Simplified on mobile */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#3D4F47]/20 to-[#2D3B35]/15 rounded-full blur-3xl md:blur-3xl blur-2xl"
          style={{ willChange: 'transform' }}
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#4A5F57]/15 to-[#3D4F47]/20 rounded-full blur-3xl md:blur-3xl blur-2xl"
          style={{ willChange: 'transform' }}
        />
      </div>
      
      <div className="relative z-10">
          <style>{`
            :root {
              --bright-snow: #f8f9faff;
              --platinum: #e9ecefff;
              --alabaster-grey: #dee2e6ff;
              --pale-slate: #ced4daff;
              --pale-slate-2: #adb5bdff;
              --slate-grey: #6c757dff;
              --iron-grey: #495057ff;
              --gunmetal: #343a40ff;
              --carbon-black: #212529ff;
            }

            html {
              scroll-behavior: smooth;
            }

            .parallax-bg {
              background-attachment: fixed;
              background-position: center;
              background-size: cover;
            }

            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }

            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 0 20px rgba(248, 249, 250, 0.1); }
              50% { box-shadow: 0 0 40px rgba(248, 249, 250, 0.2); }
            }

            .hover-lift {
              transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .hover-lift:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .logo-glow {
          filter: drop-shadow(0 0 20px rgba(201, 169, 98, 0.4));
        }
        
        .nav-link {
          position: relative;
          overflow: hidden;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 1px;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .glass-effect {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out will-change-transform ${
          atTop && currentPageName === 'Home'
            ? 'bg-transparent py-5 border-b border-transparent'
            : scrolled 
              ? 'bg-[#1a1d21]/85 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-2.5 border-b border-[#f8f9fa]/20' 
              : currentPageName === 'Home'
                ? 'bg-black/15 backdrop-blur-md py-5 border-b border-white/5'
                : 'bg-[#212529]/90 backdrop-blur-xl shadow-lg py-4 border-b border-[#f8f9fa]/10'
        }`}
        style={{ 
          backdropFilter: atTop && currentPageName === 'Home' ? 'none' : 'blur(24px)', 
          WebkitBackdropFilter: atTop && currentPageName === 'Home' ? 'none' : 'blur(24px)' 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center flex-shrink-0">
              <motion.img
                animate={{ 
                  rotate: [0, 360],
                  height: scrolled ? ['2.25rem', '2.25rem'] : ['2.75rem', '2.75rem']
                }}
                transition={{ 
                  rotate: {
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatType: "loop"
                  },
                  height: {
                    duration: 0.7
                  }
                }}
                whileHover={{ scale: 1.08 }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/927932459_icon.png"
                alt="IwHome"
                className={scrolled ? 'h-9 md:h-10' : 'h-11 md:h-12'}
                loading="eager"
                decoding="async"
                style={{ willChange: 'transform' }}
              />
            </Link>

          {/* Desktop Nav - Centered */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`nav-link text-sm tracking-wide transition-all duration-300 font-medium relative whitespace-nowrap ${
                  item.page === 'Calcolatore'
                    ? 'text-red-500 hover:text-red-400'
                    : currentPageName === item.page 
                      ? 'text-white font-semibold'
                      : 'text-white/85 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

                {/* User Menu Desktop */}
                <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto">
                  <button
                    onClick={() => setShowGlobalSearch(true)}
                    className={`p-2 rounded-lg hover:bg-white/10 transition-all ${
                      scrolled ? 'text-white/80' : 'text-white'
                    }`}
                    title="Ricerca globale"
                  >
                    <Search size={scrolled ? 18 : 20} />
                  </button>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 text-white hover:bg-white/10 rounded-full px-3 py-1.5 transition-all">
                          <div className={`rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center transition-all duration-300 ${
                            scrolled ? 'w-7 h-7' : 'w-8 h-8'
                          }`}>
                            <User size={scrolled ? 14 : 16} />
                          </div>
                          <span className={`hidden xl:block transition-all duration-300 ${scrolled ? 'text-xs' : 'text-sm'}`}>
                            {user.full_name || user.email}
                          </span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-[#1a1d21] border-white/10">
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-white/10">
                            <LayoutDashboard size={16} />
                            Area Privata
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-white hover:bg-white/10">
                          <LogOut size={16} />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                      className={`bg-gradient-to-r from-white to-gray-200 text-black hover:shadow-xl rounded-full transition-all duration-300 font-medium ${
                        scrolled ? 'px-4 py-1.5 text-sm' : 'px-5 py-2'
                      }`}
                    >
                      <User size={scrolled ? 14 : 16} className="mr-2" />
                      <span className="hidden sm:inline">Accedi</span>
                    </Button>
                  )}
                </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg transition-all duration-200 text-white hover:bg-white/10"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#212529]/95 backdrop-blur-xl border-t border-[#f8f9fa]/10"
            >
              <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
                {navItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMenuOpen(false)}
                      className={`text-lg transition-colors ${
                        item.page === 'Calcolatore'
                          ? 'text-red-500 hover:text-red-400'
                          : currentPageName === item.page 
                            ? 'text-[#f8f9fa]' 
                            : 'text-[#e9ecef]/80 hover:text-[#f8f9fa]'
                      }`}
                    >
                      {item.name}
                      </Link>
                      ))}

                    {/* User Menu Mobile */}
                    <div className="pt-4 border-t border-[#f8f9fa]/10">
                    {user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-[#dee2e6] mb-2">
                        {user.full_name || user.email}
                      </div>
                      <Link
                        to={createPageUrl('Dashboard')}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 rounded-lg"
                      >
                        <LayoutDashboard size={18} />
                        Area Privata
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 rounded-lg w-full text-left"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </>
                    ) : (
                    <button
                      onClick={() => {
                        base44.auth.redirectToLogin(window.location.pathname);
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-[#f8f9fa] hover:bg-[#f8f9fa]/10 rounded-lg w-full text-left"
                    >
                      <User size={18} />
                      Accedi
                    </button>
                    )}
                    </div>
                    </nav>
                    </motion.div>
                    )}
                    </AnimatePresence>
                    </motion.header>

      {/* Main Content */}
      <main>
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Chat Widget */}
      {showChat && <ChatWidget />}

      {/* GDPR Banner */}
      <GDPRBanner />

      {/* Global Search Modal */}
      <AnimatePresence>
        {showGlobalSearch && user && (
          <GlobalSearch user={user} onClose={() => setShowGlobalSearch(false)} />
        )}
      </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-[#212529] to-[#343a40] text-[#f8f9fa] pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#f8f9fa] rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#e9ecef] rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Logo & Description */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/2f9fe18d6_logo.png"
                  alt="IwHome Showroom"
                  className="h-16 w-auto mb-4"
                />
              </div>
              <p className="text-[#e9ecef]/70 text-sm leading-relaxed mb-6">
                Trasformiamo i tuoi spazi in realtà. Materiali di qualità, design su misura, 
                soluzioni pensate per durare nel tempo.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-[#f8f9fa]/5 flex items-center justify-center hover:bg-[#gunmetal] hover:scale-110 transition-all duration-300">
                  <Instagram size={18} className="text-[#e9ecef]/70 hover:text-[#f8f9fa]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-[#f8f9fa]/5 flex items-center justify-center hover:bg-[#gunmetal] hover:scale-110 transition-all duration-300">
                  <Facebook size={18} className="text-[#e9ecef]/70 hover:text-[#f8f9fa]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-[#f8f9fa]/5 flex items-center justify-center hover:bg-[#gunmetal] hover:scale-110 transition-all duration-300">
                  <Linkedin size={18} className="text-[#e9ecef]/70 hover:text-[#f8f9fa]" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#f8f9fa] mb-6">
                Navigazione
              </h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.page}>
                    <Link 
                      to={createPageUrl(item.page)}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#f8f9fa] mb-6">
                Legale
              </h4>
              <ul className="space-y-3">
                {legalPages.map((item) => (
                  <li key={item.page}>
                    <Link 
                      to={createPageUrl(item.page)}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#f8f9fa] mb-6">
                Contatti
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[#e9ecef]/60 text-sm">
                  <Phone size={16} className="text-[#f8f9fa]" />
                  <a href="tel:+393402921052" className="hover:text-[#f8f9fa] transition-colors">+39 340 292 1052</a>
                </li>
                <li className="flex items-center gap-3 text-[#e9ecef]/60 text-sm">
                  <Mail size={16} className="text-[#f8f9fa]" />
                  <a href="mailto:info@iwhome.it" className="hover:text-[#f8f9fa] transition-colors">info@iwhome.it</a>
                </li>
                <li className="flex items-start gap-3 text-[#e9ecef]/60 text-sm">
                  <MapPin size={16} className="mt-0.5" />
                  <span>Via Montefiorino 10/E<br />Reggio Emilia, Italia</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#f8f9fa]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#adb5bd] text-sm">
              © {new Date().getFullYear()} IwHome. Tutti i diritti riservati.
            </p>
            <p className="text-[#adb5bd] text-xs">
              Materiali. Design. Casa.
            </p>
          </div>
        </div>
      </footer>
    </div>
    );
    }