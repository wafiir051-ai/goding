import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMTP_HOST = Deno.env.get("SMTP_HOST")!;
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME")!;
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD")!;
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USERNAME;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function formatRupiah(amount: number) {
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

function buildEmailHtml(order: any, stage: "1h" | "6h") {
  const heading =
    stage === "1h"
      ? "Jangan lupa selesaikan pembayaran kamu"
      : "Pesanan kamu akan segera kedaluwarsa";
  const subtext =
    stage === "1h"
      ? "Kami lihat pesanan kamu masih menunggu pembayaran."
      : "Waktu pembayaran tersisa kurang dari 6 jam. Segera selesaikan agar pesanan tidak hangus.";

  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
    <h2 style="color: #0ea5e9;">${heading}</h2>
    <p>Halo ${order.customer_name ?? "Kak"},</p>
    <p>${subtext}</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 8px 0; color: #666;">No. Order</td><td style="padding: 8px 0; text-align: right;">${order.order_ref}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Paket</td><td style="padding: 8px 0; text-align: right;">${order.plan_name}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatRupiah(order.amount)}</td></tr>
    </table>
    <p>Silakan selesaikan pembayaran sebelum pesanan kedaluwarsa.</p>
    <p style="margin-top: 32px; color: #888; font-size: 12px;">Email ini dikirim otomatis oleh sistem Goding Official.</p>
  </div>`;
}

async function sendReminderEmail(order: any, stage: "1h" | "6h") {
  if (!order.customer_email) return false;

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USERNAME, password: SMTP_PASSWORD },
    },
  });

  try {
    await client.send({
      from: SMTP_FROM,
      to: order.customer_email,
      subject:
        stage === "1h"
          ? `Reminder Pembayaran - ${order.order_ref}`
          : `Segera Bayar - Pesanan Akan Expired - ${order.order_ref}`,
      html: buildEmailHtml(order, stage),
    });
    return true;
  } catch (err) {
    console.error(`Gagal kirim email ke ${order.customer_email}:`, err);
    return false;
  } finally {
    await client.close();
  }
}

Deno.serve(async (_req) => {
  const now = new Date();
  const results = { reminder_1h: 0, reminder_6h: 0, expired: 0, errors: [] as string[] };

  const { data: expiredOrders, error: expiredErr } = await supabase
    .from("payment_orders")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expired_at", now.toISOString())
    .select("id");

  if (expiredErr) results.errors.push("expired-update: " + expiredErr.message);
  results.expired = expiredOrders?.length ?? 0;

  const { data: pendingOrders, error: pendingErr } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("status", "pending")
    .gt("expired_at", now.toISOString());

  if (pendingErr) results.errors.push("fetch-pending: " + pendingErr.message);

  for (const order of pendingOrders ?? []) {
    const createdAt = new Date(order.created_at);
    const expiredAt = new Date(order.expired_at);
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / 3_600_000;
    const hoursUntilExpiry = (expiredAt.getTime() - now.getTime()) / 3_600_000;

    if (!order.reminder_1h_sent_at && hoursSinceCreated >= 1) {
      const ok = await sendReminderEmail(order, "1h");
      if (ok) {
        await supabase
          .from("payment_orders")
          .update({ reminder_1h_sent_at: now.toISOString() })
          .eq("id", order.id);
        results.reminder_1h++;
      }
    }

    if (!order.reminder_6h_sent_at && hoursUntilExpiry <= 6) {
      const ok = await sendReminderEmail(order, "6h");
      if (ok) {
        await supabase
          .from("payment_orders")
          .update({ reminder_6h_sent_at: now.toISOString() })
          .eq("id", order.id);
        results.reminder_6h++;
      }
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
