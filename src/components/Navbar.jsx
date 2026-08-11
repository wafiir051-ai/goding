import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import WhatsAppModal from './WhatsAppModal';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    if (id === 'clients') {
      const el = document.getElementById('clients');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = id;
    }
  };

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Layanan', href: '/#services' },
    { label: 'Harga', href: '/#pricing' },
    { label: 'Klien', action: () => scrollToSection('clients') },
    { label: 'Testimonial', href: '/testimonials' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <>
      <WhatsAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectNumber} message={pendingMessage} />
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl px-4">
        <motion.div 
          initial={{ y: -30, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ type: 'spring', stiffness: 120, damping: 15 }} 
          className="bg-black/90 backdrop-blur-xl rounded-3xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border border-white/20 shadow-2xl"
        >
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 md:w-9 md:h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg md:text-xl">G</span>
              </div>
            )}
            <span className="font-semibold text-lg md:text-xl lg:text-2xl tracking-tight text-white">goding</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              link.action ? (
                <button key={link.label} onClick={link.action} className="text-white/80 hover:text-cyan-400 transition-colors">{link.label}</button>
              ) : (
                <a key={link.label} href={link.href} className="text-white/80 hover:text-cyan-400 transition-colors">{link.label}</a>
              )
            ))}
          </div>

          {/* Desktop CTA */}
          <button 
            onClick={() => openModal('Halo, saya ingin konsultasi VIP dengan Goding.')} 
            className="hidden lg:block px-4 xl:px-6 py-2 xl:py-2.5 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-2xl text-xs xl:text-sm font-semibold text-white shadow-lg hover:scale-105 transition"
          >
            Konsultasi VIP
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </motion.div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navLinks.map((link) => (
                  link.action ? (
                    <button 
                      key={link.label} 
                      onClick={link.action}
                      className="block w-full text-left px-4 py-3 text-white/80 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a 
                      key={link.label} 
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 text-white/80 hover:text-cyan-400 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium"
                    >
                      {link.label}
                    </a>
                  )
                ))}
                <div className="pt-2 border-t border-white/10 mt-2">
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); openModal('Halo, saya ingin konsultasi VIP dengan Goding.'); }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-xl text-sm font-semibold text-white"
                  >
                    Konsultasi VIP
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
