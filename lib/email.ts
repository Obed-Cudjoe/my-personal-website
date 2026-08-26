import { catalog } from "./catalog";
import { orders } from "./store";
import { formatGhs } from "./util";
import type { Order } from "./types";

/**
 * Transactional email via Resend when RESEND_API_KEY is set.
 * In demo mode (no key) the email body is logged to the console —
 * the confirmation page always shows the download links regardless.
 */

export async function sendOrderEmail(order: Order): Promise<void> {
  const links = order.items
    .map((item) => {
      const product = catalog.find(item.productId);
      if (!product) return "";
      const rel = product.filePaths[item.format] ?? Object.values(product.filePaths)[0];
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const token = createDemoToken(order.id, product.id, item.format);
      return `• ${product.title} (${item.format.toUpperCase()}): ${base}/api/downloads/${token}`;
    })
    .filter(Boolean)
    .join("\n");

  const subject = `Your downloads are ready — Order ${order.id}`;
  const text = `Hi ${order.email.split("@")[0]},

Thank you for your purchase from Cudjoe Digital Studio.

Order: ${order.id}
Amount: ${formatGhs(order.totalGhs)}
Payment: ${order.paymentMethod === "mtn_momo" ? "MTN Mobile Money" : "Telecel Cash"}

YOUR DOWNLOADS (links expire after 48 hours — re-download anytime from your account):
${links}

Need help? Reply to this email or message us on WhatsApp.

— Cudjoe Digital Studio`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:demo] To: ${order.email} | Subject: ${subject}\n${text}`);
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? "Cudjoe Digital Studio <onboarding@resend.dev>",
        to: [order.email],
        subject,
        text,
      }),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[email:error]", err);
  }
}

/** Local import-safe token (avoids a circular import with delivery.ts). */
function createDemoToken(orderId: string, productId: string, format: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createDownloadToken } = require("./delivery") as typeof import("./delivery");
  return createDownloadToken(orderId, productId, format as import("./types").FileFormat);
}
