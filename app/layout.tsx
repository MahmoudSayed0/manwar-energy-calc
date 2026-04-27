import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const latin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-latin",
});

const arabic = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "Manwar — منور",
  description: "Egyptian battery & inverter sizing calculator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  return (
    <html className={`${arabic.variable} ${latin.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster richColors />
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
