import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Cudjoe Digital Studio — AI Prompt Packs & Practical Ebooks",
    template: "%s · Cudjoe Digital Studio",
  },
  description:
    "Buy AI prompt packs, practical ebooks and bundles for freelancers, marketers, small businesses, creators and developers. Instant delivery in PDF, Word and EPUB. Pay with MTN Mobile Money or Telecel Cash.",
  keywords: [
    "AI prompt packs", "ChatGPT prompts", "practical ebooks", "mobile money",
    "MTN MoMo", "Telecel Cash", "Ghana digital products", "freelance prompts",
  ],
  openGraph: {
    type: "website",
    siteName: "Cudjoe Digital Studio",
    title: "Cudjoe Digital Studio — AI Prompt Packs & Practical Ebooks",
    description:
      "Prompt packs, ebooks and bundles for African professionals. Pay with MoMo or Telecel Cash. Instant download.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f1b33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 pb-24 pt-6 md:pb-10">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
