import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createOrderAndGetPaymentUrl } from '../lib/orders';
import RevealOnScroll from './RevealOnScroll';
import WhatsAppModal from './WhatsAppModal';

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

function CheckoutChoiceModal({ isOpen, onClose, plan, onChooseWhatsApp, onChoosePay, isCreatingOrder }) {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white text-lg font-bold mb-1">Lanjutkan Paket {plan.name}</h3>
        <p className="text-zinc-400 text-sm mb-5">
          Total: <span className="text-cyan-400 font-semibold">Rp{formatPrice(plan.price)}</span>
        </p>

        <div className="space-y-3">
          <button
            onClick={onChoosePay}
            disabled={isCreatingOrder}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:shadow-cyan-500/30 hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isCreatingOrder ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
          <button
            onClick={onChooseWhatsApp}
            disabled={isCreatingOrder}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-zinc-800 text-white hover:bg-zinc-700 transition-all disabled:opacity-50"
          >
            Tanya Dulu via WhatsApp
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [threeDSettings, setThreeDSettings] = useState({ enabled: true, intensity: 0.6, scale: 1.03 });

  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

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

  const openChoice = (plan) => {
    setOrderError('');
    setSelectedPlan(plan);
    setIsChoiceOpen(true);
  };

  const handleChooseWhatsApp = () => {
    setIsChoiceOpen(false);
    openModal(`Saya tertarik dengan paket ${selectedPlan.name} - Rp ${formatPrice(selectedPlan.price)}`);
  };

  const handleChoosePay = async () => {
    if (!selectedPlan) return;
    setIsCreatingOrder(true);
    setOrderError('');
    try {
      const { paymentUrl } = await createOrderAndGetPaymentUrl(selectedPlan);
      window.open(paymentUrl, '_blank');
      setIsChoiceOpen(false);
    } catch (err) {
      setOrderError(err.message || 'Gagal membuat pesanan, coba lagi.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <section id="pricing" style={{position:"relative", overflow:"hidden"}} className="pt-24 pb-16 md:pt-28 md:pb-24 bg-[#0a0a0a] px-4 sm:px-6">
      <WhatsAppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleSelectNumber} message={pendingMessage} />
      <CheckoutChoiceModal
        isOpen={isChoiceOpen}
        onClose={() => setIsChoiceOpen(false)}
        plan={selectedPlan}
        onChooseWhatsApp={handleChooseWhatsApp}
        onChoosePay={handleChoosePay}
        isCreatingOrder={isCreatingOrder}
      />
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center font-bold text-white mb-10 md:mb-16 pt-2">
          Paket Harga
        </h2>
        {orderError && (
          <p className="text-center text-red-400 text-sm mb-4">{orderError}</p>
        )}
        <div className="flex gap-4 overflow-x-auto pb-6 mt-8 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => {
            const hoverEffect = threeDSettings.enabled ? {
              rotateX: threeDSettings.intensity * 6,
              rotateY: threeDSettings.intensity * 8,
              scale: threeDSettings.scale,
              transition: { type: 'spring', stiffness: 300, damping: 20 }
            } : { scale: threeDSettings.scale };

            return (
              <div key={plan.id} className="min-w-[85vw] sm:min-w-0 snap-center flex-shrink-0 sm:flex-shrink">
                <motion.div
                  initial={{ rotateX: 0, rotateY: 0, scale: 1 }}
                  whileHover={hoverEffect}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative bg-zinc-900/90 p-5 rounded-2xl border border-white/10 hover:border-cyan-400 transition-colors flex flex-col shadow-lg backdrop-blur-sm w-full mt-4"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap shadow-lg">
                        ⭐ Populer
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg md:text-xl text-cyan-400 font-bold mt-1">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-white font-bold" style={{fontSize: "clamp(0.85rem, 2.5vw, 1.6rem)", wordBreak: "break-all", lineHeight: "1.1", display: "block"}}>
                      Rp{formatPrice(plan.price)}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">/{plan.period}</p>
                  </div>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{plan.description}</p>
                  <div className="mt-3 flex-1">
                    <p className="text-cyan-400 text-xs uppercase tracking-wider mb-2 font-semibold">Fitur Utama</p>
                    <ul className="space-y-1">
                      {plan.features?.map((feature, i) => (
                        <li key={i} className="text-zinc-300 text-[11px] flex items-start gap-1.5 leading-tight">
                          <span className="text-cyan-400 shrink-0 mt-0.5">✓</span>
                          <span className="break-words leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <TechCarousel techs={plan.tech_stack} />
                  <button
                    onClick={() => openChoice(plan)}
                    className={`mt-5 w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:shadow-cyan-500/30 hover:shadow-lg'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg'
                    }`}
                  >
                    Pilih Paket
                  </button>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
