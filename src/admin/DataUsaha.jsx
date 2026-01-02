import React,  { useState, useRef } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import { FaBriefcase, FaMapMarkerAlt, FaFileAlt, FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

/* =======================
   REUSABLE COMPONENTS
======================= */

const Card = ({ title, icon, children }) => (
  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
    <div className="flex items-center gap-3 pb-2 border-b">
      <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">
        {title}
      </h3>
    </div>
    {children}
  </section>
);



const Input = ({ label, type = "text", placeholder }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
    />
  </div>
);

const Select = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">
      {label}
    </label>
    <select
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
      bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
    >
      {children}
    </select>
  </div>
);

/* =======================
   UPLOAD CAMERA (FIXED)
======================= */

const UploadButton = ({ label, file, onChange }) => {
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
        border border-gray-300 rounded-lg px-3 py-2 text-sm
        hover:bg-gray-50 transition"
      >
        <FaCamera className="text-gray-600" />
        Open Camera
      </button>

      <div className="text-[11px] text-gray-500">
        {file ? file.name : "Belum ada foto"}
      </div>
    </div>
  );
};



/* =======================
   PAGE
======================= */

export default function DataUsaha() {

const navigate = useNavigate();
const [jenisAlamat, setJenisAlamat] = useState("");
const [openAlamat, setOpenAlamat] = useState(false);


const [formData, setFormData] = useState({
  lokasi_usaha: "",
  foto_ktp: null,
  selfie_ktp: null,
  nib: null,
  npwp: null,
  siup: null,
  bagian_depan: null,
  bagian_belakang: null,
  bagian_kanan: null,
  bagian_kiri: null,
  bagian_dalam: null,
});

  const openMaps = () => {
  if (!navigator.geolocation) {
    alert("Browser tidak mendukung GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      const lokasiString = `${latitude}, ${longitude}`;

      // simpan ke formData
      setFormData((prev) => ({
        ...prev,
        lokasi_usaha: lokasiString,
      }));

      // buka Google Maps (opsional)
      window.open(
        `https://www.google.com/maps?q=${latitude},${longitude}`,
        "_blank"
      );
    },
    () => alert("Izin lokasi ditolak")
  );
};

const handleFileChange = (field) => (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setFormData((prev) => ({
    ...prev,
    [field]: file,
  }));
};

const handleSave = () => {
    Swal.fire({
      title: "Simpan Data Usaha Nasabah?",
      text: "Pastikan data yang dimasukkan sudah benar.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#1f2937", // gray-800
      cancelButtonColor: "#9ca3af",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // 🔥 simulasi simpan (nanti bisa API)
        Swal.fire({
          title: "Berhasil!",
          text: "Data Usaha Nasabah berhasil disimpan.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
  
        // ⏩ lanjut ke halaman berikutnya
        setTimeout(() => {
          navigate("/master-data/data-jaminan");
        }, 1500);
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-6 pb-16 max-w-7xl mx-auto">

          {/* TITLE */}
          <div className="flex items-center gap-3 mb-8">
            <FaBriefcase className="text-xl text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-800">
              Data Usaha <span className="text-gray-400 font-normal">Nasabah</span>
            </h1>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* DATA USAHA */}
            <Card title="Data Usaha" icon={<FaBriefcase />}>
              <Input label="Nama Usaha" />
              <Select label="Jenis Usaha">
                <option>Pilih Jenis Usaha</option>
              </Select>
              <Input label="Bidang Usaha" />
              <Select label="Bentuk Usaha">
                <option>Perseorangan</option>
                <option>CV</option>
                <option>PT</option>
              </Select>
              <Input label="Tahun Berdiri" />
              <Select label="Status Kepemilikan">
                <option>Milik Sendiri</option>
                <option>Kerjasama</option>
              </Select>
            </Card>

            {/* LOKASI & ALAMAT */}
            <Card title="Lokasi dan Alamat Usaha" icon={<FaMapMarkerAlt />}>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Alamat Lengkap
                </label>
                <textarea
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="RT" />
                <Input label="RW" />
              </div>

              <Input label="Desa / Kelurahan" />
              <Input label="Kecamatan" />
              <Input label="Kabupaten / Kota" />
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Provinsi
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200
                  bg-white/80 px-4 py-3 text-sm shadow-sm
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                  outline-none transition"
                >
                  <option value="">Pilih Provinsi</option>
                  <option>Aceh</option>
                  <option>Sumatera Utara</option>
                  <option>Sumatera Barat</option>
                  <option>Riau</option>
                  <option>Kepulauan Riau</option>
                  <option>Jambi</option>
                  <option>Sumatera Selatan</option>
                  <option>Kepulauan Bangka Belitung</option>
                  <option>Bengkulu</option>
                  <option>Lampung</option>
                  <option>DKI Jakarta</option>
                  <option>Jawa Barat</option>
                  <option>Jawa Tengah</option>
                  <option>DI Yogyakarta</option>
                  <option>Jawa Timur</option>
                  <option>Banten</option>
                  <option>Bali</option>
                  <option>Nusa Tenggara Barat</option>
                  <option>Nusa Tenggara Timur</option>
                  <option>Kalimantan Barat</option>
                  <option>Kalimantan Tengah</option>
                  <option>Kalimantan Selatan</option>
                  <option>Kalimantan Timur</option>
                  <option>Kalimantan Utara</option>
                  <option>Sulawesi Utara</option>
                  <option>Sulawesi Tengah</option>
                  <option>Sulawesi Selatan</option>
                  <option>Sulawesi Tenggara</option>
                  <option>Gorontalo</option>
                  <option>Sulawesi Barat</option>
                  <option>Maluku</option>
                  <option>Maluku Utara</option>
                  <option>Papua</option>
                  <option>Papua Barat</option>
                  <option>Papua Barat Daya</option>
                  <option>Papua Pegunungan</option>
                  <option>Papua Tengah</option>
                  <option>Papua Selatan</option>
                </select>
              </div>

              {/* 🔥 INPUT TITIK LOKASI USAHA */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  Titik Lokasi Usaha (Google Maps)
                </label>
                <input
                  type="text"
                  value={formData.lokasi_usaha}
                  readOnly
                  placeholder="Klik tombol Open Google Maps"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* 🔥 TOMBOL MAPS */}
              <button
                type="button"
                onClick={openMaps}
                className="w-full mt-2 border rounded-lg px-3 py-2 text-sm
                hover:bg-gray-50 transition"
              >
                Open Google Maps
              </button>

              {/* 🔥 JENIS ALAMAT USAHA (DROPDOWN CUSTOM) */}
              <div className="space-y-1 relative">
                <label className="text-xs font-medium text-gray-600">
                  Jenis Alamat Usaha
                </label>

                <button
                  type="button"
                  onClick={() => setOpenAlamat(!openAlamat)}
                  className="w-full flex justify-between items-center
                  rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                  hover:bg-gray-50 focus:outline-none"
                >
                  <span className={jenisAlamat ? "text-gray-800" : "text-gray-400"}>
                    {jenisAlamat || "Pilih Jenis Alamat"}
                  </span>
                  <span className="text-xs">▼</span>
                </button>

                {openAlamat && (
                  <div className="absolute z-10 w-full bg-white border rounded-lg shadow-md mt-1 overflow-hidden">
                    {["Milik Sendiri", "Kontrak / Sewa", "Keluarga"].map((item) => (
                      <div
                        key={item}
                        onClick={() => {
                          setJenisAlamat(item);
                          setOpenAlamat(false);
                        }}
                        className="px-3 py-2 text-sm cursor-pointer
                        hover:bg-gray-100"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            


            {/* LEGALITAS */}
            <Card title="Legalitas & Perizinan Usaha" icon={<FaFileAlt />}>
              <Input label="NIB" />
              <Input label="NPWP Usaha" />
              <Input label="SIUP" />
              <Input label="Izin Khusus" />
            </Card>

            {/* UPLOAD LEGALITAS */}
             <Card title="Upload Dokumen Legalitas" icon={<FaFileAlt />}>
              <UploadButton
                label="Foto KTP"
                file={formData.foto_ktp}
                onChange={handleFileChange("foto_ktp")}
              />
              <UploadButton
                label="Selfie + KTP"
                file={formData.selfie_ktp}
                onChange={handleFileChange("selfie_ktp")}
              />
              <UploadButton
                label="NIB"
                file={formData.nib}
                onChange={handleFileChange("nib")}
              />
              <UploadButton
                label="NPWP"
                file={formData.npwp}
                onChange={handleFileChange("npwp")}
              />
              <UploadButton
                label="SIUP"
                file={formData.siup}
                onChange={handleFileChange("siup")}
              />
            </Card>


            {/* DOKUMENTASI */}
            <Card title="Dokumentasi Usaha" icon={<FaCamera />}>
              <UploadButton
                label="Bagian Depan"
                file={formData.bagian_depan}
                onChange={handleFileChange("bagian_depan")}
              />
              <UploadButton
                label="Bagian Belakang"
                file={formData.bagian_belakang}
                onChange={handleFileChange("bagian_belakang")}
              />
              <UploadButton
                label="Bagian Kanan"
                file={formData.bagian_kanan}
                onChange={handleFileChange("bagian_kanan")}
              />
              <UploadButton
                label="Bagian Kiri"
                file={formData.bagian_kiri}
                onChange={handleFileChange("bagian_kiri")}
              />
              <UploadButton
                label="Bagian Dalam"
                file={formData.bagian_dalam}
                onChange={handleFileChange("bagian_dalam")}
              />
            </Card>

          </div>

          {/* ACTION */}
          <div 
          className="flex justify-end gap-4 mt-10">
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
              Simpan & Lanjut
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}
