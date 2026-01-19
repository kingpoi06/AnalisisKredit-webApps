import React, {useRef, useState, useEffect} from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import {
  FaBriefcase,
  FaUser,
  FaMapMarkedAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";


const Input = ({ label, type = "text", options = [], readOnly = false, ...props }) => (
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
        readOnly={readOnly}
        {...props}
        className={`mt-1 w-full rounded-xl border border-slate-200
        px-4 py-3 text-sm shadow-sm outline-none transition
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
          readOnly
            ? "bg-slate-50 text-slate-600 cursor-not-allowed"
            : "bg-white/90 text-slate-800"
        }`}
      />
    )}
  </div>
);


const Card = ({ title, icon, children }) => (
  <section
    className="bg-white/90 backdrop-blur rounded-3xl p-6
    ring-1 ring-slate-200 shadow-sm space-y-5"
  >
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
    {children}
  </section>
);

const Select = ({
  label,
  value,
  onChange,
  children,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-gray-600">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
      bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
    >
      {children}
    </select>
  </div>
);

export default function UpdateDataDiriNasabah() {
  const navigate = useNavigate();
  const ktpRef = useRef(null);
  const ktpRefPasangan = useRef(null);
  const selfieRef = useRef(null);
  const { no_permohonan } = useParams();

  const [fotoKtp, setFotoKtp] = useState(null);
  const [fotoKtpPasangan, setFotoKtpPasangan] = useState(null);
  const [selfieKtp, setSelfieKtp] = useState(null);
  const [existingFiles, setExistingFiles] = useState({
    fotoKTP: "",
    selfieKTP: "",
    fotoKTPPenanggungJawab: "",
  });

const [formData, setFormData] = useState({
  nik: "",
  namaLengkap: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  statusPerkawinan: "",
  agama: "",
  kewarganegaraan: "",
  kontakPribadi: "",
  anakTanggungan: "",
  alamatLengkap: "",
  rt: "",
  rw: "",
  desaKelurahan: "",
  kecamatan: "",
  kabupaten: "",
  provinsi: "",
  titikmaps: "",
  jenispekerjaan: "",
  nikPenanggungJawab: "",
  namaPenanggungJawab: "",
  pekerjaanPenanggungJawab: "",
  tempatLahirPenanggungJawab: "",
  tanggalLahirPenanggungJawab: "",
  noHPPenanggungJawab: "",
  hubunganDenganPemohon: "",
  namaIbuKandung: "",
});

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatIdInteger = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const formatDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeList = (data) => {
  if (!Array.isArray(data)) return data ? [data] : [];
  return Array.isArray(data[0]) ? data.flat() : data;
};

const getFieldValue = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return fallback;
};

const normalizeDataDiri = (data) => ({
  nik: getFieldValue(data, ["nik", "NIK"]),
  namaLengkap: getFieldValue(data, ["namaLengkap", "namalengkap", "nama_lengkap"]),
  tempatLahir: getFieldValue(data, ["tempatLahir", "tempatlahir", "tempat_lahir"]),
  tanggalLahir: formatDateInput(
    getFieldValue(data, ["tanggalLahir", "tanggallahir", "tanggal_lahir"])
  ),
  jenisKelamin: getFieldValue(data, ["jenisKelamin", "jeniskelamin", "jenis_kelamin"]),
  statusPerkawinan: getFieldValue(data, ["statusPerkawinan", "statusperkawinan", "status_perkawinan"]),
  agama: getFieldValue(data, ["agama"]),
  kewarganegaraan: getFieldValue(data, ["kewarganegaraan"]),
  kontakPribadi: getFieldValue(data, ["kontakPribadi", "noHP", "nohp", "kontak_pribadi"]),
  anakTanggungan: getFieldValue(data, ["anakTanggungan", "anaktanggungan", "anak_tanggungan"]),
  alamatLengkap: getFieldValue(data, ["alamatLengkap", "alamatlengkap", "alamat_lengkap"]),
  rt: getFieldValue(data, ["rt"]),
  rw: getFieldValue(data, ["rw"]),
  desaKelurahan: getFieldValue(data, ["desaKelurahan", "desakelurahan", "desa_kelurahan"]),
  kecamatan: getFieldValue(data, ["kecamatan"]),
  kabupaten: getFieldValue(data, ["kabupaten", "kabupatenKota", "kabupaten_kota"]),
  provinsi: getFieldValue(data, ["provinsi"]),
  titikmaps: getFieldValue(data, ["titikmaps", "titikMaps"]),
  jenispekerjaan: getFieldValue(data, ["jenispekerjaan", "jenisPekerjaan", "jenis_pekerjaan", "pekerjaan"]),
  nikPenanggungJawab: getFieldValue(data, ["nikPenanggungJawab", "nikpenanggungjawab", "nik_penanggung_jawab"]),
  namaPenanggungJawab: getFieldValue(data, ["namaPenanggungJawab", "namapenanggungjawab", "nama_penanggung_jawab"]),
  pekerjaanPenanggungJawab: getFieldValue(data, ["pekerjaanPenanggungJawab", "pekerjaanpenanggungjawab", "pekerjaan_penanggung_jawab"]),
  tempatLahirPenanggungJawab: getFieldValue(
    data,
    ["tempatLahirPenanggungJawab", "tempatlahirpenanggungjawab", "tempat_lahir_penanggung_jawab"]
  ),
  tanggalLahirPenanggungJawab: formatDateInput(
    getFieldValue(
      data,
      ["tanggalLahirPenanggungJawab", "tanggallahirpenanggungjawab", "tanggal_lahir_penanggung_jawab"]
    )
  ),
  noHPPenanggungJawab: getFieldValue(
    data,
    ["noHPPenanggungJawab", "nohpPenanggungJawab", "nohp_penanggung_jawab"]
  ),
  hubunganDenganPemohon: getFieldValue(
    data,
    ["hubunganDenganPemohon", "hubungandenganpemohon", "hubungan_dengan_pemohon"]
  ),
  namaIbuKandung: getFieldValue(data, ["namaIbuKandung", "namaibukandung", "nama_ibu_kandung"]),
});


    const updateForm = (key, value) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

    const handleNumberFieldChange = (key) => (event) => {
      const rawValue = event.target.value;
      const cleanedValue = rawValue.replace(/\D/g, "");
      updateForm(key, cleanedValue);
    };



  const fetchDataDiri = async (requestNo) => {
    if (!requestNo) return;

    try {
      const response = await axios.get(API_ENDPOINTS.datanasabah.dataDiri.list());
      const list = normalizeList(response.data?.Data ?? response.data?.data ?? response.data);
      const match = list.find(
        (item) =>
          String(item?.no_permohonan ?? item?.noPermohonan) === String(requestNo)
      );

      if (!match) {
        Swal.fire("Data tidak ditemukan", "Data diri untuk no permohonan ini tidak ada", "warning");
        return;
      }

      setExistingFiles({
        fotoKTP: getFieldValue(match, ["fotoKTP", "fotoKtp", "foto_ktp"]),
        selfieKTP: getFieldValue(match, ["selfieKTP", "selfieKtp", "selfie_ktp"]),
        fotoKTPPenanggungJawab: getFieldValue(
          match,
          ["fotoKTPPenanggungJawab", "fotoKtpPenanggungJawab", "foto_ktp_penanggung_jawab"]
        ),
      });

      setFormData((prev) => ({
        ...prev,
        ...normalizeDataDiri(match),
      }));
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Gagal mengambil data diri",
        "error"
      );
    }
  };

  /* ===============================
     🔐 AUTH
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return navigate("/");

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchDataDiri(no_permohonan);
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate, no_permohonan]);
  

  const handleCamera = (ref) => {
    ref.current.click();
  };

const openMaps = () => {
  if (!navigator.geolocation) {
    Swal.fire("Error", "Browser tidak mendukung GPS", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const lokasiString = `${latitude}, ${longitude}`;

      setFormData((prev) => ({
        ...prev,
        titikmaps: lokasiString,
      }));

      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(mapsUrl, "_blank", "noopener,noreferrer");
    },
    () => Swal.fire("Error", "Izin lokasi ditolak", "error")
  );
};

const handleValidasiKtp = async () => {
  if (!fotoKtp) {
    Swal.fire("Oops", "Foto KTP belum diupload", "warning");
    return;
  }

  try {
    const formDataUpload = new FormData();
    formDataUpload.append("fotoKTP", fotoKtp);

    Swal.fire({
      title: "Validasi KTP",
      text: "Sedang memproses data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await axios.post(
      API_ENDPOINTS.datanasabah.ocrKtp(),
      formDataUpload
    );

    const ocr = res.data.Data;

    setFormData((prev) => ({
      ...prev,
      nik: ocr.nikKTP || "",
      namaLengkap: ocr.namaLengkap || "",
      tempatLahir: ocr.tempatLahir || "",
      tanggalLahir: ocr.tanggalLahir || "",
      jenisKelamin: ocr.jenisKelamin || "",
      agama: ocr.agama || "",
      kewarganegaraan: ocr.kewarganegaraan || "",
      alamatLengkap: ocr.alamatLengkap || "",
      rt: ocr.rt || "",
      rw: ocr.rw || "",
      desaKelurahan: ocr.desaKelurahan || "",
      kecamatan: ocr.kecamatan || "",
      kabupaten: ocr.kabupaten || "",
      provinsi: ocr.provinsi || "",
      jenispekerjaan: ocr.jenispekerjaan || "",
      statusPerkawinan: ocr.statusPerkawinan || "",
    }));

    Swal.fire("Berhasil", "Data KTP berhasil divalidasi", "success");
  } catch (error) {
    Swal.fire(
      "Gagal",
      error.response?.data?.msg || "Validasi KTP gagal",
      "error"
    );
  }
};

const handleValidasiKtpPasangan = async () => {
  if (!fotoKtpPasangan) {
    Swal.fire("Oops", "Foto KTP belum diupload", "warning");
    return;
  }

  try {
    const formDataUpload = new FormData();
    formDataUpload.append("fotoKTP", fotoKtpPasangan);

    Swal.fire({
      title: "Validasi KTP",
      text: "Sedang memproses data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await axios.post(
      API_ENDPOINTS.datanasabah.ocrKtp(),
      formDataUpload
    );

    const ocr = res.data.Data;

    setFormData((prev) => ({
      ...prev,
      nikPenanggungJawab: ocr.nikKTP || "",
      namaPenanggungJawab: ocr.namaLengkap || "",
      pekerjaanPenanggungJawab: ocr.jenispekerjaan || "",
      tempatLahirPenanggungJawab: ocr.tempatLahir || "",
      tanggalLahirPenanggungJawab: ocr.tanggalLahir || "",
    }));

    Swal.fire("Berhasil", "Data KTP berhasil divalidasi", "success");
  } catch (error) {
    Swal.fire(
      "Gagal",
      error.response?.data?.msg || "Validasi KTP gagal",
      "error"
    );
  }
};

const handleSave = async () => {
    const required = [
      "nik",
      "namaLengkap",
      "tempatLahir",
      "tanggalLahir",
      "jenisKelamin",
      "agama",
      "jenispekerjaan",
      "kewarganegaraan",
      "alamatLengkap",
      "rt",
      "rt",
      "desaKelurahan",
      "kecamatan",
      "kabupaten",
      "provinsi",
      "statusPerkawinan",
      "kontakPribadi",
      "nikPenanggungJawab",
      "namaPenanggungJawab",
      "noHPPenanggungJawab",
      "pekerjaanPenanggungJawab",
      
    ];

    const empty = required.filter(
      (k) => !formData[k] || formData[k].toString().trim() === ""
    );

    if (empty.length > 0) {
      Swal.fire(
        "Data belum lengkap",
        `Field wajib belum diisi: ${empty.join(", ")}`,
        "warning"
      );
      return;
    }

    const missingFotoKtp = !fotoKtp && !existingFiles.fotoKTP;
    const missingSelfie = !selfieKtp && !existingFiles.selfieKTP;
    const missingFotoKtpPasangan = !fotoKtpPasangan && !existingFiles.fotoKTPPenanggungJawab;

    if (missingFotoKtp || missingSelfie || missingFotoKtpPasangan) {
      Swal.fire("Error", "Foto KTP & Selfie wajib diupload", "error");
      return;
    }

    const payload = new FormData();
    if (no_permohonan) {
      payload.append("no_permohonan", no_permohonan);
    }
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    if (fotoKtp) {
      payload.append("fotoKTP", fotoKtp);
    }
    if (selfieKtp) {
      payload.append("selfieKTP", selfieKtp);
    }
    if (fotoKtpPasangan) {
      payload.append("fotoKTPPenanggungJawab", fotoKtpPasangan);
    }

    const requestNo = String(no_permohonan || "").trim();
    if (!requestNo) {
      Swal.fire("Error", "No permohonan tidak ditemukan untuk update data.", "error");
      return;
    }

    try {
      Swal.showLoading();
      const response = await axios.patch(
        API_ENDPOINTS.datanasabah.dataDiri.detail(requestNo),
        payload
      );
      Swal.fire("Berhasil", "Data Diri berhasil diperbaharui", "success");
      navigate(`/dashboard`);
    } catch (err) {
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal menyimpan",
        "error"
      );
    }
  };


  return (
    <PageBackground>

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

            {/* UPLOAD DOKUMEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">

              {/* FOTO KTP */}
              <div className="flex flex-col gap-2">

                {/* CARD UPLOAD KTP */}
                <div
                  onClick={() => handleCamera(ktpRef)}
                  className="flex flex-col items-center justify-center
                  h-40 rounded-2xl border-2 border-dashed border-slate-200
                  bg-white/80 cursor-pointer shadow-sm
                  hover:border-blue-400 hover:bg-blue-50/60
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

                {/* BUTTON VALIDASI KTP */}
                <button
                  type="button"
                  disabled={!fotoKtp}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleValidasiKtp();
                  }}
                 className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
                  ${
                    fotoKtp
                      ? "bg-emerald-600 text-black border border-emerald-700 shadow-md hover:bg-emerald-700 active:scale-95"
                      : "bg-emerald-400 text-black/50 border border-emerald-500 opacity-60 cursor-not-allowed"
                  }
                `}>Validasi Data KTP
                </button>
              </div>

              {/* FOTO SELFIE + KTP */}
              <div
                onClick={() => handleCamera(selfieRef)}
                className="flex flex-col items-center justify-center
                h-40 rounded-2xl border-2 border-dashed border-slate-200
                bg-white/80 cursor-pointer shadow-sm
                hover:border-blue-400 hover:bg-blue-50/60
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

            <Input
              label="NIK Pemohon"
              value={formData.nik}
              onChange={(e) => updateForm("nik", e.target.value)}
            />

            <Input
              label="Nama Pemohon"
              value={formData.namaLengkap}
              onChange={(e) => updateForm("namaLengkap", e.target.value)}
            />

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <Input
                label="Tempat Lahir"
                value={formData.tempatLahir}
                onChange={(e) => updateForm("tempatLahir", e.target.value)}
              />

              <Input
                label="Tanggal Lahir"
                type="date"
                value={formData.tanggalLahir}
                onChange={(e) => updateForm("tanggalLahir", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <Input
                label="Pekerjaan"
                value={formData.jenispekerjaan}
                onChange={(e) => updateForm("jenispekerjaan", e.target.value)}
              />
              <Input
                label="Jenis Kelamin"
                value={formData.jenisKelamin}
                onChange={(e) => updateForm("jenisKelamin", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <Input
                label=" Status Perkawinan"
                value={formData.statusPerkawinan}
                onChange={(e) => updateForm("statusPerkawinan", e.target.value)}
              />
              <Input
                label="Agama"
                value={formData.agama}
                onChange={(e) => updateForm("agama", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <Input
                label="Anak Tanggungan"
                type="text"
                value={formatIdInteger(formData.anakTanggungan)}
                onChange={handleNumberFieldChange("anakTanggungan")}
              />
                <Input
                label="Kewarganegaraan"
                value={formData.kewarganegaraan}
                onChange={(e) => updateForm("kewarganegaraan", e.target.value)}
              />

            </div>

            <Input
              label="No HP / Whatsapp"
              value={formData.kontakPribadi}
              onChange={(e) => updateForm("kontakPribadi", e.target.value)}
            />
            <Input
              label="Nama Ibu Kandung"
              value={formData.namaIbuKandung}
              onChange={(e) => updateForm("namaIbuKandung", e.target.value)}
            />
          </Card>

          {/* ALAMAT DOMISILI */}
          <Card title="Alamat Domisili" icon={<FaMapMarkedAlt />}>
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Alamat Lengkap
              </label>
              <textarea
                rows="3"
                value={formData.alamatLengkap}
                onChange={(e) => updateForm("alamatLengkap", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200
                px-4 py-3 text-sm shadow-sm text-slate-700 bg-slate-50
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <Input
                label="RT"
                value={formData.rt}
                onChange={(e) => updateForm("rt", e.target.value)}
              />
              <Input
                label="RW"
                value={formData.rw}
                onChange={(e) => updateForm("rw", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <Input
                label="Desa / Kelurahan"
                value={formData.desaKelurahan}
                onChange={(e) => updateForm("desaKelurahan", e.target.value)}
              />
              <Input
                label="Kecamatan"
                value={formData.kecamatan}
                onChange={(e) => updateForm("kecamatan", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Kabupaten"
                value={formData.kabupaten}
                onChange={(e) => updateForm("kabupaten", e.target.value)}
              />
              <Input
                label="Provinsi"
                value={formData.provinsi}
                onChange={(e) => updateForm("provinsi", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">
                Titik Koordinat (Google Maps)
              </label>
              <input
                type="text"
                value={formData.titikmaps}
                onChange={(e) => updateForm("titikmaps", e.target.value)}
                placeholder="Klik tombol Open Google Maps"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90
                px-4 py-3 text-sm shadow-sm text-slate-700
                focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                outline-none transition"
              />
            </div>

            <button
              type="button"
              onClick={openMaps}
              className="w-full mt-2 rounded-xl border border-slate-200 px-3 py-2 text-sm
              text-slate-700 hover:bg-slate-50 transition"
            >
              Open Google Maps
            </button>
          </Card>

           {/* ================= DATA PENANGGUNG JAWAB ================= */}
          <Card title="Data Penanggung Jawab" icon={<FaBriefcase />}>

            <div className="space-y-6">
              <div
                onClick={() => handleCamera(ktpRefPasangan)}
                className="flex flex-col items-center justify-center
                h-40 rounded-xl border-2 border-dashed border-slate-200
                bg-slate-50/80 cursor-pointer shadow-sm
                hover:border-indigo-400 hover:bg-indigo-50/70
                transition text-center"
              >
                <input
                  ref={ktpRefPasangan}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFotoKtpPasangan(e.target.files[0])}
                />

                <div className="text-indigo-600 text-3xl mb-1">📄</div>

                <p className="text-sm font-semibold text-gray-700">
                  Foto KTP Penanggung Jawab
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {fotoKtpPasangan ? fotoKtpPasangan.name : "Klik untuk buka kamera"}
                </p>
              </div>

              {/* BUTTON VALIDASI */}
              <button
                type="button"
                disabled={!fotoKtpPasangan}
                onClick={(e) => {
                  e.stopPropagation();
                  handleValidasiKtpPasangan();
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${
                    fotoKtpPasangan
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                Validasi Data KTP Penanggung Jawab
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">

                <Input
                  label="NIK Penanggung Jawab"
                  value={formData.nikPenanggungJawab}
                  onChange={(e) => updateForm("nikPenanggungJawab", e.target.value)}
                />

                <Input
                  label="Nama Penanggung Jawab"
                  value={formData.namaPenanggungJawab}
                  onChange={(e) => updateForm("namaPenanggungJawab", e.target.value)}
                />

                <Input
                  label="Pekerjaan (Sesuai KTP)"
                  value={formData.pekerjaanPenanggungJawab}
                  onChange={(e) => updateForm("pekerjaanPenanggungJawab", e.target.value)}
                />
                <Input
                  label="Tempat Lahir"
                  value={formData.tempatLahirPenanggungJawab}
                  onChange={(e) => updateForm("tempatLahirPenanggungJawab", e.target.value)}
                />

                <Input
                  label="Tanggal Lahir Penanggung Jawab"
                  type="date"
                  value={formData.tanggalLahirPenanggungJawab}
                  onChange={(e) => updateForm("tanggalLahirPenanggungJawab", e.target.value)}
                />

                <Input
                  label="No HP / WhatsApp Penanggung Jawab"
                  value={formData.noHPPenanggungJawab}
                  onChange={(e) =>
                    updateForm("noHPPenanggungJawab", e.target.value)
                  }
                />
                <Select
                  label="Hubungan Dengan Pemohon"
                  value={formData.hubunganDenganPemohon}
                  onChange={(e) =>
                    setFormData({ ...formData, hubunganDenganPemohon: e.target.value })
                  }
                >
                  <option value="">Pilih Hubungan</option>
                  <option value="Istri Pemohon">Istri Pemohon</option>
                  <option value="Suami Pemohon">Suami Pemohon</option>
                  <option value="Anak Pemohon">Anak Pemohon</option>
                  <option value="Orang Tua Pemohon">Orang Tua Pemohon</option>
                  <option value="Saudara dari Bapak Pemohon">Saudara dari Bapak Pemohon</option>
                  <option value="Saudara dari Ibu Pemohon">Saudara dari Ibu Pemohon</option>
                  <option value="Saudara Kandung Pemohon">Saudara Kandung Pemohon</option>
                </Select>
              </div>
            </div>
          </Card>

          



        </div>
        
          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-12">
            <button
              onClick={() => navigate(-1)}
               className="px-6 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-success-900 text-white text-sm shadow-sm hover:bg-slate-950"
            >
              Simpan & Lanjut
            </button>
          </div>
        </main>
      </div>
    </PageBackground>
  );
}
