/** Client-safe formatting helpers (no Node built-ins). */

export function formatGhs(amount: number): string {
  return `GH₵ ${amount.toFixed(2).replace(/\.00$/, "")}`;
}
