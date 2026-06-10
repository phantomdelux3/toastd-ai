import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="bg-darkbg text-white antialiased">{children}</body>
    </html>
  );
}
