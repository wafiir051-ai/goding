import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Loader2 } from 'lucide-react';
import { createOrderAndGetPaymentUrl } from '../lib/orders';

const formatPrice = (price) => new Intl.NumberFormat('id-ID').format(price);

export default function CheckoutModal({ isOpen, onClose, plan }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !plan) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone) {
      setError('Nama dan nomor WhatsApp wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const { paymentUrl } = await createOrderAndGetPaymentUrl(plan, form);
      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan, coba lagi.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-zinc-900 rounded-2xl w-full max-w-sm md:max-w-md overflow-hidden shadow-2xl border border-white/20 mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-white/10">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
              Checkout
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 md:p-5">
            <div className="bg-zinc-800 rounded-xl p-3 mb-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold text-sm">{plan.name}</p>
                <p className="text-zinc-400 text-xs">/{plan.period}</p>
              </div>
              <p className="text-cyan-400 font-bold">Rp{formatPrice(plan.price)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nama Lengkap</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Nama kamu"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nomor WhatsApp</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="0812xxxxxxxx"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Email (opsional)</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  placeholder="email@kamu.com"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:shadow-cyan-500/30 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Memproses...' : 'Lanjut ke Pembayaran'}
              </button>
            </form>
          </div>

          <div className="p-3 md:p-4 text-center text-xs text-gray-500 border-t border-white/10">
            Kamu akan diarahkan ke halaman pembayaran Lynk.id
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
