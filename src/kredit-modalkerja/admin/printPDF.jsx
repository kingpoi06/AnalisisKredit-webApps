import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase } from "react-icons/fa";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

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

const formatTwoDecimals = (value) => {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(2);
};

const formatRupiahValue = (value, useDecimal = false) => {
  if (value === "" || value === null || value === undefined) return "-";
  const formatted = useDecimal ? formatIdNumber(value) : formatIdInteger(value);
  if (!formatted) return String(value);
  return `Rp. ${formatted}`;
};

const formatPercentValue = (value) => {
  if (value === "" || value === null || value === undefined) return "-";
  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return "-";
  return `${formatTwoDecimals(numericValue)} %`;
};

const formatRupiah = (value) => {
  if (value === "" || value === null || value === undefined) return "-";
  const formatted = formatIdInteger(value);
  if (!formatted) return String(value);
  return `Rp. ${formatted}`;
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatStatus = (value) => {
  if (!value) return "";
  return String(value).replace(/_/g, " ");
};

const formatRtRw = (rt, rw) => {
  const rtLabel = rt ? `RT ${rt}` : "";
  const rwLabel = rw ? `RW ${rw}` : "";
  return [rtLabel, rwLabel].filter(Boolean).join(", ");
};

const joinAddress = (parts) => parts.filter(Boolean).join(", ");

const formatTempatTanggal = (tempat, tanggal) => {
  if (!tempat && !tanggal) return "";
  const tanggalLabel = formatDate(tanggal);
  if (tempat && tanggalLabel) return `${tempat} / ${tanggalLabel}`;
  return tempat || tanggalLabel;
};

const normalizeList = (data) => {
  if (!Array.isArray(data)) return data ? [data] : [];
  return Array.isArray(data[0]) ? data.flat() : data;
};

const normalizeKey = (key) => String(key).replace(/_/g, "").toLowerCase();

const createEmptyJaminan = () => ({
  jenisjaminan: "",
  statusPengikatan: "",
  statusAgunan: "",
  plafonDiajukan: "",
  rerataNilaiPasar: "",
  nilaiNJOP: "",
  nilaiNJOPTanah: "",
  nilaiTaksiranKelurahan: "",
  nilaiLikuidasiBank: "",
  nilaiPasarDeposit: "",
  saldoTabunganDiblokirSebesarPlafon: "",
});

const JAMINAN_FIELD_MAP = Object.keys(createEmptyJaminan()).reduce(
  (acc, key) => {
    acc[normalizeKey(key)] = key;
    return acc;
  },
  {}
);

const normalizeJaminanScoreItem = (item) => {
  const mapped = createEmptyJaminan();
  Object.entries(item || {}).forEach(([rawKey, value]) => {
    const targetKey = JAMINAN_FIELD_MAP[normalizeKey(rawKey)];
    if (!targetKey) return;
    if (value !== undefined && value !== null) {
      mapped[targetKey] = value;
    }
  });
  return mapped;
};

const hasInputValue = (value) => String(value ?? "").trim() !== "";

const isOpaqueId = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return /^[0-9a-f]{20,}$/i.test(raw);
};

const computeAverage = (values, maxValue) => {
  if (!Array.isArray(values) || !values.length) return 0;
  const cappedValues = values.map((value) => {
    const numericValue = toNumber(value);
    if (typeof maxValue === "number") {
      return Math.min(Math.max(numericValue, 0), maxValue);
    }
    return Math.max(numericValue, 0);
  });
  const total = cappedValues.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const SLIK_GRADE_SCORE_MAP = {
  "Sangat Baik": 30,
  Baik: 22.5,
  Cukup: 15,
  Buruk: 7.5,
  "Sangat Buruk": 0,
};

const isKreditKonsumtifPegawai = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  if (normalized.includes("kredit konsumtif")) return true;
  return /\b123\b/.test(normalized);
};

const getOptionLabel = (value, options) => {
  const key = String(value ?? "").trim();
  if (!key) return "";
  return options[key] ?? key;
};

const CHARACTER_OPTION_LABELS = {
  statusKepemilikanTempatTinggal: {
    "4": "Milik Sendiri",
    "3": "Keluarga",
    "2": "Sewa",
    "1": "Menumpang",
  },
  lamaTinggalAlamatSaatIni: {
    "4": "Lebih dari ata tepat 10 Tahun",
    "3": "5 sampai Kurang dari 10 Tahun",
    "2": "2 samppai Kurang dari 5 Tahun",
    "1": "Kurang dari 2 Tahun",
  },
  frekuensiPindahRumah: {
    "4": "Tidak pernah",
    "3": "1x",
    "2": "2x",
    "1": "Lebih dari 2x",
  },
  kepatuhanProsesAnalisaKredit: {
    "4": "Patuh penuh",
    "3": "Telat ringan",
    "2": "Telat berulang",
    "1": "Tidak patuh",
  },
};

const CAPITAL_OPTION_LABELS = {
  konsumtif: {
    sumberModalAwalUsaha: {
      "4": "Gaji",
      "3": "Tunjangan Tetap (TPP,Sertifikasi,Jaspel)",
      "1": "Penghasilan lainnya tidak tetap",
    },
    buktiKeterlibatanModalSendiri: {
      "4": "Ada signifikan",
      "3": "Ada terbatas",
      "2": "Sangat terbatas",
      "1": "Tidak ada",
    },
    asetProduktifPribadi: {
      "4": "<=30%",
      "3": ">30-40%",
      "2": ">40-50%",
      "1": ">50%",
    },
  },
  produktif: {
    sumberModalAwalUsaha: {
      "4": "100% sendiri",
      "3": ">50% sendiri",
      "2": "<50% sendiri",
      "1": "Semua pinjaman",
    },
    buktiKeterlibatanModalSendiri: {
      "4": "Aset atas nama sendiri",
      "3": "Campuran",
      "2": "Mayoritas pinjaman",
      "1": "Tidak terbukti",
    },
    asetProduktifPribadi: {
      "4": "Ada signifikan",
      "3": "Ada terbatas",
      "2": "Sangat terbatas",
      "1": "Tidak ada",
    },
  },
};

const CAPACITY_OPTION_LABELS = {
  konsumtif: {
    lamaUsahaBidangSama: {
      "4": ">=5 th",
      "3": "3-<5 th",
      "2": "1-<3 th",
      "1": "<1 th",
    },
    statusLokasiUsaha: {
      "4": "Tetap (ASN/BUMN/Karyawan tetap)",
      "3": "Kontrak jangka panjang",
      "2": "Kontrak pendek",
      "1": "Tidak tetap",
    },
    ketergantunganTerhadapMusim: {
      "4": "Sangat stabil",
      "3": "Cukup stabil",
      "2": "Fluktuatif",
      "1": "Tidak stabil",
    },
  },
  produktif: {
    lamaUsahaBidangSama: {
      "4": "Lebih Dari atau tepat mencapai 5 Tahun",
      "3": "3 Hingga Kurang dari 5 Tahun",
      "2": "1 Hingga Kurang dari 3 Tahun",
      "1": "Kurang dari 1 Tahun",
    },
    statusLokasiUsaha: {
      "4": "Milik sendiri",
      "3": "Lebih dari atau tepat mencapai 3 Tahun",
      "2": "Kurang dari 3 Tahun",
      "1": "Tidak tetap",
    },
    ketergantunganTerhadapMusim: {
      "4": "Tidak",
      "3": "Ringan",
      "2": "Sedang",
      "1": "Tinggi",
    },
  },
};

const HPP_LABELS = {
  "0.7": "Dagang 70%",
  "0.2": "Jasa 20%",
};

const JENIS_KREDIT_LABELS = {
  "121": "Kredit Modal Kerja",
  "122": "Kredit Investasi",
  "123": "Kredit Konsumtif / Pegawai",
};

const PENGUSUL_NAME_KEYS = [
  "namaPengusul",
  "nama_pengusul",
  "namaAO",
  "nama_ao",
  "namaAccountOfficer",
  "nama_account_officer",
  "accountOfficer",
  "account_officer",
  "namaPetugas",
  "nama_petugas",
  "petugasInput",
  "petugas_input",
  "inputBy",
  "input_by",
  "createdBy",
  "created_by",
  "createdUser",
  "created_user",
  "userInput",
  "user_input",
  "namaUser",
  "nama_user",
  "namaPegawai",
  "nama_pegawai",
];

const USER_NAME_KEYS = [
  "namaLengkap",
  "namalengkap",
  "nama_lengkap",
  "name",
  "nama",
  "namaPegawai",
  "nama_pegawai",
];

const PENGUSUL_KD_KEYS = [
  "kdPegawai",
  "kdpegawai",
  "kd_pegawai",
  "kodePegawai",
  "kode_pegawai",
  "kdPegawaiPengusul",
  "kd_pegawai_pengusul",
  "kdPengusul",
  "kd_pengusul",
  "kdPetugas",
  "kd_petugas",
];

const CABANG_KANTOR_KEYS = ["cabangKantor", "cabang_kantor", "cabangkantor"];

const formatJenisKreditLabel = (value) => {
  const key = String(value ?? "").trim();
  if (!key) return "";
  return JENIS_KREDIT_LABELS[key] ?? formatStatus(key);
};

const chunkArray = (items, size) => {
  if (!Array.isArray(items) || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const matchByPermohonan = (list, noPermohonan) =>
  list.find(
    (item) => String(item?.no_permohonan ?? item?.noPermohonan) === noPermohonan
  );

const getFieldValue = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};

const fetchPegawaiNameByKd = async (kdPegawaiValue) => {
  if (!kdPegawaiValue) return "";
  try {
    const response = await axios.get(
      API_ENDPOINTS.users.detail(kdPegawaiValue)
    );
    const payload =
      response.data?.Data ?? response.data?.data ?? response.data ?? {};
    const userPayload = Array.isArray(payload) ? payload[0] : payload;
    if (!userPayload || typeof userPayload !== "object") return "";
    return getFieldValue(userPayload, USER_NAME_KEYS);
  } catch {
    return "";
  }
};

const getTotalNilaiNJOP = (item) => {
  const hasTanah = hasInputValue(item?.nilaiNJOPTanah);
  const totalTanah = toNumber(item?.nilaiNJOPTanah);
  if (hasTanah) {
    return { total: totalTanah, hasValue: true };
  }
  const fallback = toNumber(item?.nilaiNJOP);
  return { total: fallback, hasValue: hasInputValue(item?.nilaiNJOP) };
};

const getTotalNilaiAgunan = (item) => {
  const hasParts =
    hasInputValue(item?.nilaiTaksiranKelurahan) ||
    hasInputValue(item?.nilaiLikuidasiBank);
  const total =
    toNumber(item?.nilaiTaksiranKelurahan) +
    toNumber(item?.nilaiLikuidasiBank);
  return { total, hasValue: hasParts };
};

const getNilaiRerataPasar = (item) => {
  const totalNjop = getTotalNilaiNJOP(item);
  const totalAgunan = getTotalNilaiAgunan(item);
  const hasValue = totalNjop.hasValue || totalAgunan.hasValue;
  if (!hasValue) return { total: 0, hasValue: false };
  const total = (totalNjop.total + totalAgunan.total) / 2;
  return { total, hasValue: true };
};

const getJaminanApprovalStatus = (item, plafonPermohonan) => {
  const explicitStatus = String(item?.statusAgunan ?? "").trim();
  if (explicitStatus) return explicitStatus;

  const plafonValue = hasInputValue(item?.plafonDiajukan)
    ? item.plafonDiajukan
    : plafonPermohonan;
  const numericPlafon = toNumber(plafonValue);
  if (!numericPlafon) return "";

  const jenis = String(item?.jenisjaminan ?? "").toLowerCase();
  const minHakTanggungan = numericPlafon * 1.25;

  if (jenis === "sertifikat") {
    const rerataPasar = getNilaiRerataPasar(item);
    if (!rerataPasar.hasValue) return "";
    return rerataPasar.total >= minHakTanggungan ? "Approve" : "Reject";
  }

  if (jenis === "deposito") {
    const nilaiDeposit = toNumber(item?.nilaiPasarDeposit);
    if (!nilaiDeposit) return "";
    return nilaiDeposit >= numericPlafon ? "Approve" : "Reject";
  }

  if (jenis === "tabungan") {
    const saldoTabungan = hasInputValue(item?.saldoTabunganDiblokirSebesarPlafon)
      ? toNumber(item?.saldoTabunganDiblokirSebesarPlafon)
      : numericPlafon;
    if (!saldoTabungan) return "";
    return saldoTabungan >= numericPlafon ? "Approve" : "Reject";
  }

  const rerataNilai = toNumber(item?.rerataNilaiPasar);
  if (!rerataNilai) return "";
  return rerataNilai >= minHakTanggungan ? "Approve" : "Reject";
};

const getAgunanScoreForItem = (item, status) => {
  if (String(status).toLowerCase() !== "approve") return 0;
  const jenis = String(item?.jenisjaminan ?? "").toLowerCase();
  if (jenis === "sertifikat") {
    const pengikatan = String(item?.statusPengikatan ?? "").toUpperCase();
    if (pengikatan === "SKMHT") return 9;
    return 12;
  }
  return 15;
};

const getSlikStorageKey = (permohonan) =>
  permohonan ? `slik:${permohonan}` : "";

const readSlikStorageEntries = (permohonan) => {
  const storageKey = getSlikStorageKey(permohonan);
  if (!storageKey) return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Object.entries(parsed)
      .map(([index, value]) => ({
        index: Number(index),
        fileName: value?.fileName ?? "",
        table: value?.table ?? { headers: [], rows: [] },
        source: value?.source ?? "jaminan",
      }))
      .sort((a, b) => a.index - b.index);
  } catch {
    return [];
  }
};

const normalizeSlikKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const parseSlikAmount = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const parseSlikKualitas = (value) => {
  const match = String(value ?? "").match(/\b([1-5])\b/);
  return match ? Number(match[1]) : null;
};

const findRowValueByPatterns = (rowMap, patterns) => {
  if (!rowMap) return "";
  for (const pattern of patterns) {
    if (pattern in rowMap) return rowMap[pattern] ?? "";
  }
  const keys = Object.keys(rowMap);
  for (const key of keys) {
    if (patterns.some((pattern) => key.includes(pattern))) {
      return rowMap[key] ?? "";
    }
  }
  return "";
};

const buildSlikRowMaps = (slikTable) => {
  const rows = slikTable?.rows ?? [];
  if (!rows.length) return [];

  const isObjectRows = rows.some(
    (row) => row && typeof row === "object" && !Array.isArray(row)
  );

  if (isObjectRows) {
    return rows.map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return {};
      const map = {};
      const hasValue = (val) =>
        val !== null && val !== undefined && String(val).trim() !== "";
      const collectKeys = (value) => {
        if (!value) return;
        if (Array.isArray(value)) {
          value.forEach((item) => collectKeys(item));
          return;
        }
        if (typeof value !== "object") return;
        Object.entries(value).forEach(([key, child]) => {
          const normalizedKey = normalizeSlikKey(key);
          if (child && typeof child === "object" && !Array.isArray(child)) {
            collectKeys(child);
            return;
          }
          const existing = map[normalizedKey];
          if (
            !(normalizedKey in map) ||
            (!hasValue(existing) && hasValue(child))
          ) {
            map[normalizedKey] = child;
          }
        });
      };
      collectKeys(row);
      return map;
    });
  }

  const headers = slikTable?.headers ?? [];
  const rowLengths = rows.map((row) => (Array.isArray(row) ? row.length : 0));
  const columnCount = Math.max(headers.length, ...rowLengths, 0);
  const headerLabels =
    headers.length > 0
      ? headers
      : Array.from({ length: columnCount }, (_, index) => `Kolom ${index + 1}`);
  const normalizedHeaders = headerLabels.map(normalizeSlikKey);

  return rows.map((row) => {
    const cells = Array.isArray(row) ? row : [];
    const map = {};
    normalizedHeaders.forEach((key, index) => {
      if (!key) return;
      if (cells[index] !== undefined) {
        map[key] = cells[index];
      }
    });
    return map;
  });
};

const hasSlikRowData = (rowMap) =>
  !!rowMap &&
  Object.values(rowMap).some((value) => String(value ?? "").trim() !== "");

const computeSlikSummary = (entries) => {
  let totalAktivitas = 0;
  const kualitasValues = [];
  const kualitasCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let kualitasKet1 = "";
  let hasTunggakan = false;

  entries.forEach((entry) => {
    const rowMaps = buildSlikRowMaps(entry?.table);
    rowMaps.forEach((row) => {
      if (!hasSlikRowData(row)) return;
      totalAktivitas += 1;
      const kualitasValue = findRowValueByPatterns(row, ["kualitas"]);
      const kualitasNumber = parseSlikKualitas(kualitasValue);
      if (kualitasNumber !== null) {
        kualitasValues.push(kualitasNumber);
        if (kualitasCounts[kualitasNumber] !== undefined) {
          kualitasCounts[kualitasNumber] += 1;
        }
        if (kualitasNumber === 1 && !kualitasKet1) {
          const ketValue = String(
            findRowValueByPatterns(row, ["kualitasket"]) ?? ""
          ).trim();
          if (ketValue) kualitasKet1 = ketValue;
        }
      }

      if (!hasTunggakan) {
        const tunggakanValue = findRowValueByPatterns(row, [
          "jumlahharitunggakan",
          "lamatunggakan",
          "tunggakan",
        ]);
        const tunggakanDays = parseSlikAmount(tunggakanValue);
        if (tunggakanDays > 0) {
          hasTunggakan = true;
        }
      }
    });
  });

  const totalAktivitasLabel = totalAktivitas ? String(totalAktivitas) : "";

  const totalKualitas = kualitasValues.length;
  const kualitasSatu = kualitasValues.filter((value) => value === 1).length;
  const percentKualitas1 = totalKualitas
    ? (kualitasSatu / totalKualitas) * 100
    : 0;
  const hasQuality345 = kualitasValues.some((value) => value >= 3);

  let gradeLabel = "";
  if (totalKualitas) {
    if (percentKualitas1 >= 85) {
      gradeLabel = "Sangat Baik";
    } else if (
      percentKualitas1 >= 70 &&
      percentKualitas1 < 85 &&
      !hasQuality345
    ) {
      gradeLabel = "Baik";
    } else if (percentKualitas1 >= 50) {
      gradeLabel = "Cukup";
    } else if (percentKualitas1 >= 25) {
      gradeLabel = "Buruk";
    } else {
      gradeLabel = "Sangat Buruk";
    }
  }

  let statusSlik = "";
  if (gradeLabel) {
    statusSlik =
      gradeLabel.startsWith("Sangat Baik") || gradeLabel.startsWith("Baik")
        ? "Approve"
        : "Reject";
  }

  return {
    totalAktivitas,
    totalAktivitasLabel,
    statusSlik,
    gradeLabel,
    totalKualitas,
    kualitasCounts,
    kualitasKet1,
    hasTunggakan,
    hasQuality345,
    percentKualitas1,
  };
};

const normalizeJaminanItem = (item) => ({
  jenis: getFieldValue(item, ["jenisjaminan", "jenisJaminan", "jenis_jaminan"]),
  buktiKepemilikan: getFieldValue(item, [
    "deskripsiAgunan",
    "deskripsi_agunan",
    "buktiHakMilik",
    "bukti_hak_milik",
  ]),
  namaPemilik: getFieldValue(item, [
    "namaPemilikBPKB",
    "namaPemilik",
    "nama_pemilik",
    "namaDebitur",
    "nama_debitur",
  ]),
  lokasi: getFieldValue(item, ["letak", "lokasiJaminan", "lokasi_jaminan"]),
  nilaiAgunan: getFieldValue(item, [
    "taksiranPasar",
    "taksiran_pasar",
    "rerataNilaiPasar",
    "rerata_nilai_pasar",
    "nilaiPasarDeposit",
    "nilai_pasar_deposit",
    "saldoTabunganDiblokirSebesarPlafon",
    "saldo_tabungan_diblokir_sebesar_plafon",
    "nilaiNJOP",
    "nilai_njop",
  ]),
  safetyMargin: getFieldValue(item, ["safetyMargin", "safety_margin"]),
  hubungan: getFieldValue(item, [
    "hubungandengannasabah",
    "hubunganDenganNasabah",
    "hubungan_dengan_nasabah",
  ]),
  noIdAgunan: getFieldValue(item, [
    "noidAgunan",
    "noid_agunan",
    "noIdAgunan",
    "noid",
  ]),
  noSertifikat: getFieldValue(item, [
    "noSertifikat",
    "no_sertifikat",
    "nosertifikat",
  ]),
  noBPKB: getFieldValue(item, ["noBPKB", "no_bpkb"]),
  deskripsi: getFieldValue(item, ["deskripsiAgunan", "deskripsi_agunan"]),
  letak: getFieldValue(item, ["letak"]),
  luas: getFieldValue(item, ["luas"]),
  nilaiNJOP: getFieldValue(item, ["nilaiNJOP", "nilai_njop"]),
  taksiranPasar: getFieldValue(item, [
    "taksiranPasar",
    "taksiran_pasar",
    "rerataNilaiPasar",
    "rerata_nilai_pasar",
  ]),
  nilaiLikuidasi: getFieldValue(item, ["nilaiLikuidasi", "nilai_likuidasi"]),
  statusPengikatan: getFieldValue(item, [
    "statusPengikatan",
    "status_pengikatan",
  ]),
  statusAgunan: getFieldValue(item, ["statusAgunan", "status_agunan"]),
  pengikatanJaminan: getFieldValue(item, [
    "pengikatanJaminan",
    "pengikatan_jaminan",
  ]),
});

const InfoRow = ({ label, value }) => (
  <div className="grid grid-cols-12 gap-1 text-[11px] leading-relaxed">
    <div className="col-span-5 text-slate-600">{label}</div>
    <div className="col-span-1 text-slate-600">:</div>
    <div className="col-span-6 text-slate-900 whitespace-pre-line">
      {value !== "" && value !== null && value !== undefined ? value : "-"}
    </div>
  </div>
);

const InfoRowWide = ({ label, value }) => (
  <div className="grid grid-cols-12 gap-1 text-[11px] leading-relaxed">
    <div className="col-span-2 text-slate-600">{label}</div>
    <div className="col-span-1 text-slate-600">:</div>
    <div className="col-span-9 text-slate-900 whitespace-pre-line">
      {value !== "" && value !== null && value !== undefined ? value : "-"}
    </div>
  </div>
);

const InfoRowCompact = ({ label, value }) => (
  <div className="flex gap-2 text-[11px] leading-snug">
    <div className="min-w-[120px] text-slate-600">{label}</div>
    <div className="text-slate-600">:</div>
    <div className="flex-1 text-slate-900 whitespace-pre-line">
      {value !== "" && value !== null && value !== undefined ? value : "-"}
    </div>
  </div>
);

const CompactSectionTitle = ({ children }) => (
  <div className="border-b border-slate-300 pb-1">
    <h3 className="text-[11px] font-semibold uppercase text-slate-700">
      {children}
    </h3>
  </div>
);

const PageHeader = ({
  namaBank,
  noPermohonan,
  pageNumber,
  alamatKantor,
  telpKantor,
  hidePageNumber = false,
}) => (
  <div className="border-b-2 border-black pb-3">
    <div className="grid grid-cols-12 items-start gap-3">
      <div className="col-span-7 flex items-start gap-3">
        <img
          src="/bpr.png"
          alt="Logo BPR"
          className="h-16 w-16 rounded-xl border-0 bg-white p-1 object-contain shadow-none"
        />
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold uppercase tracking-wide text-slate-800">
            {namaBank}
          </p>
          <p className="text-[10px] leading-snug text-slate-600">
            {alamatKantor || "-"}
          </p>
          <p className="text-[10px] text-slate-600">
            Telp. {telpKantor || "-"}
          </p>
        </div>
      </div>
      <div className="col-span-5 text-right">
        <p className="text-[12px] font-semibold uppercase text-slate-800">
          Nota Analisa Kredit Mikro
        </p>
        <p className="text-[10px] text-slate-600">
          No. {noPermohonan || "-"}
        </p>
        {!hidePageNumber ? (
          <p className="text-[10px] text-slate-600">Halaman {pageNumber}</p>
        ) : null}
      </div>
    </div>
  </div>
);

