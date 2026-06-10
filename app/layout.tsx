import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { NavProgressProvider } from "@/components/NavProgress";

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
        {/* Ambient lighting + grid — fixed so they persist across routes */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          {/* Barely-visible modern grey grid */}
          <div className="absolute inset-0 bg-grid" />

          {/* Side lights — layered glows that wash in from the edges */}
          <div className="absolute -top-48 -left-40 size-[560px] rounded-full bg-rose-500/25 blur-[130px]" />
          <div className="absolute -top-24 left-1/4 size-[420px] rounded-full bg-fuchsia-500/12 blur-[150px]" />
          <div className="absolute top-1/4 -right-48 size-[600px] rounded-full bg-fuchsia-500/18 blur-[150px]" />
          <div className="absolute top-1/2 -left-56 size-[480px] rounded-full bg-orange-400/12 blur-[160px]" />
          <div className="absolute bottom-[-220px] left-1/3 size-[640px] rounded-full bg-orange-400/12 blur-[150px]" />
          {/* Thin accent beams hugging the left & right edges */}
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-rose-400/25 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-fuchsia-400/20 to-transparent" />

          {/* Top vignette so the lights bloom from above */}
          <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-white/[0.025] to-transparent" />

          {/* Subtle grain */}
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>
        <NavProgressProvider>{children}</NavProgressProvider>
      </body>
    </html>
  );
}
