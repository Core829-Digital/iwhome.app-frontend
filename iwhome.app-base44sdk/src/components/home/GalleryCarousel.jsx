import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/65d445a5d_gallery-1.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/ca1a4b708_gallery-4.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/336469847_gallery-51.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8fd84c0f9_gallery-5.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d452179f1_gallery-6.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/a50050fa3_gallery-7.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/7db741baa_gallery-8.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/ca17baedd_gallery-9.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8066fc0e3_gallery-10.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/508e1e578_gallery-11.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/a3525bd44_gallery-12.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/0283f61ec_img1-g.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/5cd783b75_img2-g.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/78adbbf3a_img3-g.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d71c5f8f3_minimalistic-25-g.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/5f3b218e0_minimalistic-26-g.jpg',
];

export default function GalleryCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => {
    setDirection(1);
    setCurrent((current + 1) % images.length);
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((current - 1 + images.length) % images.length);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
    }),
  };

  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-[#343a40] via-[#495057] to-[#6c757d] overflow-hidden">
      {/* Animated White Light Glow */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white rounded-full blur-[100px]"
      />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, #f8f9fa 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Showroom</span>
          <h2 className="text-4xl lg:text-5xl font-light text-[#f8f9fa] mt-4">
            Il nostro <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">showroom</span>
          </h2>
        </motion.div>

        {/* Carousel - macOS Light Mode Style Window */}
        <div className="relative max-w-5xl mx-auto">
          {/* macOS Window Frame */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] shadow-2xl border border-[#d1d1d6] overflow-hidden">
            {/* macOS Title Bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#f5f5f7] border-b border-[#d1d1d6]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors cursor-pointer" />
              </div>
              <div className="flex-1 text-center text-xs text-[#86868b] font-medium">
                Showroom IwHome
              </div>
            </div>

            {/* Image Container with Gradient Blur Edges */}
            <div className="relative h-[400px] lg:h-[500px] bg-[#ffffff]">
              {/* Gradient Blur Edges */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#ffffff] to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#ffffff] to-transparent" />
                <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-[#ffffff] to-transparent backdrop-blur-sm" />
                <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-[#ffffff] to-transparent backdrop-blur-sm" />
              </div>

              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={current}
                  src={images[current]}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.4 },
                    scale: { duration: 0.4 },
                  }}
                  className="absolute inset-0 w-full h-full object-contain p-8 rounded-2xl"
                />
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="absolute inset-0 flex items-center justify-between px-6 z-20">
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={prev}
                  className="w-10 h-10 rounded-full bg-[#000000]/5 backdrop-blur-xl flex items-center justify-center text-[#000000]/70 border border-[#000000]/10 hover:border-[#000000]/30 transition-all"
                >
                  <ChevronLeft size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={next}
                  className="w-10 h-10 rounded-full bg-[#000000]/5 backdrop-blur-xl flex items-center justify-center text-[#000000]/70 border border-[#000000]/10 hover:border-[#000000]/30 transition-all"
                >
                  <ChevronRight size={18} />
                </motion.button>
              </div>
            </div>

            {/* Dots - Outside Image Area */}
            <div className="flex justify-center gap-2 py-4 bg-[#f5f5f7] border-t border-[#d1d1d6]">
              {images.map((_, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={`rounded-full transition-all duration-500 ${
                    i === current
                      ? 'w-8 h-2 bg-[#000000]'
                      : 'w-2 h-2 bg-[#000000]/30 hover:bg-[#000000]/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}