export default function PrintPDF() {
  const navigate = useNavigate();
  const { no_permohonan } = useParams();
  const contentRef = useRef(null);
  const [userInfo, setUserInfo] = useState({
    jabatan: "",
    namaLengkap: "",
    role: "",
    kodeKantor: "",
    cabangKantor: "",
    alamatKantor: "",
    telpKantor: "",
    kdpegawai: "",
  });
  const [pengusulName, setPengusulName] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    permohonan: null,
    permohonanDetail: null,
    dataDiri: null,
    dataPermohonan: null,
    dataUsaha: null,
    dataAnalisis: null,
    dataJaminan: [],
  });
  const [pageBlocks, setPageBlocks] = useState([]);
  const measurePageRef = useRef(null);
  const measureHeaderRef = useRef(null);
  const measureIntroRef = useRef(null);
  const measureUsahaUploadsRef = useRef(null);
  const measureAnalisa5CRef = useRef(null);
  const measureAnalisaDetailRefs = useRef([]);
  const measureAgunanBlockRefs = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    let isActive = true;
    const loadUserProfile = async (kdPegawaiValue) => {
      if (!kdPegawaiValue) return;
      try {
        const response = await axios.get(
          API_ENDPOINTS.users.detail(kdPegawaiValue)
        );
        const payload =
          response.data?.Data ?? response.data?.data ?? response.data ?? {};
        const userPayload = Array.isArray(payload) ? payload[0] : payload;
        if (!userPayload || typeof userPayload !== "object") return;
        const alamatKantorDetail = getFieldValue(userPayload, [
          "alamatKantor",
          "alamat_kantor",
          "alamatkantor",
          "alamatCabang",
          "alamat_cabang",
          "alamatKantorCabang",
          "alamat_kantor_cabang",
          "alamat",
        ]);
        const telpKantorDetail = getFieldValue(userPayload, [
          "telpKantor",
          "telp_kantor",
          "telpkantor",
          "teleponKantor",
          "telepon_kantor",
          "noTelpKantor",
          "no_telp_kantor",
          "nomorTelpKantor",
          "nomor_telp_kantor",
          "telp",
          "telepon",
        ]);
        const cabangKantorDetail = getFieldValue(
          userPayload,
          CABANG_KANTOR_KEYS
        );
        if (!isActive) return;
        if (alamatKantorDetail || telpKantorDetail || cabangKantorDetail) {
          setUserInfo((prev) => ({
            ...prev,
            alamatKantor: alamatKantorDetail || prev.alamatKantor,
            telpKantor: telpKantorDetail || prev.telpKantor,
            cabangKantor: cabangKantorDetail || prev.cabangKantor,
          }));
        }
      } catch {
        if (!isActive) return;
      }
    };

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      const roleValue =
        decoded?.role || decoded?.user?.role || decoded?.jabatan || "";
      const kodeKantorValue =
        getFieldValue(decoded, [
          "kodeKantor",
          "kode_kantor",
          "kodekantor",
          "kodeCabang",
          "kode_cabang",
        ]) ||
        getFieldValue(decoded?.user, [
          "kodeKantor",
          "kode_kantor",
          "kodekantor",
          "kodeCabang",
          "kode_cabang",
        ]);
      const cabangKantorValue =
        getFieldValue(decoded, CABANG_KANTOR_KEYS) ||
        getFieldValue(decoded?.user, CABANG_KANTOR_KEYS);
      const alamatKantorValue =
        getFieldValue(decoded, [
          "alamatKantor",
          "alamat_kantor",
          "alamatkantor",
          "alamatCabang",
          "alamat_cabang",
          "alamatKantorCabang",
          "alamat_kantor_cabang",
          "alamat",
        ]) ||
        getFieldValue(decoded?.user, [
          "alamatKantor",
          "alamat_kantor",
          "alamatkantor",
          "alamatCabang",
          "alamat_cabang",
          "alamatKantorCabang",
          "alamat_kantor_cabang",
          "alamat",
        ]);
      const kdPegawaiValue =
        getFieldValue(decoded, [
          "kdpegawai",
          "kd_pegawai",
          "kdPegawai",
          "kdpagawai",
          "kodePegawai",
          "kode_pegawai",
        ]) ||
        getFieldValue(decoded?.user, [
          "kdpegawai",
          "kd_pegawai",
          "kdPegawai",
          "kdpagawai",
          "kodePegawai",
          "kode_pegawai",
        ]);
      const telpKantorValue =
        getFieldValue(decoded, [
          "telpKantor",
          "telp_kantor",
          "telpkantor",
          "teleponKantor",
          "telepon_kantor",
          "noTelpKantor",
          "no_telp_kantor",
          "nomorTelpKantor",
          "nomor_telp_kantor",
          "telp",
          "telepon",
        ]) ||
        getFieldValue(decoded?.user, [
          "telpKantor",
          "telp_kantor",
          "telpkantor",
          "teleponKantor",
          "telepon_kantor",
          "noTelpKantor",
          "no_telp_kantor",
          "nomorTelpKantor",
          "nomor_telp_kantor",
          "telp",
          "telepon",
        ]);

      setUserInfo({
        jabatan: decoded?.jabatan || decoded?.role || "",
        namaLengkap:
          decoded?.namaLengkap ||
          decoded?.namalengkap ||
          decoded?.nama_lengkap ||
          decoded?.name ||
          "",
        role: roleValue,
        kodeKantor: kodeKantorValue,
        cabangKantor: cabangKantorValue,
        alamatKantor: alamatKantorValue,
        telpKantor: telpKantorValue,
        kdpegawai: kdPegawaiValue,
      });
      loadUserProfile(kdPegawaiValue);
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
    return () => {
      isActive = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!no_permohonan) return;

    const fetchData = async () => {
      try {
        const [
          permohonanRes,
          permohonanDetailRes,
          dataDiriRes,
          dataPermohonanRes,
          dataUsahaRes,
          dataJaminanRes,
          dataAnalisisRes,
        ] = await Promise.all([
          axios.get(API_ENDPOINTS.generate.noPermohonan()),
          axios
            .get(API_ENDPOINTS.generate.noPermohonanDetail(no_permohonan))
            .catch(() => ({ data: {} })),
          axios.get(API_ENDPOINTS.datanasabah.dataDiri.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataUsaha.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataJaminan.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataAnalisis.list()),
        ]);

        const permohonanList = normalizeList(permohonanRes.data?.Data);
        const permohonanDetailPayload =
          permohonanDetailRes.data?.Data ??
          permohonanDetailRes.data?.data ??
          permohonanDetailRes.data ??
          {};
        const permohonanDetail = Array.isArray(permohonanDetailPayload)
          ? permohonanDetailPayload[0]
          : permohonanDetailPayload;
        const dataDiriList = normalizeList(dataDiriRes.data?.Data);
        const dataPermohonanList = normalizeList(
          dataPermohonanRes.data?.Data
        );
        const dataUsahaList = normalizeList(dataUsahaRes.data?.Data);
        const dataJaminanList = normalizeList(dataJaminanRes.data?.Data);
        const dataAnalisisList = normalizeList(dataAnalisisRes.data?.Data);

        setReportData({
          permohonan: matchByPermohonan(permohonanList, no_permohonan),
          permohonanDetail:
            permohonanDetail && typeof permohonanDetail === "object"
              ? permohonanDetail
              : null,
          dataDiri: matchByPermohonan(dataDiriList, no_permohonan),
          dataPermohonan: matchByPermohonan(dataPermohonanList, no_permohonan),
          dataUsaha: matchByPermohonan(dataUsahaList, no_permohonan),
          dataAnalisis: matchByPermohonan(dataAnalisisList, no_permohonan),
          dataJaminan: dataJaminanList.filter(
            (item) =>
              String(item?.no_permohonan ?? item?.noPermohonan) ===
              no_permohonan
          ),
        });
      } catch (error) {
        Swal.fire(
          "Gagal",
          error.response?.data?.msg || "Gagal mengambil data PDF",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [no_permohonan]);

  const handleDownload = async () => {
    if (!contentRef.current) return;

    await new Promise((resolve) => setTimeout(resolve, 0));
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const pages = Array.from(
      contentRef.current.querySelectorAll(".pdf-page")
    );
    if (!pages.length) return;

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const scale = Math.min(
        pdfWidth / canvas.width,
        pdfHeight / canvas.height
      );
      const renderWidth = canvas.width * scale;
      const renderHeight = canvas.height * scale;
      const offsetX = (pdfWidth - renderWidth) / 2;
      const offsetY = (pdfHeight - renderHeight) / 2;

      pdf.addImage(
        imgData,
        "PNG",
        offsetX,
        offsetY,
        renderWidth,
        renderHeight
      );
      if (index < pages.length - 1) {
        pdf.addPage();
      }
    }

    pdf.save(`Nota-Analisa-${no_permohonan}.pdf`);
  };

  const permohonan = reportData.permohonan || {};
  const permohonanDetail = reportData.permohonanDetail || {};
  const dataDiri = reportData.dataDiri || {};
  const dataPermohonan = reportData.dataPermohonan || {};
  const dataUsaha = reportData.dataUsaha || {};
  const dataAnalisis = reportData.dataAnalisis || {};
  const dataJaminan = reportData.dataJaminan || [];
  const pengusulKdPegawai =
    getFieldValue(permohonanDetail, PENGUSUL_KD_KEYS) ||
    getFieldValue(permohonan, PENGUSUL_KD_KEYS) ||
    getFieldValue(dataPermohonan, PENGUSUL_KD_KEYS);

  useEffect(() => {
    let isActive = true;
    const loadPengusulName = async () => {
      if (!pengusulKdPegawai) {
        setPengusulName("");
        return;
      }
      const fetchedName = await fetchPegawaiNameByKd(pengusulKdPegawai);
      if (!isActive) return;
      setPengusulName(fetchedName || "");
    };

    loadPengusulName();

    return () => {
      isActive = false;
    };
  }, [pengusulKdPegawai]);
  const dataDiriFields = {
    nik: getFieldValue(dataDiri, ["nik", "NIK"]),
    namaLengkap: getFieldValue(dataDiri, [
      "namaLengkap",
      "namalengkap",
      "nama_lengkap",
    ]),
    tempatLahir: getFieldValue(dataDiri, [
      "tempatLahir",
      "tempatlahir",
      "tempat_lahir",
    ]),
    tanggalLahir: getFieldValue(dataDiri, [
      "tanggalLahir",
      "tanggallahir",
      "tanggal_lahir",
    ]),
    jenisKelamin: getFieldValue(dataDiri, [
      "jenisKelamin",
      "jeniskelamin",
      "jenis_kelamin",
    ]),
    statusPerkawinan: getFieldValue(dataDiri, [
      "statusPerkawinan",
      "statusperkawinan",
      "status_perkawinan",
    ]),
    agama: getFieldValue(dataDiri, ["agama"]),
    kewarganegaraan: getFieldValue(dataDiri, ["kewarganegaraan"]),
    kontakPribadi: getFieldValue(dataDiri, [
      "kontakPribadi",
      "noHP",
      "nohp",
      "kontak_pribadi",
    ]),
    anakTanggungan: getFieldValue(dataDiri, [
      "anakTanggungan",
      "anaktanggungan",
      "anak_tanggungan",
    ]),
    jenisPekerjaan: getFieldValue(dataDiri, [
      "jenispekerjaan",
      "jenisPekerjaan",
      "jenis_pekerjaan",
      "pekerjaan",
    ]),
    namaIbuKandung: getFieldValue(dataDiri, [
      "namaIbuKandung",
      "namaibukandung",
      "nama_ibu_kandung",
    ]),
    alamatLengkap: getFieldValue(dataDiri, [
      "alamatLengkap",
      "alamatlengkap",
      "alamat_lengkap",
    ]),
    alamatKtp: getFieldValue(dataDiri, [
      "alamatKtp",
      "alamat_ktp",
      "alamatKTP",
      "alamatktp",
    ]),
    rt: getFieldValue(dataDiri, ["rt"]),
    rw: getFieldValue(dataDiri, ["rw"]),
    desaKelurahan: getFieldValue(dataDiri, [
      "desaKelurahan",
      "desakelurahan",
      "desa_kelurahan",
    ]),
    kecamatan: getFieldValue(dataDiri, ["kecamatan"]),
    kabupaten: getFieldValue(dataDiri, [
      "kabupaten",
      "kabupatenKota",
      "kabupaten_kota",
    ]),
    provinsi: getFieldValue(dataDiri, ["provinsi"]),
    titikmaps: getFieldValue(dataDiri, ["titikmaps", "titikMaps"]),
    nikPenanggungJawab: getFieldValue(dataDiri, [
      "nikPenanggungJawab",
      "nikpenanggungjawab",
      "nik_penanggung_jawab",
    ]),
    namaPenanggungJawab: getFieldValue(dataDiri, [
      "namaPenanggungJawab",
      "namapenanggungjawab",
      "nama_penanggung_jawab",
    ]),
    pekerjaanPenanggungJawab: getFieldValue(dataDiri, [
      "pekerjaanPenanggungJawab",
      "pekerjaanpenanggungjawab",
      "pekerjaan_penanggung_jawab",
    ]),
    tempatLahirPenanggungJawab: getFieldValue(dataDiri, [
      "tempatLahirPenanggungJawab",
      "tempatlahirpenanggungjawab",
      "tempat_lahir_penanggung_jawab",
    ]),
    tanggalLahirPenanggungJawab: getFieldValue(dataDiri, [
      "tanggalLahirPenanggungJawab",
      "tanggallahirpenanggungjawab",
      "tanggal_lahir_penanggung_jawab",
    ]),
    noHPPenanggungJawab: getFieldValue(dataDiri, [
      "noHPPenanggungJawab",
      "nohpPenanggungJawab",
      "nohp_penanggung_jawab",
    ]),
    hubunganDenganPemohon: getFieldValue(dataDiri, [
      "hubunganDenganPemohon",
      "hubungandenganpemohon",
      "hubungan_dengan_pemohon",
    ]),
  };
  const dataUsahaFields = {
    namaUsaha: getFieldValue(dataUsaha, [
      "namaUsaha",
      "namausaha",
      "nama_usaha",
    ]),
    jenisUsaha: getFieldValue(dataUsaha, [
      "jenisUsaha",
      "jenisusaha",
      "jenis_usaha",
    ]),
    bidangUsaha: getFieldValue(dataUsaha, [
      "bidangUsaha",
      "bidangusaha",
      "bidang_usaha",
    ]),
    sektorEkonomi: getFieldValue(dataUsaha, [
      "sektorEkonomiOJK",
      "sektorEkonomi",
      "sektor_ekonomi",
      "kodeSektorEkonomi",
      "kode_sektor_ekonomi",
    ]),
    statusUsaha: getFieldValue(dataUsaha, [
      "statusUsaha",
      "statususaha",
      "status_usaha",
      "bentukUsaha",
      "bentukusaha",
      "bentuk_usaha",
    ]),
    plafonPinjaman: getFieldValue(dataUsaha, [
      "plafonPinjaman",
      "plafon_pinjaman",
      "plafonPermohonan",
      "plafon_permohonan",
    ]),
    npwp: getFieldValue(dataUsaha, ["npwp", "npwpUsaha", "npwp_usaha"]),
    alamatUsaha: getFieldValue(dataUsaha, [
      "alamatUsaha",
      "alamatusaha",
      "alamat_usaha",
      "alamatlengkap",
      "alamat_lengkap",
    ]),
    desaKelurahan: getFieldValue(dataUsaha, [
      "desaKelurahan",
      "desakelurahan",
      "desa_kelurahan",
    ]),
    kecamatan: getFieldValue(dataUsaha, ["kecamatan"]),
    kabupatenKota: getFieldValue(dataUsaha, [
      "kabupatenKota",
      "kabupatenkota",
      "kabupaten_kota",
      "kabupaten",
    ]),
    provinsi: getFieldValue(dataUsaha, ["provinsi"]),
    statusAlamatUsaha: getFieldValue(dataUsaha, [
      "statusAlamatUsaha",
      "statusalamatusaha",
      "status_alamat_usaha",
      "statuskepemilikan",
      "status_kepemilikan",
    ]),
    titikmaps: getFieldValue(dataUsaha, ["titikmaps", "titikMaps", "titik_maps"]),
    nib: getFieldValue(dataUsaha, ["nib"]),
    tglNIB: getFieldValue(dataUsaha, ["tglNIB", "tgl_nib", "tglnib"]),
    sku: getFieldValue(dataUsaha, ["sku"]),
    tglSKU: getFieldValue(dataUsaha, ["tglSKU", "tgl_sku", "tglsku"]),
    izinKhusus: getFieldValue(dataUsaha, ["izinKhusus", "izin_khusus"]),
  };
  const dataUsahaUploads = {
    fotoNIB: getFieldValue(dataUsaha, ["fotoNIB", "foto_nib", "fotonib"]),
    fotoNPWP: getFieldValue(dataUsaha, ["fotoNPWP", "foto_npwp", "fotonpwp"]),
    fotoSKU: getFieldValue(dataUsaha, ["fotoSKU", "foto_sku", "fotosku"]),
    fotodepan: getFieldValue(dataUsaha, ["fotodepan", "foto_depan", "fotoDepan"]),
  };
  const buildUploadUrl = (value) => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/uploads/")) {
      return `${API_ENDPOINTS.baseUrl}${trimmed}`;
    }
    return API_ENDPOINTS.uploads(trimmed);
  };
  const usahaUploadItems = [
    { key: "fotoNIB", label: "Foto NIB", value: dataUsahaUploads.fotoNIB },
    { key: "fotoNPWP", label: "Foto NPWP", value: dataUsahaUploads.fotoNPWP },
    { key: "fotoSKU", label: "Foto SKU", value: dataUsahaUploads.fotoSKU },
    {
      key: "fotodepan",
      label: "Dokumentasi Tempat Usaha",
      value: dataUsahaUploads.fotodepan,
    },
  ]
    .map((item) => ({ ...item, value: String(item.value ?? "").trim() }))
    .filter((item) => item.value);
  const showUsahaUploads = usahaUploadItems.length > 0;
  const dataAnalisisFields = {
    jenisKredit: getFieldValue(dataAnalisis, [
      "jenisKredit",
      "jenis_kredit",
      "jenisPermohonan",
      "jenis_permohonan",
      "jenisKreditPembiayaan",
      "jenis_kredit_pembiayaan",
    ]),
    statusKepemilikanTempatTinggal: getFieldValue(dataAnalisis, [
      "statusKepemilikanTempatTinggal",
      "status_kepemilikan_tempat_tinggal",
    ]),
    lamaTinggalAlamatSaatIni: getFieldValue(dataAnalisis, [
      "lamaTinggalAlamatSaatIni",
      "lama_tinggal_alamat_saat_ini",
    ]),
    frekuensiPindahRumah: getFieldValue(dataAnalisis, [
      "frekuensiPindahRumah",
      "frekuensi_pindah_rumah",
    ]),
    kepatuhanProsesAnalisaKredit: getFieldValue(dataAnalisis, [
      "kepatuhanProsesAnalisaKredit",
      "kepatuhan_proses_analisa_kredit",
    ]),
    sumberModalAwalUsaha: getFieldValue(dataAnalisis, [
      "sumberModalAwalUsaha",
      "sumber_modal_awal_usaha",
    ]),
    buktiKeterlibatanModalSendiri: getFieldValue(dataAnalisis, [
      "buktiKeterlibatanModalSendiri",
      "bukti_keterlibatan_modal_sendiri",
    ]),
    asetProduktifPribadi: getFieldValue(dataAnalisis, [
      "asetProduktifPribadi",
      "aset_produktif_pribadi",
    ]),
    lamaUsahaBidangSama: getFieldValue(dataAnalisis, [
      "lamaUsahaBidangSama",
      "lama_usaha_bidang_sama",
    ]),
    statusLokasiUsaha: getFieldValue(dataAnalisis, [
      "statusLokasiUsaha",
      "status_lokasi_usaha",
    ]),
    ketergantunganTerhadapMusim: getFieldValue(dataAnalisis, [
      "ketergantunganTerhadapMusim",
      "ketergantungan_terhadap_musim",
    ]),
    omsetPerhari: getFieldValue(dataAnalisis, [
      "omsetPerhari",
      "omset_perhari",
    ]),
    lamaUsahaSebulan: getFieldValue(dataAnalisis, [
      "lamaUsahaSebulan",
      "lama_usaha_sebulan",
    ]),
    jenisHPP: getFieldValue(dataAnalisis, ["jenisHPP", "jenis_hpp"]),
    hargaPokokPenjualan: getFieldValue(dataAnalisis, [
      "hargaPokokPenjualan",
      "harga_pokok_penjualan",
    ]),
    omsetPerbulan: getFieldValue(dataAnalisis, [
      "omsetPerbulan",
      "omset_perbulan",
    ]),
    jumlahPendapatan: getFieldValue(dataAnalisis, [
      "jumlahPendapatan",
      "jumlah_pendapatan",
    ]),
    biayaOperasional: getFieldValue(dataAnalisis, [
      "biayaOperasional",
      "biaya_operasional",
    ]),
    biayaNonOperasional: getFieldValue(dataAnalisis, [
      "biayaNonOperasional",
      "biaya_non_operasional",
    ]),
    biayaHutangKewajibanLain: getFieldValue(dataAnalisis, [
      "biayaHutangKewajibanLain",
      "biaya_hutang_kewajiban_lain",
    ]),
    pendapatanLainnya: getFieldValue(dataAnalisis, [
      "pendapatanLainnya",
      "pendapatan_lainnya",
    ]),
    pendapatanPemohonKredit: getFieldValue(dataAnalisis, [
      "pendapatanPemohonKredit",
      "pendapatan_pemohon_kredit",
    ]),
    pendapatanIstriSuami: getFieldValue(dataAnalisis, [
      "pendapatanIstriSuami",
      "pendapatan_istri_suami",
    ]),
    pendapatanTambahan: getFieldValue(dataAnalisis, [
      "pendapatanTambahan",
      "pendapatan_tambahan",
    ]),
    totalPenghasilan: getFieldValue(dataAnalisis, [
      "totalPenghasilan",
      "total_penghasilan",
    ]),
    labaNettoNonOperasional: getFieldValue(dataAnalisis, [
      "labaNettoNonOperasional",
      "laba_netto_non_operasional",
    ]),
    plafonPermohonan: getFieldValue(
      dataAnalisis,
      ["plafonPermohonan", "plafon_permohonan"],
      dataPermohonan.plafonPermohonan
    ),
    jangkaWaktuKredit: getFieldValue(
      dataAnalisis,
      ["jangkaWaktuKredit", "jangka_waktu_kredit"],
      dataPermohonan.jangkaWaktuKredit
    ),
    perhitunganBunga: getFieldValue(
      dataAnalisis,
      ["perhitunganBunga", "perhitungan_bunga"],
      dataPermohonan.perhitunganBunga
    ),
    sukuBungaTahun: getFieldValue(
      dataAnalisis,
      ["sukuBungaTahun", "suku_bunga_tahun"],
      dataPermohonan.sukuBungaTahun
    ),
    sukuBungaBulan: getFieldValue(dataAnalisis, [
      "sukuBungaBulan",
      "suku_bunga_bulan",
    ]),
    pokokPerBulan: getFieldValue(dataAnalisis, [
      "pokokPerBulan",
      "pokok_per_bulan",
    ]),
    totalBungaPerbulan: getFieldValue(dataAnalisis, [
      "totalBungaPerbulan",
      "total_bunga_perbulan",
      "total_bunga_per_bulan",
    ]),
    angsuranPembiayaan: getFieldValue(dataAnalisis, [
      "angsuranPembiayaan",
      "angsuran_pembiayaan",
    ]),
    kemampuanMembayarSetelahPembiayaan: getFieldValue(dataAnalisis, [
      "kemampuanMembayarSetelahPembiayaan",
      "kemampuan_membayar_setelah_pembiayaan",
    ]),
    nilaiRpc: getFieldValue(dataAnalisis, ["nilaiRpc", "nilai_rpc"]),
    maksimumPlafonKredit: getFieldValue(dataAnalisis, [
      "maksimumPlafonKredit",
      "maksimum_plafon_kredit",
    ]),
    besarAngsuranMpk: getFieldValue(dataAnalisis, [
      "besarAngsuranMpk",
      "besar_angsuran_mpk",
    ]),
    repaymentCapacity: getFieldValue(dataAnalisis, [
      "repaymentCapacity",
      "repayment_capacity",
    ]),
    repaymentCapacityStatus: getFieldValue(dataAnalisis, [
      "repaymentCapacityStatus",
      "repayment_capacity_status",
    ]),
    statusPengajuan: getFieldValue(dataAnalisis, [
      "statusPengajuan",
      "status_pengajuan",
    ]),
    catatanPengajuan: getFieldValue(dataAnalisis, [
      "catatanPengajuan",
      "catatan_pengajuan",
    ]),
    character: getFieldValue(dataAnalisis, ["character"]),
  };

  const permohonanFields = {
    statusAplikasi: getFieldValue(permohonan, [
      "statusAplikasi",
      "status_aplikasi",
      "statusPermohonan",
      "status_permohonan",
      "statusPengajuan",
      "status_pengajuan",
    ]),
    tanggalPermohonan: getFieldValue(permohonan, [
      "tanggalPermohonan",
      "tanggal_permohonan",
      "tglPermohonan",
      "tgl_permohonan",
    ]),
    namaPengusul: getFieldValue(permohonan, [
      "namaPengusul",
      "nama_pengusul",
    ]),
    namaPemutus: getFieldValue(permohonan, ["namaPemutus", "nama_pemutus"]),
  };

  const dataPermohonanFields = {
    produk: getFieldValue(dataPermohonan, [
      "produk",
      "jenisKredit",
      "jenis_kredit",
      "jenisPermohonan",
      "jenis_permohonan",
    ]),
    totalOneObligor: getFieldValue(dataPermohonan, [
      "totalOneObligor",
      "total_one_obligor",
      "totalObligor",
      "total_obligor",
    ]),
    jenisPermohonan: getFieldValue(dataPermohonan, [
      "jenisPermohonan",
      "jenis_permohonan",
    ]),
    tujuanPenggunaan: getFieldValue(dataPermohonan, [
      "tujuanPenggunaanKredit",
      "tujuan_penggunaan_kredit",
      "tujuanPenggunaan",
      "tujuan_penggunaan",
    ]),
  };
  const jenisKreditValue =
    dataAnalisisFields.jenisKredit ||
    dataPermohonanFields.produk ||
    dataPermohonanFields.jenisPermohonan ||
    dataPermohonan.jenisKredit ||
    permohonan.jenisKredit ||
    "";
  const isKreditKonsumtif = isKreditKonsumtifPegawai(jenisKreditValue);
  const capitalOptionSet = isKreditKonsumtif
    ? CAPITAL_OPTION_LABELS.konsumtif
    : CAPITAL_OPTION_LABELS.produktif;
  const capacityOptionSet = isKreditKonsumtif
    ? CAPACITY_OPTION_LABELS.konsumtif
    : CAPACITY_OPTION_LABELS.produktif;
  const characterValues = [
    dataAnalisisFields.statusKepemilikanTempatTinggal,
    dataAnalisisFields.lamaTinggalAlamatSaatIni,
    dataAnalisisFields.frekuensiPindahRumah,
    dataAnalisisFields.kepatuhanProsesAnalisaKredit,
  ];
  const modalValues = [
    dataAnalisisFields.sumberModalAwalUsaha,
    dataAnalisisFields.buktiKeterlibatanModalSendiri,
    dataAnalisisFields.asetProduktifPribadi,
  ];
  const capacityValues = [
    dataAnalisisFields.lamaUsahaBidangSama,
    dataAnalisisFields.statusLokasiUsaha,
    dataAnalisisFields.ketergantunganTerhadapMusim,
  ];
  const slikEntries = no_permohonan
    ? readSlikStorageEntries(no_permohonan)
    : [];
  const slikSummary = computeSlikSummary(slikEntries);
  const slikGradeLabel = String(slikSummary.gradeLabel ?? "").trim();
  const statusSlikLabel = String(slikSummary.statusSlik ?? "").trim();
  const totalAktivitasSlikLabel = slikSummary.totalAktivitasLabel || "";
  const totalAktivitasSlikValue =
    totalAktivitasSlikLabel ||
    getFieldValue(dataAnalisis, [
      "totalAktivitasSlik",
      "total_aktivitas_slik",
      "totalAktivitasSLIK",
    ]);
  const slikGradeValue =
    slikGradeLabel ||
    getFieldValue(dataAnalisis, ["gradeSlik", "grade_slik", "slikGrade"]);
  const statusSlikValue =
    statusSlikLabel ||
    getFieldValue(dataAnalisis, ["statusSlik", "status_slik", "slikStatus"]);
  const characterScoreAverage = computeAverage(characterValues, 4);
  const modalScoreAverage = computeAverage(modalValues, 4);
  const capacityScoreAverage = computeAverage(capacityValues, 4);
  const totalStatusScore =
    ((characterScoreAverage / 4) * 40 +
      (modalScoreAverage / 4) * 30 +
      (capacityScoreAverage / 4) * 30) *
    0.15;
  const jaminanScoreItems = dataJaminan.map(normalizeJaminanScoreItem);
  const jaminanEvaluations = jaminanScoreItems.map((item) => {
    const status = getJaminanApprovalStatus(
      item,
      dataAnalisisFields.plafonPermohonan
    );
    return {
      status,
      score: getAgunanScoreForItem(item, status),
    };
  });
  const isAgunanEmpty =
    !jaminanScoreItems.length ||
    jaminanScoreItems.every((item) => !hasInputValue(item?.jenisjaminan));
  const hasAgunanApprove = jaminanEvaluations.some(
    (item) => String(item.status).toLowerCase() === "approve"
  );
  const agunanScore = isAgunanEmpty
    ? 15
    : hasAgunanApprove
    ? jaminanEvaluations.reduce(
        (maxValue, item) => Math.max(maxValue, item.score),
        0
      )
    : 0;
  const rpcStatusLabel = String(
    dataAnalisisFields.repaymentCapacityStatus ?? ""
  ).trim();
  const rpcScore = rpcStatusLabel.toLowerCase() === "approve" ? 40 : 0;
  const slikScore = SLIK_GRADE_SCORE_MAP[slikGradeLabel] ?? 0;
  const totalBobotScore = agunanScore + totalStatusScore + rpcScore + slikScore;
  const statusPengajuanComputed = totalBobotScore < 80 ? "Reject" : "Approve";
  const statusPengajuanDetail = getFieldValue(permohonanDetail, [
    "statusPengajuan",
    "status_pengajuan",
    "statuspengajuan",
  ]);
  const statusPengajuanLabel =
    formatStatus(statusPengajuanDetail) ||
    String(dataAnalisisFields.statusPengajuan ?? "").trim() ||
    statusPengajuanComputed;
  const totalBobotLabel = formatPercentValue(totalBobotScore);
  const characterAnswers = [
    {
      label: "Status Kepemilikan Tempat Tinggal",
      value: getOptionLabel(
        dataAnalisisFields.statusKepemilikanTempatTinggal,
        CHARACTER_OPTION_LABELS.statusKepemilikanTempatTinggal
      ),
    },
    {
      label: "Lama tinggal di alamat saat ini",
      value: getOptionLabel(
        dataAnalisisFields.lamaTinggalAlamatSaatIni,
        CHARACTER_OPTION_LABELS.lamaTinggalAlamatSaatIni
      ),
    },
    {
      label: "Frekuensi pindah rumah (5 Tahun)",
      value: getOptionLabel(
        dataAnalisisFields.frekuensiPindahRumah,
        CHARACTER_OPTION_LABELS.frekuensiPindahRumah
      ),
    },
    {
      label: "Kepatuhan proses analisa kredit",
      value: getOptionLabel(
        dataAnalisisFields.kepatuhanProsesAnalisaKredit,
        CHARACTER_OPTION_LABELS.kepatuhanProsesAnalisaKredit
      ),
    },
  ];
  const capitalAnswers = [
    {
      label: isKreditKonsumtif
        ? "Sumber utama pembayaran angsuran kredit berasal dari?"
        : "Sumber modal awal usaha",
      value: getOptionLabel(
        dataAnalisisFields.sumberModalAwalUsaha,
        capitalOptionSet.sumberModalAwalUsaha
      ),
    },
    {
      label: isKreditKonsumtif
        ? "Apakah calon debitur memiliki tabungan/aset likuid pribadi di luar kebutuhan rutin?"
        : "Bukti keterlibatan modal sendiri",
      value: getOptionLabel(
        dataAnalisisFields.buktiKeterlibatanModalSendiri,
        capitalOptionSet.buktiKeterlibatanModalSendiri
      ),
    },
    {
      label: isKreditKonsumtif
        ? "Bagaimana perbandingan total kewajiban bulanan terhadap penghasilan bulanan?"
        : "Aset produktif pribadi (di luar agunan)",
      value: getOptionLabel(
        dataAnalisisFields.asetProduktifPribadi,
        capitalOptionSet.asetProduktifPribadi
      ),
    },
  ];
  const capacityAnswers = [
    {
      label: isKreditKonsumtif
        ? "Sudah berapa lama calon debitur bekerja pada pekerjaan/instansi saat ini?"
        : "Lama usaha di bidang yang sama",
      value: getOptionLabel(
        dataAnalisisFields.lamaUsahaBidangSama,
        capacityOptionSet.lamaUsahaBidangSama
      ),
    },
    {
      label: isKreditKonsumtif
        ? "Bagaimana status pekerjaan calon debitur saat ini berjalan?"
        : "Status lokasi usaha",
      value: getOptionLabel(
        dataAnalisisFields.statusLokasiUsaha,
        capacityOptionSet.statusLokasiUsaha
      ),
    },
    {
      label: isKreditKonsumtif
        ? "Seberapa stabil penghasilan calon debitur dari waktu ke waktu?"
        : "Ketergantungan terhadap musim",
      value: getOptionLabel(
        dataAnalisisFields.ketergantunganTerhadapMusim,
        capacityOptionSet.ketergantunganTerhadapMusim
      ),
    },
  ];
  const analisa5CSection = (
    <div className="md:col-span-2">
      <CompactSectionTitle>V. Analisa 5C</CompactSectionTitle>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-700">Character</p>
          {characterAnswers.map((item) => (
            <InfoRow
              key={`character-${item.label}`}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-700">Capital</p>
          {capitalAnswers.map((item) => (
            <InfoRow
              key={`capital-${item.label}`}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-700">Capacity</p>
          {capacityAnswers.map((item) => (
            <InfoRow
              key={`capacity-${item.label}`}
              label={item.label}
              value={item.value}
            />
          ))}
        </div>
        <div className="space-y-1 md:col-span-3">
          <p className="text-[11px] font-semibold text-slate-700">SLIK</p>
          <InfoRowWide
            label="Hasil Analisa SLIK"
            value={dataAnalisisFields.character}
          />
        </div>
      </div>
    </div>
  );

  const cabangKantorLabel = getFieldValue(userInfo, CABANG_KANTOR_KEYS);
  const namaBank = getFieldValue(
    permohonan,
    ["namaBank", "nama_bank"],
    cabangKantorLabel || "PT. BPR NTB (Perseroda)"
  );
  const cabangKantorBankLabel = cabangKantorLabel || namaBank;
  const alamatKantorLabel =
    getFieldValue(userInfo, [
      "alamatKantor",
      "alamat_kantor",
      "alamatkantor",
      "alamatCabang",
      "alamat_cabang",
      "alamat",
    ]) ||
    getFieldValue(permohonan, [
      "alamatKantor",
      "alamat_kantor",
      "alamatCabang",
      "alamat_cabang",
      "alamatBank",
      "alamat_bank",
      "alamat",
    ]) ||
    getFieldValue(dataPermohonan, [
      "alamatKantor",
      "alamat_kantor",
      "alamatCabang",
      "alamat_cabang",
      "alamatBank",
      "alamat_bank",
      "alamat",
    ]);
  const telpKantorLabel =
    getFieldValue(userInfo, [
      "telpKantor",
      "telp_kantor",
      "telpkantor",
      "teleponKantor",
      "telepon_kantor",
      "noTelpKantor",
      "no_telp_kantor",
      "nomorTelpKantor",
      "nomor_telp_kantor",
      "telp",
      "telepon",
    ]) ||
    getFieldValue(permohonan, [
      "telpKantor",
      "telp_kantor",
      "telpkantor",
      "teleponKantor",
      "telepon_kantor",
      "telpBank",
      "telp_bank",
      "telp",
      "telepon",
    ]) ||
    getFieldValue(dataPermohonan, [
      "telpKantor",
      "telp_kantor",
      "telpkantor",
      "teleponKantor",
      "telepon_kantor",
      "telpBank",
      "telp_bank",
      "telp",
      "telepon",
    ]);
  const statusAplikasiLabel = formatStatus(
    permohonanFields.statusAplikasi ||
      dataPermohonan.statusPermohonan ||
      dataPermohonan.statusPengajuan
  );
  const tanggalPermohonanLabel = formatDate(
    permohonanFields.tanggalPermohonan ||
      permohonan.tglInput ||
      permohonan.createdAt
  );
  const roleNormalized = String(
    userInfo.role || userInfo.jabatan || ""
  )
    .toLowerCase()
    .replace(/\s+/g, "");
  const isKomiteCabang = roleNormalized.includes("komitecabang");
  const namaPengusulLabel =
    pengusulName ||
    getFieldValue(permohonan, PENGUSUL_NAME_KEYS) ||
    getFieldValue(dataPermohonan, PENGUSUL_NAME_KEYS) ||
    "-";
  const namaPemutusLabel = isKomiteCabang
    ? userInfo.namaLengkap || permohonanFields.namaPemutus || "-"
    : permohonanFields.namaPemutus || "-";
  const tempatTanggalLahir = formatTempatTanggal(
    dataDiriFields.tempatLahir,
    dataDiriFields.tanggalLahir
  );
  const alamatDomisili = joinAddress([
    dataDiriFields.alamatLengkap,
    formatRtRw(dataDiriFields.rt, dataDiriFields.rw),
    dataDiriFields.desaKelurahan,
    dataDiriFields.kecamatan,
    dataDiriFields.kabupaten,
    dataDiriFields.provinsi,
  ]);
  const alamatKtp = dataDiriFields.alamatKtp || alamatDomisili;
  const alamatUsaha = joinAddress([
    dataUsahaFields.alamatUsaha,
    dataUsahaFields.desaKelurahan,
    dataUsahaFields.kecamatan,
    dataUsahaFields.kabupatenKota,
    dataUsahaFields.provinsi,
  ]);
  const sektorEkonomiLabel =
    dataUsahaFields.sektorEkonomi || dataUsahaFields.bidangUsaha;
  const sukuBungaLabel = dataPermohonan.sukuBungaTahun
    ? `${formatIdNumber(dataPermohonan.sukuBungaTahun)} % p.a${
        dataPermohonan.perhitunganBunga
          ? ` ${dataPermohonan.perhitunganBunga}`
          : ""
      }`
    : "-";
  const jangkaWaktuLabel = dataPermohonan.jangkaWaktuKredit
    ? `${dataPermohonan.jangkaWaktuKredit} bulan`
    : "-";
  const hppLabel =
    HPP_LABELS[String(dataAnalisisFields.jenisHPP ?? "").trim()] ||
    dataAnalisisFields.jenisHPP;
  const pendapatanRows = isKreditKonsumtif
    ? [
        {
          label: "Penghasilan Pemohon Kredit",
          value: formatRupiahValue(dataAnalisisFields.pendapatanPemohonKredit),
        },
        {
          label: "Penghasilan Istri / Suami",
          value: formatRupiahValue(dataAnalisisFields.pendapatanIstriSuami),
        },
        {
          label: "Penghasilan Tambahan",
          value: formatRupiahValue(dataAnalisisFields.pendapatanTambahan),
        },
        {
          label: "Pendapatan Lainnya",
          value: formatRupiahValue(dataAnalisisFields.pendapatanLainnya),
        },
        {
          label: "Total Penghasilan",
          value: formatRupiahValue(dataAnalisisFields.totalPenghasilan),
        },
        {
          label: "Biaya Non Operasional",
          value: formatRupiahValue(dataAnalisisFields.biayaNonOperasional),
        },
        {
          label: "Biaya Hutang / Kewajiban Lain",
          value: formatRupiahValue(dataAnalisisFields.biayaHutangKewajibanLain),
        },
        {
          label: "Total Laba",
          value: formatRupiahValue(
            dataAnalisisFields.labaNettoNonOperasional,
            true
          ),
        },
      ]
    : [
        {
          label: "Omset Per Hari",
          value: formatRupiahValue(dataAnalisisFields.omsetPerhari),
        },
        {
          label: "Lama Usaha Dalam Sebulan",
          value: dataAnalisisFields.lamaUsahaSebulan
            ? `${formatIdInteger(dataAnalisisFields.lamaUsahaSebulan)} hari`
            : "",
        },
        {
          label: "Omset Per Bulan",
          value: formatRupiahValue(dataAnalisisFields.omsetPerbulan, true),
        },
        {
          label: "Jenis HPP",
          value: hppLabel,
        },
        {
          label: "Harga Pokok Penjualan",
          value: formatRupiahValue(
            dataAnalisisFields.hargaPokokPenjualan,
            true
          ),
        },
        {
          label: "Jumlah Pendapatan",
          value: formatRupiahValue(dataAnalisisFields.jumlahPendapatan, true),
        },
        {
          label: "Biaya Operasional",
          value: formatRupiahValue(dataAnalisisFields.biayaOperasional),
        },
        {
          label: "Biaya Non Operasional",
          value: formatRupiahValue(dataAnalisisFields.biayaNonOperasional),
        },
        {
          label: "Biaya Hutang / Kewajiban Lain",
          value: formatRupiahValue(dataAnalisisFields.biayaHutangKewajibanLain),
        },
        {
          label: "Pendapatan Lainnya",
          value: formatRupiahValue(dataAnalisisFields.pendapatanLainnya),
        },
        {
          label: "Total Laba",
          value: formatRupiahValue(
            dataAnalisisFields.labaNettoNonOperasional,
            true
          ),
        },
      ];
  const pembiayaanRows = [
    {
      label: "Plafon Permohonan",
      value: formatRupiahValue(dataAnalisisFields.plafonPermohonan),
    },
    {
      label: "Jangka Waktu Kredit",
      value: dataAnalisisFields.jangkaWaktuKredit
        ? `${formatIdInteger(dataAnalisisFields.jangkaWaktuKredit)} bulan`
        : "",
    },
    {
      label: "Cara Perhitungan",
      value: dataAnalisisFields.perhitunganBunga,
    },
    {
      label: "Suku Bunga / Tahun",
      value:
        dataAnalisisFields.sukuBungaTahun !== "" &&
        dataAnalisisFields.sukuBungaTahun !== null &&
        dataAnalisisFields.sukuBungaTahun !== undefined
          ? `${formatIdInteger(dataAnalisisFields.sukuBungaTahun)} %`
          : "",
    },
    {
      label: "Suku Bunga / Bulan",
      value:
        dataAnalisisFields.sukuBungaBulan !== "" &&
        dataAnalisisFields.sukuBungaBulan !== null &&
        dataAnalisisFields.sukuBungaBulan !== undefined
          ? `${formatIdNumber(dataAnalisisFields.sukuBungaBulan)} %`
          : "",
    },
    {
      label: "Pokok Per Bulan",
      value: formatRupiahValue(dataAnalisisFields.pokokPerBulan, true),
    },
    {
      label: "Total Bunga Per Bulan",
      value: formatRupiahValue(dataAnalisisFields.totalBungaPerbulan, true),
    },
    {
      label: "Angsuran Pembiayaan",
      value: formatRupiahValue(dataAnalisisFields.angsuranPembiayaan, true),
    },
  ];
  const kemampuanRows = [
    {
      label: "Angsuran Pembiayaan",
      value: formatRupiahValue(dataAnalisisFields.angsuranPembiayaan, true),
    },
    {
      label: "Besar Angsuran dari MPK",
      value: formatRupiahValue(dataAnalisisFields.besarAngsuranMpk, true),
    },
    {
      label: "Repayment Capacity",
      value: formatIdNumber(dataAnalisisFields.repaymentCapacity),
    },
    {
      label: "Nilai RPC",
      value: formatRupiahValue(dataAnalisisFields.nilaiRpc, true),
    },
    {
      label: "Maksimum Plafon Kredit (MPK)",
      value: formatRupiahValue(dataAnalisisFields.maksimumPlafonKredit, true),
    },
    {
      label: "Kemampuan Membayar Setelah Pembiayaan",
      value: formatRupiahValue(
        dataAnalisisFields.kemampuanMembayarSetelahPembiayaan,
        true
      ),
    },
    {
      label: "Status Repayment",
      value: dataAnalisisFields.repaymentCapacityStatus,
    },
  ];
  const usulanRows = [
    {
      label: "Total Bobot",
      value: totalBobotLabel,
    },
    {
      label: "Status Pengajuan",
      value: statusPengajuanLabel,
    },
    {
      label: "Catatan",
      value: dataAnalisisFields.catatanPengajuan,
    },
  ];
  const pendapatanSection = (
    <div>
      <CompactSectionTitle>VI. Pendapatan</CompactSectionTitle>
      <div className="mt-2 space-y-1">
        {pendapatanRows.map((item) => (
          <InfoRow
            key={`pendapatan-${item.label}`}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
  const pembiayaanSection = (
    <div>
      <CompactSectionTitle>VII. Pembiayaan</CompactSectionTitle>
      <div className="mt-2 space-y-1">
        {pembiayaanRows.map((item) => (
          <InfoRow
            key={`pembiayaan-${item.label}`}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
  const kemampuanSection = (
    <div>
      <CompactSectionTitle>VIII. Kemampuan Membayar</CompactSectionTitle>
      <div className="mt-2 space-y-1">
        {kemampuanRows.map((item) => (
          <InfoRow
            key={`kemampuan-${item.label}`}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
  const usulanSection = (
    <div>
      <CompactSectionTitle>IX. Usulan AO</CompactSectionTitle>
      <div className="mt-2 space-y-1">
        {usulanRows.map((item) => (
          <InfoRow
            key={`usulan-${item.label}`}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  );
  const analisaDetailRows = [
    {
      key: "analisa-detail-row-1",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendapatanSection}
          {pembiayaanSection}
        </div>
      ),
    },
    {
      key: "analisa-detail-row-2",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {kemampuanSection}
          {usulanSection}
        </div>
      ),
    },
  ];
  const jaminanRows = dataJaminan.map((item) => {
    const jaminan = normalizeJaminanItem(item);
    const nilaiAgunan = toNumber(jaminan.nilaiAgunan);
    const safetyMargin = toNumber(jaminan.safetyMargin);
    const safetyMarginRatio = safetyMargin ? safetyMargin / 100 : 1;
    const hasNilaiLikuidasi =
      jaminan.nilaiLikuidasi !== "" &&
      jaminan.nilaiLikuidasi !== null &&
      jaminan.nilaiLikuidasi !== undefined;
    const nilaiLikuidasi = toNumber(jaminan.nilaiLikuidasi);
    const nilaiSetelahMargin = hasNilaiLikuidasi
      ? nilaiLikuidasi
      : nilaiAgunan
      ? nilaiAgunan * safetyMarginRatio
      : 0;

    return { jaminan, nilaiAgunan, nilaiSetelahMargin };
  });
  const rowsPerPage = 12;
  const jaminanChunks = jaminanRows.length
    ? chunkArray(jaminanRows, rowsPerPage)
    : [[]];
  const totalNilaiSetelahMargin = jaminanRows.reduce(
    (sum, row) => sum + row.nilaiSetelahMargin,
    0
  );
  const plafonDisetujui = toNumber(dataPermohonan.plafonPermohonan);
  const rasioSafetyMargin = plafonDisetujui
    ? totalNilaiSetelahMargin / plafonDisetujui
    : 0;
  const rasioSafetyMarginLabel = plafonDisetujui
    ? `${formatIdNumber(rasioSafetyMargin * 100)} %`
    : "-";
  const kesimpulanAgunan = plafonDisetujui
    ? totalNilaiSetelahMargin >= plafonDisetujui * 1.25
      ? "Approve"
      : "Reject"
    : "-";
  const renderAgunanContent = (rows, showSummary) => (
    <div className="mt-2 space-y-2">
      {rows.length ? (
        <div className="space-y-2">
          <div className="border border-slate-300 rounded-md overflow-hidden bg-white p-1">
            <table className="w-full table-fixed border-collapse text-[10px] leading-relaxed">
              <thead className="bg-slate-100 text-slate-700">
                <tr className="border-b border-slate-300">
                  <th className="px-2 pt-1 pb-2 text-left font-semibold w-[18%] align-top">
                    Jenis Agunan
                  </th>
                  <th className="px-2 pt-1 pb-2 text-left font-semibold w-[24%] align-top">
                    Bukti Kepemilikan
                  </th>
                  <th className="px-2 pt-1 pb-2 text-left font-semibold w-[18%] align-top">
                    Nama Pemilik
                  </th>
                  <th className="px-2 pt-1 pb-2 text-left font-semibold w-[22%] align-top">
                    Lokasi/Letak
                  </th>
                  <th className="px-2 pt-1 pb-2 text-right font-semibold w-[18%] align-top">
                    Nilai Agunan
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {rows.map((row, index) => {
                  const { jaminan, nilaiAgunan } = row;
                  const nilaiAgunanLabel = nilaiAgunan
                    ? formatRupiah(nilaiAgunan)
                    : "-";

                  return (
                    <tr
                      key={`${jaminan.jenis || "agunan"}-${index}`}
                      className="border-b border-slate-200 last:border-b-0 odd:bg-slate-50/50"
                    >
                      <td className="px-2 py-1.5 align-top break-words">
                        {jaminan.jenis || "-"}
                      </td>
                      <td className="px-2 py-1.5 align-top whitespace-pre-line break-words">
                        {jaminan.buktiKepemilikan || "-"}
                      </td>
                      <td className="px-2 py-1.5 align-top break-words">
                        {jaminan.namaPemilik || "-"}
                      </td>
                      <td className="px-2 py-1.5 align-top whitespace-pre-line break-words">
                        {jaminan.lokasi || "-"}
                      </td>
                      <td className="px-2 py-1.5 text-right align-top whitespace-nowrap">
                        {nilaiAgunanLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showSummary ? (
            <div className="border border-slate-200 rounded-md px-2 py-2">
              <InfoRow
                label="Total Nilai Transaksi Setelah Safety Margin"
                value={formatRupiah(totalNilaiSetelahMargin)}
              />
              <InfoRow
                label="Plafon Kredit yang Disetujui"
                value={plafonDisetujui ? formatRupiah(plafonDisetujui) : "-"}
              />
              <InfoRow
                label="Rasio Safety Margin Agunan Terhadap Total Fasilitas Kredit"
                value={rasioSafetyMarginLabel}
              />
              <InfoRow label="Kesimpulan" value={kesimpulanAgunan} />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">Tidak ada data agunan.</p>
      )}
    </div>
  );

  const tandaTanggal = formatDate(permohonan.tglInput || permohonan.createdAt);
  const introSection = (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-800">
          Nota Analisa Kredit Mikro
        </p>
        <p className="text-[11px] text-slate-700">
          Debitur {dataDiriFields.namaLengkap || "-"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 pb-3">
        <div className="space-y-1">
          <InfoRow label="Nama Bank" value={namaBank} />
          <InfoRow label="Status Aplikasi" value={statusAplikasiLabel} />
          <InfoRow label="No. Aplikasi" value={no_permohonan} />
          <InfoRow label="Tanggal Aplikasi" value={tandaTanggal} />
          <InfoRow label="Tanggal Permohonan" value={tanggalPermohonanLabel} />
        </div>
        <div className="space-y-1">
          <InfoRow label="Nama Pengusul" value={namaPengusulLabel} />
          <InfoRow label="Nama Pemutus" value={namaPemutusLabel} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CompactSectionTitle>I. Data Permohonan</CompactSectionTitle>
          <div className="mt-2 space-y-1">
            <InfoRow label="Produk" value={dataPermohonanFields.produk} />
            <InfoRow
              label="Plafon Permohonan"
              value={formatRupiah(dataPermohonan.plafonPermohonan)}
            />
            <InfoRow
              label="Total One Obligor"
              value={formatRupiah(
                dataPermohonanFields.totalOneObligor ||
                  dataPermohonan.plafonPermohonan
              )}
            />
            <InfoRow label="Suku Bunga" value={sukuBungaLabel} />
            <InfoRow label="Jangka Waktu" value={jangkaWaktuLabel} />
            <InfoRow
              label="Jenis Permohonan"
              value={dataPermohonanFields.jenisPermohonan}
            />
            <InfoRow
              label="Tujuan Penggunaan"
              value={dataPermohonanFields.tujuanPenggunaan}
            />
          </div>
        </div>

        <div>
          <CompactSectionTitle>II. Data Usaha</CompactSectionTitle>
          <div className="mt-2 space-y-1">
            <InfoRow label="Nama Usaha" value={dataUsahaFields.namaUsaha} />
            <InfoRow label="Badan Usaha" value={dataUsahaFields.statusUsaha} />
            <InfoRow label="Sektor Ekonomi OJK" value={sektorEkonomiLabel} />
            <InfoRow
              label="Status Tempat Usaha"
              value={dataUsahaFields.statusAlamatUsaha}
            />
            <InfoRow label="Alamat Usaha" value={alamatUsaha} />
          </div>
        </div>

        <div>
          <CompactSectionTitle>III. Data Pemohon</CompactSectionTitle>
          <div className="mt-2 space-y-1">
            <InfoRow
              label="Nama Debitur/Key Person"
              value={dataDiriFields.namaLengkap}
            />
            <InfoRow label="No. KTP" value={dataDiriFields.nik} />
            <InfoRow label="Tempat/Tanggal Lahir" value={tempatTanggalLahir} />
            <InfoRow
              label="Status Perkawinan"
              value={dataDiriFields.statusPerkawinan}
            />
            <InfoRow label="Profesi Debitur" value={dataDiriFields.jenisPekerjaan} />
            <InfoRow
              label="Alamat Tempat Tinggal Saat Ini"
              value={alamatDomisili}
            />
            <InfoRow label="Alamat Tempat Tinggal Sesuai KTP" value={alamatKtp} />
            <InfoRow label="No. Telpon/HP" value={dataDiriFields.kontakPribadi} />
          </div>
        </div>

        <div>
          <CompactSectionTitle>IV. Data Penanggung Jawab</CompactSectionTitle>
          <div className="mt-2 space-y-1">
            <InfoRow label="NIK" value={dataDiriFields.nikPenanggungJawab} />
            <InfoRow
              label="Nama Lengkap"
              value={dataDiriFields.namaPenanggungJawab}
            />
            <InfoRow
              label="Pekerjaan"
              value={dataDiriFields.pekerjaanPenanggungJawab}
            />
            <InfoRow
              label="Tempat/Tanggal Lahir"
              value={formatTempatTanggal(
                dataDiriFields.tempatLahirPenanggungJawab,
                dataDiriFields.tanggalLahirPenanggungJawab
              )}
            />
            <InfoRow
              label="No. Telpon/HP"
              value={dataDiriFields.noHPPenanggungJawab}
            />
            <InfoRow
              label="Hubungan dengan Pemohon"
              value={dataDiriFields.hubunganDenganPemohon}
            />
          </div>
        </div>
      </div>
    </div>
  );
  const usahaUploadsSection = showUsahaUploads ? (
    <div>
      <CompactSectionTitle>Lampiran Data Usaha</CompactSectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {usahaUploadItems.map((item) => (
          <div key={item.key} className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-600">
              {item.label}
            </p>
            <div className="border border-slate-300 rounded-md bg-white p-1">
              <img
                src={buildUploadUrl(item.value)}
                alt={item.label}
                className="h-28 w-full object-contain"
                crossOrigin="anonymous"
                loading="eager"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;
  const keputusanTanggalLabel =
    tanggalPermohonanLabel || tandaTanggal || formatDate(new Date());
  const keputusanLokasiLabel =
    dataUsahaFields.kabupatenKota || dataDiriFields.kabupaten || "";
  const keputusanTempatTanggal = keputusanLokasiLabel
    ? `${keputusanLokasiLabel}, ${keputusanTanggalLabel || "-"}`
    : keputusanTanggalLabel || "-";
  const keputusanJenisKreditLabel =
    formatJenisKreditLabel(jenisKreditValue) || "-";
  const keputusanPlafonLabel = hasInputValue(dataAnalisisFields.plafonPermohonan)
    ? formatRupiah(dataAnalisisFields.plafonPermohonan)
    : formatRupiah(dataPermohonan.plafonPermohonan);
  const keputusanJangkaWaktuLabel = dataAnalisisFields.jangkaWaktuKredit
    ? `${formatIdInteger(dataAnalisisFields.jangkaWaktuKredit)} Bulan`
    : jangkaWaktuLabel || "-";
  const sukuBungaValue = toNumber(dataPermohonan.sukuBungaTahun);
  const keputusanSukuBungaLabel = hasInputValue(dataPermohonan.sukuBungaTahun)
    ? `${Number.isInteger(sukuBungaValue)
        ? formatIdInteger(sukuBungaValue)
        : formatIdNumber(sukuBungaValue)
      } % per tahun${
        dataPermohonan.perhitunganBunga
          ? ` (${dataPermohonan.perhitunganBunga})`
          : ""
      }`
    : "-";
  const keputusanAngsuranLabel = formatRupiahValue(
    dataAnalisisFields.angsuranPembiayaan,
    true
  );
  const keteranganPengajuanLabel =
    getFieldValue(permohonanDetail, [
      "keteranganPengajuan",
      "keterangan_pengajuan",
      "keterangan",
      "catatanPengajuan",
      "catatan_pengajuan",
    ]) ||
    getFieldValue(permohonan, [
      "keteranganPengajuan",
      "keterangan_pengajuan",
      "keterangan",
    ]) ||
    getFieldValue(dataPermohonan, [
      "keteranganPengajuan",
      "keterangan_pengajuan",
      "keterangan",
    ]) ||
    getFieldValue(dataAnalisis, [
      "catatanPengajuan",
      "catatan_pengajuan",
      "keteranganPengajuan",
      "keterangan_pengajuan",
      "keterangan",
    ]) ||
    dataAnalisisFields.catatanPengajuan;
  const namaAsuransiLabel =
    getFieldValue(permohonanDetail, ["namaAsuransi", "nama_asuransi"]) ||
    getFieldValue(dataPermohonan, ["namaAsuransi", "nama_asuransi"]);
  const premiValue =
    getFieldValue(permohonanDetail, [
      "premi",
      "premiAsuransi",
      "premi_asuransi",
    ]) ||
    getFieldValue(dataPermohonan, [
      "premi",
      "premiAsuransi",
      "premi_asuransi",
    ]);
  const premiLabel = formatRupiahValue(premiValue, true);
  const namaNotarisLabel =
    getFieldValue(permohonanDetail, ["namaNotaris", "nama_notaris"]) ||
    getFieldValue(dataPermohonan, ["namaNotaris", "nama_notaris"]);
  const biayaAphtValue =
    getFieldValue(permohonanDetail, [
      "biayaAPHT",
      "biaya_apht",
      "biayaApht",
    ]) ||
    getFieldValue(dataPermohonan, [
      "biayaAPHT",
      "biaya_apht",
      "biayaApht",
    ]);
  const biayaAphtLabel = formatRupiahValue(biayaAphtValue, true);
  const statusPermohonanRaw = getFieldValue(permohonanDetail, [
    "statusPermohonan",
    "status_permohonan",
    "statuspermohonan",
  ]);
  const statusPermohonanReadable =
    getFieldValue(permohonanDetail, [
      "statusPermohonanLabel",
      "status_permohonan_label",
      "statusPermohonanNama",
      "status_permohonan_nama",
      "namaStatusPermohonan",
      "nama_status_permohonan",
    ]) || (!isOpaqueId(statusPermohonanRaw) ? statusPermohonanRaw : "");
  const statusPermohonanLabel = formatStatus(
    statusPermohonanReadable ||
      getFieldValue(dataPermohonan, ["statusPermohonan", "status_permohonan"]) ||
      ""
  );
  const namaPimpinanCabangLabel =
    isKomiteCabang && userInfo.namaLengkap
      ? userInfo.namaLengkap
      : namaPemutusLabel && namaPemutusLabel !== "-"
      ? namaPemutusLabel
      : "Nama Pimpinan Cabang";
  const usulanAoLabel =
    namaPengusulLabel && namaPengusulLabel !== "-"
      ? `dan usulan Account Officer ${namaPengusulLabel}`
      : "dan usulan Account Officer";
  const suratKeputusanSection = (
    <div className="flex flex-1 flex-col text-[11px] leading-relaxed text-slate-800">
      <div className="text-center space-y-1">
        <p className="text-[13px] font-bold uppercase">Surat Keputusan</p>
        <p className="text-[11px] font-semibold uppercase">
          Pimpinan Cabang {cabangKantorBankLabel}
        </p>
        <p className="text-[11px]">Nomor: {no_permohonan || "-"}</p>
      </div>

      <div className="mt-4 space-y-1">
        <p className="font-semibold uppercase">Tentang</p>
        <p className="font-semibold uppercase">
          Persetujuan Pemberian Kredit Mikro
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <p>
          Menimbang bahwa berdasarkan Nota Analisa Kredit Mikro Nomor{" "}
          {no_permohonan || "-"} tanggal {keputusanTanggalLabel || "-"}{" "}
          {usulanAoLabel}, hasil analisis kredit dengan metode 5C menunjukan
          bahwa debitur dinilai layak menerima fasilitas kredit serta memiliki
          kemampuan membayar yang memenuhi ketentuan.
        </p>
        <p>
          Mengingat ketentuan perkreditan dan prinsip kehati-hatian yang berlaku
          di {namaBank}.
        </p>
      </div>

      <div className="mt-4">
        <p className="font-semibold uppercase">Memutuskan</p>
        <p className="mt-1">
          Menyetujui pemberian fasilitas Kredit Mikro kepada:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Nama Debitur: {dataDiriFields.namaLengkap || "-"}</li>
          <li>Jenis Kredit: {keputusanJenisKreditLabel}</li>
          <li>Plafon Kredit: {keputusanPlafonLabel || "-"}</li>
          <li>Jangka Waktu: {keputusanJangkaWaktuLabel}</li>
          <li>Suku Bunga: {keputusanSukuBungaLabel}</li>
          <li>Angsuran per Bulan: {keputusanAngsuranLabel || "-"}</li>
          <li>Keterangan: {keteranganPengajuanLabel || "-"}</li>
          <li>Nama Asuransi: {namaAsuransiLabel || "-"}</li>
          <li>Premi: {premiLabel || "-"}</li>
          <li>Nama Notaris: {namaNotarisLabel || "-"}</li>
          <li>Biaya APHT: {biayaAphtLabel || "-"}</li>
          <li>Status Permohonan: {statusPermohonanLabel || "-"}</li>
          <li>Status Pengajuan: {statusPengajuanLabel || "-"}</li>
        </ul>
      </div>

      <p className="mt-4">
        Persetujuan kredit diberikan dengan ketentuan bahwa realisasi kredit
        wajib memenuhi seluruh persyaratan administrasi, pengikatan agunan,
        serta ketentuan internal bank yang berlaku. Apabila kemudian hari
        ditemukan ketidaksesuaian data atau perubahan kondisi debitur, keputusan
        ini dapat ditinjau kembali sesuai kebijakan perusahaan.
      </p>
      <p className="mt-4">
        Demikian Surat Keputusan ini dibuat untuk dilaksanakan sebagaimana
        mestinya.
      </p>

      <div className="mt-auto pt-6 flex flex-col items-end text-right">
        <p>{keputusanTempatTanggal}</p>
        <p className="mt-4 font-semibold uppercase">Pimpinan Cabang</p>
        <p className="text-[10px] font-semibold uppercase">
          {cabangKantorBankLabel}
        </p>
        <p className="mt-6 text-[10px] text-slate-600">
          
        </p>
        <div className="mt-6 border-t border-slate-400 w-48" />
        <p className="mt-1 font-semibold text-slate-800">
          {namaPimpinanCabangLabel}
        </p>
      </div>
    </div>
  );
  const renderAgunanBlock = (rows, showSummary) => (
    <div className="space-y-2">
      <CompactSectionTitle>X. Data Agunan</CompactSectionTitle>
      {renderAgunanContent(rows, showSummary)}
    </div>
  );

  useLayoutEffect(() => {
    if (loading) return;
    if (!measurePageRef.current || !measureHeaderRef.current) return;

    const pageRect = measurePageRef.current.getBoundingClientRect();
    if (!pageRect.height) return;

    const pageStyles = getComputedStyle(measurePageRef.current);
    const paddingTop = parseFloat(pageStyles.paddingTop) || 0;
    const paddingBottom = parseFloat(pageStyles.paddingBottom) || 0;
    const headerHeight =
      measureHeaderRef.current.getBoundingClientRect().height || 0;
    const headerGap = 16;
    const contentHeight =
      pageRect.height - paddingTop - paddingBottom - headerHeight - headerGap;

    const getOuterHeight = (element) => {
      if (!element) return 0;
      const styles = getComputedStyle(element);
      const marginTop = parseFloat(styles.marginTop) || 0;
      const marginBottom = parseFloat(styles.marginBottom) || 0;
      return element.getBoundingClientRect().height + marginTop + marginBottom;
    };

    const introHeight = getOuterHeight(measureIntroRef.current);
    const usahaUploadsHeight = getOuterHeight(measureUsahaUploadsRef.current);
    const analisa5CHeight = getOuterHeight(measureAnalisa5CRef.current);
    const analisaDetailHeights = analisaDetailRows.map((_, index) =>
      getOuterHeight(measureAnalisaDetailRefs.current[index])
    );
    const agunanHeights = jaminanChunks.map((_, index) =>
      getOuterHeight(measureAgunanBlockRefs.current[index])
    );

    const blocks = [];
    if (introHeight) {
      blocks.push({ type: "intro", height: introHeight });
    }
    jaminanChunks.forEach((chunk, index) => {
      const height = agunanHeights[index] || 0;
      if (!height) return;
      blocks.push({
        type: "agunan",
        height,
        rows: chunk,
        showSummary: index === jaminanChunks.length - 1,
      });
    });
    if (analisa5CHeight) {
      blocks.push({ type: "analisa5c", height: analisa5CHeight });
    }
    analisaDetailRows.forEach((_, index) => {
      const height = analisaDetailHeights[index] || 0;
      if (!height) return;
      blocks.push({
        type: "analisaDetailRow",
        height,
        rowIndex: index,
      });
    });
    if (usahaUploadsHeight) {
      blocks.push({ type: "usahaUploads", height: usahaUploadsHeight });
    }

    const pages = [];
    let remaining = contentHeight;
    let current = [];
    const blockGap = 16;

    blocks.forEach((block) => {
      const needed = current.length ? block.height + blockGap : block.height;
      if (needed > remaining && current.length) {
        pages.push(current);
        current = [];
        remaining = contentHeight;
      }
      current.push(block);
      remaining -= current.length === 1 ? block.height : block.height + blockGap;
    });
    if (current.length) pages.push(current);

    setPageBlocks(pages);
  }, [loading, reportData, userInfo]);

  const renderBlock = (block) => {
    switch (block.type) {
      case "intro":
        return introSection;
      case "agunan":
        return renderAgunanBlock(block.rows, block.showSummary);
      case "analisa5c":
        return analisa5CSection;
      case "analisaDetailRow":
        return analisaDetailRows[block.rowIndex]?.content ?? null;
      case "usahaUploads":
        return usahaUploadsSection;
      default:
        return null;
    }
  };

  return (
    <PageBackground>
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FaBriefcase className="text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800">
                  Nota Analisa Kredit
                </h1>
                <p className="text-sm text-slate-500">
                  No Permohonan: {no_permohonan || "-"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-error-800 text-white text-sm shadow-sm hover:bg-slate-900"
              >
                Download PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
              Memuat data...
            </div>
          ) : (
            <>
              <div
                aria-hidden="true"
                style={{
                  position: "fixed",
                  top: "-10000px",
                  left: 0,
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: -1,
                }}
              >
                <div
                  ref={measurePageRef}
                  className="pdf-page text-sm text-slate-800"
                  style={{ height: "297mm" }}
                >
                  <div ref={measureHeaderRef}>
                    <PageHeader
                      namaBank={namaBank}
                      noPermohonan={no_permohonan}
                      pageNumber={1}
                      alamatKantor={alamatKantorLabel}
                      telpKantor={telpKantorLabel}
                    />
                  </div>
                  <div ref={measureIntroRef}>{introSection}</div>
                  {jaminanChunks.map((chunk, index) => (
                    <div
                      key={`measure-agunan-${index}`}
                      ref={(el) => {
                        measureAgunanBlockRefs.current[index] = el;
                      }}
                    >
                      {renderAgunanBlock(
                        chunk,
                        index === jaminanChunks.length - 1
                      )}
                    </div>
                  ))}
                  <div ref={measureAnalisa5CRef}>{analisa5CSection}</div>
                  {analisaDetailRows.map((row, index) => (
                    <div
                      key={`measure-analisa-detail-${row.key}`}
                      ref={(el) => {
                        measureAnalisaDetailRefs.current[index] = el;
                      }}
                    >
                      {row.content}
                    </div>
                  ))}
                  {showUsahaUploads ? (
                    <div ref={measureUsahaUploadsRef}>
                      {usahaUploadsSection}
                    </div>
                  ) : null}
                </div>
              </div>
              <div
                ref={contentRef}
                className="pdf-container text-sm text-slate-800 space-y-8"
              >
                <style>
                  {`
                    .pdf-container {
                      background: transparent;
                      padding: 0;
                    }

                    .pdf-page {
                      width: 210mm;
                      min-height: 297mm;
                      margin: 0 auto;
                      padding: 12mm 12mm;
                      box-sizing: border-box;
                      background: #ffffff;
                      break-after: page;
                      page-break-after: always;
                      break-inside: avoid;
                      page-break-inside: avoid;
                    }
                    .pdf-page.surat-page {
                      display: flex;
                      flex-direction: column;
                    }
                    .pdf-page .border-slate-200,
                    .pdf-page .border-slate-300 {
                      border-color: #000 !important;
                    }

                    @page {
                      size: A4 portrait;
                      margin: 0;
                    }
                  `}
                </style>

                {pageBlocks.map((blocks, pageIndex) => (
                  <div key={`pdf-page-${pageIndex}`} className="pdf-page space-y-4">
                    <PageHeader
                      namaBank={namaBank}
                      noPermohonan={no_permohonan}
                      pageNumber={pageIndex + 1}
                      alamatKantor={alamatKantorLabel}
                      telpKantor={telpKantorLabel}
                    />
                    {blocks.map((block, blockIndex) => (
                      <div key={`${block.type}-${blockIndex}`}>
                        {renderBlock(block)}
                      </div>
                    ))}
                  </div>
                ))}
                {pageBlocks.length ? (
                  <div className="pdf-page space-y-4 surat-page">
                    <PageHeader
                      namaBank={namaBank}
                      noPermohonan={no_permohonan}
                      pageNumber={pageBlocks.length + 1}
                      alamatKantor={alamatKantorLabel}
                      telpKantor={telpKantorLabel}
                      hidePageNumber
                    />
                    {suratKeputusanSection}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </main>
      </div>
    </PageBackground>
  );
}
