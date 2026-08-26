import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { orders } from "@/lib/store";

export async function GET() {
  try {
    await requireAdmin();
    const all = orders.list();
    const paid = all.filter((o) => o.status === "paid");
    const revenue = paid.reduce((s, o) => s + o.totalGhs, 0);
    const byType: Record<string, number> = { prompt: 0, ebook: 0, bundle: 0 };
    for (const o of paid) {
      for (const it of o.items) {
        byType[it.productType] = (byType[it.productType] ?? 0) + it.priceGhs;
      }
    }
    const byCategory: Record<string, number> = {};
    for (const o of paid) {
      for (const it of o.items) {
        byCategory[it.productId] = (byCategory[it.productId] ?? 0) + it.priceGhs;
      }
    }
    return NextResponse.json({
      revenue,
      orderCount: all.length,
      paidCount: paid.length,
      byType,
      byProduct: byCategory,
      statuses: {
        pending: all.filter((o) => o.status === "pending").length,
        paid: paid.length,
        failed: all.filter((o) => o.status === "failed").length,
        refunded: all.filter((o) => o.status === "refunded").length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
}
