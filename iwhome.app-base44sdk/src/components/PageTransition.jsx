import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    setIsTransitioning(true);
    setShowContent(false);
    const contentTimer = setTimeout(() => setShowContent(true), 400);
    const transitionTimer = setTimeout(() => setIsTransitioning(false), 800);
    return () => {
      clearTimeout(contentTimer);
      clearTimeout(transitionTimer);
    };
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key="page-transition"
            initial={{ x: '0%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[9999] pointer-events-none"
          >
            {/* Gradient Mask Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#212529] via-[#343a40] to-[#495057]" />
            
            {/* Animated Overlay Pattern */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />

            {/* Glowing Orbs */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#f8f9fa]/20 to-[#e9ecef]/10 rounded-full blur-3xl"
            />

            {/* Center Logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.img
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.5 }}
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/95bae648d_logo.png"
                alt="IwHome"
                className="h-20 w-auto drop-shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ opacity: showContent ? 1 : 0, transition: 'opacity 0.3s' }}>
        {children}
      </div>
    </>
  );
}