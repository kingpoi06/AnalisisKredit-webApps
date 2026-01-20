import React, { useEffect, useState } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaUsers, FaFileInvoiceDollar, FaBriefcase } from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAktivitas: 0,
    kreditAktif: 0,
    kreditPengajuan: 0,
  });

  const [listKredit, setListKredit] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Untuk modal
  const [showModal, setShowModal] = useState(false);
  const [selectedKredit, setSelectedKredit] = useState(null);
  const [keterangan, setKeterangan] = useState("");
  const [statusPengajuan, setStatusPengajuan] = useState("SUDAH DIAJUKAN");
  const [statusPermohonan, setStatusPermohonan] = useState("");
  const [plafonPermohonan, setPlafonPermohonan] = useState("");
  const [sukuBunga, setSukuBunga] = useState("");
  const [jenisPerhitungan, setJenisPerhitungan] = useState("");
  const [namaAsuransi, setNamaAsuransi] = useState("");
  const [premi, setPremi] = useState("");
  const [namaNotaris, setNamaNotaris] = useState("");
  const [biayaAPHT, setBiayaAPHT] = useState("");
  const [jenisPengikatan, setJenisPengikatan] = useState("");
  const [caraPengembalianKredit, setCaraPengembalianKredit] = useState("");
  const [userRole, setUserRole] = useState("");

  const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const normalized = String(status).toUpperCase();
    if (normalized === "DITERIMA" || normalized === "APPROVE") return "Approve";
    if (normalized === "DITOLAK" || normalized === "REJECT") return "Reject";
    if (normalized === "PROSES PENGAJUAN" || normalized === "PENDING") {
      return "Pending";
    }
    return status;
  };

  const toApiStatus = (status) => {
    const normalized = normalizeStatus(status);
    return normalized;
  };

  const sanitizeNumericValue = (value) =>
    String(value ?? "").replace(/\D/g, "");

  const parseIdNumber = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const normalized = raw.replace(/\./g, "").replace(/,/g, ".");
    const numericValue = Number(normalized);
    return Number.isFinite(numericValue) ? String(numericValue) : "";
  };

  const sanitizeCurrencyInput = (value) =>
    String(value ?? "").replace(/[^0-9,]/g, "");

  const formatCurrencyInput = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const sanitized = sanitizeCurrencyInput(raw);
    if (!sanitized) return "";

    const [rawInteger = "", ...rawDecimals] = sanitized.split(",");
    let integerDigits = rawInteger.replace(/\D/g, "");
    let decimalDigits = rawDecimals.join("").replace(/\D/g, "");

    if (decimalDigits.length > 2) {
      integerDigits += decimalDigits.slice(2);
      decimalDigits = decimalDigits.slice(0, 2);
    }

    if (!integerDigits && !decimalDigits) return "";

    const integerValue = integerDigits ? Number(integerDigits) : 0;
    if (!Number.isFinite(integerValue)) return "";
    const formattedInteger = new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(integerValue);
    if (decimalDigits.length > 0) {
      return `${formattedInteger || "0"},${decimalDigits}`;
    }
    return formattedInteger;
  };

  const formatCurrencyFinal = (value) => {
    const formatted = formatCurrencyInput(value);
    if (!formatted) return "";
    const [integerPart = "0", decimalPart = ""] = formatted.split(",");
    const paddedDecimal = `${decimalPart}00`.slice(0, 2);
    return `${integerPart || "0"},${paddedDecimal}`;
  };

  const formatIdNumber = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return "";
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleNumericChange = (setter) => (event) => {
    setter(sanitizeNumericValue(event.target.value));
  };

  const handleCurrencyChange = (setter) => (event) => {
    setter(formatCurrencyInput(event.target.value));
  };

  const getPengikatanLabel = (value) =>
    value ? `Biaya ${value}` : "Biaya Pengikatan";

  const getFieldValue = (source, keys, fallback = "") => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return fallback;
  };

  const JENIS_KREDIT_MAP = {
    "121": "Kredit Modal Kerja",
    "122": "Kredit Investasi",
    "123": "Kredit Konsumtif / Pegawai",
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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const roleValue =
        decoded?.role ||
        decoded?.user?.role ||
        decoded?.jabatan ||
        decoded?.level ||
        "";
      setUserRole(String(roleValue).toLowerCase());
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      fetchDashboard();
    } catch (err) {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchDashboard = async () => {
    try {
      const [
        summaryRes,
        listRes,
        dataDiriRes,
        dataPermohonanRes,
        dataUsahaRes,
        dataInstansiRes,
        dataJaminanRes,
        dataAnalisisRes,
      ] =
        await Promise.all([
        axios.get(API_ENDPOINTS.datanasabah.dashboard()),
        axios.get(API_ENDPOINTS.generate.noPermohonan()),
        axios.get(API_ENDPOINTS.datanasabah.dataDiri.list()),
        axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
        axios.get(API_ENDPOINTS.datanasabah.dataUsaha.list()),
        axios.get(API_ENDPOINTS.datanasabah.dataInstansi.list()),
        axios.get(API_ENDPOINTS.datanasabah.dataJaminan.list()),
        axios.get(API_ENDPOINTS.datanasabah.dataAnalisis.list()),
      ]);

      const summary = summaryRes.data.Data;

      setStats({
        totalAktivitas: summary.kreditAktif + summary.kreditPengajuan,
        kreditAktif: summary.kreditAktif,
        kreditPengajuan: summary.kreditPengajuan,
      });

      const normalizeList = (data) => {
        if (!Array.isArray(data)) return [];
        return Array.isArray(data[0]) ? data.flat() : data;
      };

      const listData = listRes.data.Data || [];
      const dataDiriList = normalizeList(dataDiriRes.data?.Data);
      const dataPermohonanList = normalizeList(dataPermohonanRes.data?.Data);
      const dataUsahaList = normalizeList(dataUsahaRes.data?.Data);
      const dataInstansiList = normalizeList(dataInstansiRes.data?.Data);
      const dataJaminanList = normalizeList(dataJaminanRes.data?.Data);
      const dataAnalisisList = normalizeList(dataAnalisisRes.data?.Data);
      const nikByPermohonan = new Map(
        dataDiriList.map((item) => [
          item.no_permohonan ?? item.noPermohonan,
          item.nik ?? item.NIK,
        ])
      );
      const permohonanSet = new Set(
        dataPermohonanList.map((item) => item.no_permohonan ?? item.noPermohonan)
      );
      const permohonanMap = new Map(
        dataPermohonanList.map((item) => [
          item.no_permohonan ?? item.noPermohonan,
          item,
        ])
      );
      const usahaSet = new Set(
        dataUsahaList.map((item) => item.no_permohonan ?? item.noPermohonan)
      );
      const instansiSet = new Set(
        dataInstansiList.map((item) => item.no_permohonan ?? item.noPermohonan)
      );
      const caraPengembalianMap = new Map();
      dataUsahaList.forEach((item) => {
        const noPermohonanKey = item.no_permohonan ?? item.noPermohonan;
        if (!noPermohonanKey) return;
        const caraPengembalian = getFieldValue(item, [
          "caraPengembalianKredit",
          "cara_pengembalian_kredit",
          "caraPengembalian",
          "cara_pengembalian",
          "sumberPengembalian",
          "sumber_pengembalian",
        ]);
        if (!caraPengembalian) return;
        if (!caraPengembalianMap.has(noPermohonanKey)) {
          caraPengembalianMap.set(noPermohonanKey, caraPengembalian);
        }
      });
      const jaminanSet = new Set(
        dataJaminanList.map((item) => item.no_permohonan ?? item.noPermohonan)
      );
      const pengikatanMap = new Map();
      dataJaminanList.forEach((item) => {
        const noPermohonanKey = item.no_permohonan ?? item.noPermohonan;
        const statusPengikatan =
          item.statusPengikatan ??
          item.status_pengikatan ??
          item.statuspengikatan ??
          "";
        if (!noPermohonanKey || !statusPengikatan) return;
        if (!pengikatanMap.has(noPermohonanKey)) {
          pengikatanMap.set(noPermohonanKey, statusPengikatan);
        }
      });
      const analisisSet = new Set(
        dataAnalisisList.map((item) => item.no_permohonan ?? item.noPermohonan)
      );

      const normalizedList = listData.map((item) => {
        const noPermohonanKey = item.no_permohonan ?? item.noPermohonan;
        const permohonanData = permohonanMap.get(noPermohonanKey) || {};
        const rawJenisKredit =
          getFieldValue(permohonanData, [
            "jenisKredit",
            "jenis_kredit",
            "jenisPermohonan",
            "jenis_permohonan",
            "kode_jenis_kredit",
            "kodeJenisKredit",
          ]) ||
          getFieldValue(item, [
            "jenisKredit",
            "jenis_kredit",
            "jenisPermohonan",
            "jenis_permohonan",
            "kode_jenis_kredit",
            "kodeJenisKredit",
          ]);
        const jenisKreditLabel = resolveJenisKreditLabel(rawJenisKredit);
        const isKreditKonsumtif = isKreditKonsumtifPegawai(
          jenisKreditLabel || rawJenisKredit
        );
        const hasDataDiri = nikByPermohonan.has(noPermohonanKey);
        const hasDataPermohonan = permohonanSet.has(noPermohonanKey);
        const hasDataUsaha = usahaSet.has(noPermohonanKey);
        const hasDataInstansi = instansiSet.has(noPermohonanKey);
        const hasDataJaminan = jaminanSet.has(noPermohonanKey);
        const hasDataAnalisis = analisisSet.has(noPermohonanKey);
        const hasDataFasilitas = isKreditKonsumtif
          ? hasDataPermohonan && hasDataInstansi
          : hasDataPermohonan && hasDataUsaha;

        return {
          ...item,
          nik: nikByPermohonan.get(noPermohonanKey) || item.nik,
          hasDataDiri,
          hasDataPermohonan,
          hasDataUsaha,
          hasDataInstansi,
          hasDataJaminan,
          hasDataAnalisis,
          hasDataFasilitas,
          permohonanData,
          jenisKreditLabel,
          jenisPengikatan: pengikatanMap.get(noPermohonanKey) || "",
          caraPengembalianKredit: caraPengembalianMap.get(noPermohonanKey) || "",
          statusPengajuan: normalizeStatus(item.statusPengajuan),
        };
      });
      setListKredit(normalizedList);
    } catch (err) {
      console.error("FETCH DASHBOARD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchedKredit = listKredit.filter((item) => {
    if (!normalizedQuery) return true;
    const noPermohonan = String(item.no_permohonan ?? "").toLowerCase();
    const nik = String(item.nik ?? item.NIK ?? "").toLowerCase();
    return (
      noPermohonan.includes(normalizedQuery) ||
      nik.includes(normalizedQuery)
    );
  });

  const filteredKredit =
    filterStatus === "ALL"
      ? searchedKredit
      : searchedKredit.filter((item) => item.statusPengajuan === filterStatus);

  const tableKredit = filteredKredit.slice(0, 10);

  const openModal = (kredit) => {
    const permohonanData = kredit?.permohonanData || {};
    const keteranganValue = getFieldValue(kredit, [
      "keteranganPengajuan",
      "keterangan_pengajuan",
      "keterangan",
    ]);
    const statusPermohonanValue = getFieldValue(
      kredit,
      ["statusPermohonan", "status_permohonan", "statuspermohonan"],
      permohonanData.statusPermohonan || ""
    );
    const plafonValue = getFieldValue(
      kredit,
      ["plafonPermohonan", "plafon_permohonan", "plafon"],
      permohonanData.plafonPermohonan || ""
    );
    const sukuBungaValue = getFieldValue(
      kredit,
      ["sukuBunga", "suku_bunga", "sukuBungaTahun", "suku_bunga_tahun"],
      permohonanData.sukuBungaTahun || ""
    );
    const jenisPerhitunganValue = getFieldValue(
      kredit,
      ["jenisPerhitungan", "jenis_perhitungan", "perhitunganBunga", "perhitungan_bunga"],
      permohonanData.perhitunganBunga || ""
    );
    const namaAsuransiValue = getFieldValue(
      kredit,
      ["namaAsuransi", "nama_asuransi"],
      permohonanData.namaAsuransi || ""
    );
    const premiValue = getFieldValue(
      kredit,
      ["premi", "premiAsuransi", "premi_asuransi"],
      permohonanData.premi || ""
    );
    const namaNotarisValue = getFieldValue(
      kredit,
      ["namaNotaris", "nama_notaris"],
      permohonanData.namaNotaris || ""
    );
    const biayaAphtValue = getFieldValue(
      kredit,
      ["biayaAPHT", "biaya_apht", "biayaApht"],
      permohonanData.biayaAPHT || ""
    );
    const caraPengembalianValue = getFieldValue(
      kredit,
      [
        "caraPengembalianKredit",
        "cara_pengembalian_kredit",
        "caraPengembalian",
        "cara_pengembalian",
        "sumberPengembalian",
        "sumber_pengembalian",
      ],
      permohonanData.caraPengembalianKredit ||
        permohonanData.caraAngsuranKredit ||
        permohonanData.sumberPengembalian ||
        ""
    );
    setSelectedKredit(kredit);
    setKeterangan(keteranganValue || "");
    setStatusPengajuan(normalizeStatus(kredit.statusPengajuan));
    setStatusPermohonan(statusPermohonanValue);
    setPlafonPermohonan(plafonValue);
    setSukuBunga(sukuBungaValue);
    setJenisPerhitungan(jenisPerhitunganValue);
    setNamaAsuransi(namaAsuransiValue);
    setPremi(formatCurrencyFinal(premiValue));
    setNamaNotaris(namaNotarisValue);
    setBiayaAPHT(sanitizeNumericValue(biayaAphtValue));
    setCaraPengembalianKredit(caraPengembalianValue);
    setJenisPengikatan(kredit?.jenisPengikatan || "");
    setShowModal(true);
  };

  const [saving, setSaving] = useState(false);

const handleSave = async () => {
  if (!selectedKredit?.no_permohonan) {
    Swal.fire("Gagal", "No permohonan tidak ditemukan.", "error");
    return;
  }

  if (!keterangan.trim()) {
    Swal.fire("Perhatian", "Keterangan wajib diisi.", "warning");
    return;
  }

  const confirmSave = await Swal.fire({
    title: "Simpan Perubahan?",
    text: "Status pengajuan akan diperbarui.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Simpan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#9ca3af",
  });
  if (!confirmSave.isConfirmed) return;

  try {
    setSaving(true);
    Swal.fire({
      title: "Menyimpan...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
    await axios.patch(API_ENDPOINTS.generate.noPermohonanDetail(selectedKredit.no_permohonan), {
      keteranganPengajuan: keterangan,
      statusPengajuan: toApiStatus(statusPengajuan),
      statusPermohonan,
      plafonPermohonan,
      sukuBunga,
      jenisPerhitungan,
      namaAsuransi,
      premi: parseIdNumber(premi),
      namaNotaris,
      biayaAPHT,
      caraPengembalianKredit,
    });
    Swal.fire("Berhasil", "Status pengajuan berhasil diperbarui.", "success");
    fetchDashboard();
    setShowModal(false);
  } catch (err) {
    console.error("ERROR UPDATE:", err);
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Terjadi kesalahan saat menyimpan data.",
      "error"
    );
  } finally {
    setSaving(false);
  }
};


  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const isKomiteCabang = userRole === "komitecabang";
  const isOfficer = userRole === "officer";
  const showKeputusan = !isOfficer;
  const showEditData = !isKomiteCabang;
  const showJenisKredit = isOfficer;
  const tableColumnCount =
    6 +
    (showKeputusan ? 1 : 0) +
    (showEditData ? 1 : 0) +
    (showJenisKredit ? 1 : 0);

  return (
    <PageBackground>
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="pt-20 px-4 pb-10">
          {/* TITLE & STATS */}
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <FaBriefcase />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-gray-500">Monitoring Kredit</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-8">
            <StatCard title="Total Aktivitas" value={stats.totalAktivitas} icon={<FaUsers />} color="indigo" />
            <StatCard title="Kredit Aktif" value={stats.kreditAktif} icon={<FaFileInvoiceDollar />} color="green" />
            <StatCard title="Kredit Pengajuan" value={stats.kreditPengajuan} icon={<FaFileInvoiceDollar />} color="yellow" />
          </div>

          {/* FILTER */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Filter Status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <FilterButton label="Semua" active={filterStatus === "ALL"} onClick={() => setFilterStatus("ALL")} />
                  <FilterButton label="Kredit Aktif" active={filterStatus === "Approve"} onClick={() => setFilterStatus("Approve")} />
                  <FilterButton label="Proses Pengajuan" active={filterStatus === "Pending"} onClick={() => setFilterStatus("Pending")} />
                  <FilterButton label="Ditolak" active={filterStatus === "Reject"} onClick={() => setFilterStatus("Reject")} />
                </div>
              </div>
              <div className="w-full lg:w-72">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pencarian
                </label>
                <input
                  type="text"
                  placeholder="Cari No Permohonan / NIK..."
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-16">No</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Kode Antrian Permohonan</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">NIK</th>
                    {showJenisKredit ? (
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-48">Jenis Kredit</th>
                    ) : null}
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">Tanggal Masuk</th>
                    {showKeputusan ? (
                      <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-44">Keputusan Pengajuan</th>
                    ) : null}
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Tambah Data</th>
                    {showEditData ? (
                      <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Edit Data</th>
                    ) : null}
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">Status</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {tableKredit.length === 0 ? (
                    <tr>
                      <td
                        colSpan={tableColumnCount}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    tableKredit.map((item, i) => (
                      <tr
                        key={item.no_permohonan}
                        className="border-b even:bg-gray-50/60 hover:bg-indigo-50/40 transition-colors duration-200"
                      >
                        {/* No */}
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-500 text-center">
                          {i + 1}
                        </td>

                        {/* No Permohonan */}
                        <td className="px-4 sm:px-6 py-3 font-semibold text-gray-800">
                          {item.no_permohonan}
                        </td>

                        {/* NIK */}
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {item.nik || "-"}
                        </td>

                        {/* Jenis Kredit */}
                        {showJenisKredit ? (
                          <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                            {item.jenisKreditLabel || "-"}
                          </td>
                        ) : null}

                        {/* Tanggal */}
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 text-center">
                          {formatDate(item.createdAt)}
                        </td>

                        {/* Status Action */}
                        {showKeputusan ? (
                          <td className="px-4 sm:px-6 py-3 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={() => openModal(item)}
                                className="inline-flex items-center gap-1 px-4 py-1.5 
                                          bg-amber-100 text-amber-700 border border-amber-200 
                                          rounded-lg text-sm font-medium
                                          hover:bg-amber-200 transition"
                              >
                                Keputusan
                              </button>
                            </div>
                          </td>
                          ) : null}

                        {/* Action Buttons */}
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap items-center justify-center gap-2">

                            {!isKomiteCabang ? (
                              <>
                                <button
                                  onClick={() => {
                                    if (!item.hasDataDiri) {
                                      navigate(`/master-data/data-diri`);
                                    }
                                  }}
                                  disabled={item.hasDataDiri}
                                  className={`inline-flex items-center justify-center gap-1 
                                            min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                            ${
                                              item.hasDataDiri
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            }`}
                                >
                                  Data Diri
                                </button>
                                <button
                                  onClick={() => {
                                    if (!item.hasDataFasilitas) {
                                      navigate(
                                        `/master-data/data-permohonan/${encodeURIComponent(
                                          item.no_permohonan
                                        )}`
                                      );
                                    }
                                  }}
                                  disabled={item.hasDataFasilitas}
                                  className={`inline-flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                            ${
                                              item.hasDataFasilitas
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                            }`}
                                >
                                  Fasilitas
                                </button>
                                <button
                                  onClick={() => {
                                    if (!item.hasDataAnalisis) {
                                      navigate(
                                        `/analisis-nasabah/${encodeURIComponent(item.no_permohonan)}`
                                      );
                                    }
                                  }}
                                  disabled={item.hasDataAnalisis}
                                  className={`inline-flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                            ${
                                              item.hasDataAnalisis
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            }`}
                                >
                                  Analisis 5C
                                </button>
                              </>
                            ) : null}
                            <button
                              onClick={() =>
                                navigate(
                                  `/printPDF-nasabah/${encodeURIComponent(item.no_permohonan)}`
                                )
                              }
                              className="inline-flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                        bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            >
                              View Data
                            </button>
                          </div>
                        </td>

                        {/* Update Data */}
                        {showEditData ? (
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={() => {
                                  if (item.hasDataDiri) {
                                    navigate(`/update-data/data-diri/${encodeURIComponent(item.no_permohonan)}`);
                                  }
                                }}
                                disabled={!item.hasDataDiri}
                                className={`inline-flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                          ${
                                            item.hasDataDiri
                                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                          }`}
                              >
                                Data Diri
                              </button>
                              <button
                                  onClick={() => {
                                  if (item.hasDataFasilitas) {
                                    navigate(
                                      `/update-data/data-permohonan/${encodeURIComponent(
                                        item.no_permohonan
                                      )}`
                                    );
                                  }
                                }}
                                disabled={!item.hasDataFasilitas}
                                className={`inline-flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                          ${
                                            item.hasDataFasilitas
                                              ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                          }`}
                              >
                                Fasilitas
                              </button>
                              <button
                                onClick={() => {
                                  if (item.hasDataAnalisis) {
                                    navigate(
                                      `/update-data/analisis/${encodeURIComponent(item.no_permohonan)}`
                                    );
                                  }
                                }}
                                disabled={!item.hasDataAnalisis}
                                className={`inline-flex items-center justify-center gap-1 min-w-[120px] px-3 py-1.5 rounded-lg text-sm font-medium transition
                                          ${
                                            item.hasDataAnalisis
                                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                          }`}
                              >
                                Analisis 5C
                              </button>
                            </div>
                          </td>
                        ) : null}

                        {/* Status Badge */}
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <StatusBadge status={item.statusPengajuan} />
                        </td>
                      </tr>

                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ================= MODAL ACCEPT ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">Kesimpulan Dan rekomendasi Oleh Pimpinan Cabang</h2>

            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full border rounded-md p-2 mb-4 text-sm resize-none"
              rows={3}
              placeholder="Masukkan keterangan..."
            />

            <label className="block text-sm font-medium mb-1">Status Pengajuan</label>
            <select
              value={statusPengajuan}
              onChange={(e) => setStatusPengajuan(e.target.value)}
              className="w-full border rounded-md p-2 mb-6 text-sm"
            >
              <option value="Approve">Approve</option>
              <option value="Pending">Pending</option>
              <option value="Reject">Reject</option>
            </select>

            <label className="block text-sm font-medium mb-1">
              Status Permohonan
            </label>
            <select
              value={statusPermohonan}
              onChange={(e) => setStatusPermohonan(e.target.value)}
              className="w-full border rounded-md p-2 mb-6 text-sm"
            >
              <option value="">Pilih Status</option>
              <option value="Layak">Layak</option>
              <option value="Tidak Layak">Tidak Layak</option>
            </select>

            <label className="block text-sm font-medium mb-1">Plafon</label>
            <input
              type="text"
              value={plafonPermohonan}
              readOnly
              className="w-full border rounded-md p-2 mb-4 text-sm bg-gray-100 text-gray-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Suku Bunga
                </label>
                <input
                  type="text"
                  value={sukuBunga}
                  onChange={(e) => setSukuBunga(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jenis Perhitungan
                </label>
                <select
                  value={jenisPerhitungan}
                  onChange={(e) => setJenisPerhitungan(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="">Pilih</option>
                  <option value="Flat">Flat</option>
                  <option value="Anuitas">Anuitas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Asuransi
                </label>
                <input
                  type="text"
                  value={namaAsuransi}
                  onChange={(e) => setNamaAsuransi(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Premi</label>
                <input
                  type="text"
                  value={premi}
                  onChange={handleCurrencyChange(setPremi)}
                  onBlur={() => setPremi(formatCurrencyFinal(premi))}
                  inputMode="decimal"
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Notaris
                </label>
                <input
                  type="text"
                  value={namaNotaris}
                  onChange={(e) => setNamaNotaris(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {getPengikatanLabel(jenisPengikatan)}
                </label>
                <input
                  type="text"
                  value={biayaAPHT}
                  onChange={handleNumericChange(setBiayaAPHT)}
                  inputMode="numeric"
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
            </div>

            <label className="block text-sm font-medium mb-1">
              Cara Pengembalian Kredit
            </label>
            <input
              type="text"
              value={caraPengembalianKredit}
              onChange={(e) => setCaraPengembalianKredit(e.target.value)}
              className="w-full border rounded-md p-2 mb-6 text-sm"
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-md w-full sm:w-auto ${
                  saving ? "bg-gray-400 cursor-not-allowed" : "bg-success-600 hover:bg-green-700 text-white"
                }`}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageBackground>
  );
}

/* ================= COMPONENTS ================= */
const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
      active
        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`}
  >
    {label}
  </button>
);

const StatusBadge = ({ status }) => {
  if (status === "Approve") {
    return (
      <span className="bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
        Approve
      </span>
    );
  }

  if (status === "Reject") {
    return (
      <span className="bg-red-100 text-red-700 ring-1 ring-red-200 px-3 py-1 rounded-full text-xs font-semibold">
        Reject
      </span>
    );
  }

  if (status === "Pending") {
    return (
      <span className="bg-amber-100 text-amber-700 ring-1 ring-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
        Pending
      </span>
    );
  }

  return (
    <span className="bg-gray-100 text-gray-600 ring-1 ring-gray-200 px-3 py-1 rounded-full text-xs font-semibold">
      {String(status || "-").replace("_", " ")}
    </span>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`bg-${color}-100 text-${color}-600 p-3 rounded-xl`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</h2>
    </div>
  </div>
);
