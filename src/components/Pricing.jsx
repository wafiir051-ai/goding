import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import RevealOnScroll from './RevealOnScroll';
import WhatsAppModal from './WhatsAppModal';
import CheckoutModal from './CheckoutModal';

const formatPrice = (price) => new Intl.NumberFormat('id-ID').format(price);

function TechCarousel({ techs }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  if (!techs || techs.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-white/10">
      <p className="text-cyan-400 text-xs uppercase tracking-wider mb-2 font-semibold">Teknologi</p>
      <div className="relative">
        {canPrev && (
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-zinc-900 to-transparent z-10 pointer-events-none rounded-l" />
        )}
        {canNext && (
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-zinc-900 to-transparent z-10 pointer-events-none rounded-r" />
        )}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-1.5">
            {techs.map((tech, i) => (
              <span
                key={i}
                className="flex-shrink-0 bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1 rounded-full border border-white/5 whitespace-nowrap"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
        {techs.length > 3 && (
          <div className="flex gap-1 mt-2 justify-end">
            <button
              onClick={() => emblaApi && emblaApi.scrollPrev()}
              disabled={!canPrev}
              className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-3 h-3 text-white" />
            </button>
            <button
              onClick={() => emblaApi && emblaApi.scrollNext()}
              disabled={!canNext}
              className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [threeDSettings, setThreeDSettings] = useState({ enabled: true, intensity: 0.6, scale: 1.03 });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    supabase.from('pricing_plans').select('*').order('price').then(({ data }) => setPlans(data || []));
    supabase
      .from('animation_settings')
      .select('three_d_enabled, three_d_intensity, three_d_scale')
      .eq('component', 'pricing')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setThreeDSettings({
          enabled: data.three_d_enabled ?? true,
          intensity: data.three_d_intensity ?? 0.6,
          scale: data.three_d_scale ?? 1.03,
        });
      });
  }, []);

  const openModal = (msg) => { setPendingMessage(msg); setIsModalOpen(true); };
  const handleSelectNumber = (phoneNumber, message) => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setIsModalOpen(false);
  };

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 4);
    setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timeoutId = setTimeout(updateScrollButtons, 100);
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      clearTimeout(timeoutId);
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [plans, updateScrollButtons]);

  const scrollByCard = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector(':scope > div');
    const cardWidth = card ? card.offsetWidth : 300;
    el.scrollBy({ left: direction * (cardWidth + 24), behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="relative z-10 pt-8 md:pt-10 pb-16 md:pb-20 bg-[#0a0a0a] px-4 sm:px-6">
      <WhatsAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectNumber} message={pendingMessage} />
      <CheckoutModal isOpen={Boolean(checkoutPlan)} onClose={() => setCheckoutPlan(null)} plan={checkoutPlan} />
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll componentName="pricing">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-center font-bold text-white mb-4">
            Paket Harga
          </h2>
        </RevealOnScroll>

        <div className="relative">
          {canScrollPrev && (
            <button
              onClick={() => scrollByCard(-1)}
              aria-label="Sebelumnya"
              className="hidden sm:flex absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border border-white/10 hover:bg-cyan-500 hover:border-cyan-400 transition shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={() => scrollByCard(1)}
              aria-label="Berikutnya"
              className="hidden sm:flex absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border border-white/10 hover:bg-cyan-500 hover:border-cyan-400 transition shadow-lg"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          <div ref={scrollRef} className="flex items-start overflow-x-auto gap-6 px-1 pt-5 pb-6 snap-x snap-mandatory scrollbar-thin scroll-smooth">
            {plans.map((plan, idx) => {
              const hoverEffect = {
                scale: threeDSettings.enabled ? threeDSettings.scale : 1,
                transition: { type: 'spring', stiffness: 300, damping: 20 }
              };

              return (
                <RevealOnScroll key={plan.id} componentName="pricing" customDelay={idx * 0.1} className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start">
                  <motion.div
                    initial={{ scale: 1 }}
                    whileHover={hoverEffect}
                    className="relative bg-zinc-900/90 p-4 md:p-5 rounded-2xl border border-white/10 hover:border-cyan-400 transition-colors max-h-[560px] flex flex-col shadow-lg backdrop-blur-sm"
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap shadow-lg">
                          ⭐ Populer
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg md:text-xl text-cyan-400 font-bold mt-1">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl text-white font-bold whitespace-nowrap">
                        Rp{formatPrice(plan.price)}
                      </span>
                      <p className="text-xs text-zinc-400 mt-1">/{plan.period}</p>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{plan.description}</p>
                    <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">
                      <p className="text-cyan-400 text-xs uppercase tracking-wider mb-2 font-semibold">Fitur Utama</p>
                      <ul className="space-y-1">
                        {plan.features?.map((feature, i) => (
                          <li key={i} className="text-zinc-300 text-xs flex items-start gap-2">
                            <span className="text-cyan-400 shrink-0 mt-0.5">✓</span>
                            <span className="break-words leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <TechCarousel techs={plan.tech_stack} />
                    <div className="mt-auto pt-3 flex flex-col gap-1.5">
                      <button
                        onClick={() => setCheckoutPlan(plan)}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                          plan.popular
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:shadow-cyan-500/30 hover:shadow-lg'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg'
                        }`}
                      >
                        Beli Sekarang
                      </button>
                      <button
                        onClick={() => openModal(`Saya tertarik dengan paket ${plan.name} - Rp ${formatPrice(plan.price)}`)}
                        className="w-full py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                      >
                        Tanya dulu via WhatsApp
                      </button>
                    </div>
                  </motion.div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
