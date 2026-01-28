import { useState, useRef, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase, FaFileAlt, FaCamera } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

/* =======================
   REUSABLE COMPONENTS
======================= */

const Card = ({ title, icon, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 text-[13px]">
        {title}
      </h3>
    </div>
    {children}
  </section>
);



const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  readOnly = false,
  inputMode,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      inputMode={inputMode}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
      placeholder:text-slate-400 ${
        readOnly ? "bg-slate-50 text-slate-600 cursor-not-allowed" : "bg-white text-slate-800"
      }`}
    />
  </div>
);


const TextArea = ({
  label,
  rows = 3,
  value,
  onChange,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
      {label}
    </label>
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
      text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
      placeholder:text-slate-400"
    />
  </div>
);

const Select = ({ label, value, onChange, options = [] }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
      bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
    >
      <option value="">Pilih {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

/* =======================
   UPLOAD CAMERA (FIXED)
======================= */

const UploadButton = ({ label, file, onChange }) => {
  const inputRef = useRef(null);
  const fileLabel =
    typeof file === "string"
      ? file.split("/").pop()
      : file?.name || "Belum ada foto";

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>

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
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2
        border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700
        hover:bg-slate-50 transition"
      >
        <FaCamera className="text-slate-600" />
        Open Camera
      </button>

      <div className="text-[11px] text-slate-500">{fileLabel}</div>
    </div>
  );
};

const DATA_INSTANSI_FIELDS = [
  { key: "namaInstansi", label: "Nama Instansi" },
];

const GOLONGAN_OPTIONS = [
  "Golongan I (Juru)",
  "Golongan II (Pengatur)",
  "Golongan III (Penata)",
  "Golongan IV (Pembina)",
  "Staff",
  "Supervisor",
  "Manager",
  "Senior Manager",
  "Direktur",
  "Lainnya",
];

const STATUS_INSTANSI_OPTIONS = [
  "Pemerintah",
  "BUMN/BUMD",
  "Swasta",
  "Lainnya",
];

const STATUS_PEGAWAI_OPTIONS = ["Aktif", "Cuti", "Tidak Aktif", "Pensiun"];

const BIDANG_INSTANSI_OPTIONS = [
  "Pemerintahan",
  "BUMN/BUMD",
  "Swasta/Industri",
  "Teknologi & Kreatif",
  "Keuangan",
  "Pendidikan & Sosial",
  "Sektor Primer",
  "Mandiri",
  "Lainnya",
];

const PEGAWAI_FIELDS = [
  { key: "jabatanDebitur", label: "Jabatan Debitur" },
  { key: "nipNik", label: "NIP / NIK", readOnly: true },
  { key: "bekerjaSejak", label: "Bekerja Sejak", type: "date" },
];

const KONTAK_FIELDS = [
  { key: "nomorHP", label: "Nomor HP", type: "tel" },
  { key: "namaAtasan", label: "Nama Atasan" },
  { key: "namaBendahara", label: "Nama Bendahara" },
  { key: "npwp", label: "NPWP" },
];

const initialFormData = {
  namaInstansi: "",
  statusInstansi: "",
  statusInstansiOther: "",
  bidangInstansi: "",
  bidangInstansiOther: "",
  alamatInstansi: "",
  namaAtasan: "",
  namaBendahara: "",
  nomorHP: "",
  jabatanDebitur: "",
  pangkatGolongan: "",
  pangkatGolonganOther: "",
  statusPegawai: "",
  nipNik: "",
  npwp: "",
  plafonDiajukan: "",
  bekerjaSejak: "",
  uploadSKTerakhir: null,
  uploadNPWP: null,
};

const getFieldValue = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};

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

const resolveOptionValue = (value, options) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { value: "", other: "" };
  if (options.includes(trimmed)) return { value: trimmed, other: "" };
  return { value: "Lainnya", other: trimmed };
};

const normalizeDataInstansi = (data) => {
  const statusResolved = resolveOptionValue(
    getFieldValue(data, [
      "statusInstansi",
      "status_instansi",
      "statusPerusahaan",
      "status_perusahaan",
      "statusPekerjaan",
      "status_pekerjaan",
    ]),
    STATUS_INSTANSI_OPTIONS
  );
  const bidangResolved = resolveOptionValue(
    getFieldValue(data, [
      "bidangInstansi",
      "bidang_instansi",
      "bidangUsaha",
      "bidang_usaha",
      "bidangPerusahaan",
      "bidang_perusahaan",
    ]),
    BIDANG_INSTANSI_OPTIONS
  );
  const pangkatResolved = resolveOptionValue(
    getFieldValue(data, [
      "pangkatGolongan",
      "pangkat_golongan",
      "golongan",
      "pangkat",
    ]),
    GOLONGAN_OPTIONS
  );

  const normalized = {
    namaInstansi: getFieldValue(data, [
      "namaInstansi",
      "nama_instansi",
      "instansi",
      "namaTempatKerja",
      "nama_tempat_kerja",
      "namaPerusahaan",
      "nama_perusahaan",
    ]),
    statusInstansi: statusResolved.value,
    statusInstansiOther: statusResolved.other,
    bidangInstansi: bidangResolved.value,
    bidangInstansiOther: bidangResolved.other,
    alamatInstansi: getFieldValue(data, [
      "alamatInstansi",
      "alamat_instansi",
      "alamatPerusahaan",
      "alamat_perusahaan",
      "alamatTempatKerja",
      "alamat_tempat_kerja",
      "alamat",
    ]),
    namaAtasan: getFieldValue(data, ["namaAtasan", "nama_atasan"]),
    namaBendahara: getFieldValue(data, ["namaBendahara", "nama_bendahara"]),
    nomorHP: getFieldValue(data, ["nomorHP", "nomor_hp", "noHP", "nohp"]),
    jabatanDebitur: getFieldValue(data, [
      "jabatanDebitur",
      "jabatan_debitur",
      "jabatan",
      "jabatanKerja",
      "jabatan_kerja",
    ]),
    pangkatGolongan: pangkatResolved.value,
    pangkatGolonganOther: pangkatResolved.other,
    statusPegawai: getFieldValue(data, [
      "statusPegawai",
      "status_pegawai",
      "statusKaryawan",
      "status_karyawan",
      "statusPekerjaan",
      "status_pekerjaan",
    ]),
    nipNik: getFieldValue(data, ["nipNik", "nip_nik", "nip", "nik"]),
    npwp: getFieldValue(data, ["npwp", "NPWP", "npwpInstansi", "npwp_instansi"]),
    plafonDiajukan: getFieldValue(data, [
      "plafonDiajukan",
      "plafon_diajukan",
      "plafonPermohonan",
      "plafon_permohonan",
      "plafon",
      "plafonPinjaman",
      "plafon_pinjaman",
    ]),
    bekerjaSejak: getFieldValue(data, [
      "bekerjaSejak",
      "bekerja_sejak",
      "mulaiBekerja",
      "mulai_bekerja",
      "tanggalBekerja",
      "tanggal_bekerja",
    ]),
    uploadSKTerakhir: getFieldValue(data, [
      "uploadSKTerakhir",
      "upload_sk_terakhir",
      "skTerakhir",
      "sk_terakhir",
      "fotoSKTerakhir",
      "foto_sk_terakhir",
    ]),
    uploadNPWP: getFieldValue(data, [
      "uploadNPWP",
      "upload_npwp",
      "fotoNPWP",
      "foto_npwp",
      "npwpFile",
      "npwp_file",
    ]),
  };

  return Object.entries(normalized).reduce((acc, [key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/* =======================
   PAGE
======================= */

export default function UpdateDataInstansi() {

const navigate = useNavigate();
const { no_permohonan } = useParams();

const [formData, setFormData] = useState(initialFormData);
const shouldShowNpwp = toNumber(formData.plafonDiajukan) > 100000000;

  
  
  /* ===============================
     AUTH
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
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (!no_permohonan) return;

    let isActive = true;
    const fetchDataDiri = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.datanasabah.dataDiri.detail(no_permohonan)
        );
        const payload =
          response.data?.Data ?? response.data?.data ?? response.data ?? {};
        const data = Array.isArray(payload) ? payload[0] : payload;
        const nikValue = getFieldValue(data, ["nik", "NIK"]);
        if (!nikValue || !isActive) return;
        setFormData((prev) =>
          prev.nipNik ? prev : { ...prev, nipNik: nikValue }
        );
      } catch {
        if (!isActive) return;
      }
    };

    fetchDataDiri();
    return () => {
      isActive = false;
    };
  }, [no_permohonan]);

  useEffect(() => {
    if (!no_permohonan) return;

    let isActive = true;
    const fetchDataInstansi = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.datanasabah.dataInstansi.detail(no_permohonan)
        );
        const payload =
          response.data?.Data ?? response.data?.data ?? response.data ?? {};
        const data = Array.isArray(payload) ? payload[0] : payload;
        if (!data || !isActive) return;
        const normalized = normalizeDataInstansi(data);
        setFormData((prev) => ({ ...prev, ...normalized }));
      } catch {
        if (!isActive) return;
      }
    };

    fetchDataInstansi();
    return () => {
      isActive = false;
    };
  }, [no_permohonan]);

  useEffect(() => {
    if (!no_permohonan) return;

    let isActive = true;
    const fetchDataPermohonan = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.datanasabah.dataPermohonan.detail(no_permohonan)
        );
        const payload =
          response.data?.Data ?? response.data?.data ?? response.data ?? {};
        const data = Array.isArray(payload) ? payload[0] : payload;
        const plafonRaw = getFieldValue(data, [
          "plafonPermohonan",
          "plafon_permohonan",
          "plafonPinjaman",
          "plafon_pinjaman",
          "plafon",
        ]);
        const plafonValue = toNumber(plafonRaw);
        if (!isActive || !plafonValue) return;
        setFormData((prev) =>
          prev.plafonDiajukan
            ? prev
            : { ...prev, plafonDiajukan: String(plafonValue) }
        );
      } catch {
        if (!isActive) return;
      }
    };

    fetchDataPermohonan();
    return () => {
      isActive = false;
    };
  }, [no_permohonan]);
  

const handleFieldChange = (field) => (event) => {
  setFormData((prev) => ({
    ...prev,
    [field]: event.target.value,
  }));
};

const handleFileChange = (field) => (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFormData((prev) => ({
    ...prev,
    [field]: file,
  }));
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "File berhasil disimpan",
    showConfirmButton: false,
    timer: 1200,
    timerProgressBar: true,
  });
};

const handleNumberFieldChange = (field) => (event) => {
  const rawValue = event.target.value;
  const cleanedValue = rawValue.replace(/\D/g, "");
  setFormData((prev) => ({
    ...prev,
    [field]: cleanedValue,
  }));
};

const handleSave = async () => {
  if (!no_permohonan) {
    Swal.fire("Error", "No Permohonan tidak ditemukan di URL", "error");
    return;
  }

  const resolvedStatusInstansi =
    formData.statusInstansi === "Lainnya"
      ? formData.statusInstansiOther
      : formData.statusInstansi;
  const resolvedBidangInstansi =
    formData.bidangInstansi === "Lainnya"
      ? formData.bidangInstansiOther
      : formData.bidangInstansi;
  const resolvedPangkatGolongan =
    formData.pangkatGolongan === "Lainnya"
      ? formData.pangkatGolonganOther
      : formData.pangkatGolongan;

  const payload = new FormData();

  payload.append("no_permohonan", no_permohonan);

  const {
    statusInstansiOther,
    bidangInstansiOther,
    pangkatGolonganOther,
    ...payloadValues
  } = {
    ...formData,
    statusInstansi: resolvedStatusInstansi,
    bidangInstansi: resolvedBidangInstansi,
    pangkatGolongan: resolvedPangkatGolongan,
  };

  Object.entries(payloadValues).forEach(([key, value]) => {
    if (value instanceof File) {
      payload.append(key, value);
    } else if (value !== null && value !== "") {
      payload.append(key, value);
    }
  });


  try {
    Swal.fire({
      title: "Menyimpan Data Instansi...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await axios.post(
      API_ENDPOINTS.datanasabah.dataInstansi.list(),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Berhasil", "Data Instansi berhasil disimpan", "success");
    const plafonValue = toNumber(formData.plafonDiajukan);
    const nextPath =
      plafonValue > 10000000
        ? `/update-data/data-jaminan/${encodeURIComponent(no_permohonan)}`
        : "/dashboard";
    navigate(nextPath);

  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal menyimpan Data Instansi",
      "error"
    );
  }
};

  
  return (
    <PageBackground>
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-7xl mx-auto">

          {/* TITLE */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <FaBriefcase className="text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Data Instansi <span className="text-slate-400 font-normal">Nasabah</span>
              </h1>
              <p className="text-xs text-slate-500">
                Lengkapi informasi instansi untuk kebutuhan analisis kredit.
              </p>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* DATA INSTANSI */}
            <Card title="Data Instansi" icon={<FaBriefcase />}>
              {DATA_INSTANSI_FIELDS.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  value={formData[field.key]}
                  onChange={handleFieldChange(field.key)}
                />
              ))}
              <Select
                label="Status Instansi"
                value={formData.statusInstansi}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    statusInstansi: nextValue,
                    statusInstansiOther:
                      nextValue === "Lainnya" ? prev.statusInstansiOther : "",
                  }));
                }}
                options={STATUS_INSTANSI_OPTIONS}
              />
              {formData.statusInstansi === "Lainnya" ? (
                <Input
                  label="Status Instansi (Lainnya)"
                  value={formData.statusInstansiOther}
                  onChange={handleFieldChange("statusInstansiOther")}
                />
              ) : null}
              <Select
                label="Bidang Instansi"
                value={formData.bidangInstansi}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    bidangInstansi: nextValue,
                    bidangInstansiOther:
                      nextValue === "Lainnya" ? prev.bidangInstansiOther : "",
                  }));
                }}
                options={BIDANG_INSTANSI_OPTIONS}
              />
              {formData.bidangInstansi === "Lainnya" ? (
                <Input
                  label="Bidang Instansi (Lainnya)"
                  value={formData.bidangInstansiOther}
                  onChange={handleFieldChange("bidangInstansiOther")}
                />
              ) : null}
              <TextArea
                label="Alamat Instansi"
                value={formData.alamatInstansi}
                onChange={handleFieldChange("alamatInstansi")}
              />
            </Card>

            {/* INFORMASI PEGAWAI */}
            <Card title="Informasi Pegawai" icon={<FaBriefcase />}>
              {PEGAWAI_FIELDS.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type={field.type || "text"}
                  value={formData[field.key]}
                  onChange={handleFieldChange(field.key)}
                  readOnly={field.readOnly}
                />
              ))}
              <Select
                label="Pangkat/Golongan"
                value={formData.pangkatGolongan}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    pangkatGolongan: nextValue,
                    pangkatGolonganOther:
                      nextValue === "Lainnya" ? prev.pangkatGolonganOther : "",
                  }));
                }}
                options={GOLONGAN_OPTIONS}
              />
              {formData.pangkatGolongan === "Lainnya" ? (
                <Input
                  label="Pangkat/Golongan (Lainnya)"
                  value={formData.pangkatGolonganOther}
                  onChange={handleFieldChange("pangkatGolonganOther")}
                />
              ) : null}
              <Select
                label="Status Pegawai"
                value={formData.statusPegawai}
                onChange={handleFieldChange("statusPegawai")}
                options={STATUS_PEGAWAI_OPTIONS}
              />
            </Card>

            <Card title="Plafon Pengajuan" icon={<FaBriefcase />}>
              <Input
                label="Plafon Diajukan"
                value={formatIdInteger(formData.plafonDiajukan)}
                onChange={handleNumberFieldChange("plafonDiajukan")}
                inputMode="numeric"
              />
            </Card>

            {/* KONTAK & DOKUMEN */}
            <Card title="Kontak & Dokumen" icon={<FaFileAlt />}>
              {KONTAK_FIELDS.filter(
                (field) => field.key !== "npwp" || shouldShowNpwp
              ).map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  type={field.type || "text"}
                  value={formData[field.key]}
                  onChange={handleFieldChange(field.key)}
                />
              ))}
              {shouldShowNpwp ? (
                <UploadButton
                  label="Upload NPWP"
                  file={formData.uploadNPWP}
                  onChange={handleFileChange("uploadNPWP")}
                />
              ) : null}
              <UploadButton
                label="Upload SK Terakhir"
                file={formData.uploadSKTerakhir}
                onChange={handleFileChange("uploadSKTerakhir")}
              />
            </Card>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-success-800 text-white text-sm shadow-sm hover:bg-slate-900"
            >
              Simpan Data Instansi
            </button>
          </div>

        </main>
      </div>
    </PageBackground>
  );
}
