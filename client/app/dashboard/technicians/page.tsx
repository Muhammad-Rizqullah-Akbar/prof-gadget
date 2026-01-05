// client/src/app/dashboard/technicians/page.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, ShieldCheck, Briefcase, CheckCircle, Clock, Eye, EyeOff, AlertTriangle } from "lucide-react";
// IMPORT TOAST
import toast from "react-hot-toast";

export default function TechniciansPage() {
  const [techs, setTechs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States Dialog Tambah/Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- STATE KONFIRMASI (BARU) ---
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);

  const fetchTechs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechs(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat data teknisi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      if (isEditMode && selectedId) {
        await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/users/${selectedId}`, 
          { name, password }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Data teknisi diperbarui");
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, 
          { name, username, password },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Teknisi baru berhasil ditambahkan");
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchTechs(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNGSI CONFIRMATION DIALOG
  const triggerDelete = (id: number, techName: string) => {
    setConfirmData({
        title: "Hapus Teknisi?",
        message: `Anda akan menghapus akun "${techName}". Akses login mereka akan hilang permanen.`,
        action: async () => {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Teknisi berhasil dihapus");
                fetchTechs();
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Gagal menghapus");
            }
        }
    });
    setConfirmOpen(true);
  };

  const openAddDialog = () => {
    setIsEditMode(false);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (tech: any) => {
    setIsEditMode(true);
    setSelectedId(tech.id);
    setName(tech.name);
    setUsername(tech.username);
    setPassword(""); 
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setSelectedId(null);
    setShowPassword(false); 
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Kelola Teknisi</h2>
          <p className="text-sm text-gray-500">Pantau kinerja dan kelola akun tim teknisi.</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4" /> Tambah Teknisi
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
            <p className="col-span-3 text-center text-gray-400 py-10">Memuat data tim...</p>
        ) : techs.length === 0 ? (
            <div className="col-span-3 text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">Belum ada teknisi. Tambahkan sekarang.</p>
            </div>
        ) : (
            techs.map((tech) => (
                <Card key={tech.id} className="hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
                    <CardHeader className="pb-2 flex flex-row justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">{tech.name}</CardTitle>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <ShieldCheck className="w-3 h-3" /> @{tech.username}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                                onClick={() => openEditDialog(tech)}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50"
                                onClick={() => triggerDelete(tech.id, tech.name)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 p-3 rounded-md mb-4 border">
                            <div className="flex justify-between items-center text-sm font-semibold mb-2">
                                <span className="flex items-center gap-2 text-gray-600"><Briefcase className="w-4 h-4" /> Total Servis</span>
                                <span className="text-lg">{tech.stats.total}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white p-2 rounded border flex items-center justify-between text-green-700 font-medium">
                                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Selesai</span>
                                    <span>{tech.stats.done}</span>
                                </div>
                                <div className="bg-white p-2 rounded border flex items-center justify-between text-yellow-700 font-medium">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                                    <span>{tech.stats.pending}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Teknisi' : 'Tambah Teknisi Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Nama Lengkap</Label>
                    <Input placeholder="Nama Teknisi" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                    <Label>Username (Login)</Label>
                    <Input 
                        placeholder="username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                        disabled={isEditMode} 
                        className={isEditMode ? "bg-gray-100 text-gray-500" : ""}
                    />
                </div>

                <div className="space-y-2">
                    <Label>{isEditMode ? 'Reset Password (Opsional)' : 'Password'}</Label>
                    <div className="relative">
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={isEditMode ? "Isi hanya jika ingin ganti password" : "Minimal 6 karakter"} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required={!isEditMode} 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" /> {confirmData?.title}
                </DialogTitle>
                <DialogDescription>
                    {confirmData?.message}
                </DialogDescription>
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