import type { Metadata } from "next";
import { Inter, Sora, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IdenVault",
  description: "Digital Academic Identity Wallet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sora.variable} ${geistMono.variable} font-sans antialiased bg-[#F8F8F8] text-slate-900 selection:bg-teal-500/30`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
