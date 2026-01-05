// client/src/app/dashboard/services/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter, Search, Calendar } from "lucide-react"; // Tambah Icon Calendar

export default function ServiceListPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterTechnician, setFilterTechnician] = useState("ALL");
  
  // FILTER BARU: TANGGAL
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  const [search, setSearch] = useState(""); 
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [userRole, setUserRole] = useState(""); 

  const router = useRouter();

  // Logic Generate List Tahun (Dari 2024 s/d Sekarang)
  const startYear = 2024;
  const currentYear = new Date().getFullYear();
  const yearList = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

  // 1. Initial Load: Cek Role & Ambil Daftar Teknisi
  useEffect(() => {
    const initPage = async () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      
      if (userData && token) {
        const role = JSON.parse(userData).role;
        setUserRole(role);

        if (role === 'ADMIN') {
          try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users?role=TECHNICIAN`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTechnicians(res.data.data);
          } catch (err) { console.error("Gagal load teknisi", err); }
        }
      }
    };
    initPage();
  }, []);

  // 2. Fetch Data Servis (Dipanggil saat Page/Filter/Search berubah)
useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search); // Update value final setelah user diam 500ms
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);


  // 3. USE EFFECT FETCH DATA UTAMA (Langsung jalan tanpa delay)
  useEffect(() => {
      const fetchServices = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          
          const params: any = { page, limit: 10 };
          
          if (filterStatus !== 'ALL') params.status = filterStatus;
          if (userRole === 'ADMIN' && filterTechnician !== 'ALL') params.technicianId = filterTechnician;
          if (filterYear !== 'ALL') params.year = filterYear;
          if (filterMonth !== 'ALL') params.month = filterMonth;

          // Gunakan debouncedSearch, bukan search mentah
          if (debouncedSearch) params.search = debouncedSearch; 

          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
            headers: { Authorization: `Bearer ${token}` },
            params: params,
          });

          setServices(res.data.data.services);
          setTotalPages(res.data.data.pagination.totalPages);
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
      };

      fetchServices();

  }, [page, filterStatus, filterTechnician, filterMonth, filterYear, debouncedSearch, userRole]); 

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* HEADER & FILTER CONTAINER */}
      <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
        
        {/* BARIS 1: JUDUL & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-primary">Daftar Servis</h2>
                <p className="text-sm text-gray-500">Pantau riwayat servis pelanggan.</p>
            </div>
            
            {/* INPUT PENCARIAN */}
            <div className="relative w-full md:w-[320px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari Tiket, Pelanggan, atau HP..."
                  className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  value={search}
                  onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1); 
                  }}
                />
            </div>
        </div>
        
        {/* BARIS 2: AREA FILTER (Dibuat Lebih Rapi) */}
        <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t items-start lg:items-center justify-between">
            
            {/* KIRI: FILTER TANGGAL (GROUP) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 min-w-[60px]">
                    <Calendar className="w-4 h-4" /> Periode:
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Filter Bulan */}
                    <div className="w-full sm:w-[150px]">
                        <Select value={filterMonth} onValueChange={(val) => { setFilterMonth(val); setPage(1); }}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 h-9">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Bulan</SelectItem>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                        {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Filter Tahun */}
                    <div className="w-[100px] sm:w-[100px]">
                        <Select value={filterYear} onValueChange={(val) => { setFilterYear(val); setPage(1); }}>
                            <SelectTrigger className="bg-gray-50 border-gray-200 h-9">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All</SelectItem>
                                {yearList.map((y) => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* KANAN: FILTER TEKNISI & STATUS */}
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                 {/* Filter Teknisi (Admin Only) */}
                 {userRole === 'ADMIN' && (
                    <div className="w-full sm:w-[180px]">
                        <Select value={filterTechnician} onValueChange={(val) => { setFilterTechnician(val); setPage(1); }}>
                            <SelectTrigger className="bg-white border-gray-200 h-9">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Filter className="w-3 h-3" />
                                    <SelectValue placeholder="Pilih Teknisi" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Teknisi</SelectItem>
                                {technicians.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Filter Status */}
                <div className="w-full sm:w-[160px]">
                    <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                        <SelectTrigger className={`h-9 border-gray-200 ${filterStatus !== 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white'}`}>
                            <SelectValue placeholder="Status Servis" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="WORKING">WORKING</SelectItem>
                            <SelectItem value="DONE">DONE</SelectItem>
                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

        </div>
      </div>

      {/* TABEL DATA */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase border-b text-xs tracking-wider">
                <tr>
                <th className="px-6 py-3 font-semibold">Tiket</th>
                <th className="px-6 py-3 font-semibold">Pelanggan</th>
                <th className="px-6 py-3 font-semibold">Teknisi</th>
                <th className="px-6 py-3 font-semibold">Perangkat</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Tanggal</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-500">Memuat data...</td></tr>
                ) : services.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-500 bg-gray-50/30">
                        <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-gray-300" />
                            <p>{search ? `Tidak ditemukan data untuk "${search}"` : "Belum ada data servis."}</p>
                        </div>
                    </td></tr>
                ) : (
                services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/service/${srv.id}`)}>
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{srv.ticketNumber}</td>
                    <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{srv.customer.name}</div>
                        <div className="text-xs text-gray-400">{srv.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                        {userRole === 'TECHNICIAN' ? (
                            <span className="text-gray-600">Saya (Anda)</span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    {srv.technician.name.charAt(0)}
                                </div>
                                <span className="text-gray-700">{srv.technician.name}</span>
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{srv.deviceModel}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide shadow-sm
                        ${srv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : ''}
                        ${srv.status === 'WORKING' ? 'bg-blue-100 text-blue-700 border border-blue-200' : ''}
                        ${srv.status === 'DONE' ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                        ${srv.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600 border border-gray-200' : ''}
                        `}>{srv.status}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(srv.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
          <div className="text-xs text-gray-500">
            Hal <strong>{page}</strong> / <strong>{totalPages || 1}</strong>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1 || loading}>
              <ChevronLeft className="h-3 w-3 mr-1" /> Prev
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages || loading}>
              Next <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}