import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Cache di level module: sekali sebuah componentName di-fetch, hasilnya
// disimpan di sini dan dipakai ulang oleh semua instance RevealOnScroll
// lain dengan componentName yang sama. Ini mencegah puluhan fetch
// bersamaan ke Supabase untuk row yang identik, yang sebelumnya bisa
// menyebabkan salah satu elemen "nyangkut" di state tersembunyi.
const settingsCache = new Map();
const pendingFetches = new Map();

async function getAnimationSettings(componentName) {
  if (settingsCache.has(componentName)) {
    return settingsCache.get(componentName);
  }
  if (pendingFetches.has(componentName)) {
    return pendingFetches.get(componentName);
  }
  const fetchPromise = supabase
    .from('animation_settings')
    .select('animation_type, speed, delay, intensity, direction')
    .eq('component', componentName)
    .maybeSingle()
    .then(({ data }) => {
      settingsCache.set(componentName, data);
      pendingFetches.delete(componentName);
      return data;
    });
  pendingFetches.set(componentName, fetchPromise);
  return fetchPromise;
}

export default function RevealOnScroll({ children, componentName, once = false, className = '', customDelay = null }) {
  const [settings, setSettings] = useState(() => settingsCache.get(componentName) ?? null);
  const [ref, inView] = useInView({ triggerOnce: once, threshold: 0, rootMargin: '0px' });

  useEffect(() => {
    let cancelled = false;
    getAnimationSettings(componentName).then((data) => {
      if (!cancelled && data) setSettings(data);
    });
    return () => { cancelled = true; };
  }, [componentName]);

  if (!settings) return <div className={className}>{children}</div>;

  const delay = customDelay !== null ? customDelay : settings.delay;
  const variants = {
    hidden: { opacity: 0, filter: 'blur(4px)' },
    visible: { opacity: 1, filter: 'blur(0px)', transition: { delay, duration: settings.speed, ease: 'easeOut' } }
  };
  if (settings.direction === 'up') variants.hidden.y = 60 * settings.intensity;
  if (settings.direction === 'down') variants.hidden.y = -60 * settings.intensity;
  if (settings.direction === 'left') variants.hidden.x = 60 * settings.intensity;
  if (settings.direction === 'right') variants.hidden.x = -60 * settings.intensity;
  if (settings.animation_type === 'scale') variants.hidden.scale = 0.7;
  if (settings.animation_type === 'rotate') variants.hidden.rotate = -10;

  return <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={variants} className={className}>{children}</motion.div>;
}
