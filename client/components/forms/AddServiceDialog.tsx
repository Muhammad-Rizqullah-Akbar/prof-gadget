// src/components/forms/AddServiceDialog.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import Icon
import { CalendarClock, Clock, Wrench, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

// --- DATA PILIHAN ---
const CATEGORIES = [
  { id: "Handphone", label: "Handphone (HP)" },
  { id: "Laptop", label: "Laptop / PC" },
  { id: "Lainnya", label: "Elektronik Lainnya" },
];

const HP_BRANDS = [
  "Samsung", "iPhone", "Oppo", "Vivo", "Xiaomi", "Realme", "Infinix", "Google Pixel", "Huawei"
];

const LAPTOP_BRANDS = [
  "Asus", "Lenovo", "Acer", "HP", "Dell", "MSI", "Macbook", "Toshiba", "Axioo"
];

interface Props {
  onSuccess: () => void;
}

export function AddServiceDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Logic Dropdown
  const [category, setCategory] = useState("Handphone");
  const [brand, setBrand] = useState("");
  const [customBrand, setCustomBrand] = useState(""); 
  const [modelSeries, setModelSeries] = useState(""); 

  // Form Data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [complaint, setComplaint] = useState("");
  
  // ADMIN ONLY FIELDS
  const [entryDate, setEntryDate] = useState("");
  const [initialStatus, setInitialStatus] = useState("PENDING"); 

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
        const parsed = JSON.parse(userData);
        setUserRole(parsed.role || "");
    }
  }, []);

  useEffect(() => {
    setBrand("");
    setCustomBrand("");
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalDeviceModel = "";
      if (category === "Lainnya") {
        finalDeviceModel = modelSeries; 
      } else {
        const selectedBrand = brand === "Lainnya" ? customBrand : brand;
        finalDeviceModel = `${selectedBrand} ${modelSeries}`;
      }

      if (!finalDeviceModel.trim()) {
        alert("Mohon lengkapi data perangkat");
        setLoading(false);
        return;
      }

      const payload: any = {
        customerName,
        customerPhone,
        customerAddress,
        deviceType: category, 
        deviceModel: finalDeviceModel, 
        complaint,
        status: userRole === 'ADMIN' ? initialStatus : 'PENDING'
      };

      if (userRole === 'ADMIN' && entryDate) {
        payload.createdAt = new Date(entryDate).toISOString();
      }

      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/services`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCategory("Handphone");
    setBrand("");
    setCustomBrand("");
    setModelSeries("");
    setComplaint("");
    setEntryDate(""); 
    setInitialStatus("PENDING");
  };

  const getBrandList = () => {
    if (category === "Handphone") return HP_BRANDS;
    if (category === "Laptop") return LAPTOP_BRANDS;
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-blue-700 text-white shadow-md font-semibold">
          + Servis Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Input Servis Masuk</DialogTitle>
          <DialogDescription>
            Isi detail perangkat dan keluhan pelanggan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          
          {/* BAGIAN 1: PELANGGAN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Pelanggan</Label>
              <Input placeholder="Pak Budi" required 
                value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>No. WhatsApp</Label>
              <Input placeholder="0812..." required type="number"
                value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <Label>Alamat (Opsional)</Label>
            <Input 
              placeholder="Contoh: Jl. Mawar No. 10" 
              value={customerAddress} 
              onChange={(e) => setCustomerAddress(e.target.value)} 
            />
          </div>

          <div className="border-t my-1"></div>

          {/* BAGIAN 2: PERANGKAT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jenis Perangkat</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {category !== "Lainnya" && (
              <div className="space-y-2">
                <Label>Merk / Brand</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Merk" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBrandList().map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                    <SelectItem value="Lainnya">Lainnya...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {category !== "Lainnya" && brand === "Lainnya" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label className="text-blue-600">Masukkan Nama Merk Manual</Label>
              <Input placeholder="Contoh: Nokia / Polytron" required 
                value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>{category === "Lainnya" ? "Nama Barang & Tipe" : "Tipe / Seri / Model"}</Label>
            <Input 
              placeholder={category === "Lainnya" ? "Contoh: PS5, Drone DJI" : "Contoh: A50, Reno 8, Rog Strix"} 
              required 
              value={modelSeries} onChange={(e) => setModelSeries(e.target.value)} 
            />
          </div>

          {/* BAGIAN 3: KELUHAN */}
          <div className="space-y-2">
            <Label>Keluhan / Kerusakan</Label>
            <Textarea placeholder="Mati total, layar pecah, dll..." required 
               value={complaint} onChange={(e) => setComplaint(e.target.value)} />
          </div>

          {/* BAGIAN 4: OPSI KHUSUS ADMIN (MINIMALIS & COMPACT) */}
          {userRole === 'ADMIN' && (
              <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 mt-1 animate-in fade-in">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
                    <ShieldCheck className="w-3 h-3" /> Mode Admin (Backdate)
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {/* 4a. STATUS AWAL */}
                    <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase">Status Awal</Label>
                        <Select value={initialStatus} onValueChange={setInitialStatus}>
                            <SelectTrigger className="bg-white border-blue-200 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">
                                    <div className="flex items-center gap-2 text-yellow-600"><Clock className="w-3 h-3"/> Pending</div>
                                </SelectItem>
                                <SelectItem value="WORKING">
                                    <div className="flex items-center gap-2 text-blue-600"><Wrench className="w-3 h-3"/> Proses</div>
                                </SelectItem>
                                <SelectItem value="DONE">
                                    <div className="flex items-center gap-2 text-green-600"><CheckCircle className="w-3 h-3"/> Selesai</div>
                                </SelectItem>
                                <SelectItem value="CANCELLED">
                                    <div className="flex items-center gap-2 text-gray-500"><XCircle className="w-3 h-3"/> Batal</div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4b. TANGGAL MASUK */}
                    <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500 uppercase">Waktu Masuk</Label>
                        <div className="relative">
                            <Input 
                                type="datetime-local" 
                                value={entryDate}
                                onChange={(e) => setEntryDate(e.target.value)}
                                className="bg-white border-blue-200 h-8 text-xs pr-2"
                            />
                            {!entryDate && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
          )}

          <DialogFooter className="mt-2">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Menyimpan..." : "Simpan Tiket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}