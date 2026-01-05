// client/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 1. IMPORT TOASTER
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Professor Gadget ERP",
  description: "Sistem Manajemen Servis & Toko",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. PASANG KOMPONEN TOASTER DISINI */}
        <Toaster 
            position="top-center" 
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
                success: {
                    style: { background: '#DEF7EC', color: '#03543F', border: '1px solid #84E1BC' },
                },
                error: {
                    style: { background: '#FDE8E8', color: '#9B1C1C', border: '1px solid #F8B4B4' },
                },
            }}
        />
        {children}
      </body>
    </html>
  );
}