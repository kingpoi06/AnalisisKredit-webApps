import { useState, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";
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
  className = "",
  inputMode,
  accept,
  capture,
}) => (
  <div className="space-y-1">
    <label className="text-[11px] font-medium text-slate-600">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      inputMode={inputMode}
      accept={accept}
      capture={capture}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-xs transition
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
      placeholder:text-slate-400 ${
        readOnly ? "bg-slate-50 text-slate-600 cursor-not-allowed" : "bg-white text-slate-800"
      } ${className}`}
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
    <label className="text-[11px] font-medium text-slate-600">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs
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
  keteranganUmum: "",
  jenisNasabah: "",
  character: "",
  statusKepemilikanTempatTinggal: "",
  lamaTinggalAlamatSaatIni: "",
  frekuensiPindahRumah: "",
  kepatuhanProsesAnalisaKredit: "",
  tunggakanKewajibanRutinNonKredit: "",
  sumberModalAwalUsaha: "",
  buktiKeterlibatanModalSendiri: "",
  asetProduktifPribadi: "",
  danaDaruratCalonDebitur: "",
  konsistensiSaldoRekening: "",
  cadanganKasOperasionalUsaha: "",
  rekeningKhususOperasionalUsaha: "",
  lamaUsahaBidangSama: "",
  statusLokasiUsaha: "",
  ketergantunganTerhadapMusim: "",
  risikoPHKPekerjaan: "",
  penghasilanAlternatifBerkelanjutan: "",
  stabilitasOmzetUsaha: "",
  ketergantunganPelangganUtama: "",
  statusAgunan: "",
  capital1: "",
  capital2: "",
  capacity1: "",
  capacity2: "",
  capacity3: "",
  capacity4: "",

  // KEUANGAN USAHA
  omsetPerhari: "",
  lamaUsahaSebulan: "",
  jenisHPP: "",
  hargaPokokPenjualan: "",
  omsetPerbulan: "",
  jumlahPendapatan: "",
  labaNetto: "",
  labaNettoLainnya:"",
  labaNettoNonOperasional: "",
  ketAngsuranDariBank: "",
  biayaOperasional: "",
  ketBiayaOperasional: "",
  pendapatanLainnya: "",
  pendapatanPemohonKredit: "",
  pendapatanIstriSuami: "",
  pendapatanTambahan: "",
  totalPenghasilan: "",
  ketPendapatanLainnya: "",
  biayaNonOperasional: "",
  biayaAnakSekolah: "",
  biayaKonsumsi: "",
  biayaListrikAirTelepon: "",
  biayaLainnyaNonOperasional: "",
  ketBiayaNonOperasional: "",
  biayaHutangKewajibanLain: "",
  ketBiayaHutangKewajibanLain: "",
  
  pokokPerBulan: "",
  totalBungaPerbulan: "",
  angsuranPembiayaan: "",
  
  kemampuanMembayarSetelahPembiayaan: "",
  nilaiRpc: "",
  maksimumPlafonKredit: "",
  besarAngsuranMpk: "",

  repaymentCapacity: "",
  repaymentCapacityStatus: "",
  catatanPengajuan: "",
  pertimbanganKewajiban: "",
  pertimbanganUsulan: "",
};

const MAX_LIST_ITEMS = 5;
const SLIK_UPLOAD_INDEX = 0;

const normalizeKey = (key) => String(key).replace(/_/g, "").toLowerCase();

const ANALISIS_FIELD_MAP = Object.keys(initialFormData).reduce((acc, key) => {
  acc[normalizeKey(key)] = key;
  return acc;
}, {});

const createEmptyJaminan = () => ({
  jenisjaminan: "",
  statusPengikatan: "",
  statusAgunan: "",
  statusHubBankLain: "",
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

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const hasInputValue = (value) => String(value ?? "").trim() !== "";

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

const computeSum = (values, maxValue) => {
  if (!Array.isArray(values) || !values.length) return 0;
  return values.reduce((sum, value) => {
    const numericValue = toNumber(value);
    const cappedValue =
      typeof maxValue === "number"
        ? Math.min(Math.max(numericValue, 0), maxValue)
        : Math.max(numericValue, 0);
    return sum + cappedValue;
  }, 0);
};

const SLIK_GRADE_SCORE_MAP = {
  "Sangat Baik": 30,
  Baik: 22.5,
  Cukup: 15,
  Buruk: 7.5,
  "Sangat Buruk": 0,
};

const formatTwoDecimals = (value) => {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(2);
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

const normalizeJaminanItem = (item) => {
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

const readSlikStorage = (permohonan) => {
  const storageKey = getSlikStorageKey(permohonan);
  if (!storageKey) return {};
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeSlikStorage = (permohonan, next) => {
  const storageKey = getSlikStorageKey(permohonan);
  if (!storageKey) return;
  if (!next || Object.keys(next).length === 0) {
    localStorage.removeItem(storageKey);
    return;
  }
  localStorage.setItem(storageKey, JSON.stringify(next));
};

const saveSlikStorageEntry = (
  permohonan,
  index,
  table,
  fileName,
  source
) => {
  const current = readSlikStorage(permohonan);
  current[index] = { table, fileName, source };
  writeSlikStorage(permohonan, current);
};

const removeSlikStorageEntry = (permohonan, index) => {
  const current = readSlikStorage(permohonan);
  if (!(index in current)) return;
  delete current[index];
  writeSlikStorage(permohonan, current);
};

const parseSlikText = (text) => {
  const rawText = String(text ?? "");
  const trimmedText = rawText.trim();
  if (!trimmedText) {
    return { headers: [], rows: [] };
  }

  const normalizeKey = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const expectedKeys = [
    "namadebitur",
    "ljkket",
    "jeniskreditpembiayaan",
    "jeniskreditpembiayaanket",
    "plafon",
    "bakidebet",
    "sukubungaimbalan",
    "tanggalakadawal",
    "tanggaljatuhtempo",
    "jumlahharitunggakan",
    "kualitas",
    "kualitasket",
    "kondisi",
  ];

  const findFirstValueByKey = (value, targetKeys) => {
    if (!value) return "";
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = findFirstValueByKey(item, targetKeys);
        if (found !== "") return found;
      }
      return "";
    }
    if (typeof value !== "object") return "";
    for (const [key, child] of Object.entries(value)) {
      const normalized = normalizeKey(key);
      if (targetKeys.includes(normalized)) {
        const raw = child ?? "";
        if (String(raw).trim() !== "") return String(raw).trim();
      }
      const found = findFirstValueByKey(child, targetKeys);
      if (found !== "") return found;
    }
    return "";
  };

  const collectNormalizedKeys = (value, keySet) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => collectNormalizedKeys(item, keySet));
      return;
    }
    if (typeof value !== "object") return;
    Object.entries(value).forEach(([key, child]) => {
      keySet.add(normalizeKey(key));
      if (child && typeof child === "object") {
        collectNormalizedKeys(child, keySet);
      }
    });
  };

  const collectObjectArrays = (value, arrays) => {
    if (!value) return;
    if (Array.isArray(value)) {
      const objectItems = value.filter(
        (item) => item && typeof item === "object" && !Array.isArray(item)
      );
      if (objectItems.length) {
        arrays.push(objectItems);
      }
      value.forEach((item) => collectObjectArrays(item, arrays));
      return;
    }
    if (typeof value !== "object") return;
    Object.values(value).forEach((child) =>
      collectObjectArrays(child, arrays)
    );
  };

  const extractRowsFromJson = (jsonData) => {
    const arrays = [];
    collectObjectArrays(jsonData, arrays);

    let bestRows = [];
    let bestScore = 0;
    let bestLength = 0;

    arrays.forEach((rows) => {
      const keySet = new Set();
      rows.forEach((row) => collectNormalizedKeys(row, keySet));
      const score = expectedKeys.filter((key) => keySet.has(key)).length;
      if (score > bestScore || (score === bestScore && rows.length > bestLength)) {
        bestRows = rows;
        bestScore = score;
        bestLength = rows.length;
      }
    });

    if (bestScore > 0) return bestRows;

    if (jsonData && typeof jsonData === "object" && !Array.isArray(jsonData)) {
      const keySet = new Set();
      collectNormalizedKeys(jsonData, keySet);
      const score = expectedKeys.filter((key) => keySet.has(key)).length;
      if (score > 0) return [jsonData];
    }

    return [];
  };

  if (trimmedText.startsWith("{") || trimmedText.startsWith("[")) {
    try {
      const jsonData = JSON.parse(trimmedText);
      const jsonRows = extractRowsFromJson(jsonData);
      if (jsonRows.length) {
        const namaDebitur = findFirstValueByKey(jsonData, ["namadebitur"]);
        return {
          headers: [],
          rows: jsonRows,
          meta: namaDebitur ? { namaDebitur } : {},
        };
      }
    } catch {
      // Fall through to delimited parsing.
    }
  }

  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const delimiters = [",", ";", "\t", "|"];
  const firstLine = lines[0];
  let delimiter = "";
  let maxCount = 0;

  delimiters.forEach((delim) => {
    const count = firstLine.split(delim).length - 1;
    if (count > maxCount) {
      maxCount = count;
      delimiter = delim;
    }
  });

  if (!delimiter) {
    return {
      headers: ["Data SLIK"],
      rows: lines.map((line) => [line]),
    };
  }

  const rows = lines.map((line) =>
    line.split(delimiter).map((cell) => cell.trim())
  );
  const firstRow = rows[0];
  const looksLikeHeader = firstRow.some((cell) => /[A-Za-z]/.test(cell));

  if (looksLikeHeader && rows.length > 1) {
    return { headers: firstRow, rows: rows.slice(1) };
  }

  return {
    headers: firstRow.map((_, index) => `Kolom ${index + 1}`),
    rows,
  };
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

const parseSlikDateValue = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const ymdMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]) - 1;
    const day = Number(ymdMatch[3]);
    return new Date(Date.UTC(year, month, day));
  }
  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const year = Number(dmyMatch[3]);
    return new Date(Date.UTC(year, month, day));
  }
  if (/^\d+$/.test(raw) && raw.length >= 8) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6)) - 1;
    const day = Number(raw.slice(6, 8));
    return new Date(Date.UTC(year, month, day));
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatSlikDateShort = (value) => {
  const date = parseSlikDateValue(value);
  if (!date) return String(value ?? "").trim();
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}-${month}-${year}`;
};

const buildSlikSummaryRows = (entries) => {
  const rows = [];
  entries.forEach((entry) => {
    const rowMaps = buildSlikRowMaps(entry?.table);
    const fallbackName = String(entry?.table?.meta?.namaDebitur ?? "").trim();
    rowMaps.forEach((row) => {
      if (!hasSlikRowData(row)) return;
      const namaDebitur =
        String(findRowValueByPatterns(row, ["namadebitur"]) ?? "").trim() ||
        fallbackName;
      const kualitas = String(
        findRowValueByPatterns(row, ["kualitas"]) ?? ""
      ).trim();
      const kualitasKet = String(
        findRowValueByPatterns(row, ["kualitasket"]) ?? ""
      ).trim();
      const tanggalMulai = findRowValueByPatterns(row, [
        "tanggalmulai",
        "tanggalakadawal",
        "tglmulai",
        "tglakadawal",
      ]);
      const tanggalJatuhTempo = findRowValueByPatterns(row, [
        "tanggaljatuhtempo",
        "tgljatuhtempo",
      ]);

      const kolektibilitas =
        kualitas && kualitasKet
          ? `${kualitas} - ${kualitasKet}`
          : kualitas || kualitasKet || "-";

      rows.push({
        namaDebitur: namaDebitur || "-",
        kolektibilitas,
        tanggalMulai: formatSlikDateShort(tanggalMulai) || "-",
        tanggalJatuhTempo: formatSlikDateShort(tanggalJatuhTempo) || "-",
      });
    });
  });
  return rows;
};

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

const buildSlikNarrative = (summary) => {
  if (!summary || !summary.totalAktivitas) return "";

  const totalAktivitas = summary.totalAktivitas;
  const totalKualitas = summary.totalKualitas ?? 0;
  const kualitasCounts = summary.kualitasCounts ?? {};
  const kualitas1 = kualitasCounts[1] ?? 0;
  const nonOneCount = totalKualitas ? totalKualitas - kualitas1 : 0;
  const kualitasKet1Label =
    summary.kualitasKet1 ||
    (totalKualitas && kualitas1 === totalKualitas ? "Lancar" : "");
  const kualitasKetSuffix = kualitasKet1Label ? ` (${kualitasKet1Label})` : "";
  const fasilitasLabel =
    totalAktivitas === 1
      ? "1 fasilitas kredit"
      : `${totalAktivitas} fasilitas kredit`;

  let firstSentence = "";
  if (totalKualitas) {
    if (kualitas1 === totalKualitas) {
      firstSentence = `Berdasarkan hasil pengecekan SLIK, debitur memiliki ${fasilitasLabel} yang seluruhnya tercatat dengan kolektibilitas 1${kualitasKetSuffix}.`;
    } else {
      firstSentence = `Berdasarkan hasil pengecekan SLIK, debitur memiliki ${fasilitasLabel} dengan ${kualitas1} fasilitas berkolektibilitas 1 dan ${nonOneCount} fasilitas berkolektibilitas di atas 1.`;
    }
  } else {
    firstSentence = `Berdasarkan hasil pengecekan SLIK, debitur memiliki ${fasilitasLabel} dengan rincian kolektibilitas belum lengkap.`;
  }

  let tunggakanSentence = "";
  if (summary.hasTunggakan) {
    tunggakanSentence = "Terdapat tunggakan yang perlu menjadi perhatian.";
  } else if (totalKualitas && nonOneCount > 0) {
    tunggakanSentence =
      "Terdapat catatan kolektibilitas di atas 1 yang perlu diperhatikan.";
  } else {
    tunggakanSentence = "Tidak terdapat tunggakan maupun catatan negatif.";
  }

  let kelayakanSentence = "";
  if (summary.gradeLabel) {
    const gradeLower = summary.gradeLabel.toLowerCase();
    const statusPhrase =
      summary.statusSlik === "Approve"
        ? "memenuhi kriteria kelayakan"
        : "perlu pertimbangan lebih lanjut";
    kelayakanSentence = `Riwayat kredit debitur dinilai ${gradeLower} sehingga ${statusPhrase}.`;
  }

  return [firstSentence, tunggakanSentence, kelayakanSentence]
    .filter(Boolean)
    .join(" ");
};

