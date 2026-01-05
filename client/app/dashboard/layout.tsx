// client/src/app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet
import { LayoutDashboard, Package, Users, LogOut, DollarSign, Menu } from "lucide-react"; // Tambah Icon Menu

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/"); 
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/"); 
  };

  if (!user) return null;

  // --- KOMPONEN ISI SIDEBAR (Dipisah agar bisa dipakai di Desktop & Mobile) ---
  const SidebarContent = () => {
    const getLinkClass = (path: string) => {
      const isActive = pathname === path;
      return `flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium mb-1
        ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`;
    };

    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">Professor Gadget</h1>
          <p className="text-xs text-gray-500 mt-1">Sistem Servis & Administrasi</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 pl-3">Menu Utama</div>
          
          <Link href="/dashboard" className={getLinkClass("/dashboard")}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          
          <Link href="/dashboard/services" className={getLinkClass("/dashboard/services")}>
            <Package className="w-5 h-5" /> Daftar Servis
          </Link>

          {user.role === 'ADMIN' && (
            <>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 pl-3">Admin Zone</div>
              <Link href="/dashboard/financials" className={getLinkClass("/dashboard/financials")}>
                <DollarSign className="w-5 h-5" /> Laporan Keuangan
              </Link>
              <Link href="/dashboard/technicians" className={getLinkClass("/dashboard/technicians")}>
                <Users className="w-5 h-5" /> Kelola Teknisi
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t bg-gray-50">
           <div className="flex items-center gap-3 px-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user.role.toLowerCase()}</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* 1. SIDEBAR DESKTOP (Hidden di Mobile) */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* 2. HEADER (Ada Tombol Menu Mobile) */}
        <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm md:px-8">
          
          {/* TOMBOL HAMBURGER (Hanya muncul di Mobile / md:hidden) */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                {/* Panggil komponen Sidebar yang sama */}
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <span className="font-bold text-blue-600">Professor Gadget</span>
          </div>

          {/* Sapaan User (Kanan) */}
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-500 hidden sm:inline">
              Halo, <strong>{user.username}</strong>
            </span>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* Isi Halaman */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}