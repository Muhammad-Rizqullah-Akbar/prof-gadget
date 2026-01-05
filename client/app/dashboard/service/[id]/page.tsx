// src/app/dashboard/service/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Printer, Play, CheckCircle, Ban, Lock, Pencil, Trash2, Wrench, ShoppingCart, Clock, XCircle, AlertTriangle, ArrowLeft, Phone } from "lucide-react";
import toast from "react-hot-toast";

const EditIcon = () => (
    <div className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
        <Pencil className="w-3 h-3 mr-1" /> Edit
    </div>
);
const DeleteIcon = () => (
    <div className="flex items-center text-red-600 hover:text-red-800 cursor-pointer text-sm ml-3">
        <Trash2 className="w-3 h-3 mr-1" /> Hapus
    </div>
);

export default function ServiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(""); 

  // --- STATE FORMULIR ---
  const [category, setCategory] = useState("SERVICE");
  const [itemName, setItemName] = useState("");
  const [priceInput, setPriceInput] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- STATE EDIT ---
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // --- STATE KONFIRMASI ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    action: () => void;
    isDanger?: boolean;
  } | null>(null);

  // 1. Ambil Data Servis
  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}"); 
      setUserRole(user.role || "");

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setService(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat data servis");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // --- HELPER KONFIRMASI ---
  const triggerConfirm = (title: string, message: string, action: () => void, isDanger = false) => {
      setConfirmData({ title, message, action, isDanger });
      setConfirmOpen(true);
  };

  // --- LOGIC HAPUS SERVIS (ADMIN ONLY) ---
  const handleDeleteService = () => {
    triggerConfirm(
        "Hapus Servis Ini?",
        "PERINGATAN: Tindakan ini akan menghapus seluruh data tiket ini beserta rincian biayanya secara PERMANEN. Data tidak bisa dikembalikan.",
        async () => {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/services/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                toast.success("Servis berhasil dihapus");
                router.push('/dashboard/services'); // Balik ke halaman list
            } catch (error) {
                toast.error("Gagal menghapus servis");
            }
        },
        true // Danger Mode (Merah)
    );
  };

  const executeStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/services/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setService({ ...service, status: newStatus });
      toast.success(`Status diperbarui ke ${newStatus}`);
    } catch (error) {
      toast.error("Gagal update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'CANCELLED') {
        triggerConfirm(
            "Batalkan Servis?",
            "Tindakan ini akan menandai servis sebagai DIBATALKAN. Lanjutkan?",
            () => executeStatusChange(newStatus),
            true 
        );
    } else {
        executeStatusChange(newStatus);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const buyPrice = category === "PART" ? Number(priceInput) : 0;
      const sellPrice = category === "SERVICE" ? Number(priceInput) : 0;

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/services/${id}/items`,
        { itemName, category, buyPrice, sellPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setItemName("");
      setPriceInput("");
      setCategory("SERVICE"); 
      fetchDetail();
      toast.success("Item berhasil ditambahkan");
    } catch (error) {
      toast.error("Gagal menambah item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (itemId: number) => {
    triggerConfirm(
        "Hapus Item?",
        "Item ini akan dihapus permanen dari rincian biaya. Yakin?",
        async () => {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/services/items/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                fetchDetail();
                toast.success("Item dihapus");
            } catch (error) {
                toast.error("Gagal menghapus item");
            }
        },
        true
    );
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setEditName(item.itemName);
    const price = item.category === 'SERVICE' ? item.sellPrice : item.buyPrice;
    setEditPrice(price.toString());
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const buyPrice = editingItem.category === "PART" ? Number(editPrice) : 0;
      const sellPrice = editingItem.category === "SERVICE" ? Number(editPrice) : 0;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/services/items/${editingItem.id}`,
        { itemName: editName, buyPrice, sellPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditingItem(null); 
      fetchDetail();
      toast.success("Item diperbarui");
    } catch (error) {
      toast.error("Gagal update item");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center gap-2"><div className="animate-spin">⏳</div> Memuat data...</div>;
  if (!service) return null;

  const isTerminalState = service.status === 'DONE' || service.status === 'CANCELLED';
  const canEdit = userRole === 'ADMIN' || !isTerminalState;

  const renderStatusControl = () => {
    if (updatingStatus) return <span className="text-sm text-gray-500 animate-pulse">Menyimpan...</span>;

    if (userRole === 'ADMIN') {
        return (
            <Select value={service.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={`w-[160px] font-bold border shadow-sm transition-colors
                    ${service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                    ${service.status === 'WORKING' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                    ${service.status === 'DONE' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                    ${service.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                `}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="PENDING">
                        <div className="flex items-center gap-2 text-yellow-700 font-medium">
                            <Clock className="w-4 h-4" /> PENDING
                        </div>
                    </SelectItem>
                    <SelectItem value="WORKING">
                        <div className="flex items-center gap-2 text-blue-700 font-medium">
                            <Wrench className="w-4 h-4" /> WORKING
                        </div>
                    </SelectItem>
                    <SelectItem value="DONE">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                            <CheckCircle className="w-4 h-4" /> DONE
                        </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                         <div className="flex items-center gap-2 text-gray-600 font-medium">
                            <XCircle className="w-4 h-4" /> CANCELLED
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        );
    }

    if (service.status === 'PENDING') {
      return (
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange('WORKING')}>
            <Play className="w-4 h-4 mr-2" /> Mulai Kerjakan
          </Button>
          <Button variant="destructive" onClick={() => handleStatusChange('CANCELLED')}>
            <Ban className="w-4 h-4 mr-2" /> Batalkan
          </Button>
        </div>
      );
    }

    if (service.status === 'WORKING') {
      return (
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('DONE')}>
            <CheckCircle className="w-4 h-4 mr-2" /> Selesai (Done)
          </Button>
          <Button variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-300" onClick={() => handleStatusChange('CANCELLED')}>
            <Ban className="w-4 h-4 mr-2" /> Batalkan
          </Button>
        </div>
      );
    }

    return <Badge variant="secondary" className="px-3 py-1 text-sm border-gray-300">Status Final</Badge>;
  };

  const totalTagihan = service.items.reduce((sum: number, item: any) => sum + Number(item.sellPrice), 0);
  const totalModal = service.items.reduce((sum: number, item: any) => sum + Number(item.buyPrice), 0);

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* HEADER UTAMA */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* GROUP KIRI */}
        <div className="flex items-start gap-4">
            <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 shrink-0 border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => router.push('/dashboard/services')}
                title="Kembali ke Daftar"
            >
                <ArrowLeft className="w-5 h-5" />
            </Button>

            <div>
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-800">Tiket #{service.ticketNumber}</h2>
                    
                    {userRole !== 'ADMIN' && (
                        <Badge className={`text-sm px-3 py-1 flex items-center gap-1 border shadow-sm
                            ${service.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                            ${service.status === 'WORKING' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            ${service.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                            ${service.status === 'CANCELLED' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                        `}>
                            {service.status === 'PENDING' && <Clock className="w-3 h-3" />}
                            {service.status === 'WORKING' && <Wrench className="w-3 h-3" />}
                            {service.status === 'DONE' && <CheckCircle className="w-3 h-3" />}
                            {service.status === 'CANCELLED' && <XCircle className="w-3 h-3" />}
                            {service.status}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>Masuk: {new Date(service.createdAt).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
            </div>
        </div>
        
        {/* GROUP KANAN */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
            {/* TOMBOL HAPUS (HANYA ADMIN) */}
            {userRole === 'ADMIN' && (
                <Button 
                    variant="outline" 
                    size="icon"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    title="Hapus Servis (Permanen)"
                    onClick={handleDeleteService}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}

            <Button 
              variant="outline" 
              className="gap-2 border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
              onClick={() => window.open(`/print/service/${id}`, '_blank')}
            >
              <Printer className="w-4 h-4" /> Nota
            </Button>
            
            {renderStatusControl()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KOLOM KIRI */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm border-t-4 border-t-blue-500">
            <CardHeader className="pb-3 border-b bg-gray-50/50"><CardTitle className="text-base text-gray-700">Informasi Pelanggan</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm pt-4">
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wider mb-1 block">Nama Pelanggan</Label>
                <div className="font-bold text-lg text-gray-800 mb-1">{service.customer.name}</div>
                <div className="flex items-center gap-2 text-blue-600 font-mono bg-blue-50 w-fit px-2 py-1 rounded text-xs">
                    <Phone className="w-3 h-3" /> {service.customer.phone}
                </div>
                <div className="text-gray-500 text-xs mt-2 italic">{service.customer.address || "Alamat tidak diisi"}</div>
              </div>
              <div>
                <Label className="text-gray-500 text-xs uppercase tracking-wider mb-1 block">Perangkat</Label>
                <div className="font-bold text-lg text-gray-800">{service.deviceModel}</div>
                <Badge variant="outline" className="mt-1 bg-gray-50">{service.deviceType}</Badge>
              </div>
              <div className="col-span-1 sm:col-span-2 mt-2 p-4 bg-red-50 text-red-800 rounded-md border border-red-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <div>
                    <span className="font-bold block text-xs uppercase tracking-wider mb-1">Keluhan Awal</span> 
                    {service.complaint}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="flex justify-between items-center text-base text-gray-700">
                <span>Rincian Biaya & Tindakan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead className="pl-6">Item</TableHead>
                    <TableHead className="w-[100px]">Tipe</TableHead>
                    <TableHead className="text-right text-red-400 hidden sm:table-cell">Modal</TableHead>
                    <TableHead className="text-right text-blue-600">Tagihan</TableHead>
                    <TableHead className="text-right w-[100px] pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {service.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-gray-400 italic">
                        <div className="flex flex-col items-center gap-2">
                             <ShoppingCart className="w-8 h-8 text-gray-200" />
                             Belum ada tindakan/sparepart yang diinput.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    service.items.map((item: any) => (
                      <TableRow key={item.id} className="group hover:bg-gray-50">
                        <TableCell className="font-medium pl-6">{item.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={item.category === 'SERVICE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                            {item.category === 'SERVICE' ? 'Jasa' : 'Part'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-red-400 font-mono text-xs hidden sm:table-cell">
                           {Number(item.buyPrice) > 0 ? `(Rp ${Number(item.buyPrice).toLocaleString("id-ID")})` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-700">
                          {Number(item.sellPrice) > 0 ? `Rp ${Number(item.sellPrice).toLocaleString("id-ID")}` : '-'}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {canEdit && (
                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditDialog(item)} title="Edit"><EditIcon /></button>
                                <button onClick={() => handleDeleteItem(item.id)} title="Hapus"><DeleteIcon /></button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow className="bg-gray-50 font-bold border-t-2 border-gray-200 text-base">
                    <TableCell colSpan={2} className="pl-6 text-gray-600">TOTAL AKHIR</TableCell>
                    <TableCell className="text-right text-red-500 text-xs hidden sm:table-cell">(Rp {totalModal.toLocaleString("id-ID")})</TableCell>
                    <TableCell className="text-right text-blue-700 text-lg">Rp {totalTagihan.toLocaleString("id-ID")}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: FORM INPUT & PESAN */}
        <div className="md:col-span-1">
          {/* WRAPPER STICKY DI SINI */}
          <div className="sticky top-6 space-y-4">
            
            <Card className={`bg-white border-l-4 border-l-blue-600 shadow-sm transition-opacity ${!canEdit ? 'opacity-60 pointer-events-none grayscale' : ''}`}>
                <CardHeader className="pb-3 border-b bg-gray-50/50 flex flex-row items-center justify-between">
                <CardTitle className="text-gray-800 text-sm uppercase tracking-wider font-bold">Input Transaksi</CardTitle>
                {!canEdit && <Lock className="w-4 h-4 text-gray-400" />} 
                </CardHeader>
                <CardContent className="pt-4">
                <form onSubmit={handleAddItem} className="space-y-4">
                    <fieldset disabled={!canEdit} className="space-y-4">
                        <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Jenis Transaksi</Label>
                        <Select value={category} onValueChange={setCategory} disabled={!canEdit}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SERVICE">
                                    <div className="flex items-center gap-2 text-blue-700">
                                        <Wrench className="w-4 h-4" /> Tagihan Servis
                                    </div>
                                </SelectItem>
                                <SelectItem value="PART">
                                    <div className="flex items-center gap-2 text-orange-600">
                                        <ShoppingCart className="w-4 h-4" /> Belanja Sparepart
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        </div>

                        <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Nama Item</Label>
                        <Input placeholder="Contoh: Ganti LCD" required value={itemName} onChange={e => setItemName(e.target.value)} className="bg-white" />
                        </div>
                        
                        <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Nominal (Rp)</Label>
                        <Input type="number" placeholder="0" required value={priceInput} onChange={e => setPriceInput(e.target.value)} className="bg-white font-bold text-gray-800" />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={isSubmitting || !canEdit}>
                            {isSubmitting ? "Menyimpan..." : (canEdit ? "+ Tambahkan Item" : "Terkunci")}
                        </Button>
                    </fieldset>
                </form>
                </CardContent>
            </Card>
            
            {/* PESAN SEKARANG ADA DI DALAM WRAPPER STICKY */}
            {!canEdit && userRole !== 'ADMIN' && (
                <div className="text-center text-xs text-gray-400 p-3 bg-gray-50 rounded border border-dashed border-gray-200">
                    <Lock className="w-4 h-4 mx-auto mb-1 opacity-50" />
                    Servis sudah selesai/batal.<br/>Hubungi Admin untuk revisi.
                </div>
            )}
            
          </div>
        </div>
      </div>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
         <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Rincian</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateItem} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Item</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>{editingItem?.category === 'SERVICE' ? 'Harga Tagihan' : 'Harga Modal'}</Label>
              <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isUpdating}>{isUpdating ? "Menyimpan..." : "Simpan Perubahan"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle className={`flex items-center gap-2 ${confirmData?.isDanger ? "text-red-600" : "text-gray-800"}`}>
                    {confirmData?.isDanger ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 text-blue-600" />}
                    {confirmData?.title}
                </DialogTitle>
                <DialogDescription>
                    {confirmData?.message}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3"> 
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                    Batal
                </Button>
                <Button 
                    variant={confirmData?.isDanger ? "destructive" : "default"} 
                    onClick={() => {
                        confirmData?.action();
                        setConfirmOpen(false);
                    }}
                >
                    {confirmData?.isDanger ? "Ya, Lanjutkan" : "Konfirmasi"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}