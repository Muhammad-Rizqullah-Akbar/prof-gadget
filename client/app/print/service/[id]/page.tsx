// src/app/print/service/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button"; // Import Button

export default function PrintInvoicePage() {
  const { id } = useParams();
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/services/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setService(res.data.data);
        
        // Popup otomatis tetap ada (opsional)
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (error) {
        alert("Gagal memuat data nota");
      }
    };
    fetchDetail();
  }, [id]);

  if (!service) return <div className="p-10 text-center">Memuat Nota...</div>;

  const billableItems = service.items.filter((item: any) => Number(item.sellPrice) > 0);
  const totalTagihan = billableItems.reduce((sum: number, item: any) => sum + Number(item.sellPrice), 0);

  return (
    <div className="max-w-[800px] mx-auto p-8 bg-white text-black font-sans relative min-h-screen">
      
      {/* --- TOMBOL AKSI (HANYA TAMPIL DI LAYAR, HILANG DI PDF) --- */}
      <div className="fixed bottom-6 right-6 flex gap-4 print:hidden">
        <Button 
            className="bg-blue-600 text-white shadow-lg hover:bg-blue-700"
            onClick={() => window.print()}
        >
            📥 Download PDF / Cetak
        </Button>
      </div>

      {/* HEADER NOTA */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider">Professor Gadget</h1>
          <p className="text-sm mt-1">Solusi Servis Laptop & HP Terpercaya</p>
          <p className="text-sm">Makassar, Sulawesi Selatan</p>
          <p className="text-sm">WA: 0812-3456-7890</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-600">INVOICE</h2>
          <p className="text-lg font-mono font-bold mt-2">#{service.ticketNumber}</p>
          <p className="text-sm text-gray-500">{new Date(service.createdAt).toLocaleDateString("id-ID", { 
            day: 'numeric', month: 'long', year: 'numeric' 
          })}</p>
        </div>
      </div>

      {/* INFO PELANGGAN */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold border-b border-gray-300 mb-2 uppercase text-xs text-gray-500">Pelanggan</h3>
          <p className="font-bold text-lg">{service.customer.name}</p>
          <p>{service.customer.phone}</p>
          <p className="text-sm text-gray-600">{service.customer.address || "-"}</p>
        </div>
        <div>
          <h3 className="font-bold border-b border-gray-300 mb-2 uppercase text-xs text-gray-500">Unit Servis</h3>
          <p className="font-bold">{service.deviceModel}</p>
          <p className="text-sm">{service.deviceType}</p>
          <p className="text-sm italic mt-1 text-gray-500">"Keluhan: {service.complaint}"</p>
        </div>
      </div>

      {/* TABEL BIAYA */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100 border-y border-black">
            <th className="py-2 px-4 text-left font-bold text-sm uppercase">Deskripsi</th>
            <th className="py-2 px-4 text-right font-bold text-sm uppercase">Harga</th>
          </tr>
        </thead>
        <tbody>
          {billableItems.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-4 text-center text-gray-500 italic">Tidak ada biaya tagihan.</td>
            </tr>
          ) : (
            billableItems.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-3 px-4">{item.itemName}</td>
                <td className="py-3 px-4 text-right font-mono">
                  Rp {Number(item.sellPrice).toLocaleString("id-ID")}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="text-lg">
            <td className="py-4 px-4 text-right font-bold">TOTAL</td>
            <td className="py-4 px-4 text-right font-bold bg-gray-100 border-t border-black">
              Rp {totalTagihan.toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* FOOTER */}
      <div className="grid grid-cols-2 gap-10 mt-12 text-center text-sm">
        <div>
          <p className="mb-16">Hormat Kami,</p>
          <p className="font-bold">( Professor Gadget )</p>
        </div>
        <div>
          <p className="mb-16">Penerima,</p>
          <p className="font-bold">( {service.customer.name} )</p>
        </div>
      </div>

      <div className="mt-12 text-[10px] text-gray-400 text-center border-t pt-4">
        <p>Garansi berlaku 7 hari. Barang tidak diambil 30 hari di luar tanggung jawab kami.</p>
      </div>

      {/* CSS KHUSUS AGAR TOMBOL HILANG SAAT DI-PRINT/SAVE PDF */}
      <style jsx global>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 1.5cm; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; } 
        }
      `}</style>
    </div>
  );
}