const renderSlikSummaryTable = (entries) => {
  const rows = buildSlikSummaryRows(entries);
  if (!rows.length) {
    return (
      <p className="text-[11px] text-slate-500">Belum ada data SLIK</p>
    );
  }

  const columns = [
    { key: "namaDebitur", label: "Nama Debitur", align: "text-left" },
    {
      key: "kolektibilitas",
      label: "Kolektibilitas",
      align: "text-center",
    },
    { key: "tanggalMulai", label: "Tanggal Masuk", align: "text-center" },
    {
      key: "tanggalJatuhTempo",
      label: "Tanggal Jatuh Tempo",
      align: "text-center",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.06),_transparent_60%)]" />
      <div className="relative z-10">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 px-5 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Ringkasan Data SLIK
            </p>
            <p className="text-xs text-black">
              Total Aktivitas: {rows.length}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-[11px] text-black">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-slate-200 px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-black"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 1 ? "bg-slate-50/60" : "bg-white"}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`border-b border-slate-100 px-3 py-2 align-top transition-colors hover:bg-blue-50/40 ${column.align}`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const renderSlikTable = (slikTable, meta = {}) => {
  const headers = slikTable?.headers ?? [];
  const rows = slikTable?.rows ?? [];
  const mergedMeta = { ...(slikTable?.meta ?? {}), ...meta };
  const fileName = mergedMeta.fileName ?? "";
  const namaDebiturDefault = String(mergedMeta.namaDebitur ?? "").trim();
  const isObjectRows = rows.some(
    (row) => row && typeof row === "object" && !Array.isArray(row)
  );

  if (!rows.length) {
    return (
      <p className="text-[11px] text-slate-500">Belum ada data SLIK</p>
    );
  }

  const rowLengths = rows.map((row) => (Array.isArray(row) ? row.length : 0));
  const columnCount = Math.max(
    headers.length,
    ...rowLengths,
    1
  );
  const headerLabels =
    headers.length > 0
      ? headers
      : Array.from({ length: columnCount }, (_, index) => `Kolom ${index + 1}`);

  const normalizeHeader = (value) =>
    String(value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const normalizedHeaders = headerLabels.map(normalizeHeader);

  const findColumnIndex = (patterns) => {
    const exactIndex = normalizedHeaders.findIndex((header) =>
      patterns.includes(header)
    );
    if (exactIndex >= 0) return exactIndex;
    return normalizedHeaders.findIndex((header) =>
      patterns.some((pattern) => header.includes(pattern))
    );
  };

  const parseAmount = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };

  const fieldPatterns = {
    namaDebitur: ["namadebitur"],
    ljkKet: ["ljkket"],
    jenisKreditPembiayaan: ["jeniskreditpembiayaan"],
    jenisKreditPembiayaanKet: ["jeniskreditpembiayaanket"],
    plafon: ["plafon"],
    bakiDebet: ["bakidebet"],
    sukuBungaImbalan: ["sukubungaimbalan"],
    tanggalAkadAwal: ["tanggalakadawal"],
    tanggalJatuhTempo: ["tanggaljatuhtempo"],
    jumlahHariTunggakan: ["jumlahharitunggakan"],
    kualitas: ["kualitas"],
    kualitasKet: ["kualitasket"],
    kondisi: ["kondisi"],
  };

  const fieldIndexes = Object.fromEntries(
    Object.entries(fieldPatterns).map(([key, patterns]) => [
      key,
      findColumnIndex(patterns),
    ])
  );
  const hasMappedFields =
    isObjectRows || Object.values(fieldIndexes).some((index) => index >= 0);

  const rowKeyCache = new WeakMap();
  const getRowKeyMap = (row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    if (rowKeyCache.has(row)) return rowKeyCache.get(row);
    const map = {};
    const hasValue = (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== "";
    const collectKeys = (value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((item) => collectKeys(item));
        return;
      }
      if (typeof value !== "object") return;
      Object.entries(value).forEach(([key, child]) => {
        const normalizedKey = normalizeHeader(key);
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
    rowKeyCache.set(row, map);
    return map;
  };

  const getFieldValue = (row, fieldKey, fallbackIndex) => {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      if (!fieldKey) return "";
      const rowMap = getRowKeyMap(row) ?? {};
      const patterns = fieldPatterns[fieldKey] ?? [];
      for (const pattern of patterns) {
        const normalized = normalizeHeader(pattern);
        if (normalized in rowMap) return rowMap[normalized] ?? "";
      }
      return row[fieldKey] ?? "";
    }

    const index =
      fieldKey && typeof fieldIndexes[fieldKey] === "number"
        ? fieldIndexes[fieldKey]
        : -1;
    if (index >= 0) return row?.[index] ?? "";
    if (!hasMappedFields && typeof fallbackIndex === "number") {
      return row?.[fallbackIndex] ?? "";
    }
    return "";
  };

  const parseDateValue = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const ymdMatch = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]) - 1;
      const day = Number(ymdMatch[3]);
      return new Date(Date.UTC(year, month, day));
    }
    const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const month = Number(dmyMatch[2]) - 1;
      const year = Number(dmyMatch[3]);
      return new Date(Date.UTC(year, month, day));
    }
    if (/^\d+$/.test(raw) && raw.length >= 8) {
      const year = Number(raw.slice(0, 4));
      const month = Number(raw.slice(4, 6)) - 1;
      const day = Number(raw.slice(6, 8));
      return new Date(Date.UTC(year, month, day));
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatDateDisplay = (value) => {
    const date = parseDateValue(value);
    if (!date) return String(value ?? "").trim();
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = String(date.getUTCFullYear());
    return `${day}-${month}-${year}`;
  };

  const computeDayDiff = (startValue, endValue) => {
    const startDate = parseDateValue(startValue);
    const endDate = parseDateValue(endValue);
    if (!startDate || !endDate) return "";
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
    return diffDays >= 0 ? String(diffDays) : "";
  };

  const formatMoneyCell = (value) => {
    const numericValue = parseAmount(value);
    if (!numericValue) return value ?? "";
    return formatIdInteger(numericValue);
  };

  const columns = [
    {
      key: "namaNasabah",
      label: "Nama Nasabah",
      getValue: (row, fallbackIndex) => {
        const value = getFieldValue(row, "namaDebitur", fallbackIndex);
        if (String(value ?? "").trim()) return value;
        return namaDebiturDefault;
      },
    },
    {
      key: "namaBank",
      label: "Nama Bank",
      getValue: (row, fallbackIndex) =>
        getFieldValue(row, "ljkKet", fallbackIndex),
    },
    {
      key: "jenisKredit",
      label: "Jenis Kredit",
      getValue: (row, fallbackIndex) => {
        const jenis = getFieldValue(row, "jenisKreditPembiayaan");
        const ket = getFieldValue(row, "jenisKreditPembiayaanKet");
        if (jenis && ket) return `${jenis} - ${ket}`;
        if (jenis) return jenis;
        if (ket) return ket;
        return getFieldValue(row, null, fallbackIndex);
      },
    },
    {
      key: "plafonKredit",
      label: "Plafon Kredit (Rp.)",
      getValue: (row, fallbackIndex) =>
        formatMoneyCell(getFieldValue(row, "plafon", fallbackIndex)),
    },
    {
      key: "bakiDebet",
      label: "Baki Debet (Rp.)",
      getValue: (row, fallbackIndex) =>
        formatMoneyCell(getFieldValue(row, "bakiDebet", fallbackIndex)),
    },
    {
      key: "sukuBunga",
      label: "Suku Bunga (% p.a)",
      getValue: (row, fallbackIndex) =>
        getFieldValue(row, "sukuBungaImbalan", fallbackIndex),
    },
    {
      key: "tanggalAkad",
      label: "Tanggal Akad",
      getValue: (row, fallbackIndex) =>
        formatDateDisplay(getFieldValue(row, "tanggalAkadAwal", fallbackIndex)),
    },
    {
      key: "tanggalJatuhTempo",
      label: "Tanggal Jatuh Tempo",
      getValue: (row, fallbackIndex) =>
        formatDateDisplay(getFieldValue(row, "tanggalJatuhTempo", fallbackIndex)),
    },
    {
      key: "jangkaWaktu",
      label: "Jangka Waktu (Bulan)",
      getValue: (row, fallbackIndex) => {
        const start = getFieldValue(row, "tanggalAkadAwal");
        const end = getFieldValue(row, "tanggalJatuhTempo");
        const diff = computeDayDiff(start, end);
        if (diff !== "") return diff;
        return getFieldValue(row, null, fallbackIndex);
      },
    },
    {
      key: "lamaTunggakan",
      label: "Lama Tunggakan (Hari)",
      getValue: (row, fallbackIndex) =>
        getFieldValue(row, "jumlahHariTunggakan", fallbackIndex),
    },
    {
      key: "kol",
      label: "Kol",
      getValue: (row, fallbackIndex) => {
        const kualitas = getFieldValue(row, "kualitas");
        const ket = getFieldValue(row, "kualitasKet");
        if (kualitas && ket) return `${kualitas} - ${ket}`;
        if (kualitas) return kualitas;
        if (ket) return ket;
        return getFieldValue(row, null, fallbackIndex);
      },
    },
    {
      key: "kondisi",
      label: "Kondisi",
      getValue: (row, fallbackIndex) =>
        getFieldValue(row, "kondisi", fallbackIndex),
    },
  ];

  const fallbackIndexes = columns.reduce((acc, column, index) => {
    acc[column.key] = index;
    return acc;
  }, {});

  let namaNasabah = "";
  if (isObjectRows) {
    const rowWithName = rows.find((row) =>
      String(getFieldValue(row, "namaDebitur")).trim()
    );
    namaNasabah = rowWithName
      ? String(getFieldValue(rowWithName, "namaDebitur")).trim()
      : "";
  } else {
    const namaNasabahIndex = hasMappedFields
      ? fieldIndexes.namaDebitur ?? -1
      : fallbackIndexes.namaNasabah ?? -1;
    const namaNasabahRow =
      namaNasabahIndex >= 0
        ? rows.find((row) => String(row?.[namaNasabahIndex] ?? "").trim())
        : null;
    namaNasabah =
      namaNasabahIndex >= 0
        ? String(namaNasabahRow?.[namaNasabahIndex] ?? "").trim()
        : "";
  }
  if (!namaNasabah && namaDebiturDefault) {
    namaNasabah = namaDebiturDefault;
  }

  const plafonIndex = fieldIndexes.plafon ?? -1;
  const bakiIndex = fieldIndexes.bakiDebet ?? -1;

  let totalPlafon = null;
  let totalBaki = null;
  if (isObjectRows) {
    totalPlafon = rows.reduce(
      (sum, row) => sum + parseAmount(getFieldValue(row, "plafon")),
      0
    );
    totalBaki = rows.reduce(
      (sum, row) => sum + parseAmount(getFieldValue(row, "bakiDebet")),
      0
    );
  } else {
    totalPlafon =
      typeof plafonIndex === "number" && plafonIndex >= 0
        ? rows.reduce((sum, row) => sum + parseAmount(row?.[plafonIndex]), 0)
        : !hasMappedFields
          ? rows.reduce(
              (sum, row) =>
                sum +
                parseAmount(
                  row?.[fallbackIndexes.plafonKredit ?? -1] ?? ""
                ),
              0
            )
          : null;
    totalBaki =
      typeof bakiIndex === "number" && bakiIndex >= 0
        ? rows.reduce((sum, row) => sum + parseAmount(row?.[bakiIndex]), 0)
        : !hasMappedFields
          ? rows.reduce(
              (sum, row) =>
                sum +
                parseAmount(row?.[fallbackIndexes.bakiDebet ?? -1] ?? ""),
              0
            )
          : null;
  }

  const rightAlignedKeys = new Set(["plafonKredit", "bakiDebet"]);
  const centerAlignedKeys = new Set([
    "sukuBunga",
    "tanggalAkad",
    "tanggalJatuhTempo",
    "jangkaWaktu",
    "lamaTunggakan",
    "kol",
  ]);

  const getCellAlign = (columnKey) => {
    if (rightAlignedKeys.has(columnKey)) return "text-right";
    if (centerAlignedKeys.has(columnKey)) return "text-center";
    return "text-left";
  };

  const visibleRows = rows.map((row) =>
    columns.map((column) => column.getValue(row, fallbackIndexes[column.key]))
  );

  const totalLabelSpan = Math.min(3, columns.length);
  const showTotals = totalPlafon !== null || totalBaki !== null;
  const namaDebiturLabel = namaNasabah || "-";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,116,144,0.06),_transparent_60%)]" />
      <div className="relative z-10">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 px-5 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              Rekapitulasi Cek IDEB/SLIK
            </p>
            <p className="text-xs text-black">Nama Debitur: {namaDebiturLabel}</p>
          </div>
          {fileName ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-black shadow-sm">
              File: {fileName}
            </span>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-collapse text-[11px] text-black">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-slate-200 px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-black"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 1 ? "bg-slate-50/60" : "bg-white"}
                >
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className={`border-b border-slate-100 px-3 py-2 align-top transition-colors hover:bg-blue-50/40 ${getCellAlign(
                        columns[colIndex].key
                      )}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {showTotals ? (
                <tr className="bg-slate-50 font-semibold text-black">
                  <td
                    colSpan={totalLabelSpan}
                    className="border-t border-slate-200 px-3 py-2 text-center"
                  >
                    Total
                  </td>
                  {Array.from(
                    { length: columns.length - totalLabelSpan },
                    (_, offset) => {
                      const colIndex = offset + totalLabelSpan;
                      const columnKey = columns[colIndex]?.key;
                      let value = "";
                      if (columnKey === "plafonKredit" && totalPlafon !== null) {
                        value = formatIdInteger(totalPlafon);
                      }
                      if (columnKey === "bakiDebet" && totalBaki !== null) {
                        value = formatIdInteger(totalBaki);
                      }
                      return (
                        <td
                          key={`total-${colIndex}`}
                          className={`border-t border-slate-200 px-3 py-2 ${getCellAlign(
                            columnKey
                          )}`}
                        >
                          {value}
                        </td>
                      );
                    }
                  )}
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const formatLineItems = (items) => {
  let counter = 0;
  return items
    .map((item) => {
      const keterangan = String(item?.keterangan ?? "").trim();
      const nilai = String(item?.nilai ?? "").trim();
      if (!keterangan && !nilai) return "";
      counter += 1;
      const parts = [];
      if (keterangan) parts.push(keterangan);
      if (nilai) parts.push(`Rp ${formatIdInteger(nilai)}`);
      return `${counter}. ${parts.join(" - ")}`;
    })
    .filter(Boolean)
    .join("\n");
};

const getLineItemsTotals = (items) => {
  const total = items.reduce(
    (sum, item) => sum + toNumber(item?.nilai),
    0
  );
  const hasValue = items.some(
    (item) => String(item?.nilai ?? "").trim() !== ""
  );
  return {
    total: hasValue ? String(total) : "",
    summary: formatLineItems(items),
  };
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

const isKreditModalKerjaType = (value) => {
  if (!value) return false;
  const normalized = String(value).toLowerCase();
  if (normalized.includes("kredit modal kerja")) return true;
  return /\b121\b/.test(normalized);
};

const normalizePerhitunganBunga = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "flat") return "Flat";
  if (normalized === "anuitas") return "Anuitas";
  return "";
};

const computeSukuBungaBulan = ({ sukuBungaTahun, perhitunganBunga }) => {
  const resolvedPerhitungan = normalizePerhitunganBunga(perhitunganBunga);
  if (sukuBungaTahun === "" || resolvedPerhitungan === "") {
    return "";
  }

  const annualRate = toNumber(sukuBungaTahun) / 100;
  if (annualRate <= 0) return "";

  if (resolvedPerhitungan === "Flat") {
    return String(((annualRate / 12) * 100).toFixed(2));
  }

  if (resolvedPerhitungan === "Anuitas") {
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    return String((monthlyRate * 100).toFixed(2));
  }

  return "";
};

const HPP_OPTIONS = [
  { value: "0.7", label: "Dagang 70%" },
  { value: "0.2", label: "Jasa 20%" },
];

const computeOmsetPerbulan = (omsetPerhari, lamaUsaha) => {
  if (omsetPerhari === "" || lamaUsaha === "") return "";
  return formatTwoDecimals(toNumber(omsetPerhari) * toNumber(lamaUsaha));
};

const computeHargaPokokPenjualan = (omsetPerbulan, jenisHPP) => {
  if (omsetPerbulan === "" || jenisHPP === "") return "";
  return formatTwoDecimals(toNumber(omsetPerbulan) * toNumber(jenisHPP));
};

const computeJumlahPendapatan = (omsetPerbulan, hargaPokokPenjualan) => {
  if (omsetPerbulan === "" || hargaPokokPenjualan === "") return "";
  return formatTwoDecimals(
    toNumber(omsetPerbulan) - toNumber(hargaPokokPenjualan)
  );
};

const computeLabaNetto = (jumlahPendapatan, biayaOperasional) => {
  if (jumlahPendapatan === "") return "";
  return formatTwoDecimals(
    toNumber(jumlahPendapatan) - toNumber(biayaOperasional)
  );
};

const computeTotalPenghasilanKonsumtif = (
  pendapatanPemohonKredit,
  pendapatanIstriSuami,
  pendapatanTambahan,
  pendapatanLainnya,
  biayaHutangKewajibanLain
) => {
  const hasAnyIncome =
    pendapatanPemohonKredit !== "" ||
    pendapatanIstriSuami !== "" ||
    pendapatanTambahan !== "" ||
    pendapatanLainnya !== "";
  if (!hasAnyIncome) return "";

  const tpp = toNumber(pendapatanTambahan);
  if (!tpp) return "0";

  const angsuranBankLain = toNumber(biayaHutangKewajibanLain);
  const remainingTpp = Math.max(tpp - angsuranBankLain, 0);
  return String(remainingTpp * 0.8);
};

const computeBiayaNonOperasionalKonsumtif = (
  biayaAnakSekolah,
  biayaKonsumsi,
  biayaListrikAirTelepon,
  biayaLainnyaNonOperasional
) => {
  if (
    biayaAnakSekolah === "" &&
    biayaKonsumsi === "" &&
    biayaListrikAirTelepon === "" &&
    biayaLainnyaNonOperasional === ""
  ) {
    return "";
  }

  return String(
    toNumber(biayaAnakSekolah) +
      toNumber(biayaKonsumsi) +
      toNumber(biayaListrikAirTelepon) +
      toNumber(biayaLainnyaNonOperasional)
  );
};

const computePokokPerBulan = (plafonPermohonan, jangkaWaktuKredit) => {
  if (plafonPermohonan === "" || jangkaWaktuKredit === "") return "";
  const principal = toNumber(plafonPermohonan);
  const months = toNumber(jangkaWaktuKredit);
  if (principal <= 0 || months <= 0) return "";
  return formatTwoDecimals(principal / months);
};

const computeTotalBungaPerbulan = (plafonPermohonan, sukuBungaBulan) => {
  if (plafonPermohonan === "" || sukuBungaBulan === "") return "";
  const principal = toNumber(plafonPermohonan);
  const monthlyRate = toNumber(sukuBungaBulan) / 100;
  if (principal <= 0 || monthlyRate <= 0) return "";
  return formatTwoDecimals(principal * monthlyRate);
};

const computeAngsuranPembiayaan = ({
  perhitunganBunga,
  plafonPermohonan,
  sukuBungaTahun,
  jangkaWaktuKredit,
  pokokPerBulan,
  totalBungaPerbulan,
}) => {
  if (perhitunganBunga === "Anuitas") {
    if (plafonPermohonan === "" || sukuBungaTahun === "" || jangkaWaktuKredit === "") {
      return "";
    }

    const principal = toNumber(plafonPermohonan);
    const months = toNumber(jangkaWaktuKredit);
    const annualRate = toNumber(sukuBungaTahun) / 100;
    if (principal <= 0 || months <= 0 || annualRate <= 0) return "";

    const ratePerMonth = annualRate / 12;
    const denominator = 1 - 1 / Math.pow(1 + ratePerMonth, months);
    if (denominator === 0) return "";

    return formatTwoDecimals((principal * ratePerMonth) / denominator);
  }

  if (pokokPerBulan === "") return "";
  return formatTwoDecimals(
    toNumber(pokokPerBulan) + toNumber(totalBungaPerbulan)
  );
};

const computeLabaNettoLainnya = (labaNetto, pendapatanLainnya) => {
  if (labaNetto === "") return "";
  return formatTwoDecimals(toNumber(labaNetto) + toNumber(pendapatanLainnya));
};

const computeLabaNettoNonOperasional = (
  labaNettoLainnya,
  biayaNonOperasional,
  biayaHutangKewajibanLain
) => {
  if (labaNettoLainnya === "") return "";
  return formatTwoDecimals(
    toNumber(labaNettoLainnya) -
      toNumber(biayaNonOperasional) -
      toNumber(biayaHutangKewajibanLain)
  );
};

const computeTotalLabaKonsumtif = (
  pendapatanPemohonKredit,
  pendapatanIstriSuami,
  pendapatanLainnya,
  maksimumAngsuran,
  biayaNonOperasional
) => {
  const totalPendapatan =
    toNumber(pendapatanPemohonKredit) +
    toNumber(pendapatanIstriSuami) +
    toNumber(pendapatanLainnya) +
    toNumber(maksimumAngsuran);
  if (!totalPendapatan) return "";
  return formatTwoDecimals(totalPendapatan - toNumber(biayaNonOperasional));
};

const computeKemampuanMembayarSetelahPembiayaan = (
  totalLaba,
  angsuranPembiayaan
) => {
  if (totalLaba === "") return "";
  return formatTwoDecimals(
    toNumber(totalLaba) - toNumber(angsuranPembiayaan)
  );
};

const computeNilaiRpc = (totalLaba) => {
  if (totalLaba === "") return "";
  const laba = toNumber(totalLaba);
  if (laba <= 0) return "";
  return formatTwoDecimals(laba * 0.5);
};

const computeMaksimumPlafonKredit = ({
  nilaiRpc,
  sukuBungaBulan,
  jangkaWaktuKredit,
}) => {
  if (nilaiRpc === "" || sukuBungaBulan === "" || jangkaWaktuKredit === "") {
    return "";
  }

  const rpc = toNumber(nilaiRpc);
  const months = toNumber(jangkaWaktuKredit);
  const monthlyRate = toNumber(sukuBungaBulan) / 100;
  if (rpc <= 0 || months <= 0) return "";

  const denominator = 1 + monthlyRate * months;
  if (denominator <= 0) return "";

  const factor = 1 / denominator;
  return formatTwoDecimals(rpc * months * factor);
};

const computeAngsuranDariMpk = ({
  maksimumPlafonKredit,
  sukuBungaBulan,
  jangkaWaktuKredit,
}) => {
  if (
    maksimumPlafonKredit === "" ||
    sukuBungaBulan === "" ||
    jangkaWaktuKredit === ""
  ) {
    return "";
  }

  const mpk = toNumber(maksimumPlafonKredit);
  const months = toNumber(jangkaWaktuKredit);
  const rate = toNumber(sukuBungaBulan) / 100;
  if (mpk <= 0 || months <= 0) return "";

  return formatTwoDecimals(mpk / months + mpk * rate);
};

const computeRepaymentCapacity = (angsuranPembiayaan, totalLaba) => {
  if (angsuranPembiayaan === "" || totalLaba === "") {
    return "";
  }

  const laba = toNumber(totalLaba);
  if (laba <= 0) return "";

  const denominator = laba * 0.5;
  if (denominator <= 0) return "";

  return formatTwoDecimals(toNumber(angsuranPembiayaan) / denominator);
};

const computeRepaymentCapacityStatus = (
  repaymentCapacity,
  kemampuanMembayarSetelahPembiayaan
) => {
  if (repaymentCapacity === "" && kemampuanMembayarSetelahPembiayaan === "") {
    return "";
  }

  if (
    kemampuanMembayarSetelahPembiayaan !== "" &&
    toNumber(kemampuanMembayarSetelahPembiayaan) < 0
  ) {
    return "Reject";
  }

  if (repaymentCapacity === "") return "";
  return toNumber(repaymentCapacity) > 0.5 ? "Reject" : "Approve";
};

const normalizeList = (data) => {
  if (!Array.isArray(data)) return data ? [data] : [];
  return Array.isArray(data[0]) ? data.flat() : data;
};

/* =======================
   PAGE
======================= */


export default function Analisis() {

const navigate = useNavigate();

const { no_permohonan: noPermohonanParam } = useParams();

const [formData, setFormData] = useState(initialFormData);
const [noPermohonan, setNoPermohonan] = useState(noPermohonanParam ?? "");
const [loadingNoPermohonan, setLoadingNoPermohonan] = useState(false);
const [capitalItems, setCapitalItems] = useState([]);
const [operasionalItems, setOperasionalItems] = useState([]);
const [nonOperasionalItems, setNonOperasionalItems] = useState([]);
const [hutangItems, setHutangItems] = useState([]);
const [pendapatanItems, setPendapatanItems] = useState([]);
const [slikEntries, setSlikEntries] = useState([]);
const [jaminanList, setJaminanList] = useState([]);

  const isKreditKonsumtif = isKreditKonsumtifPegawai(formData.jenisKredit);
  const isKreditModalKerja = isKreditModalKerjaType(formData.jenisKredit);
  const slikSummary = computeSlikSummary(slikEntries);
  const hasSlikFromJaminan = slikEntries.some((entry) => {
    const hasData = entry.fileName || entry.table?.rows?.length;
    return hasData && entry.source !== "analisis";
  });
  const hubunganBankLainValue = String(formData.jenisNasabah ?? "").trim();
  const isHubunganBankLainAda =
    hubunganBankLainValue.toLowerCase() === "ada";
  const shouldShowSlikUpload = isHubunganBankLainAda && !hasSlikFromJaminan;
  const analisisSlikEntry = slikEntries.find(
    (entry) => entry.source === "analisis"
  );
  const hasSlikRows = slikEntries.some(
    (entry) => entry.table?.rows?.length
  );
  const hasSlikUpload = Boolean(analisisSlikEntry?.fileName);
  const handleGenerateSlikNarrative = () => {
    const narrative = buildSlikNarrative(slikSummary);
    if (!narrative) return;
    setFormData((prev) => ({ ...prev, character: narrative }));
  };
  const characterValues = [
    formData.statusKepemilikanTempatTinggal,
    formData.lamaTinggalAlamatSaatIni,
    formData.frekuensiPindahRumah,
    formData.kepatuhanProsesAnalisaKredit,
    ...(isKreditModalKerja || isKreditKonsumtif
      ? [formData.tunggakanKewajibanRutinNonKredit]
      : []),
  ];
  const modalValues = isKreditModalKerja
    ? [
        formData.lamaUsahaBidangSama,
        formData.statusLokasiUsaha,
        formData.ketergantunganTerhadapMusim,
        formData.stabilitasOmzetUsaha,
        formData.ketergantunganPelangganUtama,
      ]
    : isKreditKonsumtif
    ? [
        formData.sumberModalAwalUsaha,
        formData.buktiKeterlibatanModalSendiri,
        formData.asetProduktifPribadi,
        formData.danaDaruratCalonDebitur,
        formData.konsistensiSaldoRekening,
      ]
    : [
        formData.sumberModalAwalUsaha,
        formData.buktiKeterlibatanModalSendiri,
        formData.asetProduktifPribadi,
      ];
  const capacityValues = isKreditModalKerja
    ? [
        formData.sumberModalAwalUsaha,
        formData.buktiKeterlibatanModalSendiri,
        formData.asetProduktifPribadi,
        formData.cadanganKasOperasionalUsaha,
        formData.rekeningKhususOperasionalUsaha,
      ]
    : isKreditKonsumtif
    ? [
        formData.lamaUsahaBidangSama,
        formData.statusLokasiUsaha,
        formData.ketergantunganTerhadapMusim,
        formData.risikoPHKPekerjaan,
        formData.penghasilanAlternatifBerkelanjutan,
      ]
    : [
        formData.lamaUsahaBidangSama,
        formData.statusLokasiUsaha,
        formData.ketergantunganTerhadapMusim,
      ];
  const characterScoreAverage = computeAverage(characterValues, 4);
  const characterStatusScore =
    characterScoreAverage === null
      ? 0
      : (characterScoreAverage / 4) * 40;
  const characterStatusLabel = `${formatTwoDecimals(characterStatusScore)}%`;
  const characterBobotSum = computeSum(characterValues, 4);
  const modalScoreAverage = computeAverage(modalValues, 4);
  const modalStatusScore =
    modalScoreAverage === null ? 0 : (modalScoreAverage / 4) * 30;
  const modalStatusLabel = `${formatTwoDecimals(modalStatusScore)}%`;
  const modalBobotSum = computeSum(modalValues, 4);
  const capacityScoreAverage = computeAverage(capacityValues, 4);
  const capacityStatusScore =
    capacityScoreAverage === null ? 0 : (capacityScoreAverage / 4) * 30;
  const capacityStatusLabel = `${formatTwoDecimals(capacityStatusScore)}%`;
  const capacityBobotSum = computeSum(capacityValues, 4);
  const totalStatusScore =
    (characterStatusScore + modalStatusScore + capacityStatusScore) * 0.15;
  const totalStatusLabel = `${formatTwoDecimals(totalStatusScore)}%`;
  const formatPercent = (value) => {
    const formatted = formatTwoDecimals(value);
    return formatted ? `${formatted}%` : "";
  };
  const jaminanEvaluations = jaminanList.map((item) => {
    const status = getJaminanApprovalStatus(
      item,
      formData.plafonPermohonan
    );
    return {
      status,
      score: getAgunanScoreForItem(item, status),
    };
  });
  const isAgunanEmpty =
    !jaminanList.length ||
    jaminanList.every((item) => !hasInputValue(item?.jenisjaminan));
  const hasAgunanApprove = jaminanEvaluations.some(
    (item) => String(item.status).toLowerCase() === "approve"
  );
  const hasAgunanReject = jaminanEvaluations.some(
    (item) => String(item.status).toLowerCase() === "reject"
  );
  const agunanStatusLabel = isAgunanEmpty
    ? "Approve"
    : hasAgunanApprove
    ? "Approve"
    : hasAgunanReject
    ? "Reject"
    : "";
  const agunanScore = isAgunanEmpty
    ? 15
    : hasAgunanApprove
    ? jaminanEvaluations.reduce(
        (maxValue, item) => Math.max(maxValue, item.score),
        0
      )
    : 0;
  const rpcStatusLabel = String(formData.repaymentCapacityStatus ?? "").trim();
  const rpcScore = rpcStatusLabel.toLowerCase() === "approve" ? 40 : 0;
  const slikGradeLabel = String(slikSummary.gradeLabel ?? "").trim();
  const slikScore = isHubunganBankLainAda
    ? SLIK_GRADE_SCORE_MAP[slikGradeLabel] ?? 0
    : 30;
  const totalBobotScore =
    agunanScore + totalStatusScore + rpcScore + slikScore;
  const agunanScoreLabel = formatPercent(agunanScore);
  const rpcScoreLabel = formatPercent(rpcScore);
  const slikScoreLabel = formatPercent(slikScore);
  const totalBobotLabel = formatPercent(totalBobotScore);
  const statusPengajuan = totalBobotScore < 80 ? "Reject" : "Approve";
  const shouldShowCatatanPengajuan =
    totalBobotScore >= 80 && totalBobotScore <= 85;
  const statusPengajuanClass =
    statusPengajuan === "Reject"
      ? "!border-error-400 !bg-red-50 !text-error-700"
      : statusPengajuan === "Approve"
      ? "!border-success-500 !bg-green-50 !text-success-900"
      : "";

  useEffect(() => {
    const formattedCapital = formatLineItems(capitalItems);
    setFormData((prev) => {
      if (prev.capital1 === formattedCapital) return prev;
      return { ...prev, capital1: formattedCapital };
    });
  }, [capitalItems]);

  useEffect(() => {
    if (isKreditKonsumtif || !operasionalItems.length) return;
    const { total, summary } = getLineItemsTotals(operasionalItems);
    setFormData((prev) => {
      if (
        prev.biayaOperasional === total &&
        prev.ketBiayaOperasional === summary
      ) {
        return prev;
      }
      return {
        ...prev,
        biayaOperasional: total,
        ketBiayaOperasional: summary,
      };
    });
  }, [isKreditKonsumtif, operasionalItems]);

  useEffect(() => {
    if (isKreditKonsumtif || !nonOperasionalItems.length) return;
    const { total, summary } = getLineItemsTotals(nonOperasionalItems);
    setFormData((prev) => {
      if (
        prev.biayaNonOperasional === total &&
        prev.ketBiayaNonOperasional === summary
      ) {
        return prev;
      }
      return {
        ...prev,
        biayaNonOperasional: total,
        ketBiayaNonOperasional: summary,
      };
    });
  }, [isKreditKonsumtif, nonOperasionalItems]);

  useEffect(() => {
    if (!hutangItems.length) return;
    const { total, summary } = getLineItemsTotals(hutangItems);
    setFormData((prev) => {
      if (
        prev.biayaHutangKewajibanLain === total &&
        prev.ketBiayaHutangKewajibanLain === summary
      ) {
        return prev;
      }
      return {
        ...prev,
        biayaHutangKewajibanLain: total,
        ketBiayaHutangKewajibanLain: summary,
      };
    });
  }, [hutangItems]);

  useEffect(() => {
    if (!pendapatanItems.length) return;
    const { total, summary } = getLineItemsTotals(pendapatanItems);
    setFormData((prev) => {
      if (
        prev.pendapatanLainnya === total &&
        prev.ketPendapatanLainnya === summary
      ) {
        return prev;
      }
      return {
        ...prev,
        pendapatanLainnya: total,
        ketPendapatanLainnya: summary,
      };
    });
  }, [pendapatanItems]);

  useEffect(() => {
    const computedSukuBunga = computeSukuBungaBulan(formData);

    setFormData((prev) => {
      if (prev.sukuBungaBulan === computedSukuBunga) return prev;
      return { ...prev, sukuBungaBulan: computedSukuBunga };
    });
  }, [
    formData.sukuBungaTahun,
    formData.perhitunganBunga,
  ]);

  useEffect(() => {
    const normalized = normalizePerhitunganBunga(formData.perhitunganBunga);
    if (normalized && normalized !== formData.perhitunganBunga) {
      setFormData((prev) => ({
        ...prev,
        perhitunganBunga: normalized,
      }));
      return;
    }

    if (formData.sukuBungaTahun === "") return;
    const rate = toNumber(formData.sukuBungaTahun);
    if (!Number.isFinite(rate) || rate <= 0) return;

    const inferred = rate >= 18 ? "Anuitas" : "Flat";
    setFormData((prev) => {
      if (normalizePerhitunganBunga(prev.perhitunganBunga)) return prev;
      return { ...prev, perhitunganBunga: inferred };
    });
  }, [
    formData.perhitunganBunga,
    formData.sukuBungaTahun,
  ]);


  useEffect(() => {
    const computedOmset = computeOmsetPerbulan(
      formData.omsetPerhari,
      formData.lamaUsahaSebulan
    );
    const computedHpp = computeHargaPokokPenjualan(
      computedOmset,
      formData.jenisHPP
    );
    const computedPendapatan = computeJumlahPendapatan(
      computedOmset,
      computedHpp
    );
    const computedLabaNetto = computeLabaNetto(
      computedPendapatan,
      formData.biayaOperasional
    );

    setFormData((prev) => {
      if (
        prev.omsetPerbulan === computedOmset &&
        prev.hargaPokokPenjualan === computedHpp &&
        prev.jumlahPendapatan === computedPendapatan &&
        prev.labaNetto === computedLabaNetto
      ) {
        return prev;
      }

      return {
        ...prev,
        omsetPerbulan: computedOmset,
        hargaPokokPenjualan: computedHpp,
        jumlahPendapatan: computedPendapatan,
        labaNetto: computedLabaNetto,
      };
    });
  }, [
    formData.omsetPerhari,
    formData.lamaUsahaSebulan,
    formData.jenisHPP,
    formData.biayaOperasional,
  ]);

  useEffect(() => {
    if (!isKreditKonsumtif) {
      setFormData((prev) => {
        if (prev.totalPenghasilan === "") return prev;
        return { ...prev, totalPenghasilan: "" };
      });
      return;
    }

    const computedTotalPenghasilan = computeTotalPenghasilanKonsumtif(
      formData.pendapatanPemohonKredit,
      formData.pendapatanIstriSuami,
      formData.pendapatanTambahan,
      formData.pendapatanLainnya,
      formData.biayaHutangKewajibanLain
    );
    const computedBiayaNonOperasional = computeBiayaNonOperasionalKonsumtif(
      formData.biayaAnakSekolah,
      formData.biayaKonsumsi,
      formData.biayaListrikAirTelepon,
      formData.biayaLainnyaNonOperasional
    );

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      if (prev.totalPenghasilan !== computedTotalPenghasilan) {
        next.totalPenghasilan = computedTotalPenghasilan;
        changed = true;
      }

      if (prev.biayaNonOperasional !== computedBiayaNonOperasional) {
        next.biayaNonOperasional = computedBiayaNonOperasional;
        changed = true;
      }

      if (prev.biayaOperasional !== "") {
        next.biayaOperasional = "";
        changed = true;
      }

      if (prev.ketBiayaOperasional !== "") {
        next.ketBiayaOperasional = "";
        changed = true;
      }

      if (prev.omsetPerhari !== "") {
        next.omsetPerhari = "";
        changed = true;
      }

      if (prev.lamaUsahaSebulan !== "") {
        next.lamaUsahaSebulan = "";
        changed = true;
      }

      if (prev.jenisHPP !== "") {
        next.jenisHPP = "";
        changed = true;
      }

      if (prev.omsetPerbulan !== "") {
        next.omsetPerbulan = "";
        changed = true;
      }

      if (prev.hargaPokokPenjualan !== "") {
        next.hargaPokokPenjualan = "";
        changed = true;
      }

      if (prev.jumlahPendapatan !== "") {
        next.jumlahPendapatan = "";
        changed = true;
      }

      if (prev.labaNetto !== "") {
        next.labaNetto = "";
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    isKreditKonsumtif,
    formData.pendapatanPemohonKredit,
    formData.pendapatanIstriSuami,
    formData.pendapatanTambahan,
    formData.pendapatanLainnya,
    formData.biayaAnakSekolah,
    formData.biayaKonsumsi,
    formData.biayaListrikAirTelepon,
    formData.biayaLainnyaNonOperasional,
    formData.biayaHutangKewajibanLain,
    formData.biayaOperasional,
    formData.ketBiayaOperasional,
    formData.omsetPerhari,
    formData.lamaUsahaSebulan,
    formData.jenisHPP,
    formData.omsetPerbulan,
    formData.hargaPokokPenjualan,
    formData.jumlahPendapatan,
    formData.labaNetto,
  ]);

  useEffect(() => {
    const computedPokok = computePokokPerBulan(
      formData.plafonPermohonan,
      formData.jangkaWaktuKredit
    );
    let computedBunga = computeTotalBungaPerbulan(
      formData.plafonPermohonan,
      formData.sukuBungaBulan
    );
    const computedAngsuran = computeAngsuranPembiayaan({
      perhitunganBunga: formData.perhitunganBunga,
      plafonPermohonan: formData.plafonPermohonan,
      sukuBungaTahun: formData.sukuBungaTahun,
      jangkaWaktuKredit: formData.jangkaWaktuKredit,
      pokokPerBulan: computedPokok,
      totalBungaPerbulan: computedBunga,
    });
    if (
      formData.perhitunganBunga === "Anuitas" &&
      computedAngsuran !== "" &&
      computedPokok !== ""
    ) {
      computedBunga = formatTwoDecimals(
        toNumber(computedAngsuran) - toNumber(computedPokok)
      );
    }

    setFormData((prev) => {
      if (
        prev.pokokPerBulan === computedPokok &&
        prev.totalBungaPerbulan === computedBunga &&
        prev.angsuranPembiayaan === computedAngsuran
      ) {
        return prev;
      }

      return {
        ...prev,
        pokokPerBulan: computedPokok,
        totalBungaPerbulan: computedBunga,
        angsuranPembiayaan: computedAngsuran,
      };
    });
  }, [
    formData.plafonPermohonan,
    formData.jangkaWaktuKredit,
    formData.sukuBungaBulan,
    formData.sukuBungaTahun,
    formData.perhitunganBunga,
  ]);

  useEffect(() => {
    const computedLabaNettoLainnya = computeLabaNettoLainnya(
      formData.labaNetto,
      formData.pendapatanLainnya
    );
    const computedLabaNettoNonOperasional = isKreditKonsumtif
      ? computeTotalLabaKonsumtif(
          formData.pendapatanPemohonKredit,
          formData.pendapatanIstriSuami,
          formData.pendapatanLainnya,
          formData.totalPenghasilan,
          formData.biayaNonOperasional
        )
      : computeLabaNettoNonOperasional(
          computedLabaNettoLainnya,
          formData.biayaNonOperasional,
          formData.biayaHutangKewajibanLain
        );
    const computedKemampuanMembayar = computeKemampuanMembayarSetelahPembiayaan(
      computedLabaNettoNonOperasional,
      formData.angsuranPembiayaan
    );
    const computedNilaiRpc = computeNilaiRpc(computedLabaNettoNonOperasional);
    const computedMaksimumPlafonKredit = computeMaksimumPlafonKredit({
      nilaiRpc: computedNilaiRpc,
      sukuBungaBulan: formData.sukuBungaBulan,
      jangkaWaktuKredit: formData.jangkaWaktuKredit,
    });
    const computedAngsuranDariMpk = computeAngsuranDariMpk({
      maksimumPlafonKredit: computedMaksimumPlafonKredit,
      sukuBungaBulan: formData.sukuBungaBulan,
      jangkaWaktuKredit: formData.jangkaWaktuKredit,
    });
    const computedRepaymentCapacity = computeRepaymentCapacity(
      formData.angsuranPembiayaan,
      computedLabaNettoNonOperasional
    );
    const computedRepaymentStatus = computeRepaymentCapacityStatus(
      computedRepaymentCapacity,
      computedKemampuanMembayar
    );

    setFormData((prev) => {
      if (
        prev.labaNettoLainnya === computedLabaNettoLainnya &&
        prev.labaNettoNonOperasional === computedLabaNettoNonOperasional &&
        prev.kemampuanMembayarSetelahPembiayaan === computedKemampuanMembayar &&
        prev.nilaiRpc === computedNilaiRpc &&
        prev.maksimumPlafonKredit === computedMaksimumPlafonKredit &&
        prev.besarAngsuranMpk === computedAngsuranDariMpk &&
        prev.repaymentCapacity === computedRepaymentCapacity &&
        prev.repaymentCapacityStatus === computedRepaymentStatus
      ) {
        return prev;
      }

      return {
        ...prev,
        labaNettoLainnya: computedLabaNettoLainnya,
        labaNettoNonOperasional: computedLabaNettoNonOperasional,
        kemampuanMembayarSetelahPembiayaan: computedKemampuanMembayar,
        nilaiRpc: computedNilaiRpc,
        maksimumPlafonKredit: computedMaksimumPlafonKredit,
        besarAngsuranMpk: computedAngsuranDariMpk,
        repaymentCapacity: computedRepaymentCapacity,
        repaymentCapacityStatus: computedRepaymentStatus,
      };
    });
  }, [
    isKreditKonsumtif,
    formData.labaNetto,
    formData.pendapatanLainnya,
    formData.totalPenghasilan,
    formData.pendapatanPemohonKredit,
    formData.pendapatanIstriSuami,
    formData.biayaNonOperasional,
    formData.biayaHutangKewajibanLain,
    formData.angsuranPembiayaan,
    formData.sukuBungaBulan,
    formData.jangkaWaktuKredit,
  ]);

const normalizeAnalisisItem = (item) => {
  const mapped = {};

  Object.entries(item || {}).forEach(([rawKey, value]) => {
    const targetKey = ANALISIS_FIELD_MAP[normalizeKey(rawKey)];
    if (!targetKey) return;
    if (value !== undefined && value !== null) {
      mapped[targetKey] = value;
    }
  });

  return mapped;
};

const fetchDataAnalisis = async (requestNo) => {
  if (!requestNo) return;

  const applyAnalisisData = (data) => {
    const list = normalizeList(data);
    const match = list.find(
      (item) =>
        String(item?.no_permohonan ?? item?.noPermohonan) ===
        String(requestNo)
    );
    if (!match) return;
    setFormData((prev) => ({
      ...prev,
      ...normalizeAnalisisItem(match),
    }));
  };

  try {
    const response = await axios.get(
      API_ENDPOINTS.datanasabah.dataAnalisis.detail(requestNo)
    );
    applyAnalisisData(response.data?.Data ?? response.data?.data ?? response.data);
  } catch (error) {
    try {
      const response = await axios.get(
        API_ENDPOINTS.datanasabah.dataAnalisis.list()
      );
      applyAnalisisData(response.data?.Data ?? response.data?.data ?? response.data);
    } catch (innerError) {
      Swal.fire(
        "Gagal",
        innerError.response?.data?.msg || "Gagal mengambil data analisis",
        "error"
      );
    }
  }
};

const fetchDataJaminan = async (requestNo) => {
  if (!requestNo) {
    setJaminanList([]);
    return;
  }

  const filterByPermohonan = (list) =>
    list.filter(
      (item) =>
        String(item?.no_permohonan ?? item?.noPermohonan) ===
        String(requestNo)
    );

  try {
    const response = await axios.get(
      API_ENDPOINTS.datanasabah.dataJaminan.detail(requestNo)
    );
    const list = normalizeList(
      response.data?.Data ?? response.data?.data ?? response.data
    );
    const filtered = filterByPermohonan(list);
    const mapped = (filtered.length ? filtered : list).map(normalizeJaminanItem);
    setJaminanList(mapped);
  } catch (error) {
    try {
      const response = await axios.get(
        API_ENDPOINTS.datanasabah.dataJaminan.list()
      );
      const list = normalizeList(
        response.data?.Data ?? response.data?.data ?? response.data
      );
      const filtered = filterByPermohonan(list);
      setJaminanList(filtered.map(normalizeJaminanItem));
    } catch (innerError) {
      Swal.fire(
        "Gagal",
        innerError.response?.data?.msg || "Gagal mengambil data jaminan",
        "error"
      );
    }
  }
};

const fetchNoPermohonan = async () => {
  if (noPermohonanParam) {
    setNoPermohonan(noPermohonanParam);
    return;
  }

  try {
    setLoadingNoPermohonan(true);
    const listRes = await axios.get(API_ENDPOINTS.generate.noPermohonan());
    const data = listRes.data?.Data;
    const latestPermohonan = Array.isArray(data) ? data[0] : data;
    const fetchedNo = latestPermohonan?.no_permohonan || "";

    setNoPermohonan(fetchedNo);
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
    const data = response.data?.Data ?? response.data?.data;
    const permohonan = Array.isArray(data) ? data[0] : data;

    if (!permohonan) return;

    const rawJenis =
      permohonan.jenisPermohonan ??
      permohonan.jenisKredit ??
      permohonan.kodeJenisKredit ??
      permohonan.jenis_permohonan ??
      permohonan.jenis_kredit ??
      "";
    const resolvedJenisKredit = resolveJenisKreditLabel(rawJenis);

    setFormData((prev) => {
      const next = {
        ...prev,
        jenisKredit: resolvedJenisKredit || prev.jenisKredit,
        plafonPermohonan: permohonan.plafonPermohonan ?? prev.plafonPermohonan,
        jangkaWaktuKredit:
          permohonan.jangkaWaktuKredit ?? prev.jangkaWaktuKredit,
        sukuBungaTahun: permohonan.sukuBungaTahun ?? prev.sukuBungaTahun,
        perhitunganBunga:
          permohonan.perhitunganBunga ?? prev.perhitunganBunga,
      };

      if (
        prev.jenisKredit === next.jenisKredit &&
        prev.plafonPermohonan === next.plafonPermohonan &&
        prev.jangkaWaktuKredit === next.jangkaWaktuKredit &&
        prev.sukuBungaTahun === next.sukuBungaTahun &&
        prev.perhitunganBunga === next.perhitunganBunga
      ) {
        return prev;
      }

      return next;
    });
  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal mengambil data permohonan",
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
    fetchDataAnalisis(requestNo);
  }, [noPermohonanParam, noPermohonan]);

  useEffect(() => {
    const requestNo = noPermohonanParam || noPermohonan;
    if (!requestNo) {
      setJaminanList([]);
      return;
    }
    fetchDataJaminan(requestNo);
  }, [noPermohonanParam, noPermohonan]);

  useEffect(() => {
    const requestNo = noPermohonanParam || noPermohonan;
    if (!requestNo) {
      setSlikEntries([]);
      return;
    }
    setSlikEntries(readSlikStorageEntries(requestNo));
  }, [noPermohonanParam, noPermohonan]);

  useEffect(() => {
    if (!jaminanList.length) return;
    const hasYa = jaminanList.some(
      (item) =>
        String(item?.statusHubBankLain ?? "").trim().toLowerCase() === "ya"
    );
    const hasTidak = jaminanList.some(
      (item) =>
        String(item?.statusHubBankLain ?? "").trim().toLowerCase() === "tidak"
    );
    const nextValue = hasYa ? "Ada" : hasTidak ? "Tidak Ada" : "";
    if (!nextValue) return;
    setFormData((prev) => {
      if (prev.jenisNasabah === nextValue) return prev;
      return { ...prev, jenisNasabah: nextValue };
    });
  }, [jaminanList]);

const handleFieldChange = (field) => (event) => {
  setFormData((prev) => ({
    ...prev,
    [field]: event.target.value,
  }));
};

const handleNumberFieldChange = (field) => (event) => {
  const rawValue = event.target.value;
  const cleanedValue = rawValue.replace(/\D/g, "");

  setFormData((prev) => ({
    ...prev,
    [field]: cleanedValue,
  }));
};

const handleSlikFileChange = (event) => {
  const requestNo = noPermohonanParam || noPermohonan;
  if (!requestNo) {
    Swal.fire("Error", "No Permohonan tidak ditemukan", "error");
    return;
  }

  const file = event.target.files?.[0];
  if (!file) {
    removeSlikStorageEntry(requestNo, SLIK_UPLOAD_INDEX);
    setSlikEntries(readSlikStorageEntries(requestNo));
    return;
  }

  const isTxtFile =
    file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
  if (!isTxtFile) {
    Swal.fire("Error", "File SLIK harus berformat .txt", "error");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result ?? "");
    const table = parseSlikText(text);
    saveSlikStorageEntry(
      requestNo,
      SLIK_UPLOAD_INDEX,
      table,
      file.name,
      "analisis"
    );
    setSlikEntries(readSlikStorageEntries(requestNo));
  };
  reader.onerror = () => {
    Swal.fire("Error", "Gagal membaca file SLIK", "error");
  };
  reader.readAsText(file);
};

const handleAddCapitalItem = () => {
  setCapitalItems((prev) => {
    if (prev.length >= MAX_LIST_ITEMS) return prev;
    return [...prev, { keterangan: "", nilai: "" }];
  });
};

const handleRemoveCapitalItem = () => {
  setCapitalItems((prev) => (prev.length ? prev.slice(0, -1) : prev));
};

const handleCapitalItemChange = (index, field) => (event) => {
  const rawValue = event.target.value;
  const nextValue = field === "nilai" ? rawValue.replace(/\D/g, "") : rawValue;

  setCapitalItems((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: nextValue };
    return next;
  });
};

const handleAddOperasionalItem = () => {
  setOperasionalItems((prev) => {
    if (prev.length >= MAX_LIST_ITEMS) return prev;
    return [...prev, { keterangan: "", nilai: "" }];
  });
};

const handleRemoveOperasionalItem = () => {
  setOperasionalItems((prev) => {
    if (!prev.length) return prev;
    const next = prev.slice(0, -1);
    if (!next.length) {
      setFormData((current) => ({
        ...current,
        biayaOperasional: "",
        ketBiayaOperasional: "",
      }));
    }
    return next;
  });
};

const handleOperasionalItemChange = (index, field) => (event) => {
  const rawValue = event.target.value;
  const nextValue = field === "nilai" ? rawValue.replace(/\D/g, "") : rawValue;

  setOperasionalItems((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: nextValue };
    return next;
  });
};

const handleAddNonOperasionalItem = () => {
  setNonOperasionalItems((prev) => {
    if (prev.length >= MAX_LIST_ITEMS) return prev;
    return [...prev, { keterangan: "", nilai: "" }];
  });
};

const handleRemoveNonOperasionalItem = () => {
  setNonOperasionalItems((prev) => {
    if (!prev.length) return prev;
    const next = prev.slice(0, -1);
    if (!next.length) {
      setFormData((current) => ({
        ...current,
        biayaNonOperasional: "",
        ketBiayaNonOperasional: "",
      }));
    }
    return next;
  });
};

const handleNonOperasionalItemChange = (index, field) => (event) => {
  const rawValue = event.target.value;
  const nextValue = field === "nilai" ? rawValue.replace(/\D/g, "") : rawValue;

  setNonOperasionalItems((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: nextValue };
    return next;
  });
};

const handleAddHutangItem = () => {
  setHutangItems((prev) => {
    if (prev.length >= MAX_LIST_ITEMS) return prev;
    return [...prev, { keterangan: "", nilai: "" }];
  });
};

const handleRemoveHutangItem = () => {
  setHutangItems((prev) => {
    if (!prev.length) return prev;
    const next = prev.slice(0, -1);
    if (!next.length) {
      setFormData((current) => ({
        ...current,
        biayaHutangKewajibanLain: "",
        ketBiayaHutangKewajibanLain: "",
      }));
    }
    return next;
  });
};

const handleHutangItemChange = (index, field) => (event) => {
  const rawValue = event.target.value;
  const nextValue = field === "nilai" ? rawValue.replace(/\D/g, "") : rawValue;

  setHutangItems((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: nextValue };
    return next;
  });
};

const handleAddPendapatanItem = () => {
  setPendapatanItems((prev) => {
    if (prev.length >= MAX_LIST_ITEMS) return prev;
    return [...prev, { keterangan: "", nilai: "" }];
  });
};

const handleRemovePendapatanItem = () => {
  setPendapatanItems((prev) => {
    if (!prev.length) return prev;
    const next = prev.slice(0, -1);
    if (!next.length) {
      setFormData((current) => ({
        ...current,
        pendapatanLainnya: "",
        ketPendapatanLainnya: "",
      }));
    }
    return next;
  });
};

const handlePendapatanItemChange = (index, field) => (event) => {
  const rawValue = event.target.value;
  const nextValue = field === "nilai" ? rawValue.replace(/\D/g, "") : rawValue;

  setPendapatanItems((prev) => {
    const next = [...prev];
    next[index] = { ...next[index], [field]: nextValue };
    return next;
  });
};

const handleSave = async () => {
  const requestNoPermohonan = noPermohonan || noPermohonanParam;
  if (!requestNoPermohonan) {
    Swal.fire("Error", "No Antrian tidak ditemukan di URL", "error");
    return;
  }

  const payload = new FormData();
  const operasionalTotals =
    !isKreditKonsumtif && operasionalItems.length
      ? getLineItemsTotals(operasionalItems)
      : null;
  const nonOperasionalTotals =
    !isKreditKonsumtif && nonOperasionalItems.length
      ? getLineItemsTotals(nonOperasionalItems)
      : null;
  const hutangTotals = hutangItems.length
    ? getLineItemsTotals(hutangItems)
    : null;
  const pendapatanTotals = pendapatanItems.length
    ? getLineItemsTotals(pendapatanItems)
    : null;
  const preparedData = {
    ...formData,
    statusAgunan: agunanStatusLabel,
    statusPengajuan,
    catatanPengajuan: shouldShowCatatanPengajuan
      ? formData.catatanPengajuan
      : "",
    capital1: capitalItems.length
      ? formatLineItems(capitalItems)
      : formData.capital1,
    ...(operasionalTotals
      ? {
          biayaOperasional: operasionalTotals.total,
          ketBiayaOperasional: operasionalTotals.summary,
        }
      : {}),
    ...(nonOperasionalTotals
      ? {
          biayaNonOperasional: nonOperasionalTotals.total,
          ketBiayaNonOperasional: nonOperasionalTotals.summary,
        }
      : {}),
    ...(hutangTotals
      ? {
          biayaHutangKewajibanLain: hutangTotals.total,
          ketBiayaHutangKewajibanLain: hutangTotals.summary,
        }
      : {}),
    ...(pendapatanTotals
      ? {
          pendapatanLainnya: pendapatanTotals.total,
          ketPendapatanLainnya: pendapatanTotals.summary,
        }
      : {}),
  };

  // ⬇️ inject nik
  payload.append("no_permohonan", requestNoPermohonan);

  // ⬇️ kirim semua text + file
  Object.entries(preparedData).forEach(([key, value]) => {
    if (value instanceof File) {
      payload.append(key, value);
    } else if (value !== null && value !== "") {
      payload.append(key, value);
    }
  });


  try {
    Swal.fire({
      title: "Menyimpan Data Analisis Kredit...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await axios.post(
      API_ENDPOINTS.datanasabah.dataAnalisis.create(),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Berhasil", "Data Analisis Kredit berhasil disimpan", "success");

    // ⬇️ lanjut ke jaminan (pakai nik yg sama)
    navigate(`/dashboard`);

  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal menyimpan Data Analisis",
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
                Data ANALISIS KREDIT 5C{" "}
                <span className="text-slate-400 font-normal">Nasabah</span>
              </h1>
              <p className="text-xs text-slate-500">
                Ringkasan penilaian dan kemampuan bayar nasabah.
              </p>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            <Card title="WATAK / KARAKTER (Character)" icon={<FaMapMarkerAlt />}>
              <div className="space-y-4">
                {renderSlikSummaryTable(slikEntries)}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="Hubungan Nasabah Dengan Bank Lain"
                    value={formData.jenisNasabah}
                    onChange={handleFieldChange("jenisNasabah")}
                  >
                    <option value="">Pilih Hubungan</option>
                    <option value="Ada">Ada</option>
                    <option value="Tidak Ada">Tidak Ada</option>
                  </Select>
                  <p className="text-[11px] text-slate-500 md:col-span-2">
                    Otomatis terisi dari Data Jaminan (Hubungan dengan Bank Lain).
                  </p>
                </div>
                {shouldShowSlikUpload ? (
                  <div className="space-y-2">
                    <Input
                      label="Upload SLIK (TXT)"
                      type="file"
                      accept=".txt,text/plain"
                      onChange={handleSlikFileChange}
                    />
                    <div className="text-[11px] text-slate-500">
                      {analisisSlikEntry?.fileName || "Belum ada file SLIK"}
                    </div>
                  </div>
                ) : null}
                {isHubunganBankLainAda ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-gray-500">
                        Keterangan SLIK
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateSlikNarrative}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Generate Narasi
                      </button>
                    </div>
                    <textarea
                      rows="4"
                      value={formData.character}
                      onChange={handleFieldChange("character")}
                      placeholder="Masukkan keterangan SLIK..."
                      className="mt-1 w-full rounded-md border border-gray-200
                      px-3 py-2 text-xs shadow-sm text-gray-700
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Select
                      label="Status Kepemilikan Tempat Tinggal"
                      value={formData.statusKepemilikanTempatTinggal}
                      onChange={handleFieldChange(
                        "statusKepemilikanTempatTinggal"
                      )}
                    >
                      <option value="">Pilih Status Kepemilikan</option>
                      <option value="4">Milik Sendiri</option>
                      <option value="3">Keluarga</option>
                      <option value="2">Sewa</option>
                      <option value="1">Menumpang</option>
                    </Select>
                    <p className="text-[11px] text-slate-500">
                      Dokumen/observasi rumah
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Select
                      label="Lama tinggal di alamat saat ini"
                      value={formData.lamaTinggalAlamatSaatIni}
                      onChange={handleFieldChange("lamaTinggalAlamatSaatIni")}
                    >
                      <option value="">Pilih Lama Tinggal</option>
                      <option value="4">{"Lebih dari ata tepat 10 Tahun"}</option>
                      <option value="3">{"5 sampai Kurang dari 10 Tahun"}</option>
                      <option value="2">{"2 samppai Kurang dari 5 Tahun"}</option>
                      <option value="1">{"Kurang dari 2 Tahun"}</option>
                    </Select>
                    <p className="text-[11px] text-slate-500">
                      KTP + konfirmasi lingkungan.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Select
                      label="Frekuensi pindah rumah (5 Tahun)"
                      value={formData.frekuensiPindahRumah}
                      onChange={handleFieldChange("frekuensiPindahRumah")}
                    >
                      <option value="">Pilih Frekuensi</option>
                      <option value="4">Tidak pernah</option>
                      <option value="3">1x</option>
                      <option value="2">2x</option>
                      <option value="1">{"Lebih dari 2x"}</option>
                    </Select>
                    <p className="text-[11px] text-slate-500">Riwayat alamat.</p>
                  </div>
                  <div className="space-y-2">
                    <Select
                      label="Kepatuhan proses analisa kredit"
                      value={formData.kepatuhanProsesAnalisaKredit}
                      onChange={handleFieldChange(
                        "kepatuhanProsesAnalisaKredit"
                      )}
                    >
                      <option value="">Pilih Kepatuhan</option>
                      <option value="4">Patuh penuh</option>
                      <option value="3">Telat ringan</option>
                      <option value="2">Telat berulang</option>
                      <option value="1">Tidak patuh</option>
                    </Select>
                    <p className="text-[11px] text-slate-500">
                      {
                        "data <=2 hari kerja & tanpa reschedule / <=5 hari/1x reschedule / >5 hari/>1x / menolak/tidak responsif."
                      }
                    </p>
                  </div>
                  {isKreditModalKerja || isKreditKonsumtif ? (
                    <div className="space-y-2">
                      <Select
                        label="Pernah menunggak kewajiban rutin non-kredit?"
                        value={formData.tunggakanKewajibanRutinNonKredit}
                        onChange={handleFieldChange(
                          "tunggakanKewajibanRutinNonKredit"
                        )}
                      >
                        <option value="">Pilih Kondisi</option>
                        <option value="4">Tidak pernah</option>
                        <option value="3">Jarang</option>
                        <option value="2">Pernah</option>
                        <option value="1">Sering</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Bukti pembayaran tagihan, konfirmasi RT, wawancara.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
            <Card title="MODAL (Capital)" icon={<FaMapMarkerAlt />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isKreditKonsumtif ? (
                  <>
                    <div className="space-y-2">
                      <Select
                        label="Sumber utama pembayaran angsuran kredit berasal dari?"
                        value={formData.sumberModalAwalUsaha}
                        onChange={handleFieldChange("sumberModalAwalUsaha")}
                      >
                        <option value="">Pilih Sumber Pembayaran</option>
                        <option value="4">Gaji tetap</option>
                        <option value="3">Gaji + tambahan</option>
                        <option value="2">Penghasilan tidak tetap</option>
                        <option value="1">Tidak jelas</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Slip gaji, surat keterangan kerja, mutasi rekening.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Apakah calon debitur memiliki tabungan atau aset likuid pribadi?"
                        value={formData.buktiKeterlibatanModalSendiri}
                        onChange={handleFieldChange(
                          "buktiKeterlibatanModalSendiri"
                        )}
                      >
                        <option value="">Pilih Kondisi</option>
                        <option value="4">Ada signifikan</option>
                        <option value="3">Ada terbatas</option>
                        <option value="2">Sangat terbatas</option>
                        <option value="1">Tidak ada</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Saldo tabungan, mutasi rekening, bukti simpanan.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Berapa rasio total kewajiban bulanan terhadap penghasilan bulanan?"
                        value={formData.asetProduktifPribadi}
                        onChange={handleFieldChange("asetProduktifPribadi")}
                      >
                        <option value="">Pilih Perbandingan</option>
                        <option value="4">{"<=30%"}</option>
                        <option value="3">{">30-40%"}</option>
                        <option value="2">{">40-50%"}</option>
                        <option value="1">{">50%"}</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Perhitungan RC, daftar kewajiban, slip gaji.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Apakah calon debitur memiliki dana darurat (>=3x pengeluaran bulanan)?"
                        value={formData.danaDaruratCalonDebitur}
                        onChange={handleFieldChange("danaDaruratCalonDebitur")}
                      >
                        <option value="">Pilih Kondisi</option>
                        <option value="4">Ada >=3x</option>
                        <option value="3">{"Ada <3x"}</option>
                        <option value="2">Sangat terbatas</option>
                        <option value="1">Tidak ada</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Saldo rekening, tabungan terpisah, estimasi biaya hidup.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Seberapa konsisten saldo rekening calon debitur dalam 6 bulan terakhir?"
                        value={formData.konsistensiSaldoRekening}
                        onChange={handleFieldChange("konsistensiSaldoRekening")}
                      >
                        <option value="">Pilih Konsistensi</option>
                        <option value="4">Stabil naik</option>
                        <option value="3">Relatif stabil</option>
                        <option value="2">Fluktuatif</option>
                        <option value="1">Sering kosong</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Mutasi rekening 6 bulan terakhir.
                      </p>
                    </div>
                  </>
                ) : isKreditModalKerja ? (
                  <>
                    <div className="space-y-2">
                      <Select
                        label="Lama usaha di bidang yang sama"
                        value={formData.lamaUsahaBidangSama}
                        onChange={handleFieldChange("lamaUsahaBidangSama")}
                      >
                        <option value="">Pilih Lama Usaha</option>
                        <option value="4">{">=5 th"}</option>
                        <option value="3">{"3-<5 th"}</option>
                        <option value="2">{"1-<3 th"}</option>
                        <option value="1">{"<1 th"}</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Riwayat usaha, izin usaha, observasi kontinuitas.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Status lokasi usaha"
                        value={formData.statusLokasiUsaha}
                        onChange={handleFieldChange("statusLokasiUsaha")}
                      >
                        <option value="">Pilih Status Lokasi</option>
                        <option value="4">Milik sendiri</option>
                        <option value="3">Sewa >=3 th</option>
                        <option value="2">{"Sewa <3 th"}</option>
                        <option value="1">Tidak tetap</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Sertifikat/akta sewa, observasi lokasi.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Ketergantungan usaha terhadap musim"
                        value={formData.ketergantunganTerhadapMusim}
                        onChange={handleFieldChange("ketergantunganTerhadapMusim")}
                      >
                        <option value="">Pilih Ketergantungan</option>
                        <option value="4">Tidak</option>
                        <option value="3">Ringan</option>
                        <option value="2">Sedang</option>
                        <option value="1">Tinggi</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Pola penjualan bulanan & jenis usaha.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Stabilitas omzet usaha"
                        value={formData.stabilitasOmzetUsaha}
                        onChange={handleFieldChange("stabilitasOmzetUsaha")}
                      >
                        <option value="">Pilih Stabilitas</option>
                        <option value="4">Stabil</option>
                        <option value="3">Fluktuasi ringan</option>
                        <option value="2">Fluktuasi sedang</option>
                        <option value="1">Tidak stabil</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Rekap omzet 6-12 bulan, mutasi rekening.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Ketergantungan usaha pada pelanggan utama"
                        value={formData.ketergantunganPelangganUtama}
                        onChange={handleFieldChange(
                          "ketergantunganPelangganUtama"
                        )}
                      >
                        <option value="">Pilih Ketergantungan</option>
                        <option value="4">Tidak tergantung</option>
                        <option value="3">Ringan</option>
                        <option value="2">Sedang</option>
                        <option value="1">Tinggi</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Proporsi omzet pelanggan utama & observasi transaksi.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Select
                        label="Sumber modal awal usaha"
                        value={formData.sumberModalAwalUsaha}
                        onChange={handleFieldChange("sumberModalAwalUsaha")}
                      >
                        <option value="">Pilih Sumber Modal</option>
                        <option value="4">100% sendiri</option>
                        <option value="3">{">50% sendiri"}</option>
                        <option value="2">{"<50% sendiri"}</option>
                        <option value="1">Semua pinjaman</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Struktur modal usaha
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Bukti keterlibatan modal sendiri"
                        value={formData.buktiKeterlibatanModalSendiri}
                        onChange={handleFieldChange(
                          "buktiKeterlibatanModalSendiri"
                        )}
                      >
                        <option value="">Pilih Bukti</option>
                        <option value="4">Aset atas nama sendiri</option>
                        <option value="3">Campuran</option>
                        <option value="2">Mayoritas pinjaman</option>
                        <option value="1">Tidak terbukti</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Aset, nota, foto
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Aset produktif pribadi (di luar agunan)"
                        value={formData.asetProduktifPribadi}
                        onChange={handleFieldChange("asetProduktifPribadi")}
                      >
                        <option value="">Pilih Aset Produktif</option>
                        <option value="4">Ada signifikan</option>
                        <option value="3">Ada terbatas</option>
                        <option value="2">Sangat terbatas</option>
                        <option value="1">Tidak ada</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        {">=50% plafon / 25%-<50% / >0%-<25% / 0%"}
                      </p>
                    </div>
                  </>
                )}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-gray-500">
                      Adapun Modal dan Asset yang dimiliki saat ini berupa
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveCapitalItem}
                        disabled={!capitalItems.length}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Kurangi modal atau asset"
                        title="Kurangi modal atau asset"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCapitalItem}
                        disabled={capitalItems.length >= MAX_LIST_ITEMS}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Tambah modal atau asset"
                        title="Tambah modal atau asset"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {capitalItems.length ? (
                    <div className="space-y-3">
                      {capitalItems.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="grid grid-cols-2 gap-3"
                        >
                          <Input
                            label="Keterangan Modal/Asset"
                            value={item.keterangan}
                            onChange={handleCapitalItemChange(
                              itemIndex,
                              "keterangan"
                            )}
                            placeholder="Contoh: Rumah Tempat Tinggal"
                          />
                          <Input
                            label="Nilai Modal/Asset"
                            type="text"
                            value={formatIdInteger(item.nilai)}
                            onChange={handleCapitalItemChange(
                              itemIndex,
                              "nilai"
                            )}
                            inputMode="numeric"
                            placeholder="Contoh: 250000000"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Klik tombol + untuk menambah modal atau asset.
                    </p>
                  )}
                </div>
              </div>
            </Card>
            <Card title="KEMAMPUAN (Capasity)" icon={<FaMapMarkerAlt />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isKreditKonsumtif ? (
                  <>
                    <div className="space-y-2">
                      <Select
                        label="Sudah berapa lama calon debitur bekerja pada instansi/pekerjaan saat ini?"
                        value={formData.lamaUsahaBidangSama}
                        onChange={handleFieldChange("lamaUsahaBidangSama")}
                      >
                        <option value="">Pilih Lama Bekerja</option>
                        <option value="4">{">=5 th"}</option>
                        <option value="3">{"3-<5 th"}</option>
                        <option value="2">{"1-<3 th"}</option>
                        <option value="1">{"<1 th"}</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        SK kerja, surat keterangan kerja, riwayat pekerjaan.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Bagaimana status pekerjaan calon debitur saat ini?"
                        value={formData.statusLokasiUsaha}
                        onChange={handleFieldChange("statusLokasiUsaha")}
                      >
                        <option value="">Pilih Status Pekerjaan</option>
                        <option value="4">Tetap</option>
                        <option value="3">Kontrak panjang</option>
                        <option value="2">Kontrak pendek</option>
                        <option value="1">Tidak tetap</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        SK pengangkatan, kontrak kerja.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Bagaimana pola penghasilan tetap calon debitur dalam 6 bulan terakhir?"
                        value={formData.ketergantunganTerhadapMusim}
                        onChange={handleFieldChange("ketergantunganTerhadapMusim")}
                      >
                        <option value="">Pilih Stabilitas</option>
                        <option value="4">Konsisten</option>
                        <option value="3">Cukup konsisten</option>
                        <option value="2">Fluktuatif</option>
                        <option value="1">Tidak dapat dipastikan</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Slip gaji, mutasi rekening 6 bulan.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Apakah pekerjaan calon debitur memiliki risiko PHK tinggi?"
                        value={formData.risikoPHKPekerjaan}
                        onChange={handleFieldChange("risikoPHKPekerjaan")}
                      >
                        <option value="">Pilih Risiko</option>
                        <option value="4">Sangat rendah</option>
                        <option value="3">Rendah</option>
                        <option value="2">Sedang</option>
                        <option value="1">Tinggi</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Jenis instansi, status kerja, wawancara debitur.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Apakah calon debitur memiliki sumber penghasilan alternatif yang berkelanjutan?"
                        value={formData.penghasilanAlternatifBerkelanjutan}
                        onChange={handleFieldChange(
                          "penghasilanAlternatifBerkelanjutan"
                        )}
                      >
                        <option value="">Pilih Penghasilan</option>
                        <option value="4">Ada stabil</option>
                        <option value="3">Ada tidak tetap</option>
                        <option value="2">Sangat terbatas</option>
                        <option value="1">Tidak ada</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Bukti penghasilan tambahan, mutasi rekening.
                      </p>
                    </div>
                  </>
                ) : isKreditModalKerja ? (
                  <>
                    <div className="space-y-2">
                      <Select
                        label="Sumber modal awal usaha"
                        value={formData.sumberModalAwalUsaha}
                        onChange={handleFieldChange("sumberModalAwalUsaha")}
                      >
                        <option value="">Pilih Sumber Modal</option>
                        <option value="4">100% sendiri</option>
                        <option value="3">{">50% sendiri"}</option>
                        <option value="2">{"<50% sendiri"}</option>
                        <option value="1">Semua pinjaman</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Struktur modal usaha, keterangan debitur.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Bukti keterlibatan modal sendiri"
                        value={formData.buktiKeterlibatanModalSendiri}
                        onChange={handleFieldChange(
                          "buktiKeterlibatanModalSendiri"
                        )}
                      >
                        <option value="">Pilih Bukti</option>
                        <option value="4">Aset atas nama sendiri</option>
                        <option value="3">Campuran</option>
                        <option value="2">Mayoritas pinjaman</option>
                        <option value="1">Tidak terbukti</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Aset, nota, foto, dokumen kepemilikan.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Aset produktif pribadi (di luar agunan)"
                        value={formData.asetProduktifPribadi}
                        onChange={handleFieldChange("asetProduktifPribadi")}
                      >
                        <option value="">Pilih Aset Produktif</option>
                        <option value="4">Ada signifikan</option>
                        <option value="3">Ada terbatas</option>
                        <option value="2">Sangat terbatas</option>
                        <option value="1">Tidak ada</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        {">=50% plafon / 25%-<50% / >0%-<25% / 0%"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Cadangan kas / buffer operasional usaha"
                        value={formData.cadanganKasOperasionalUsaha}
                        onChange={handleFieldChange(
                          "cadanganKasOperasionalUsaha"
                        )}
                      >
                        <option value="">Pilih Cadangan Kas</option>
                        <option value="4">Ada >=1 bulan operasional</option>
                        <option value="3">{"Ada <1 bulan"}</option>
                        <option value="2">Sangat terbatas</option>
                        <option value="1">Tidak ada</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Kas di tempat, saldo rekening, catatan kas.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Rekening khusus operasional usaha"
                        value={formData.rekeningKhususOperasionalUsaha}
                        onChange={handleFieldChange(
                          "rekeningKhususOperasionalUsaha"
                        )}
                      >
                        <option value="">Pilih Rekening</option>
                        <option value="4">Ada & aktif untuk transaksi utama</option>
                        <option value="3">Ada & digunakan terbatas</option>
                        <option value="2">Ada tapi tidak digunakan operasional</option>
                        <option value="1">Tidak ada rekening khusus</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Mutasi rekening 3-6 bulan, pola setoran.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Select
                        label="Lama usaha di bidang yang sama"
                        value={formData.lamaUsahaBidangSama}
                        onChange={handleFieldChange("lamaUsahaBidangSama")}
                      >
                        <option value="">Pilih Lama Usaha</option>
                        <option value="4">
                          {"Lebih Dari atau tepat mencapai 5 Tahun"}
                        </option>
                        <option value="3">{"3 Hingga Kurang dari 5 Tahun"}</option>
                        <option value="2">{"1 Hingga Kurang dari 3 Tahun "}</option>
                        <option value="1">{"Kurang dari 1 Tahun"}</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">Riwayat usaha</p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Status lokasi usaha"
                        value={formData.statusLokasiUsaha}
                        onChange={handleFieldChange("statusLokasiUsaha")}
                      >
                        <option value="">Pilih Status Lokasi</option>
                        <option value="4">Milik sendiri</option>
                        <option value="3">
                          {"Lebih dari atau tepat mencapai 3 Tahun"}
                        </option>
                        <option value="2">{"Kurang dari 3 Tahun"}</option>
                        <option value="1">Tidak tetap</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Kontrak/observasi
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Select
                        label="Ketergantungan terhadap musim"
                        value={formData.ketergantunganTerhadapMusim}
                        onChange={handleFieldChange("ketergantunganTerhadapMusim")}
                      >
                        <option value="">Pilih Ketergantungan</option>
                        <option value="4">Tidak</option>
                        <option value="3">Ringan</option>
                        <option value="2">Sedang</option>
                        <option value="1">Tinggi</option>
                      </Select>
                      <p className="text-[11px] text-slate-500">
                        Pola penjualan & jenis usaha
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* KEUANGAN USAHA */}
            <Card title="Pendapatan" icon={<FaFileAlt />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {!isKreditKonsumtif ? (
                  <>
                    <Input
                      label="Omset Per /Hari"
                      type="text"
                      value={formatIdInteger(formData.omsetPerhari)}
                      onChange={handleNumberFieldChange("omsetPerhari")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Lama Usaha Dalam Sebulan (Dihitung perhari)"
                      type="text"
                      value={formatIdInteger(formData.lamaUsahaSebulan)}
                      onChange={handleNumberFieldChange("lamaUsahaSebulan")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Omset Per /bulan"
                      type="text"
                      value={formatIdNumber(formData.omsetPerbulan)}
                      readOnly
                    />
                    <Select
                      label="Jenis HPP"
                      value={formData.jenisHPP}
                      onChange={handleFieldChange("jenisHPP")}
                    >
                      <option value="">Pilih Jenis HPP</option>
                      {HPP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Harga Pokok Penjualan"
                      type="text"
                      value={formatIdNumber(formData.hargaPokokPenjualan)}
                      readOnly
                    />
                    <Input
                      label="Jumlah Pendapatan"
                      type="text"
                      value={formatIdNumber(formData.jumlahPendapatan)}
                      readOnly
                    />
                  </>
                ) : null}
                {!isKreditKonsumtif ? (
                  <>
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Input
                            label="Biaya Operasional"
                            type="text"
                            value={formatIdInteger(formData.biayaOperasional)}
                            readOnly
                            inputMode="numeric"
                          />
                        </div>
                        <div className="flex items-end gap-2 pb-0.5">
                          <button
                            type="button"
                            onClick={handleRemoveOperasionalItem}
                            disabled={!operasionalItems.length}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Kurangi biaya operasional"
                            title="Kurangi biaya operasional"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={handleAddOperasionalItem}
                            disabled={operasionalItems.length >= MAX_LIST_ITEMS}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Tambah biaya operasional"
                            title="Tambah biaya operasional"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {operasionalItems.length ? (
                        <div className="space-y-3">
                          {operasionalItems.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="grid grid-cols-2 gap-3"
                            >
                              <Input
                                label="Keterangan Biaya Operasional"
                                value={item.keterangan}
                                onChange={handleOperasionalItemChange(
                                  itemIndex,
                                  "keterangan"
                                )}
                                placeholder="Contoh: Gaji Karyawan"
                              />
                              <Input
                                label="Nilai Biaya Operasional"
                                type="text"
                                value={formatIdInteger(item.nilai)}
                                onChange={handleOperasionalItemChange(
                                  itemIndex,
                                  "nilai"
                                )}
                                inputMode="numeric"
                                placeholder="Contoh: 1500000"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          Klik tombol + untuk menambah biaya operasional.
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
                {isKreditKonsumtif ? (
                  <>
                    <Input
                      label="Biaya Anak Sekolah"
                      type="text"
                      value={formatIdInteger(formData.biayaAnakSekolah)}
                      onChange={handleNumberFieldChange("biayaAnakSekolah")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Biaya Konsumsi"
                      type="text"
                      value={formatIdInteger(formData.biayaKonsumsi)}
                      onChange={handleNumberFieldChange("biayaKonsumsi")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Biaya Listrik, Air, Telepon"
                      type="text"
                      value={formatIdInteger(formData.biayaListrikAirTelepon)}
                      onChange={handleNumberFieldChange("biayaListrikAirTelepon")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Biaya Lainnya"
                      type="text"
                      value={formatIdInteger(formData.biayaLainnyaNonOperasional)}
                      onChange={handleNumberFieldChange(
                        "biayaLainnyaNonOperasional"
                      )}
                      inputMode="numeric"
                    />
                  </>
                ) : null}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="Biaya Non Operasional"
                        type="text"
                        value={formatIdInteger(formData.biayaNonOperasional)}
                        readOnly
                        inputMode="numeric"
                      />
                    </div>
                    {!isKreditKonsumtif ? (
                      <div className="flex items-end gap-2 pb-0.5">
                        <button
                          type="button"
                          onClick={handleRemoveNonOperasionalItem}
                          disabled={!nonOperasionalItems.length}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Kurangi biaya non operasional"
                          title="Kurangi biaya non operasional"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNonOperasionalItem}
                          disabled={nonOperasionalItems.length >= MAX_LIST_ITEMS}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Tambah biaya non operasional"
                          title="Tambah biaya non operasional"
                        >
                          +
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {!isKreditKonsumtif ? (
                    nonOperasionalItems.length ? (
                      <div className="space-y-3">
                        {nonOperasionalItems.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="grid grid-cols-2 gap-3"
                          >
                            <Input
                              label="Keterangan Biaya Non Operasional"
                              value={item.keterangan}
                              onChange={handleNonOperasionalItemChange(
                                itemIndex,
                                "keterangan"
                              )}
                              placeholder="Contoh: Biaya Pendidikan"
                            />
                            <Input
                              label="Nilai Biaya Non Operasional"
                              type="text"
                              value={formatIdInteger(item.nilai)}
                              onChange={handleNonOperasionalItemChange(
                                itemIndex,
                                "nilai"
                              )}
                              inputMode="numeric"
                              placeholder="Contoh: 1000000"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Klik tombol + untuk menambah biaya non operasional.
                      </p>
                    )
                  ) : null}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="Pinjaman di Bank lain"
                        type="text"
                        value={formatIdInteger(
                          formData.biayaHutangKewajibanLain
                        )}
                        readOnly
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex items-end gap-2 pb-0.5">
                      <button
                        type="button"
                        onClick={handleRemoveHutangItem}
                        disabled={!hutangItems.length}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Kurangi biaya hutang"
                        title="Kurangi biaya hutang"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={handleAddHutangItem}
                        disabled={hutangItems.length >= MAX_LIST_ITEMS}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Tambah biaya hutang"
                        title="Tambah biaya hutang"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {hutangItems.length ? (
                    <div className="space-y-3">
                      {hutangItems.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="grid grid-cols-2 gap-3"
                        >
                          <Input
                            label="Keterangan Biaya Hutang"
                            value={item.keterangan}
                            onChange={handleHutangItemChange(
                              itemIndex,
                              "keterangan"
                            )}
                            placeholder="Contoh: Cicilan Motor"
                          />
                          <Input
                            label="Nilai Biaya Hutang"
                            type="text"
                            value={formatIdInteger(item.nilai)}
                            onChange={handleHutangItemChange(
                              itemIndex,
                              "nilai"
                            )}
                            inputMode="numeric"
                            placeholder="Contoh: 1000000"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Klik tombol + untuk menambah biaya hutang.
                    </p>
                  )}
                </div>
                {isKreditKonsumtif ? (
                  <>
                    <Input
                      label="Penghasilan Pemohon Kredit"
                      type="text"
                      value={formatIdInteger(formData.pendapatanPemohonKredit)}
                      onChange={handleNumberFieldChange(
                        "pendapatanPemohonKredit"
                      )}
                      inputMode="numeric"
                    />
                    <Input
                      label="Penghasilan Istri / Suami"
                      type="text"
                      value={formatIdInteger(formData.pendapatanIstriSuami)}
                      onChange={handleNumberFieldChange("pendapatanIstriSuami")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Penghasilan Tambahan"
                      type="text"
                      value={formatIdInteger(formData.pendapatanTambahan)}
                      onChange={handleNumberFieldChange("pendapatanTambahan")}
                      inputMode="numeric"
                    />
                  </>
                ) : null}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="Pendapatan Lainnya"
                        type="text"
                        value={formatIdInteger(formData.pendapatanLainnya)}
                        readOnly
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex items-end gap-2 pb-0.5">
                      <button
                        type="button"
                        onClick={handleRemovePendapatanItem}
                        disabled={!pendapatanItems.length}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Kurangi pendapatan lainnya"
                        title="Kurangi pendapatan lainnya"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={handleAddPendapatanItem}
                        disabled={pendapatanItems.length >= MAX_LIST_ITEMS}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Tambah pendapatan lainnya"
                        title="Tambah pendapatan lainnya"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {pendapatanItems.length ? (
                    <div className="space-y-3">
                      {pendapatanItems.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="grid grid-cols-2 gap-3"
                        >
                          <Input
                            label="Keterangan Pendapatan"
                            value={item.keterangan}
                            onChange={handlePendapatanItemChange(
                              itemIndex,
                              "keterangan"
                            )}
                            placeholder="Contoh: Usaha Sampingan"
                          />
                          <Input
                            label="Nilai Pendapatan"
                            type="text"
                            value={formatIdInteger(item.nilai)}
                            onChange={handlePendapatanItemChange(
                              itemIndex,
                              "nilai"
                            )}
                            inputMode="numeric"
                            placeholder="Contoh: 500000"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Klik tombol + untuk menambah pendapatan lainnya.
                    </p>
                  )}
                </div>
                {isKreditKonsumtif ? (
                  <div className="space-y-1">
                    <Input
                      label="Maksimum Angsuran (80% TPP)"
                      type="text"
                      value={formatIdInteger(formData.totalPenghasilan)}
                      readOnly
                    />
                    <p className="text-[11px] text-slate-500">
                      80% dari TPP setelah dikurangi angsuran bank lain (jika ada).
                    </p>
                  </div>
                ) : null}
                <Input
                  label="Hasil Pendapatan setelah Dikurangi Pembiayaan"
                  type="text"
                  value={formatIdNumber(formData.labaNettoNonOperasional)}
                  readOnly
                />
              </div>
            </Card>

            <Card title="Pembiayaan" icon={<FaBriefcase />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      label="Suku Bunga / Tahun"
                      type="text"
                      value={formatIdInteger(formData.sukuBungaTahun)}
                      onChange={handleNumberFieldChange("sukuBungaTahun")}
                      inputMode="numeric"
                    />
                  </div>
                  <span className="pb-2 text-xs text-gray-500">%</span>
                </div>
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
                  label="Pokok Per Bulan"
                  type="text"
                  value={formatIdNumber(formData.pokokPerBulan)}
                  readOnly
                />
                <Input
                  label="Total Bunga Per Bulan"
                  type="text"
                  value={formatIdNumber(formData.totalBungaPerbulan)}
                  readOnly
                />
                <Input
                  label="Angsuran Pembiayaan"
                  type="text"
                  value={formatIdNumber(formData.angsuranPembiayaan)}
                  readOnly
                />
              </div>
            </Card>

            <Card title="Kemampuan Pembayaran" icon={<FaBriefcase />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Angsuran Pembiayaan"
                  type="text"
                  value={formatIdNumber(formData.angsuranPembiayaan)}
                  readOnly
                />
                <Input
                  label="Besar Angsuran dari MPK"
                  type="text"
                  value={formatIdNumber(formData.besarAngsuranMpk)}
                  readOnly
                />
                <Input
                  label="Repayment Capacity"
                  type="text"
                  value={formatIdNumber(formData.repaymentCapacity)}
                  readOnly
                />
                <Input
                  label="Nilai RPC (Repayment Capacity)"
                  type="text"
                  value={formatIdNumber(formData.nilaiRpc)}
                  readOnly
                />
                <Input
                  label="Maksimum Plafon Kredit (MPK)"
                  type="text"
                  value={formatIdNumber(formData.maksimumPlafonKredit)}
                  readOnly
                  className="border-2 font-bold"
                />
                <Input
                  label="Status Repayment"
                  value={formData.repaymentCapacityStatus}
                  readOnly
                  className={`border-2 font-bold ${
                    formData.repaymentCapacityStatus === "Reject"
                      ? "!border-error-400 !bg-red-50 !text-error-700"
                      : formData.repaymentCapacityStatus === "Approve"
                      ? "!border-success-500 !bg-green-50 !text-success-900"
                      : ""
                  }`}
                />
              </div>
            </Card>
            <Card title="Usulan AO" icon={<FaBriefcase />}>
              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Total Bobot"
                    value={totalBobotLabel || "-"}
                    readOnly
                  />
                  <Input
                    label="Status Pengajuan"
                    value={statusPengajuan || "-"}
                    readOnly
                    className={`border-2 font-bold ${statusPengajuanClass}`}
                  />
                </div>
                {shouldShowCatatanPengajuan ? (
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500">
                      Catatan
                    </label>
                    <textarea
                      rows="3"
                      value={formData.catatanPengajuan}
                      placeholder="Masukkan catatan pengajuan..."
                      onChange={handleFieldChange("catatanPengajuan")}
                      className="mt-1 w-full rounded-md border border-gray-200
                      px-3 py-2 text-xs shadow-sm text-gray-700
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                ) : null}
                <div className="rounded-md border border-dashed border-gray-200 p-3 text-xs text-gray-700">
                  <p className="font-semibold text-gray-800">
                    Setelah perhitungan dan proses analisa, maka dapat disimpulkan adalah
                  </p>
                  <p className="mt-2">
                    DAPAT diberikan KREDIT SEBESAR RP{" "}
                    <span className="font-semibold">
                      {formatIdNumber(formData.plafonPermohonan) || "-"}
                    </span>{" "}
                    Jangka Waktu{" "}
                    <span className="font-semibold">
                      {formatIdInteger(formData.jangkaWaktuKredit) || "-"}
                    </span>{" "}
                    Bulan ({formData.perhitunganBunga || "-"}).
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-md bg-gray-50 px-2 py-1">
                      <span className="text-[10px] text-gray-500">Pokok</span>
                      <div className="font-semibold">
                        Rp {formatIdNumber(formData.pokokPerBulan) || "-"}
                      </div>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1">
                      <span className="text-[10px] text-gray-500">Bunga</span>
                      <div className="font-semibold">
                        Rp {formatIdNumber(formData.totalBungaPerbulan) || "-"}
                      </div>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1">
                      <span className="text-[10px] text-gray-500">Total</span>
                      <div className="font-semibold">
                        Rp {formatIdNumber(formData.angsuranPembiayaan) || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* ACTION */}
          <div 
          className="flex justify-end gap-4 mt-10">
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
