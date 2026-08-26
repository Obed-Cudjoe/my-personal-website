// Shared domain types for the digital marketplace.

export type ProductType = "prompt" | "ebook" | "bundle";
export type Category =
  | "freelance"
  | "marketing"
  | "smb"
  | "creators"
  | "dev";

export type FileFormat = "pdf" | "docx" | "epub" | "zip";

export interface Product {
  id: string; // slug, e.g. pkg-fre-01
  sku: string;
  title: string;
  description: string;
  productType: ProductType;
  category: Category;
  priceGhs: number;
  // prompt
  promptCount?: number;
  // ebook
  pageCount?: number;
  author?: string;
  coverPath?: string; // storage path
  samplePath?: string; // storage path (free chapter / sample prompts)
  toc?: { title: string; pages: number }[];
  // bundle
  items?: { productId: string; position: number }[];
  formats: FileFormat[];
  filePaths: Record<string, string>; // format -> storage path
  active: boolean;
  createdAt: string;
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  format: FileFormat;
  qty: number;
}

export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  productId: string;
  title: string;
  productType: ProductType;
  format: FileFormat;
  priceGhs: number;
}

export interface Order {
  id: string; // CDS-XXXX
  userId: string | null;
  email: string;
  phone: string;
  status: OrderStatus;
  items: OrderItem[];
  totalGhs: number;
  paymentMethod: "mtn_momo" | "telecel_cash";
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: "demo" | "paystack" | "flutterwave";
  channel: "mtn_momo" | "telecel_cash";
  reference: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amountGhs: number;
  createdAt: string;
}

export interface DownloadRow {
  id: string;
  orderId: string;
  productId: string;
  format: FileFormat;
  count: number;
  lastDownloadedAt: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  phone: string;
  source: string;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  freelance: "Freelancers & Solopreneurs",
  marketing: "Marketers & Copywriters",
  smb: "Small Business Owners",
  creators: "Content Creators",
  dev: "Developers & Data Analysts",
};

export const PAYMENT_METHODS = [
  { id: "mtn_momo" as const, label: "MTN Mobile Money", hint: "024 / 054 / 055 / 059" },
  { id: "telecel_cash" as const, label: "Telecel Cash", hint: "020 / 026 / 027 / 050" },
];

export const TYPE_LABELS: Record<ProductType, string> = {
  prompt: "Prompt Pack",
  ebook: "Ebook",
  bundle: "Bundle",
};
