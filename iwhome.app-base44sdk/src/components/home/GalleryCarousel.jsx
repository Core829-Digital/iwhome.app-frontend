import React from 'react';
import { motion } from 'framer-motion';

const images = [
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/65d445a5d_gallery-1.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/ca1a4b708_gallery-4.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8fd84c0f9_gallery-5.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d452179f1_gallery-6.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/a50050fa3_gallery-7.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/7db741baa_gallery-8.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/ca17baedd_gallery-9.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/8066fc0e3_gallery-10.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/508e1e578_gallery-11.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/a3525bd44_gallery-12.jpg',
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/d71c5f8f3_minimalistic-25-g.jpg',
];

// Triplicate so the seamless loop never shows a gap at any screen size
const STRIP = [...images, ...images, ...images];

// Each card is 320px wide + 16px gap = 336px per card.
// 11 images × 336px = 3696px per loop. We animate by -3696px.
const CARD_W = 320;
const GAP = 16;
const LOOP_PX = images.length * (CARD_W + GAP);

export default function GalleryCarousel() {
  return (
    <section className="relative py-20 lg:py-32 bg-gradient-to-b from-[#343a40] via-[#495057] to-[#6c757d] overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.25, 0.12] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white rounded-full blur-[120px] pointer-events-none"
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #f8f9fa 1px, transparent 1px)', backgroundSize: '50px 50px' }}
      />

      {/* Section header */}
      <div className="relative max-w-7xl mx-auto px-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-[#f8f9fa] text-sm tracking-widest uppercase">Showroom</span>
          <h2 className="text-4xl lg:text-5xl font-light text-[#f8f9fa] mt-4">
            Il nostro{' '}
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef]">
              showroom
            </span>
          </h2>
        </motion.div>
      </div>

      {/* Infinite scroll strip — full width, clipped, with edge fade mask */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          // CSS mask: transparent at edges → solid in center → transparent at edges
          // This creates a smooth fade-out as photos approach the boundaries
          maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        }}
      >
        <div className="flex" style={{ gap: GAP }}>
          {/* Two identical strips for seamless loop */}
          {[0, 1].map(stripIdx => (
            <motion.div
              key={stripIdx}
              className="flex flex-shrink-0"
              style={{ gap: GAP }}
              animate={{ x: [0, -LOOP_PX] }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: 'linear',
                repeatType: 'loop',
              }}
            >
              {STRIP.map((src, i) => (
                <div
                  key={`${stripIdx}-${i}`}
                  className="flex-shrink-0 rounded-2xl overflow-hidden shadow-xl"
                  style={{ width: CARD_W, height: 220 }}
                >
                  <img
                    src={src}
                    alt={`IwHome showroom ${(i % images.length) + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
