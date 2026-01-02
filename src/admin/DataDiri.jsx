import React, {useRef, useState} from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import {
  FaBriefcase,
  FaUser,
  FaMapMarkedAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";


const Input = ({ label, type = "text", options = [], ...props }) => (
  <div className="relative space-y-1">
    <label className="text-xs font-semibold text-gray-500">
      {label}
    </label>

    {type === "select" ? (
      <select
        {...props}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80
        px-4 py-3 text-sm shadow-sm
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100
        outline-none transition"
      >
        <option value="">Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        {...props}
        className="mt-1 w-full rounded-xl border border-gray-200 bg-white/80
        px-4 py-3 text-sm shadow-sm
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100
        outline-none transition"
      />
    )}
  </div>
);


const Card = ({ title, icon, children }) => (
  <section
    className="bg-white/80 backdrop-blur rounded-2xl p-6
    ring-1 ring-gray-100 shadow-sm space-y-5"
  >
    <div className="flex items-center gap-3 pb-3 border-b">
      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </section>
);

export default function DataDiriNasabah() {
  const navigate = useNavigate();
  const ktpRef = useRef(null);
  const selfieRef = useRef(null);
  const [jenisAlamat, setJenisAlamat] = useState("");
  const [openAlamat, setOpenAlamat] = useState(false);

  const [fotoKtp, setFotoKtp] = useState(null);
  const [selfieKtp, setSelfieKtp] = useState(null);

  const handleCamera = (ref) => {
    ref.current.click();
  };

  const handleSave = () => {
  Swal.fire({
    title: "Simpan Data Diri Nasabah?",
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
        text: "Data Diri Nasabah berhasil disimpan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // ⏩ lanjut ke halaman berikutnya
      setTimeout(() => {
        navigate("/master-data/data-usaha");
      }, 1500);
    }
  });
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-slate-100 to-blue-100">

      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-16 md:pt-20 px-4 md:px-8 pb-14 max-w-7xl mx-auto">

          {/* PAGE TITLE */}
          <div className="mb-10 flex items-center gap-4">
            <div
              className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700
              text-white shadow-lg flex items-center justify-center"
            >
              <FaBriefcase size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Data Diri Nasabah
              </h1>
              <p className="text-sm text-gray-500">
                Lengkapi data calon nasabah dengan benar
              </p>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* DATA PRIBADI */}
            <Card title="Data Pribadi" icon={<FaUser />}>
            <Input label="Nama Lengkap" />
            <Input label="Tempat Lahir" />

            {/* DATE PICKER */}
            <Input
              label="Tanggal Lahir"
              type="date"
              name="tanggal_lahir"
            />

            {/* SELECT JENIS KELAMIN */}
            <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">
              Jenis Kelamin
            </label>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="jenis_kelamin"
                  value="Laki-laki"
                  className="accent-blue-600"
                />
                Laki-laki
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="jenis_kelamin"
                  value="Perempuan"
                  className="accent-blue-600"
                />
                Perempuan
              </label>
            </div>
          </div>

            <Input label="NIK" />
            <Input
              label="Status Perkawinan"
              type="select"
              options={[
                "Belum Kawin",
                "Kawin",
                "Cerai Hidup",
                "Cerai Mati",
              ]}
            />
            <Input
              label="Agama"
              type="select"
              name="agama"
              options={[
                "Islam",
                "Kristen",
                "Katolik",
                "Hindu",
                "Buddha",
                "Konghucu",
              ]}
            />
            <Input label="Kewarganegaraan" />
            <Input label="No HP" />
            <Input label="Email" type="email" />

            {/* UPLOAD DOKUMEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">

              {/* FOTO KTP */}
              <div
                onClick={() => handleCamera(ktpRef)}
                className="flex flex-col items-center justify-center
                h-40 rounded-2xl border-2 border-dashed border-gray-300
                bg-white/70 cursor-pointer
                hover:border-blue-400 hover:bg-blue-50
                transition text-center"
              >
                <input
                  ref={ktpRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFotoKtp(e.target.files[0])}
                />

                <div className="text-blue-600 text-3xl mb-2">📄</div>

                <span className="text-sm font-semibold text-gray-700">
                  Foto KTP
                </span>

                <span className="text-xs text-gray-500 mt-1">
                  {fotoKtp ? fotoKtp.name : "Buka Kamera"}
                </span>
              </div>

              {/* FOTO SELFIE + KTP */}
              <div
                onClick={() => handleCamera(selfieRef)}
                className="flex flex-col items-center justify-center
                h-40 rounded-2xl border-2 border-dashed border-gray-300
                bg-white/70 cursor-pointer
                hover:border-blue-400 hover:bg-blue-50
                transition text-center"
              >
                <input
                  ref={selfieRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => setSelfieKtp(e.target.files[0])}
                />

                <div className="text-blue-600 text-3xl mb-2">🤳</div>

                <span className="text-sm font-semibold text-gray-700">
                  Selfie + KTP
                </span>

                <span className="text-xs text-gray-500 mt-1">
                  {selfieKtp ? selfieKtp.name : "Buka Kamera"}
                </span>
              </div>

            </div>

          </Card>

            {/* ALAMAT */}
            <Card title="Alamat Domisili" icon={<FaMapMarkedAlt />}>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Alamat Lengkap
                </label>
                <textarea
                  rows="3"
                  className="mt-1 w-full rounded-xl border border-gray-200
                  px-4 py-3 text-sm shadow-sm
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="RT" />
                <Input label="RW" />
              </div>

              {["Desa / Kelurahan", "Kecamatan", "Kabupaten / Kota"].map((v) => (
                <Input key={v} label={v} />
              ))}

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

              <div className="space-y-1 relative">
                <label className="text-xs font-medium text-gray-600">
                  Jenis Alamat Domisili
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

            {/* PEKERJAAN & PENGHASILAN */}
            <div className="space-y-6">
              <Card title="Data Pekerjaan" icon={<FaBriefcase />}>
                {[
                  "Jenis Pekerjaan",
                  "Nama Usaha",
                  "Lama Bekerja",
                  "Penghasilan Perbulan",
                  "Alamat Pekerjaan",
                  "Penghasilan Tambahan",
                ].map((v) => (
                  <Input key={v} label={v} />
                ))}
              </Card>

              <Card title="Data Penghasilan" icon={<FaMoneyBillWave />}>
                {[
                  "Total Penghasilan",
                  "Pengeluaran Bulanan",
                  "Cicilan",
                  "Sumber Utama Penghasilan",
                ].map((v) => (
                  <Input key={v} label={v} />
                ))}
              </Card>
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-12">
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
