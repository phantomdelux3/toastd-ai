import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Toastd — AI Shopping Assistant",
  description: "Tell us what you're looking for and we'll find the perfect product.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${instrumentSerif.variable}`}>
      <body className="bg-darkbg text-white antialiased font-sans relative overflow-x-hidden">
        {/* Ambient gradient orbs — fixed so they persist across routes */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-rose-500/20 blur-[120px]" />
          <div className="absolute top-1/3 -right-40 size-[560px] rounded-full bg-fuchsia-500/15 blur-[140px]" />
          <div className="absolute bottom-[-200px] left-1/3 size-[600px] rounded-full bg-orange-400/10 blur-[140px]" />
          {/* Subtle grain */}
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>
        {children}
      </body>
    </html>
  );
}
