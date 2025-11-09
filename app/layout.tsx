import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SuiWalletProvider } from "@/lib/sui/SuiWalletProvider";
import { GlobalErrorHandler } from "@/components/providers/GlobalErrorHandler";
import { WalletFilterScript } from "@/components/providers/WalletFilterScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Synthetic Souls - AI Digital Twins",
  description: "Create, train, and interact with your AI digital twin on Sui Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletFilterScript />
        <GlobalErrorHandler />
        <SuiWalletProvider>
          {children}
        </SuiWalletProvider>
      </body>
    </html>
  );
}
