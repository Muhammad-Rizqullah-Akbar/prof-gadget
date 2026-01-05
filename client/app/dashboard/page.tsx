// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddServiceDialog } from "@/components/forms/AddServiceDialog";
// Import Icon Lucide yang dibutuhkan
import { Package, Clock, Wrench, CheckCircle, XCircle, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, working: 0, done: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      // Minta limit 5 saja untuk tabel ringkas
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setServices(res.data.data.services); // Hanya 5 data terbaru
      setStats(res.data.data.stats);       // Statistik TOTAL (Global)
    } catch (error) {
      console.error("Gagal load dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Hitung Total Servis Aktif (Semua dikurang yang Batal)
  const totalActive = (stats?.pending || 0) + (stats?.working || 0) + (stats?.done || 0);
  
  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">Overview</h2>
            <p className="text-sm text-gray-500">Ringkasan aktivitas bengkel hari ini.</p>
        </div>
        <AddServiceDialog onSuccess={fetchDashboardData} />
      </div>

      {/* --- 5 KARTU STATISTIK (DENGAN ICON) --- */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        
        {/* 1. TOTAL SERVIS */}
        <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" /> {/* ICON PACKAGE */}
                Total Masuk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-gray-800">{totalActive}</div>
          </CardContent>
        </Card>

        {/* 2. PENDING */}
        <Card className="bg-white border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" /> {/* ICON CLOCK */}
                Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        {/* 3. WORKING */}
        <Card className="bg-white border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-500" /> {/* ICON WRENCH */}
                Pengerjaan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-600">{stats.working}</div>
          </CardContent>
        </Card>

        {/* 4. SELESAI */}
        <Card className="bg-white border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" /> {/* ICON CHECK */}
                Selesai
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
          </CardContent>
        </Card>

        {/* 5. DIBATALKAN */}
        <Card className="bg-gray-50 border-l-4 border-l-gray-400 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-500" /> {/* ICON X */}
                Batal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
          </CardContent>
        </Card>

      </div>

      {/* --- TABEL RINGKAS (HANYA 5 DATA TERAKHIR) --- */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                5 Servis Terakhir
            </h3>
            <button 
                onClick={() => router.push('/dashboard/services')} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 transition-colors"
            >
                Lihat Semua <ArrowRight className="w-3 h-3" />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b bg-white">
                <tr>
                <th className="px-6 py-3 font-medium">Tiket</th>
                <th className="px-6 py-3 font-medium">Pelanggan</th>
                <th className="px-6 py-3 font-medium">Perangkat</th>
                <th className="px-6 py-3 font-medium">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Memuat data...</td></tr>
                ) : services.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400 italic">Belum ada servis masuk.</td></tr>
                ) : (
                    services.map((srv) => (
                        <tr key={srv.id} className="hover:bg-blue-50/50 cursor-pointer transition-colors" 
                            onClick={() => router.push(`/dashboard/service/${srv.id}`)}>
                        <td className="px-6 py-3 font-mono text-blue-600 font-medium">{srv.ticketNumber}</td>
                        <td className="px-6 py-3">
                            <div className="font-semibold text-gray-700">{srv.customer.name}</div>
                        </td>
                        <td className="px-6 py-3 text-gray-600">{srv.deviceModel}</td>
                        <td className="px-6 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide shadow-sm
                            ${srv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : ''}
                            ${srv.status === 'WORKING' ? 'bg-blue-100 text-blue-700 border border-blue-200' : ''}
                            ${srv.status === 'DONE' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                            ${srv.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600 border border-gray-200' : ''}
                            `}>{srv.status}</span>
                        </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}