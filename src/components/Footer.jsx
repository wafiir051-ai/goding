import { useState, useEffect } from 'react';
import { Mail, AtSign } from 'lucide-react';
import { motion } from 'framer-motion';
import RevealOnScroll from './RevealOnScroll';
import MarqueeText from './MarqueeText';
import WhatsAppModal from './WhatsAppModal';
import VisitorStats from './VisitorStats';
import { supabase } from '../lib/supabase';

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'logo_url').single().then(({ data }) => {
      if (data?.value) setLogoUrl(data.value);
    }).catch(() => {});
  }, []);

  const openModal = (msg) => { setPendingMessage(msg); setIsModalOpen(true); };
  const handleSelectNumber = (phoneNumber, message) => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setIsModalOpen(false);
  };

  return (
    <footer className="bg-black text-white pt-12 md:pt-20 pb-16 md:pb-24 relative z-10 px-4 sm:px-6">
      <WhatsAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectNumber} message={pendingMessage} />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <RevealOnScroll componentName="footer">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 md:gap-3 justify-center md:justify-start">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-700 to-cyan-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl md:text-2xl">G</span>
                  </div>
                )}
                <span className="text-2xl md:text-3xl font-bold">goding</span>
              </div>
              <p className="mt-3 md:mt-4 text-zinc-400 text-base md:text-lg max-w-md mx-auto md:mx-0">
                Menciptakan pengalaman digital premium yang membantu bisnis Anda tumbuh.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll componentName="footer">
            <div className="text-center md:text-right">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold">Siap membuat website luar biasa?</h3>
              <button
                onClick={() => openModal('Halo, saya tertarik untuk konsultasi dengan Goding.')}
                className="mt-4 md:mt-6 px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-blue-700 to-cyan-500 rounded-xl text-base md:text-lg font-semibold hover:scale-105 transition-all duration-300"
              >
                Hubungi Kami
              </button>
            </div>
          </RevealOnScroll>
        </div>

        <div className="mt-10 md:mt-20 mb-6 md:mb-10 py-4 md:py-6 border-t-2 border-b-2 border-white/20">
          <MarqueeText />
        </div>
        <VisitorStats />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center text-xs md:text-sm text-zinc-500 mt-8 pt-6 md:pt-8 border-t border-white/10 relative z-10"
        >
          © 2026 Goding Grup. Semua hak dilindungi.
        </motion.div>

        <RevealOnScroll componentName="footer" once={false}>
          <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm md:text-base text-zinc-300">
            <a href="mailto:ayocoding@godingofficial.com" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </span>
              ayocoding@godingofficial.com
            </a>
            <a href="https://instagram.com/goding.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <AtSign className="w-4 h-4" />
              </span>
              @goding.id
            </a>
            <a href="https://tiktok.com/@goding.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
              <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <AtSign className="w-4 h-4" />
              </span>
              @goding.id
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </footer>
  );
}
