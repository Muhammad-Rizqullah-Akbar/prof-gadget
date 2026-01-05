// client/src/app/dashboard/financials/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
// ICON UPDATED: BookOpen ditambahkan, Emoji dihapus
import { DollarSign, TrendingDown, Wallet, Zap, Trash2, PlusCircle, Download, AlertTriangle, BookOpen } from "lucide-react"; 
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from "react-hot-toast";

export default function FinancialPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter State
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  // Expense Dialog State
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Konfirmasi
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  // Logic Generate List Tahun
  const startYear = 2024;
  const currentYearNum = new Date().getFullYear();
  const yearList = Array.from({ length: currentYearNum - startYear + 1 }, (_, i) => startYear + i);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
      });
      setData(res.data.data);
    } catch (error) { toast.error("Gagal memuat laporan"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [month, year]);

  // LOGIKA GABUNGAN (MUTASI) - UPDATED dengan Info Perangkat
  const combinedMutations = useMemo(() => {
    if (!data) return [];
    let mutations: any[] = [];
    
    // 1. DATA SERVIS
    data.transactions.forEach((t: any) => {
        // Ambil info perangkat
        const deviceType = t.service.deviceType;
        const deviceModel = t.service.deviceModel;

        if (Number(t.sellPrice) > 0) {
            mutations.push({
                uniqueKey: `inc-${t.id}`, realId: t.id, source: 'SERVICE_ITEM', 
                date: new Date(t.service.createdAt), 
                desc: `Jasa: ${t.itemName} (${t.service.customer.name})`,
                category: 'INCOME', ticket: t.service.ticketNumber, amount: Number(t.sellPrice), type: 'IN',
                deviceType, deviceModel // Tambah info ke object
            });
        }
        if (Number(t.buyPrice) > 0) {
            mutations.push({
                uniqueKey: `cogs-${t.id}`, realId: t.id, source: 'SERVICE_ITEM',
                date: new Date(t.service.createdAt), 
                desc: `Modal Part: ${t.itemName}`,
                category: 'COGS', ticket: t.service.ticketNumber, amount: Number(t.buyPrice), type: 'OUT',
                deviceType, deviceModel // Tambah info ke object
            });
        }
    });

    // 2. DATA BEBAN OPERASIONAL
    data.expenses.forEach((e: any) => {
        mutations.push({
            uniqueKey: `exp-${e.id}`, realId: e.id, source: 'EXPENSE', 
            date: new Date(e.date), desc: `Beban: ${e.name}`,
            category: 'OPEX', ticket: '-', amount: Number(e.amount), type: 'OUT',
            deviceType: '-', deviceModel: '-' // Default strip
        });
    });
    return mutations.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [data]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const token = localStorage.getItem("token");
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, 
            { name: expName, amount: expAmount, date: new Date() },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsExpenseOpen(false); setExpName(""); setExpAmount(""); fetchReport(); 
        toast.success("Pengeluaran dicatat");
    } catch (error) { toast.error("Gagal menyimpan data"); } finally { setIsSubmitting(false); }
  };

  const handleDeleteItem = async (id: number, source: string) => {
    const confirmMsg = source === 'SERVICE_ITEM' 
        ? "PERINGATAN: Item ini terhubung dengan Tiket Servis. Menghapusnya disini akan menghapusnya juga dari nota tiket." 
        : "Anda akan menghapus catatan pengeluaran ini.";

    setConfirmData({
        title: "Hapus Transaksi?",
        message: confirmMsg,
        action: async () => {
            try {
                const token = localStorage.getItem("token");
                if (source === 'SERVICE_ITEM') {
                    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/services/items/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
                toast.success("Transaksi dihapus");
                fetchReport(); 
            } catch (error) { 
                toast.error("Gagal menghapus data"); 
            }
        }
    });
    setConfirmOpen(true);
  };

  // --- UPDATED EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (!combinedMutations.length) return;
    
    // Mapping Data agar kolomnya sesuai request
    const exportData = combinedMutations.map(m => ({
        "Tanggal": m.date.toLocaleDateString('id-ID'),
        "Keterangan": m.desc,
        "No. Tiket": m.ticket,
        "Jenis Perangkat": m.deviceType, // Kolom Baru
        "Merk/Model": m.deviceModel,     // Kolom Baru
        "Kategori": m.category,
        "Masuk (IDR)": m.type === 'IN' ? m.amount : 0,
        "Keluar (IDR)": m.type === 'OUT' ? m.amount : 0
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Auto width sederhana (Optional)
    const wscols = [
        {wch: 15}, {wch: 40}, {wch: 20}, {wch: 15}, {wch: 25}, {wch: 10}, {wch: 15}, {wch: 15}
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Laporan_Keuangan_${month}_${year}.xlsx`);
    toast.success("Laporan berhasil didownload");
  };

  const toIDR = (val: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // --- GRAFIK SETUP UPDATED ---
  // Ganti dari Top Teknisi ke "Komposisi Pengeluaran" (Modal Part vs Operasional)
  const expenseComposition = useMemo(() => {
    if (!data?.summary) return [];
    
    const stats = [
        { name: 'Modal Sparepart', value: data.summary.totalCogs || 0, color: '#F97316' }, // Orange
        { name: 'Biaya Operasional', value: data.summary.totalOpEx || 0, color: '#DC2626' }, // Merah
    ];

    // Filter agar yang 0 tidak muncul di chart
    return stats.filter(s => s.value > 0);
  }, [data]);

  const getChartTitle = () => year === 'ALL' ? "Tren Tahunan (5 Thn)" : (month === 'ALL' ? `Tren Bulanan (${year})` : `Tren Omzet (6 Bulan)`);
  const getPeriodLabel = () => year === 'ALL' ? "Semua Waktu" : (month === 'ALL' ? `Tahun ${year}` : `${new Date(0, Number(month)-1).toLocaleString('id-ID',{month:'long'})} ${year}`);

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Laporan Keuangan</h2>
          <p className="text-sm text-gray-500 font-medium text-blue-600">Periode: {getPeriodLabel()}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50" onClick={handleExportExcel}>
             <Download className="w-4 h-4" /> Export Excel
           </Button>
           <Button variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setIsExpenseOpen(true)}>
             <PlusCircle className="w-4 h-4" /> Catat Beban
           </Button>

          <Select value={month} onValueChange={setMonth} disabled={year === 'ALL'}>
            <SelectTrigger className="w-[140px] bg-gray-50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold text-blue-600">📅 Setahun Penuh</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[110px] bg-gray-50"><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL" className="font-bold text-blue-600">🌐 All Time</SelectItem>
                {yearList.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4 CARDS SUMMARY */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-500 uppercase flex gap-2"><DollarSign className="w-4 h-4" /> Total Omzet</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><div className="text-xl font-bold text-blue-700">{loading ? "..." : toIDR(data?.summary.totalRevenue || 0)}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-500 uppercase flex gap-2"><TrendingDown className="w-4 h-4" /> Modal Part</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><div className="text-xl font-bold text-orange-600">{loading ? "..." : `(${toIDR(data?.summary.totalCogs || 0)})`}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-600 shadow-sm">
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-gray-500 uppercase flex gap-2"><Zap className="w-4 h-4" /> Beban Ops</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><div className="text-xl font-bold text-red-600">{loading ? "..." : `(${toIDR(data?.summary.totalOpEx || 0)})`}</div></CardContent>
        </Card>
        <Card className={`border-l-4 shadow-sm bg-opacity-50 ${ (data?.summary.netProfit || 0) >= 0 ? 'border-l-green-600 bg-green-50' : 'border-l-red-800 bg-red-50' }`}>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold text-gray-700 uppercase flex gap-2"><Wallet className="w-4 h-4" /> Laba Bersih</CardTitle></CardHeader>
            <CardContent className="p-4 pt-0"><div className={`text-xl font-bold ${(data?.summary.netProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>{loading ? "..." : toIDR(data?.summary.netProfit || 0)}</div></CardContent>
        </Card>
      </div>

      {/* AREA GRAFIK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CHART 1: LINE CHART (TREN OMZET) */}
        <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">{getChartTitle()}</CardTitle></CardHeader>
            <CardContent className="h-[250px] w-full">
                {loading ? <div className="text-center text-gray-400">...</div> : (
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={data?.chartData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: '#6b7280'}} />
                        <YAxis fontSize={12} tickFormatter={(val) => `${val/1000000}jt`} tickLine={false} axisLine={false} tick={{fill: '#6b7280'}} />
                        <Tooltip formatter={(val: any) => toIDR(val)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="omzet" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 0 }} name="Omzet" />
                     </LineChart>
                   </ResponsiveContainer>
                )}
            </CardContent>
        </Card>

        {/* CHART 2: PIE CHART (KOMPOSISI PENGELUARAN) */}
        <Card className="md:col-span-1 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Proporsi Pengeluaran</CardTitle></CardHeader>
            <CardContent className="h-[250px] w-full flex items-center justify-center">
                 {loading ? <div className="text-gray-400">...</div> : (
                    expenseComposition.length === 0 ? <div className="text-gray-400 text-sm">Belum ada pengeluaran.</div> :
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={expenseComposition} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                {expenseComposition.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                            </Pie>
                            <Tooltip formatter={(val: any) => toIDR(val)} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                 )}
            </CardContent>
        </Card>
      </div>

      {/* TABEL BUKU KAS */}
      <Card className="shadow-md border-t-4 border-t-primary">
        <CardHeader className="pb-3 border-b bg-gray-50 flex flex-row items-center justify-between">
            {/* ICON BUKU DIGANTI */}
            <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Buku Kas Umum
            </CardTitle>
            <Badge variant="secondary" className="text-xs">{combinedMutations.length} Transaksi</Badge>
        </CardHeader>
        <CardContent className="p-0">
            <div className="h-[600px] overflow-auto relative">
                <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[120px] pl-6">Tanggal</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead className="w-[120px]">Kategori</TableHead>
                            <TableHead className="text-right text-green-600">Masuk</TableHead>
                            <TableHead className="text-right text-red-600">Keluar</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <TableRow><TableCell colSpan={6} className="text-center py-10">...</TableCell></TableRow> : 
                        combinedMutations.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">Belum ada transaksi.</TableCell></TableRow> :
                        combinedMutations.map((mut) => (
                            <TableRow key={mut.uniqueKey} className="hover:bg-gray-50 group">
                                <TableCell className="pl-6 font-mono text-xs text-gray-500">
                                    {mut.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    <div className="text-[10px]">{mut.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-gray-800">{mut.desc}</div>
                                    {mut.ticket !== '-' && <div className="text-xs text-blue-600 font-mono">Ref: {mut.ticket}</div>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`${mut.category === 'INCOME' ? 'bg-green-50 text-green-700 border-green-200' : ''} ${mut.category === 'COGS' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''} ${mut.category === 'OPEX' ? 'bg-red-50 text-red-700 border-red-200' : ''}`}>
                                        {mut.category === 'INCOME' ? 'Pendapatan' : (mut.category === 'COGS' ? 'Modal Part' : 'Operasional')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-green-700">{mut.type === 'IN' ? mut.amount.toLocaleString('id-ID') : '-'}</TableCell>
                                <TableCell className="text-right font-bold text-red-600">{mut.type === 'OUT' ? `(${mut.amount.toLocaleString('id-ID')})` : '-'}</TableCell>
                                <TableCell>
                                    <button 
                                        onClick={() => handleDeleteItem(mut.realId, mut.source)} 
                                        className="text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Hapus Transaksi"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Catat Pengeluaran (OpEx)</DialogTitle></DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4 py-2">
                <div className="space-y-2"><Label>Nama Pengeluaran</Label><Input placeholder="Contoh: Listrik" value={expName} onChange={e => setExpName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Nominal</Label><Input type="number" placeholder="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} required /></div>
                <DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700">Simpan</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" /> {confirmData?.title}
                </DialogTitle>
                <DialogDescription>{confirmData?.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3">
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>Batal</Button>
                <Button variant="destructive" onClick={() => { confirmData?.action(); setConfirmOpen(false); }}>
                    Ya, Hapus
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}