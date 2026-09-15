import { supabase } from './supabase';

const LYNK_BASE_URL = 'https://lynk.id/officialgoding';

const generateOrderRef = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6);
  return `GDN-${timestamp}-${random}`;
};

export async function createOrderAndGetPaymentUrl(plan, customer = {}) {
  const orderRef = generateOrderRef();

  const { error } = await supabase.from('payment_orders').insert({
    order_ref: orderRef,
    plan_id: plan.id,
    plan_name: plan.name,
    amount: plan.price,
    customer_name: customer.name || null,
    customer_email: customer.email || null,
    customer_phone: customer.phone || null,
    status: 'pending',
  });

  if (error) {
    console.error('Gagal membuat order:', error);
    throw new Error('Gagal membuat pesanan, coba lagi.');
  }

  const paymentUrl = `${LYNK_BASE_URL}?ref=${orderRef}`;

  return { orderRef, paymentUrl };
}

export async function getOrderStatus(orderRef) {
  const { data, error } = await supabase
    .from('payment_orders')
    .select('order_ref, plan_name, amount, status, created_at, paid_at')
    .eq('order_ref', orderRef)
    .maybeSingle();

  if (error) {
    console.error('Gagal ambil status order:', error);
    return null;
  }
  return data;
}
