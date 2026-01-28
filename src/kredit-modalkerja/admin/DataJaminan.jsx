import React, { useState, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import {
  FaBriefcase,
  FaChevronDown,
  FaChevronUp,
  FaFileAlt,
  FaMapMarkedAlt,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

/* =======================
   REUSABLE COMPONENTS
======================= */

const Card = ({ title, icon, children, headerRight }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-800 text-sm tracking-wide">
          {title}
        </h3>
      </div>
      {headerRight ? (
        <div className="flex-shrink-0">{headerRight}</div>
      ) : null}
    </div>
    {children}
  </section>
);

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  readOnly = false,
  accept,
  capture,
  suffix,
  action,
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-600 uppercase">
      {label}
    </label>
    <div className={suffix || action ? "relative" : ""}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        readOnly={readOnly}
        accept={accept}
        capture={capture}
        className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm transition ${
          suffix || action ? "pr-10" : ""
        }
                 focus:outline-none focus:ring-2 focus:ring-blue-200
                 focus:border-blue-500 placeholder:text-slate-400 ${
                   readOnly ? "bg-slate-50 text-slate-600 cursor-not-allowed" : "bg-white text-slate-800"
                 }`}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
          {suffix}
        </span>
      ) : null}
      {action ? (
        <span className="absolute inset-y-0 right-2 flex items-center">
          {action}
        </span>
      ) : null}
    </div>
  </div>
);

const Select = ({ label, value, onChange, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-600 uppercase">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white text-slate-800
                 focus:outline-none focus:ring-2 focus:ring-blue-200
                 focus:border-blue-500 transition"
    >
      {children}
    </select>
  </div>
);

const createEmptyJaminan = () => ({
  jenisjaminan: "",
  hubungandengannasabah: "",
  noidAgunan: "",
  deskripsiAgunan: "",
  dokumentasiAgunan: null,
  statusPengikatan: "",
  statusAgunan: "",
  hubDgnBPR: "",
  jenisHub: "",
  sejakTahun: "",
  sisaSaldoDana: "",
  statusHubBankLain: "",
  slik: null,
  slikTable: { headers: [], rows: [] },
  slikFileName: "",

  namaPemilikSertifikat: "",
  jenisSertifikat: "",
  noSertifikat: "",
  letak: "",
  luas: "",
  taksiranPasar: "",
  nilaiPPAP: "",
  nilaiNJOP: "",
  nilaiNJOPTanah: "",
  nilaiNJOPBangunan: "",
  nilaiTaksiranKelurahan: "",
  nilaiLikuidasiBank: "",
  jumlahNilaiDigunakan: "",
  plafonDiajukan: "",
  pengikatanJaminan: "",

  namaPemilikBPKB: "",
  tipeBPKB: "",
  pengikatan: "",
  rerataNilaiPasar: "",
  safetyMargin: "",
  nilaiLikuidasi: "",
  noBPKB: "",
  merek: "",
  noMesin: "",
  noSTNK: "",
  noRangka: "",
  masaLakuSTNK: "",

  namaDebitur: "",
  buktiHakMilik: "",
  noBilyet: "",
  tanggalDeposito: "",
  tipeDeposito: "",
  nilaiPasarDeposit: "",
  bungaSimpanan: "",
  bungaTambahan: "",

  tipeTabungan: "",
  lokasiJaminan: "",
  saldoTabunganDiblokirSebesarPlafon: "",
  noRekening: "",
});

const MAX_AGUNAN_FILE_SIZE = 30 * 1024 * 1024;

/* =======================
   PAGE
======================= */

export default function DataJaminan() {
  const navigate = useNavigate();
  const { no_permohonan } = useParams();
  const toNumber = (value) => {
    if (value === "" || value === null || value === undefined) return 0;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
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

  const hasInputValue = (value) => String(value ?? "").trim() !== "";
  const getPlafonPermohonanValue = (permohonan) => {
    if (!permohonan) return "";
    const candidates = [
      permohonan.plafonPermohonan,
      permohonan.plafon_permohonan,
      permohonan.plafonKredit,
      permohonan.plafon_kredit,
      permohonan.plafon,
    ];
    return candidates.find((value) => hasInputValue(value)) ?? "";
  };

  const getTotalNilaiNJOP = (item) => {
    const hasTanah = hasInputValue(item.nilaiNJOPTanah);
    const totalTanah = toNumber(item.nilaiNJOPTanah);
    if (hasTanah) {
      return { total: totalTanah, hasValue: true };
    }
    const fallback = toNumber(item.nilaiNJOP);
    return { total: fallback, hasValue: hasInputValue(item.nilaiNJOP) };
  };

  const getTotalNilaiAgunan = (item) => {
    const hasParts =
      hasInputValue(item.nilaiTaksiranKelurahan) ||
      hasInputValue(item.nilaiLikuidasiBank);
    const total =
      toNumber(item.nilaiTaksiranKelurahan) +
      toNumber(item.nilaiLikuidasiBank);
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

  const computeMinimalHakTanggungan = (plafon) => {
    const numericPlafon = toNumber(plafon);
    if (!numericPlafon) return "";
    return formatIdInteger(numericPlafon * 1.25);
  };

  const computeNilaiLikuidasi = (nilaiPasar, margin) => {
    if (nilaiPasar === "") return "";
    const safeMargin = Number.isFinite(margin) ? margin : 0.5;
    return formatTwoDecimals(toNumber(nilaiPasar) * safeMargin);
  };

  const getBpkbMargin = (pengikatanValue) => {
    const normalized = String(pengikatanValue ?? "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    if (normalized === "FIDUSIA") return 0.5;
    if (normalized === "NONFIDUSIA") return 0;
    return 0.5;
  };

  const getSertifikatMargin = (statusPengikatan) => {
    const normalized = String(statusPengikatan ?? "").toUpperCase();
    if (normalized === "SKMHT") return 0.6;
    if (normalized === "APHT") return 0.8;
    return 0.8;
  };

  const getApprovalStatus = (item) => {
    const plafonValue = hasInputValue(item.plafonDiajukan)
      ? item.plafonDiajukan
      : plafonPermohonan;
    const minHakTanggungan = toNumber(plafonValue) * 1.25;
    if (!minHakTanggungan) return "";

    const nilaiMargin = hasInputValue(item.nilaiLikuidasi)
      ? toNumber(item.nilaiLikuidasi)
      : hasInputValue(item.taksiranPasar)
      ? toNumber(item.taksiranPasar)
      : toNumber(item.rerataNilaiPasar);
    if (!nilaiMargin) return "";
    return nilaiMargin >= minHakTanggungan ? "Approve" : "Reject";
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
          (item) =>
            item && typeof item === "object" && !Array.isArray(item)
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

  const getSlikStorageKey = (permohonan) =>
    permohonan ? `slik:${permohonan}` : "";

  const readSlikStorage = () => {
    const storageKey = getSlikStorageKey(no_permohonan);
    if (!storageKey) return {};
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const writeSlikStorage = (next) => {
    const storageKey = getSlikStorageKey(no_permohonan);
    if (!storageKey) return;
    if (!next || Object.keys(next).length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const saveSlikStorageEntry = (index, table, fileName) => {
    const current = readSlikStorage();
    current[index] = { table, fileName };
    writeSlikStorage(current);
  };

  const removeSlikStorageEntry = (index) => {
    const current = readSlikStorage();
    if (!(index in current)) return;
    delete current[index];
    writeSlikStorage(current);
  };

  const handleSlikFileChange = (index) => (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      updateJaminan(index, {
        slik: null,
        slikTable: { headers: [], rows: [] },
        slikFileName: "",
      });
      removeSlikStorageEntry(index);
      return;
    }

    const isTxtFile =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isTxtFile) {
      Swal.fire("Error", "File SLIK harus berformat .txt", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const table = parseSlikText(text);
      updateJaminan(index, {
        slik: file,
        slikTable: table,
        slikFileName: file.name,
      });
      saveSlikStorageEntry(index, table, file.name);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "File SLIK berhasil disimpan",
        showConfirmButton: false,
        timer: 1200,
        timerProgressBar: true,
      });
    };
    reader.onerror = () => {
      Swal.fire("Error", "Gagal membaca file SLIK", "error");
    };
    reader.readAsText(file);
  };

  const [totalJaminan, setTotalJaminan] = useState(1);
  const [jaminanList, setJaminanList] = useState([createEmptyJaminan()]);
  const [plafonPermohonan, setPlafonPermohonan] = useState("");
  const [showNilaiAgunanDetails, setShowNilaiAgunanDetails] = useState([false]);
  const [showNilaiNjopDetails, setShowNilaiNjopDetails] = useState([false]);

  /* =======================
     AUTH + FETCH
  ======================= */
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

    const fetchPermohonan = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.datanasabah.dataPermohonan.detail(no_permohonan)
        );
        const data = response.data?.Data ?? response.data?.data;
        const permohonan = Array.isArray(data) ? data[0] : data;
        setPlafonPermohonan(getPlafonPermohonanValue(permohonan));
      } catch {
        setPlafonPermohonan("");
      }
    };

    fetchPermohonan();
  }, [no_permohonan]);

  useEffect(() => {
    setJaminanList((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const nextPlafon = plafonPermohonan ?? "";
        if (
          String(item.plafonDiajukan ?? "") === String(nextPlafon)
        ) {
          return item;
        }
        changed = true;
        return { ...item, plafonDiajukan: nextPlafon };
      });
      return changed ? next : prev;
    });
  }, [plafonPermohonan]);

  useEffect(() => {
    setJaminanList((prev) => {
      const next = [...prev];
      if (totalJaminan > next.length) {
        while (next.length < totalJaminan) {
          const nextItem = createEmptyJaminan();
          if (hasInputValue(plafonPermohonan)) {
            nextItem.plafonDiajukan = plafonPermohonan;
          }
          next.push(nextItem);
        }
      } else if (totalJaminan < next.length) {
        next.length = totalJaminan;
      }
      return next;
    });
    setShowNilaiAgunanDetails((prev) => {
      const next = [...prev];
      if (totalJaminan > next.length) {
        while (next.length < totalJaminan) {
          next.push(false);
        }
      } else if (totalJaminan < next.length) {
        next.length = totalJaminan;
      }
      return next;
    });
    setShowNilaiNjopDetails((prev) => {
      const next = [...prev];
      if (totalJaminan > next.length) {
        while (next.length < totalJaminan) {
          next.push(false);
        }
      } else if (totalJaminan < next.length) {
        next.length = totalJaminan;
      }
      return next;
    });
  }, [totalJaminan]);

  /* =======================
     HANDLERS
  ======================= */

  const updateJaminan = (index, updates) => {
    setJaminanList((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      )
    );
  };

  const toggleNilaiAgunanDetails = (index) => {
    setShowNilaiAgunanDetails((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const toggleNilaiNjopDetails = (index) => {
    setShowNilaiNjopDetails((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleItemChange = (index, field) => (e) => {
    const value = e.target.value;

    if (field === "jenisjaminan") {
      const updates = { jenisjaminan: value };
      if (value === "BPKB") {
        const pengikatanValue =
          jaminanList[index]?.pengikatan || "Fidusia";
        const margin = getBpkbMargin(pengikatanValue);
        updates.pengikatan = pengikatanValue;
        updates.safetyMargin = String(Math.round(margin * 100));
        updates.nilaiLikuidasi = computeNilaiLikuidasi(
          jaminanList[index]?.rerataNilaiPasar,
          margin
        );
      }
      if (value === "Sertifikat") {
        const nextItem = { ...jaminanList[index], ...updates };
        const rerataPasar = getNilaiRerataPasar(nextItem);
        const rerataValue = rerataPasar.hasValue ? rerataPasar.total : "";
        const margin = getSertifikatMargin(nextItem.statusPengikatan);
        updates.safetyMargin = String(Math.round(margin * 100));
        updates.rerataNilaiPasar =
          rerataValue !== "" ? String(rerataValue) : "";
        updates.taksiranPasar = updates.rerataNilaiPasar;
        updates.nilaiLikuidasi =
          rerataValue !== ""
            ? computeNilaiLikuidasi(rerataValue, margin)
            : "";
      }
      if (value === "Deposito") {
        updates.buktiHakMilik = "Bilyet Deposito";
      }
      updateJaminan(index, updates);
      return;
    }

    if (field === "pengikatan") {
      const updates = { pengikatan: value };
      if (jaminanList[index]?.jenisjaminan === "BPKB") {
        const margin = getBpkbMargin(value);
        updates.safetyMargin = String(Math.round(margin * 100));
        updates.nilaiLikuidasi = computeNilaiLikuidasi(
          jaminanList[index]?.rerataNilaiPasar,
          margin
        );
      }
      updateJaminan(index, updates);
      return;
    }

    if (field === "statusPengikatan") {
      const updates = { statusPengikatan: value };
      if (jaminanList[index]?.jenisjaminan === "Sertifikat") {
        const nextItem = { ...jaminanList[index], ...updates };
        const rerataPasar = getNilaiRerataPasar(nextItem);
        const rerataValue = rerataPasar.hasValue ? rerataPasar.total : "";
        const margin = getSertifikatMargin(value);
        updates.safetyMargin = String(Math.round(margin * 100));
        updates.rerataNilaiPasar =
          rerataValue !== "" ? String(rerataValue) : "";
        updates.taksiranPasar = updates.rerataNilaiPasar;
        updates.nilaiLikuidasi =
          rerataValue !== ""
            ? computeNilaiLikuidasi(rerataValue, margin)
            : "";
      }
      updateJaminan(index, updates);
      return;
    }

    if (field === "statusHubBankLain") {
      const updates = { statusHubBankLain: value };
      if (value !== "Ya") {
        updates.slik = null;
        updates.slikTable = { headers: [], rows: [] };
        updates.slikFileName = "";
        removeSlikStorageEntry(index);
      }
      updateJaminan(index, updates);
      return;
    }

    updateJaminan(index, { [field]: value });
  };

  const handleItemNumberChange = (index, field) => (e) => {
    const rawValue = e.target.value;
    const cleanedValue = rawValue.replace(/\D/g, "");
    const formulaFields = new Set([
      "nilaiTaksiranKelurahan",
      "nilaiLikuidasiBank",
      "nilaiNJOP",
      "nilaiNJOPTanah",
      "nilaiNJOPBangunan",
    ]);
    const njopFields = new Set(["nilaiNJOPTanah", "nilaiNJOPBangunan"]);

    if (field === "rerataNilaiPasar") {
      if (jaminanList[index]?.jenisjaminan === "BPKB") {
        const margin = getBpkbMargin(jaminanList[index]?.pengikatan);
        updateJaminan(index, {
          rerataNilaiPasar: cleanedValue,
          safetyMargin: String(Math.round(margin * 100)),
          nilaiLikuidasi: computeNilaiLikuidasi(cleanedValue, margin),
        });
        return;
      }
      updateJaminan(index, {
        rerataNilaiPasar: cleanedValue,
        safetyMargin: "50",
        nilaiLikuidasi: computeNilaiLikuidasi(cleanedValue, 0.5),
      });
      return;
    }

    if (
      formulaFields.has(field) &&
      jaminanList[index]?.jenisjaminan === "Sertifikat"
    ) {
      const updates = { [field]: cleanedValue };
      let nextItem = { ...jaminanList[index], ...updates };
      if (njopFields.has(field)) {
        const totalNjop = getTotalNilaiNJOP(nextItem);
        updates.nilaiNJOP = totalNjop.hasValue ? String(totalNjop.total) : "";
        nextItem = { ...jaminanList[index], ...updates };
      }
      const rerataPasar = getNilaiRerataPasar(nextItem);
      const rerataValue = rerataPasar.hasValue ? rerataPasar.total : "";
      const margin = getSertifikatMargin(nextItem.statusPengikatan);
      updates.rerataNilaiPasar =
        rerataValue !== "" ? String(rerataValue) : "";
      updates.taksiranPasar = updates.rerataNilaiPasar;
      updates.safetyMargin = String(Math.round(margin * 100));
      updates.nilaiLikuidasi =
        rerataValue !== ""
          ? computeNilaiLikuidasi(rerataValue, margin)
          : "";
      updateJaminan(index, updates);
      return;
    }

    updateJaminan(index, { [field]: cleanedValue });
  };

  const handleFileChange = (index) => (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      updateJaminan(index, { dokumentasiAgunan: null });
      return;
    }
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      e.target.value = "";
      updateJaminan(index, { dokumentasiAgunan: null });
      Swal.fire("Gagal", "Dokumen agunan harus berformat PDF.", "error");
      return;
    }
    if (file.size > MAX_AGUNAN_FILE_SIZE) {
      e.target.value = "";
      updateJaminan(index, { dokumentasiAgunan: null });
      Swal.fire("Gagal", "Ukuran file maksimal 30MB.", "error");
      return;
    }
    updateJaminan(index, { dokumentasiAgunan: file });
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

  const handleSave = async () => {
    if (!no_permohonan) {
      Swal.fire("Error", "No Permohonan tidak ditemukan", "error");
      return;
    }

    try {
      Swal.fire({
        title: "Menyimpan Data Jaminan...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      for (const item of jaminanList) {
        const payload = new FormData();
        payload.append("no_permohonan", no_permohonan);
        payload.append("totalJaminan", String(totalJaminan));

        const {
          slikTable,
          slikFileName,
          nilaiNJOPTanah,
          nilaiNJOPBangunan,
          ...dataToSend
        } = item;
        if (item.jenisjaminan === "BPKB") {
          const margin = getBpkbMargin(item.pengikatan);
          dataToSend.safetyMargin = String(Math.round(margin * 100));
          dataToSend.nilaiLikuidasi = computeNilaiLikuidasi(
            item.rerataNilaiPasar,
            margin
          );
        }
        if (item.jenisjaminan === "Sertifikat") {
          const totalNjop = getTotalNilaiNJOP(item);
          const rerataPasar = getNilaiRerataPasar(item);
          const rerataValue = rerataPasar.hasValue ? rerataPasar.total : "";
          const margin = getSertifikatMargin(item.statusPengikatan);
          dataToSend.safetyMargin = String(Math.round(margin * 100));
          if (totalNjop.hasValue) {
            dataToSend.nilaiNJOP = String(totalNjop.total);
          }
          if (rerataValue !== "") {
            dataToSend.rerataNilaiPasar = String(rerataValue);
            dataToSend.taksiranPasar = String(rerataValue);
            dataToSend.nilaiLikuidasi = computeNilaiLikuidasi(
              rerataValue,
              margin
            );
          }
        }
        if (item.jenisjaminan === "Deposito") {
          dataToSend.buktiHakMilik = "Bilyet Deposito";
        }
        if (item.jenisjaminan === "Tabungan") {
          dataToSend.saldoTabunganDiblokirSebesarPlafon = plafonPermohonan;
        }

        Object.entries(dataToSend).forEach(([key, value]) => {
          if (value !== null && value !== "") {
            payload.append(key, value);
          }
        });

        await axios.post(API_ENDPOINTS.datanasabah.dataJaminan.list(), payload);
      }

      Swal.fire("Berhasil", "Data Jaminan berhasil disimpan", "success");
      navigate("/dashboard");
    } catch (err) {
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal menyimpan Data Jaminan",
        "error"
      );
    }
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <PageBackground>
      <Sidebar />
      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <FaBriefcase className="text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Data Jaminan Nasabah
              </h1>
              <p className="text-sm text-slate-500">
                Lengkapi informasi agunan untuk mendukung proses pengajuan kredit.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <Card title="Data Umum Jaminan" icon={<FaBriefcase />}>
              <Select
                label="Total Jaminan"
                value={String(totalJaminan)}
                onChange={(e) => {
                  const value = Math.min(
                    3,
                    Math.max(1, Number(e.target.value))
                  );
                  setTotalJaminan(value);
                }}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </Select>
            </Card>
          </div>

          {jaminanList.map((item, index) => {
            const totalNilaiNjop = getTotalNilaiNJOP(item);
            const totalNilaiAgunan = getTotalNilaiAgunan(item);
            const nilaiRerataPasar = getNilaiRerataPasar(item);
            const plafonValue = hasInputValue(item.plafonDiajukan)
              ? item.plafonDiajukan
              : plafonPermohonan;

            return (
            <div key={index} className="mb-10">
              <h2 className="text-lg font-semibold text-slate-700 mb-4">
                Jaminan {index + 1}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card
                  title="Data Umum Jaminan"
                  icon={<FaBriefcase />}
                >
                  <Select
                    label="Jenis Agunan"
                    value={item.jenisjaminan}
                    onChange={handleItemChange(index, "jenisjaminan")}
                  >
                    <option value="">Pilih Jenis Agunan</option>
                    <option value="Sertifikat">Sertifikat</option>
                    <option value="BPKB">BPKB</option>
                    <option value="Tabungan">Tabungan</option>
                    <option value="Deposito">Deposito</option>
                    <option value="Gadai Emas">Gadai Emas</option>
                  </Select>

                  <Select
                    label="Hubungan dengan Nasabah"
                    value={item.hubungandengannasabah}
                    onChange={handleItemChange(index, "hubungandengannasabah")}
                  >
                    <option value="">Pilih Hubungan</option>
                    <option value="Pemilik Langsung">Pemilik Langsung</option>
                    <option value="Suami/Istri">Suami / Istri</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Kerabat">Kerabat</option>
                  </Select>
                </Card>

                <Card title="Detail Jaminan" icon={<FaFileAlt />}>
                  {item.jenisjaminan ? (
                    <>
                      <Input
                        label={
                          item.jenisjaminan === "Sertifikat"
                            ? "Nomor NIB Sertifikat"
                            : "No ID Agunan"
                        }
                        value={item.noidAgunan}
                        onChange={handleItemChange(index, "noidAgunan")}
                      />

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase">
                          Deskripsi Agunan
                        </label>
                        <textarea
                          rows="3"
                          value={item.deskripsiAgunan}
                          placeholder="Tanah dan Bangunan dipinggir jalan utama, mempunyai nilai ekonomis yang tinggi/marketable..."
                          onChange={handleItemChange(index, "deskripsiAgunan")}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700
                                 focus:outline-none focus:ring-2 focus:ring-blue-200
                                 focus:border-blue-500 transition placeholder:text-slate-400"
                        />
                      </div>

                      {item.jenisjaminan === "Sertifikat" && (
                        <div className="space-y-4">
                          <Select
                            label="Jenis Sertifikat"
                            value={item.jenisSertifikat}
                            onChange={handleItemChange(index, "jenisSertifikat")}
                          >
                            <option value="">Pilih Jenis Sertifikat</option>
                            <option value="SHM">SHM</option>
                            <option value="SHGB">SHGB</option>
                          </Select>
                          <Select
                            label="Jenis Pengikatan"
                            value={item.statusPengikatan}
                            onChange={handleItemChange(index, "statusPengikatan")}
                          >
                            <option value="">Pilih Jenis Pengikatan</option>
                            <option value="APHT">APHT</option>
                            <option value="SKMHT">SKMHT</option>
                          </Select>
                          <Input
                            label="No SHM / SHGB"
                            value={item.noSertifikat}
                            onChange={handleItemChange(index, "noSertifikat")}
                          />
                          <Input
                            label="Nama Pemilik Sertifikat"
                            value={item.namaPemilikSertifikat}
                            onChange={handleItemChange(
                              index,
                              "namaPemilikSertifikat"
                            )}
                          />
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 uppercase">
                              Letak
                            </label>
                            <textarea
                              rows="3"
                              value={item.letak}
                              placeholder="Di desa/kelurahan ..., kecamatan ..., kota/kabupaten ..., provinsi ..., akses Lokasi Agunan ..."
                              onChange={handleItemChange(index, "letak")}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700
                                    focus:outline-none focus:ring-2 focus:ring-blue-200
                                    focus:border-blue-500 transition placeholder:text-slate-400"
                            />
                          </div>
                          <Input
                            label="Luas"
                            type="text"
                            value={formatIdInteger(item.luas)}
                            onChange={handleItemNumberChange(index, "luas")}
                            inputMode="numeric"
                            suffix="M²"
                          />
                          <Input
                            label="Total Nilai NJOP"
                            type="text"
                            value={
                              totalNilaiNjop.hasValue
                                ? formatIdInteger(totalNilaiNjop.total)
                                : ""
                            }
                            readOnly
                            action={
                              <button
                                type="button"
                                onClick={() => toggleNilaiNjopDetails(index)}
                                className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                                aria-label={
                                  showNilaiNjopDetails[index]
                                    ? "Sembunyikan detail NJOP"
                                    : "Tampilkan detail NJOP"
                                }
                                title={
                                  showNilaiNjopDetails[index]
                                    ? "Sembunyikan detail NJOP"
                                    : "Tampilkan detail NJOP"
                                }
                              >
                                {showNilaiNjopDetails[index] ? (
                                  <FaChevronUp className="mx-auto text-xs" />
                                ) : (
                                  <FaChevronDown className="mx-auto text-xs" />
                                )}
                              </button>
                            }
                          />
                          {showNilaiNjopDetails[index] ? (
                            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                              <Input
                                label="Nilai NJOP Tanah"
                                type="text"
                                value={formatIdInteger(item.nilaiNJOPTanah)}
                                onChange={handleItemNumberChange(
                                  index,
                                  "nilaiNJOPTanah"
                                )}
                                inputMode="numeric"
                              />
                              <Input
                                label="Nilai NJOP Bangunan"
                                type="text"
                                value={formatIdInteger(item.nilaiNJOPBangunan)}
                                onChange={handleItemNumberChange(
                                  index,
                                  "nilaiNJOPBangunan"
                                )}
                                inputMode="numeric"
                              />
                            </div>
                          ) : null}
                          <Input
                            label="Total Likuidasi Penilaian Bank"
                            type="text"
                            value={
                              totalNilaiAgunan.hasValue
                                ? formatIdInteger(totalNilaiAgunan.total)
                                : ""
                            }
                            readOnly
                            action={
                              <button
                                type="button"
                                onClick={() => toggleNilaiAgunanDetails(index)}
                                className="h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                                aria-label={
                                  showNilaiAgunanDetails[index]
                                    ? "Sembunyikan detail nilai agunan"
                                    : "Tampilkan detail nilai agunan"
                                }
                                title={
                                  showNilaiAgunanDetails[index]
                                    ? "Sembunyikan detail nilai agunan"
                                    : "Tampilkan detail nilai agunan"
                                }
                              >
                                {showNilaiAgunanDetails[index] ? (
                                  <FaChevronUp className="mx-auto text-xs" />
                                ) : (
                                  <FaChevronDown className="mx-auto text-xs" />
                                )}
                              </button>
                            }
                          />
                          {showNilaiAgunanDetails[index] ? (
                            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                              <Input
                                label="Nilai Likuidasi Penilaian Bank"
                                type="text"
                                value={formatIdInteger(item.nilaiLikuidasiBank)}
                                onChange={handleItemNumberChange(
                                  index,
                                  "nilaiLikuidasiBank"
                                )}
                                inputMode="numeric"
                              />
                            </div>
                          ) : null}
                          <Input
                            label="Nilai Rerata Pasar"
                            type="text"
                            value={
                              nilaiRerataPasar.hasValue
                                ? formatIdInteger(nilaiRerataPasar.total)
                                : ""
                            }
                            readOnly
                          />
                          <Input
                            label="Nilai Transaksi Setelah Safety Margin"
                            type="text"
                            value={formatIdNumber(item.nilaiLikuidasi)}
                            readOnly
                          />
                          <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                            Master Agunan Tanah di IBS
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Ikatan Agunan"
                              value={item.statusPengikatan || "-"}
                              readOnly
                            />
                            <Input
                              label="Nilai APHT / SKMHT"
                              type="text"
                              value={
                                nilaiRerataPasar.hasValue
                                  ? formatIdInteger(nilaiRerataPasar.total)
                                  : ""
                              }
                              readOnly
                            />
                            <Input
                              label="Nilai NJOP"
                              type="text"
                              value={
                                totalNilaiNjop.hasValue
                                  ? formatIdInteger(totalNilaiNjop.total)
                                  : ""
                              }
                              readOnly
                            />
                            <Input
                              label="Nilai Taksasi"
                              type="text"
                              value={
                                nilaiRerataPasar.hasValue
                                  ? formatIdInteger(nilaiRerataPasar.total)
                                  : ""
                              }
                              readOnly
                            />
                            <Input
                              label="Nilai Pasar"
                              type="text"
                              value={
                                totalNilaiAgunan.hasValue
                                  ? formatIdInteger(totalNilaiAgunan.total)
                                  : ""
                              }
                              readOnly
                            />
                            <Input
                              label="Nilai Likuiditas (PPAP)"
                              type="text"
                              value={formatIdNumber(item.nilaiLikuidasi)}
                              readOnly
                            />
                          </div>
                          
                          <Input
                            label="Min. Hak Tanggungan (125%)"
                            value={computeMinimalHakTanggungan(
                              plafonValue
                            )}
                            readOnly
                          />
                          {(item.pengikatanJaminan ===
                            "Jika diikat, bernilai sebesar taksiran harga bank" ||
                            item.pengikatanJaminan === "Suami/Istri") && (
                            <Input
                              label="Nilai Pengikatan Jaminan"
                              type="text"
                              value={formatIdInteger(item.taksiranPasar)}
                              readOnly
                            />
                          )}
                        </div>
                      )}

                      {item.jenisjaminan === "BPKB" && (
                        <div className="space-y-4">
                          <Input
                            label="Nama Pemilik BPKB"
                            value={item.namaPemilikBPKB}
                            onChange={handleItemChange(index, "namaPemilikBPKB")}
                          />
                          <Select
                            label="Tipe BPKB"
                            value={item.tipeBPKB}
                            onChange={handleItemChange(index, "tipeBPKB")}
                          >
                            <option value="">Pilih Tipe</option>
                            <option value="Roda 2">Kendaraan Roda 2</option>
                            <option value="Roda 3">Kendaraan Roda 3</option>
                            <option value="Roda 4">Kendaraan Roda 4</option>
                          </Select>
                          <Select
                            label="Jenis Pengikatan"
                            value={item.pengikatan}
                            onChange={handleItemChange(index, "pengikatan")}
                          >
                            <option value="">Pilih Pengikatan</option>
                            <option value="Fidusia">Fidusia</option>
                            <option value="Non Fidusia">Non Fidusia</option>
                          </Select>
                          <Input
                            label="Rerata Nilai Pasar"
                            type="text"
                            value={formatIdInteger(item.rerataNilaiPasar)}
                            onChange={handleItemNumberChange(
                              index,
                              "rerataNilaiPasar"
                            )}
                            inputMode="numeric"
                          />
                          <Input
                            label="Nilai Likuidasi"
                            type="text"
                            value={formatIdNumber(item.nilaiLikuidasi)}
                            readOnly
                          />
                          <Input
                            label="Nilai Plafon yang Diajukan"
                            type="text"
                            value={formatIdInteger(plafonValue)}
                            readOnly
                          />
                          
                          <Input
                            label="Status Pengajuan"
                            value={getApprovalStatus(item) || "-"}
                            readOnly
                          />
                          <Input
                            label="No BPKB"
                            value={item.noBPKB}
                            onChange={handleItemChange(index, "noBPKB")}
                          />
                          <Input
                            label="Merek"
                            value={item.merek}
                            onChange={handleItemChange(index, "merek")}
                          />
                          <Input
                            label="No Mesin"
                            value={item.noMesin}
                            onChange={handleItemChange(index, "noMesin")}
                          />
                          <Input
                            label="No STNK"
                            value={item.noSTNK}
                            onChange={handleItemChange(index, "noSTNK")}
                          />
                          <Input
                            label="No Rangka"
                            value={item.noRangka}
                            onChange={handleItemChange(index, "noRangka")}
                          />
                          <Input
                            label="Masa Laku STNK"
                            type="date"
                            value={item.masaLakuSTNK}
                            onChange={handleItemChange(index, "masaLakuSTNK")}
                          />
                        </div>
                      )}

                      {item.jenisjaminan === "Deposito" && (
                        <div className="space-y-4">
                          <Input
                            label="Nama Debitur"
                            value={item.namaDebitur}
                            onChange={handleItemChange(index, "namaDebitur")}
                          />
                          <Input
                            label="Bukti Hak Milik"
                            value="Bilyet Deposito"
                            readOnly
                          />
                          <Input
                            label="No Bilyet"
                            value={item.noBilyet}
                            onChange={handleItemChange(index, "noBilyet")}
                          />
                          <Input
                            label="Tanggal Deposito"
                            type="date"
                            value={item.tanggalDeposito}
                            onChange={handleItemChange(index, "tanggalDeposito")}
                          />
                          <Input
                            label="Tipe Deposito"
                            value={item.tipeDeposito}
                            onChange={handleItemChange(index, "tipeDeposito")}
                          />
                          <Input
                            label="Nilai Pasar Deposito"
                            type="text"
                            value={formatIdInteger(item.nilaiPasarDeposit)}
                            onChange={handleItemNumberChange(
                              index,
                              "nilaiPasarDeposit"
                            )}
                            inputMode="numeric"
                          />
                          <Input
                            label="Bunga Simpanan"
                            type="text"
                            value={formatIdInteger(item.bungaSimpanan)}
                            onChange={handleItemNumberChange(
                              index,
                              "bungaSimpanan"
                            )}
                            inputMode="numeric"
                          />
                          <Input
                            label="Bunga Tambahan"
                            type="text"
                            value={formatIdInteger(item.bungaTambahan)}
                            onChange={handleItemNumberChange(
                              index,
                              "bungaTambahan"
                            )}
                            inputMode="numeric"
                          />
                        </div>
                      )}

                      {item.jenisjaminan === "Tabungan" && (
                        <div className="space-y-4">
                          <Input
                            label="Bukti Hak Milik"
                            value={item.buktiHakMilik}
                            onChange={handleItemChange(index, "buktiHakMilik")}
                          />
                          <Input
                            label="Tipe Tabungan"
                            value={item.tipeTabungan}
                            onChange={handleItemChange(index, "tipeTabungan")}
                          />
                          <Input
                            label="Lokasi Jaminan"
                            value={item.lokasiJaminan}
                            onChange={handleItemChange(index, "lokasiJaminan")}
                          />
                          <Input
                            label="Saldo Tabungan Dibekukan"
                            type="text"
                            value={formatIdInteger(plafonPermohonan)}
                            readOnly
                          />
                          <Input
                            label="No Rekening"
                            value={item.noRekening}
                            onChange={handleItemChange(index, "noRekening")}
                          />
                        </div>
                      )}

                      <Input
                        label="Status Pengajuan"
                        value={getApprovalStatus(item) || "-"}
                        readOnly
                      />

                      <Input
                        label="Upload Dokumen Agunan"
                        type="file"
                        onChange={handleFileChange(index)}
                        accept="application/pdf"
                      />
                    </>
                  ) : null}
                </Card>

                <Card title="Data Keterangan Lain-lain" icon={<FaMapMarkedAlt />}>
                  <Select
                    label="Hubungan dengan PT. BPR NTB"
                    value={item.hubDgnBPR}
                    onChange={handleItemChange(index, "hubDgnBPR")}
                  >
                    <option value="">Pilih</option>
                    <option value="Ya">Nasabah Lama</option>
                    <option value="Tidak">Nasabah Baru</option>
                  </Select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Jenis Hubungan"
                      value={item.jenisHub}
                      onChange={handleItemChange(index, "jenisHub")}
                    >
                      <option value="">Pilih</option>
                      <option value="Penabung">Nasabah Penabung</option>
                      <option value="Deposito">Nasabah Deposito</option>
                      <option value="Kredit">Nasabah Kredit</option>
                    </Select>
                    <Input
                      label="Sejak Tahun"
                      value={item.sejakTahun}
                      onChange={handleItemChange(index, "sejakTahun")}
                    />
                  </div>

                  <Input
                    label="Saldo Dana di BPR NTB"
                    type="text"
                    value={formatIdInteger(item.sisaSaldoDana)}
                    onChange={handleItemNumberChange(index, "sisaSaldoDana")}
                    inputMode="numeric"
                  />

                  <Select
                    label="Hubungan dengan Bank Lain"
                    value={item.statusHubBankLain}
                    onChange={handleItemChange(index, "statusHubBankLain")}
                  >
                    <option value="">Pilih</option>
                    <option value="Ya">Ada</option>
                    <option value="Tidak">Tidak Ada</option>
                  </Select>

                </Card>
              </div>

              {item.statusHubBankLain === "Ya" &&
              (item.slik || item.slikTable?.rows?.length) ? (
                <div className="mt-6">
                  {renderSlikTable(item.slikTable, {
                    fileName: item.slik?.name || item.slikFileName,
                  })}
                </div>
              ) : null}
            </div>
            );
          })}

          <div className="flex justify-end gap-3 mt-10 border-t border-slate-100 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border border-slate-200
                         text-slate-700 text-sm font-semibold
                         hover:bg-slate-50 transition"
            >
              Kembali
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-success-800
                         text-white text-sm font-semibold shadow-sm
                         hover:bg-slate-900 transition"
            >
              Simpan & Ajukan
            </button>
          </div>
        </main>
      </div>
    </PageBackground>
  );
}
