import { useState, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase, FaMapMarkerAlt } from "react-icons/fa";
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


const Select = ({
  label,
  value,
  onChange,
  children,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
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

const initialFormData = {
  jenisKredit: "",
  tujuanPenggunaanKredit: "",
  plafonPermohonan: "",
  jangkaWaktuKredit: "",
  sukuBungaTahun: "",
  sukuBungaBulan: "",
  perhitunganBunga: "",
  sumberPengembalian: "",
  caraAngsuranKredit: "",
  sistemAngsuranKredit: "",
  keteranganUmum: "",
};

const JENIS_KREDIT_MAP = {
  "121": "Kredit Modal Kerja",
  "122": "Kredit Investasi",
  "123": "Kredit Konsumtif / Pegawai",
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

const formatIdNumber = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const computeSukuBungaBulan = ({ sukuBungaTahun, perhitunganBunga }) => {
  if (sukuBungaTahun === "" || perhitunganBunga === "") {
    return "";
  }

  const annualRate = toNumber(sukuBungaTahun) / 100;
  if (annualRate <= 0) return "";

  if (perhitunganBunga === "Flat") {
    return String(((annualRate / 12) * 100).toFixed(2));
  }

  if (perhitunganBunga === "Anuitas") {
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    return String((monthlyRate * 100).toFixed(2));
  }

  return "";
};

const resolvePerhitunganBungaFromRate = (sukuBungaTahun) => {
  if (sukuBungaTahun === "" || sukuBungaTahun === null || sukuBungaTahun === undefined) {
    return "";
  }
  const rate = toNumber(sukuBungaTahun);
  if (!Number.isFinite(rate) || rate <= 0) return "";

  return rate >= 18 ? "Anuitas" : "Flat";
};

const resolveJenisKreditLabel = (value) => {
  if (!value) return "";
  const normalized = String(value).trim();
  if (JENIS_KREDIT_MAP[normalized]) return JENIS_KREDIT_MAP[normalized];

  const codeMatch = normalized.match(/\b(121|122|123)\b/);
  if (codeMatch && JENIS_KREDIT_MAP[codeMatch[1]]) {
    return JENIS_KREDIT_MAP[codeMatch[1]];
  }

  return normalized;
};

const isKreditKonsumtifPegawai = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  if (normalized.includes("kredit konsumtif")) return true;
  return /\b123\b/.test(normalized);
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

const normalizeDataPermohonan = (data) => ({
  jenisKredit: resolveJenisKreditLabel(
    getFieldValue(data, [
      "jenisKredit",
      "jenis_kredit",
      "jenisPermohonan",
      "jenis_permohonan",
      "kodeJenisKredit",
      "kode_jenis_kredit",
    ])
  ),
  tujuanPenggunaanKredit: getFieldValue(data, [
    "tujuanPenggunaanKredit",
    "tujuan_penggunaan_kredit",
    "tujuanPenggunaan",
    "tujuan_penggunaan",
  ]),
  plafonPermohonan: getFieldValue(data, ["plafonPermohonan", "plafon_permohonan"]),
  jangkaWaktuKredit: getFieldValue(data, ["jangkaWaktuKredit", "jangka_waktu_kredit"]),
  sukuBungaTahun: getFieldValue(data, ["sukuBungaTahun", "suku_bunga_tahun"]),
  sukuBungaBulan: getFieldValue(data, [
    "sukuBungaBulan",
    "suku_bunga_bulan",
    "sukuBungaPerBulan",
    "suku_bunga_per_bulan",
    "sukuBungaBulanan",
    "suku_bunga_bulanan",
  ]),
  perhitunganBunga: getFieldValue(data, [
    "perhitunganBunga",
    "perhitungan_bunga",
    "jenisPerhitungan",
    "jenis_perhitungan",
    "caraPerhitungan",
    "cara_perhitungan",
  ]),
  sumberPengembalian: getFieldValue(data, ["sumberPengembalian", "sumber_pengembalian"]),
  caraAngsuranKredit: getFieldValue(data, ["caraAngsuranKredit", "cara_angsuran_kredit"]),
  sistemAngsuranKredit: getFieldValue(data, [
    "sistemAngsuranKredit",
    "sistem_angsuran_kredit",
    "sistemAngsuran",
    "sistem_angsuran",
  ]),
  keteranganUmum: getFieldValue(data, ["keteranganUmum", "keterangan_umum"]),
});

/* =======================
   PAGE
======================= */


export default function UpdateDataPermohonan() {

const navigate = useNavigate();

const { no_permohonan: noPermohonanParam } = useParams();

const [formData, setFormData] = useState(initialFormData);
const [noPermohonan, setNoPermohonan] = useState(noPermohonanParam ?? "");
const [loadingNoPermohonan, setLoadingNoPermohonan] = useState(false);

  useEffect(() => {
    const computedSukuBunga = computeSukuBungaBulan(formData);

    setFormData((prev) => {
      if (!computedSukuBunga) return prev;
      if (prev.sukuBungaBulan === computedSukuBunga) return prev;
      return { ...prev, sukuBungaBulan: computedSukuBunga };
    });
  }, [
    formData.sukuBungaTahun,
    formData.perhitunganBunga,
  ]);

  useEffect(() => {
    const nextPerhitungan = resolvePerhitunganBungaFromRate(
      formData.sukuBungaTahun
    );
    if (!nextPerhitungan) return;
    setFormData((prev) =>
      prev.perhitunganBunga === nextPerhitungan
        ? prev
        : { ...prev, perhitunganBunga: nextPerhitungan }
    );
  }, [formData.sukuBungaTahun]);

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
      fetchNoPermohonan();
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]); 

  useEffect(() => {
    const requestNo = noPermohonanParam || noPermohonan;
    if (!requestNo) return;
    fetchDataPermohonan(requestNo);
  }, [noPermohonanParam, noPermohonan]);

const handleFieldChange = (field) => (event) => {
  setFormData((prev) => ({
    ...prev,
    [field]: event.target.value,
  }));
};

const sanitizeDecimalInput = (value) => {
  const normalized = String(value ?? "").replace(/,/g, ".");
  const digitsOnly = normalized.replace(/[^0-9.]/g, "");
  if (!digitsOnly) return "";
  const dotIndex = digitsOnly.indexOf(".");
  if (dotIndex === -1) return digitsOnly;
  const whole = digitsOnly.slice(0, dotIndex);
  const decimals = digitsOnly.slice(dotIndex + 1).replace(/\./g, "");
  return decimals ? `${whole}.${decimals}` : `${whole}.`;
};

const handleNumberFieldChange = (field) => (event) => {
  const rawValue = event.target.value;
  const cleanedValue = rawValue.replace(/\D/g, "");

  setFormData((prev) => ({
    ...prev,
    [field]: cleanedValue,
  }));
};

const handleDecimalFieldChange = (field) => (event) => {
  const cleanedValue = sanitizeDecimalInput(event.target.value);
  setFormData((prev) => ({
    ...prev,
    [field]: cleanedValue,
  }));
};

const fetchJenisKreditFromGenerate = async (requestNo) => {
  if (!requestNo) return;

  try {
    const listRes = await axios.get(API_ENDPOINTS.generate.noPermohonan());
    const data = listRes.data?.Data;
    const list = Array.isArray(data) ? data : data ? [data] : [];

    const match = list.find(
      (item) =>
        String(item?.no_permohonan ?? item?.noPermohonan) ===
        String(requestNo)
    );
    const source = match || list[0];

    const rawJenis =
      source?.jenisPermohonan ??
      source?.jenisKredit ??
      source?.kodeJenisKredit ??
      source?.jenis_permohonan ??
      source?.jenis_kredit ??
      "";

    const resolved = resolveJenisKreditLabel(rawJenis);
    if (!resolved) return;

    setFormData((prev) => {
      if (prev.jenisKredit) {
        return prev;
      }
      if (prev.jenisKredit === resolved) {
        return prev;
      }
      return { ...prev, jenisKredit: resolved };
    });
  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal mengambil jenis kredit",
      "error"
    );
  }
};

const fetchNoPermohonan = async () => {
  if (noPermohonanParam) {
    setNoPermohonan(noPermohonanParam);
    fetchJenisKreditFromGenerate(noPermohonanParam);
    return;
  }

  try {
    setLoadingNoPermohonan(true);
    const listRes = await axios.get(API_ENDPOINTS.generate.noPermohonan());
    const data = listRes.data?.Data;
    const latestPermohonan = Array.isArray(data) ? data[0] : data;
    const fetchedNo = latestPermohonan?.no_permohonan || "";

    setNoPermohonan(fetchedNo);
    fetchJenisKreditFromGenerate(fetchedNo);
  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal mengambil nomor permohonan",
      "error"
    );
  } finally {
    setLoadingNoPermohonan(false);
  }
};

