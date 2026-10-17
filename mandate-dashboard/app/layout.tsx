import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mandate | Proof before payment",
  description: "A BSC testnet dashboard for verifiable agent-executed trade mandates.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
