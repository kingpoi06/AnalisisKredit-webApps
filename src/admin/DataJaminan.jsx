import React, { useState, useRef } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import { FaBriefcase, FaFileAlt, FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

/* =======================
   REUSABLE COMPONENTS
======================= */

const Card = ({ title, icon, children }) => (
  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
    <div className="flex items-center gap-3 pb-2 border-b">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-700">{icon}</div>
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    </div>
    {children}
  </section>
);

const Input = ({ label, type = "text", placeholder }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-200"
    />
  </div>
);

const Select = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <select
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
      bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
    >
      {children}
    </select>
  </div>
);

/* =======================
   CAMERA UPLOAD COMPONENT
======================= */

const CameraUpload = ({ label, file, onChange }) => {
  const inputRef = useRef(null);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="w-full flex items-center justify-center gap-2
        rounded-lg border border-gray-300 px-3 py-2 text-sm
        hover:bg-gray-50 transition"
      >
        <FaCamera className="text-gray-600" />
        Ambil Foto Dokumen
      </button>

      <div className="text-[11px] text-gray-500">
        {file ? file.name : "Belum ada dokumen"}
      </div>
    </div>
  );
};

/* =======================
   PAGE
======================= */

export default function DataJaminan() {
  const navigate = useNavigate();
  const [dokumenAgunan, setDokumenAgunan] = useState(null);

  const handleDokumenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDokumenAgunan(file);
  };

  const handleSave = () => {
    Swal.fire({
      title: "Simpan Data Jaminan?",
      text: "Pastikan data jaminan sudah benar.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#1f2937",
      cancelButtonColor: "#9ca3af",
      reverseButtons: true,
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Data Jaminan berhasil disimpan, Data Nasabah Berhasil Di Ajukan!",
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-6 pb-16 max-w-6xl mx-auto">
          {/* TITLE */}
          <div className="flex items-center gap-3 mb-8">
            <FaBriefcase className="text-xl text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-800">
              Data Jaminan{" "}
              <span className="text-gray-400 font-normal">Nasabah</span>
            </h1>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DATA UMUM JAMINAN */}
            <Card title="Data Umum Jaminan" icon={<FaBriefcase />}>
              <Select label="Jenis Jaminan">
                <option>Pilih Jenis Jaminan</option>
                <option>Sertifikat Rumah</option>
                <option>BPKB Kendaraan</option>
                <option>Emas</option>
              </Select>

              <Input label="Nama Pemilik" placeholder="Nama pemilik jaminan" />

              <Select label="Hubungan dengan Nasabah">
                <option>Pilih Hubungan</option>
                <option>Pemilik Langsung</option>
                <option>Suami / Istri</option>
                <option>Keluarga</option>
              </Select>
            </Card>

            {/* DETAIL JAMINAN */}
            <Card title="Detail Jaminan" icon={<FaFileAlt />}>
              <Input
                label="Nomor ID Agunan"
                placeholder="Nomor dokumen / agunan"
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Deskripsi Agunan
                </label>
                <textarea
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <Input
                label="Nilai Agunan (Rp)"
                type="number"
                placeholder="Contoh: 150000000"
              />

              {/* 🔥 CAMERA UPLOAD */}
              <CameraUpload
                label="Dokumen Agunan"
                file={dokumenAgunan}
                onChange={handleDokumenChange}
              />

              <Select label="Status Agunan">
                <option>Pilih Status</option>
                <option>Aktif</option>
                <option>Tidak Aktif</option>
              </Select>
            </Card>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50"
            >
              Kembali
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900"
            >
              Simpan & Ajukan !
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