const fetchDataPermohonan = async (requestNo) => {
  if (!requestNo) return;

  try {
    const response = await axios.get(
      API_ENDPOINTS.datanasabah.dataPermohonan.detail(requestNo)
    );
    const data = normalizeList(response.data?.Data ?? response.data?.data ?? response.data);
    const permohonan = Array.isArray(data) ? data[0] : data;

    if (!permohonan) return;

    setFormData((prev) => ({
      ...prev,
      ...normalizeDataPermohonan(permohonan),
    }));
  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal mengambil data permohonan",
      "error"
    );
  }
};

const handleSave = async () => {
  const requestNoPermohonan = noPermohonan || noPermohonanParam;
  if (!requestNoPermohonan) {
    Swal.fire("Error", "No Antrian tidak ditemukan di URL", "error");
    return;
  }

  const payload = new FormData();

  // ⬇️ inject nik
  payload.append("no_permohonan", requestNoPermohonan);

  // ⬇️ kirim semua text + file
  Object.entries(formData).forEach(([key, value]) => {
    if (value instanceof File) {
      payload.append(key, value);
    } else if (value !== null && value !== "") {
      payload.append(key, value);
    }
  });


  try {
    Swal.fire({
      title: "Menyimpan Data Permohonan Kredit...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await axios.patch(
      API_ENDPOINTS.datanasabah.dataPermohonan.detail(requestNoPermohonan),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Berhasil", "Data Permohonan Kredit berhasil diperbaharui", "success");

    // ⬇️ lanjut ke jaminan (pakai nik yg sama)
    if (isKreditKonsumtifPegawai(formData.jenisKredit)) {
      navigate(
        `/update-data/data-instansi/${encodeURIComponent(requestNoPermohonan)}`
      );
    } else {
      navigate(
        `/update-data/data-usaha/${encodeURIComponent(requestNoPermohonan)}`
      );
    }

  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal menyimpan Data Usaha",
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
                Data PERMOHONAN KREDIT{" "}
                <span className="text-slate-400 font-normal">Nasabah</span>
              </h1>
              <p className="text-xs text-slate-500">
                Isi data permohonan sesuai kebutuhan kredit nasabah.
              </p>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 gap-6">

            {/* DATA PERMOHONAN */}
            {/* DATA PENGGUNA KREDIT */}
            <Card title="Data Pengguna Kredit" icon={<FaMapMarkerAlt />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Jenis Kredit"
                  value={formData.jenisKredit}
                  onChange={handleFieldChange("jenisKredit")}
                >
                  <option value="">Pilih Jenis Kredit</option>
                  <option value="Kredit Modal Kerja">Kredit Modal Kerja</option>
                  <option value="Kredit Investasi">Kredit Investasi</option>
                  <option value="Kredit Konsumtif / Pegawai">
                    Kredit Konsumtif / Pegawai
                  </option>
                </Select>
                <Input
                  label="Tujuan Penggunaan Kredit"
                  value={formData.tujuanPenggunaanKredit}
                  onChange={handleFieldChange("tujuanPenggunaanKredit")}
                  placeholder="Contoh: Menambah modal kerja "
                />
                <Input
                  label="Plafon Permohonan"
                  type="text"
                  value={formatIdInteger(formData.plafonPermohonan)}
                  onChange={handleNumberFieldChange("plafonPermohonan")}
                  inputMode="numeric"
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Jangka Waktu Kredit"
                      type="text"
                      value={formatIdInteger(formData.jangkaWaktuKredit)}
                      onChange={handleNumberFieldChange("jangkaWaktuKredit")}
                      inputMode="numeric"
                    />
                  </div>
                  <span className="pb-2 text-xs text-gray-500">Bulan</span>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Suku Bunga / Tahun"
                      type="text"
                      value={formData.sukuBungaTahun}
                      onChange={handleDecimalFieldChange("sukuBungaTahun")}
                      inputMode="decimal"
                    />
                  </div>
                  <span className="pb-2 text-xs text-gray-500">%</span>
                </div>
                <Select
                  label="Cara Perhitungan"
                  value={formData.perhitunganBunga}
                  onChange={handleFieldChange("perhitunganBunga")}
                >
                  <option value="">Pilih Jenis Perhitungan</option>
                  <option value="Flat">Flat</option>
                  <option value="Anuitas">Anuitas</option>
                </Select>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Suku Bunga / Bulan"
                      type="text"
                      value={formatIdNumber(formData.sukuBungaBulan)}
                      readOnly
                    />
                  </div>
                  <span className="pb-2 text-xs text-gray-500">%</span>
                </div>
                <Input
                  label="Sumber Pengembalian Kredit"
                  placeholder="Contoh: Usaha Dagang"
                  value={formData.sumberPengembalian}
                  onChange={handleFieldChange("sumberPengembalian")}
                />
                <Select
                  label="Cara Angsuran Kredit"
                  value={formData.caraAngsuranKredit}
                  onChange={handleFieldChange("caraAngsuranKredit")}
                >
                  <option value="">Pilih Cara Angsuran</option>
                  <option value="Bulanan">Bulanan</option>
                  <option value="3 Bulan">3 Bulan</option>
                  <option value="6 Bulan">6 Bulan</option>
                  <option value="Lebih Dari 6 Bulanan">Lebih Dari 6 Bulanan</option>
                </Select>
                <Select
                  label="Sistem Angsuran Kredit"
                  value={formData.sistemAngsuranKredit}
                  onChange={handleFieldChange("sistemAngsuranKredit")}
                >
                  <option value="">Pilih Sistem Angsuran</option>
                  <option value="Pokok dan Bunga dibayar setiap Bulan">
                    Pokok dan Bunga dibayar setiap Bulan
                  </option>
                  <option value="Bunga dibayar setiap bulan dan Pokok saat JT">
                    Bunga dibayar setiap bulan dan Pokok saat JT
                  </option>
                  <option value="Bunga dan Pokok dibayar sekaligus saat JT">
                    Bunga dan Pokok dibayar sekaligus saat JT
                  </option>
                  <option value="Pokok dan Bunga per Triwulan">Pokok dan Bunga per Triwulan</option>
                  <option value="Pokok dan Bunga dibayar per semester ( 6 bulan sekali)">
                    Pokok dan Bunga dibayar per semester ( 6 bulan sekali)
                  </option>
                </Select>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">
                    Gambaran Umum
                  </label>
                  <textarea
                    rows="3"
                    value={formData.keteranganUmum}
                    onChange={handleFieldChange("keteranganUmum")}
                    placeholder="Contoh: Ibu ... adalah seorang pengusaha yang mempunyai CV bernama ..., tempat usaha Ibu ... bertempat di komplek pertokoan ..."
                    className="mt-1 w-full rounded-xl border border-slate-200
                    px-4 py-3 text-sm text-slate-700 shadow-sm
                    focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none
                    placeholder:text-slate-400"
                  />
                </div>
              </div>
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
              Simpan & Lanjut
            </button>
          </div>

        </main>
      </div>
    </PageBackground>
  );
}
