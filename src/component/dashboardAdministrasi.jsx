import React, { useEffect, useRef, useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import PageBackground from "./PageBackground";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaUsers, FaFileInvoiceDollar, FaBriefcase, FaTrash } from "react-icons/fa";
import { API_ENDPOINTS } from "../config/apiEndpoints";

export default function DashboardAdministrasi() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAktivitas: 0,
    kreditAktif: 0,
    kreditPengajuan: 0,
  });

  const [listKredit, setListKredit] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");
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
  const [caraPengembalianKredit, setCaraPengembalianKredit] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userKantor, setUserKantor] = useState("");
  const pendingAlertRef = useRef("");
  const NIK_PENANGGUNG_KEYS = [
    "nikPenanggungJawab",
    "nik_penanggung_jawab",
    "nikPenanggung",
    "nik_penanggung",
    "nikPasangan",
    "nik_pasangan",
    "nikSuamiIstri",
    "nik_suami_istri",
    "nikPenjamin",
    "nik_penjamin",
  ];

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

  const normalizeJenisPerhitungan = (value) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return "";
    if (normalized === "flat") return "Flat";
    if (normalized === "anuitas") return "Anuitas";
    return value;
  };

  const inferJenisPerhitungan = (value) => {
    const raw = String(value ?? "").replace(/[^0-9.]/g, "");
    if (!raw) return "";
    const rate = Number(raw);
    if (!Number.isFinite(rate) || rate <= 0) return "";
    return rate >= 18 ? "Anuitas" : "Flat";
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

  const SLIK_UPLOAD_INDEX = 0;

  const getSlikStorageKey = (permohonan) =>
    permohonan ? `slik:${permohonan}` : "";

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

  const clearSlikStorage = (permohonan) => {
    writeSlikStorage(permohonan, {});
  };

  const getLocalSlikEntry = (permohonan) => {
    const current = readSlikStorage(permohonan);
    return current?.[SLIK_UPLOAD_INDEX] ?? null;
  };

  const hasLocalSlikEntry = (entry) =>
    Boolean(entry?.fileName || entry?.table?.rows?.length);

  const getLocalSlikInfo = (permohonan) => {
    const current = readSlikStorage(permohonan);
    const values = Object.values(current || {});
    for (const entry of values) {
      const hasRows = Boolean(entry?.table?.rows?.length);
      const fileName = entry?.fileName ?? "";
      if (fileName || hasRows) {
        return { hasSlik: true, fileName };
      }
    }
    return { hasSlik: false, fileName: "" };
  };

  const hasTextValue = (value) =>
    typeof value === "string" && value.trim() !== "";

  const looksLikeTxtFileName = (value) =>
    hasTextValue(value) && value.trim().toLowerCase().endsWith(".txt");

  const getFirstStringValue = (source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (hasTextValue(value)) {
        return value.trim();
      }
    }
    return "";
  };

  const getSlikInfoFromDataDiri = (item) => {
    const nasabahFile = getFirstStringValue(item, [
      "slik",
      "slikFile",
      "slikFileName",
      "slik_file",
      "slik_filename",
    ]);
    const nasabahText = getFirstStringValue(item, [
      "slikText",
      "slik_text",
      "slikTxt",
      "sliktext",
    ]);
    const penanggungFile = getFirstStringValue(item, [
      "slikPenanggungJawab",
      "slik_penanggung_jawab",
      "slikPasangan",
      "slik_pasangan",
    ]);
    const penanggungText = getFirstStringValue(item, [
      "slikTextPenanggungJawab",
      "slik_text_penanggung_jawab",
      "slikTxtPenanggungJawab",
      "slik_txt_penanggung_jawab",
    ]);

    const nasabahFileName = looksLikeTxtFileName(nasabahFile)
      ? nasabahFile
      : "";
    const penanggungFileName = looksLikeTxtFileName(penanggungFile)
      ? penanggungFile
      : "";
    const hasNasabahServerSlik = Boolean(
      nasabahFileName || hasTextValue(nasabahText)
    );
    const hasPenanggungServerSlik = Boolean(
      penanggungFileName || hasTextValue(penanggungText)
    );

    return {
      nasabahFileName,
      penanggungFileName,
      hasNasabahServerSlik,
      hasPenanggungServerSlik,
    };
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
        if (
          score > bestScore ||
          (score === bestScore && rows.length > bestLength)
        ) {
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

  const handleNumericChange = (setter) => (event) => {
    setter(sanitizeNumericValue(event.target.value));
  };

  const handleCurrencyChange = (setter) => (event) => {
    setter(formatCurrencyInput(event.target.value));
  };

  const getSlikTargetConfig = (target) => {
    const normalized = target === "penanggung" ? "penanggung" : "nasabah";
    return {
      target: normalized,
      label: normalized === "penanggung" ? "Penanggung Jawab" : "Nasabah",
      fileField: normalized === "penanggung" ? "slikPenanggungJawab" : "slik",
      clearField:
        normalized === "penanggung"
          ? "clearSlikPenanggungJawab"
          : "clearSlik",
    };
  };

  const handleDeletePermohonan = async (kredit) => {
    const noPermohonan = kredit?.no_permohonan;
    if (!noPermohonan) {
      Swal.fire("Gagal", "No permohonan tidak ditemukan.", "error");
      return;
    }

    const confirmDelete = await Swal.fire({
      title: "Hapus Permohonan?",
      text: `Data permohonan ${noPermohonan} akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#9ca3af",
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      Swal.fire({
        title: "Menghapus...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await axios.delete(API_ENDPOINTS.generate.noPermohonanDetail(noPermohonan));
      Swal.fire("Berhasil", "Permohonan berhasil dihapus.", "success");
      fetchDashboard();
    } catch (err) {
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal menghapus permohonan.",
        "error"
      );
    }
  };

  const handleDeleteSlik = async (kredit, target = "nasabah") => {
    const noPermohonan = kredit?.no_permohonan;
    if (!noPermohonan) {
      Swal.fire("Gagal", "No permohonan tidak ditemukan.", "error");
      return;
    }
    const config = getSlikTargetConfig(target);
    const hasLocalSlik =
      config.target === "nasabah" &&
      hasLocalSlikEntry(getLocalSlikEntry(noPermohonan));
    const hasServerSlik =
      config.target === "penanggung"
        ? Boolean(kredit?.hasServerSlikPenanggung)
        : Boolean(kredit?.hasServerSlikNasabah);
    if (!hasLocalSlik && !hasServerSlik) {
      Swal.fire("Info", "Data SLIK tidak ditemukan untuk dihapus.", "info");
      return;
    }

    const confirmDelete = await Swal.fire({
      title: "Hapus SLIK?",
      text: `Hasil upload SLIK ${config.label} (${noPermohonan}) akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#9ca3af",
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      Swal.fire({
        title: "Menghapus...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      if (hasServerSlik) {
        const payload = new FormData();
        payload.append(config.clearField, "1");
        await axios.patch(
          API_ENDPOINTS.datanasabah.dataDiri.detail(noPermohonan),
          payload
        );
      }
      if (config.target === "nasabah") {
        clearSlikStorage(noPermohonan);
      }
      Swal.fire("Berhasil", "Data SLIK berhasil dihapus.", "success");
      fetchDashboard();
    } catch (err) {
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal menghapus data SLIK.",
        "error"
      );
    }
  };

  const handleUploadSlik = async (kredit, target = "nasabah") => {
    const noPermohonan = kredit?.no_permohonan;
    if (!noPermohonan) {
      Swal.fire("Gagal", "No permohonan tidak ditemukan.", "error");
      return;
    }

    const config = getSlikTargetConfig(target);
    const hasSlikTarget =
      config.target === "penanggung"
        ? Boolean(kredit?.hasSlikPenanggung)
        : Boolean(kredit?.hasSlikNasabah);
    const isInitialUpload = !hasSlikTarget;
    const uploadPrompt = isInitialUpload
      ? `Data ${noPermohonan} sedang menunggu upload file SLIK ${config.label}.`
      : `Upload ulang file SLIK ${config.label} untuk ${noPermohonan}.`;

    const result = await Swal.fire({
      title: `Upload SLIK ${config.label} (TXT)`,
      text: uploadPrompt,
      input: "file",
      inputAttributes: {
        accept: ".txt,text/plain",
      },
      showCancelButton: true,
      confirmButtonText: isInitialUpload ? "Upload" : "Upload Ulang",
      cancelButtonText: "Batal",
      preConfirm: () => {
        const file = Swal.getInput()?.files?.[0];
        if (!file) {
          Swal.showValidationMessage("File TXT wajib dipilih.");
          return false;
        }
        if (!file.name.toLowerCase().endsWith(".txt")) {
          Swal.showValidationMessage("File harus berformat .txt.");
          return false;
        }
        return file;
      },
    });

    if (!result.isConfirmed || !result.value) return;

    const file = result.value;
    try {
      Swal.fire({
        title: "Memproses...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Gagal membaca file SLIK."));
        reader.readAsText(file);
      });
      const table = parseSlikText(text);
      if (!table.rows?.length) {
        Swal.fire("Gagal", "File SLIK kosong atau tidak terbaca.", "error");
        return;
      }
      const payload = new FormData();
      payload.append(config.fileField, file);
      await axios.patch(
        API_ENDPOINTS.datanasabah.dataDiri.detail(noPermohonan),
        payload
      );
      if (config.target === "nasabah") {
        clearSlikStorage(noPermohonan);
      }
      Swal.fire("Berhasil", "File SLIK berhasil diupload.", "success");
      fetchDashboard();
    } catch (err) {
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || err?.message || "Gagal mengupload file SLIK.",
        "error"
      );
    }
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
  const hasInputValue = (value) =>
    value !== undefined && value !== null && String(value).trim() !== "";

  const normalizeKantorValue = (value) => String(value ?? "").trim();
  const extractKantorFromNoPermohonan = (value) => {
    const parts = String(value ?? "").split("/");
    return parts.length > 1 ? parts[1] : "";
  };
  const getPermohonanKantor = (item) =>
    getFieldValue(item, ["kdkantor", "kd_kantor", "kodeKantor", "kode_kantor"]) ||
    getFieldValue(item?.User, ["kdkantor", "kd_kantor", "kodeKantor", "kode_kantor"]) ||
    extractKantorFromNoPermohonan(item?.no_permohonan);

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

  const isAdmin = userRole === "admin";
  const isKomiteCabang = userRole === "komitecabang";
  const isOfficer = userRole === "officer";
  const keputusanTitle =
    userRole === "penyelia"
      ? "Kesimpulan Dan rekomendasi Oleh Penyelia Cabang"
      : "Kesimpulan Dan rekomendasi Oleh Pimpinan Cabang";
  const isPenyelia = userRole === "penyelia";

  const getMonthKey = (dateValue) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = String(monthKey).split("-");
    if (!year || !month) return monthKey;
    const parsed = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(parsed.getTime())) return monthKey;
    return parsed.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  const adminSlikSuccess = listKredit.filter((item) => item.hasSlik).length;
  const adminSlikPending = listKredit.filter((item) => !item.hasSlik).length;
  const adminTotalSlik = adminSlikSuccess + adminSlikPending;

  const monthOptions = isAdmin
    ? Array.from(
        new Set(
          listKredit
            .map((item) => getMonthKey(item.createdAt))
            .filter(Boolean)
        )
      )
        .sort()
        .reverse()
    : [];

  useEffect(() => {
    if (userRole !== "admin") return;
    if (!listKredit.length) return;
    const pendingItems = listKredit.filter((item) => !item.hasSlik);
    if (!pendingItems.length) {
      pendingAlertRef.current = "";
      return;
    }
    const pendingIds = pendingItems
      .map((item) => item.no_permohonan)
      .filter(Boolean);
    if (!pendingIds.length) return;
    const key = pendingIds.join("|");
    if (pendingAlertRef.current === key) return;
    pendingAlertRef.current = key;
    const preview = pendingIds.slice(0, 5);
    const remaining = pendingIds.length - preview.length;
    const message = `Menunggu upload SLIK untuk: ${preview.join(", ")}${
      remaining > 0 ? `, +${remaining} lainnya` : ""
    }.`;
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Menunggu Upload SLIK",
      text: message,
      showConfirmButton: false,
      timer: 20000,
      timerProgressBar: true,
    });
  }, [listKredit, userRole]);

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
      const normalizedRole = String(roleValue).toLowerCase();
      const kantorValue =
        decoded?.kdkantor ||
        decoded?.kdKantor ||
        decoded?.kodeKantor ||
        decoded?.user?.kdkantor ||
        decoded?.user?.kdKantor ||
        decoded?.user?.kodeKantor ||
        "";
      const normalizedKantor = normalizeKantorValue(kantorValue);
      setUserRole(normalizedRole);
      setUserKantor(normalizedKantor);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      fetchDashboard(normalizedRole, normalizedKantor);
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

  const fetchDashboard = async (roleValue = userRole, kantorValue = userKantor) => {
    try {
      const normalizedRole = String(roleValue ?? "").toLowerCase();
      const normalizedKantor = normalizeKantorValue(kantorValue);
      const isAdminRole = normalizedRole === "admin";
      const emptyResponse = { data: { Data: [] } };
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
        isAdminRole
          ? Promise.resolve(emptyResponse)
          : axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
        isAdminRole
          ? Promise.resolve(emptyResponse)
          : axios.get(API_ENDPOINTS.datanasabah.dataUsaha.list()),
        isAdminRole
          ? Promise.resolve(emptyResponse)
          : axios.get(API_ENDPOINTS.datanasabah.dataInstansi.list()),
        axios.get(API_ENDPOINTS.datanasabah.dataJaminan.list()),
        isAdminRole
          ? Promise.resolve(emptyResponse)
          : axios.get(API_ENDPOINTS.datanasabah.dataAnalisis.list()),
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

      const rawListData = listRes.data.Data || [];
      const listData =
        isAdminRole && normalizedKantor
          ? rawListData.filter(
              (item) =>
                normalizeKantorValue(getPermohonanKantor(item)) ===
                normalizedKantor
            )
          : rawListData;
      const dataDiriList = normalizeList(dataDiriRes.data?.Data);
      const dataPermohonanList = normalizeList(dataPermohonanRes.data?.Data);
      const dataUsahaList = normalizeList(dataUsahaRes.data?.Data);
      const dataInstansiList = normalizeList(dataInstansiRes.data?.Data);
      const dataJaminanList = normalizeList(dataJaminanRes.data?.Data);
      const dataAnalisisList = normalizeList(dataAnalisisRes.data?.Data);
      const slikMap = new Map();
      dataDiriList.forEach((item) => {
        const noPermohonanKey = item.no_permohonan ?? item.noPermohonan;
        if (!noPermohonanKey) return;
        const slikInfo = getSlikInfoFromDataDiri(item);
        const hasNasabahServerSlik = Boolean(slikInfo.hasNasabahServerSlik);
        const hasPenanggungServerSlik = Boolean(
          slikInfo.hasPenanggungServerSlik
        );
        if (!hasNasabahServerSlik && !hasPenanggungServerSlik) return;
        slikMap.set(noPermohonanKey, {
          nasabahFileName: slikInfo.nasabahFileName,
          penanggungFileName: slikInfo.penanggungFileName,
          hasNasabahSlik: hasNasabahServerSlik,
          hasPenanggungSlik: hasPenanggungServerSlik,
          hasServerSlikNasabah: hasNasabahServerSlik,
          hasServerSlikPenanggung: hasPenanggungServerSlik,
          hasLocalSlikNasabah: false,
        });
      });
      if (isAdminRole) {
        listData.forEach((item) => {
          const noPermohonanKey = item.no_permohonan ?? item.noPermohonan;
          if (!noPermohonanKey) return;
          const localInfo = getLocalSlikInfo(noPermohonanKey);
          if (!localInfo.hasSlik) return;
          const existing = slikMap.get(noPermohonanKey);
          if (existing) {
            slikMap.set(noPermohonanKey, {
              ...existing,
              nasabahFileName:
                existing.nasabahFileName || localInfo.fileName || "",
              hasNasabahSlik: true,
              hasLocalSlikNasabah: true,
            });
          } else {
            slikMap.set(noPermohonanKey, {
              nasabahFileName: localInfo.fileName || "",
              penanggungFileName: "",
              hasNasabahSlik: true,
              hasPenanggungSlik: false,
              hasServerSlikNasabah: false,
              hasServerSlikPenanggung: false,
              hasLocalSlikNasabah: true,
            });
          }
        });
      }
      const nikByPermohonan = new Map(
        dataDiriList.map((item) => [
          item.no_permohonan ?? item.noPermohonan,
          item.nik ?? item.NIK,
        ])
      );
      const nikPenanggungByPermohonan = new Map(
        dataDiriList.map((item) => [
          item.no_permohonan ?? item.noPermohonan,
          getFieldValue(item, NIK_PENANGGUNG_KEYS),
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
      const analisisSet = new Set(
        dataAnalisisList.map((item) => item.no_permohonan ?? item.noPermohonan)
      );

      const normalizedList = listData.map((item) => {
        const noPermohonanKey = item.no_permohonan ?? item.noPermohonan;
        const permohonanData = permohonanMap.get(noPermohonanKey) || {};
        const slikInfo = slikMap.get(noPermohonanKey) || {
          nasabahFileName: "",
          penanggungFileName: "",
          hasNasabahSlik: false,
          hasPenanggungSlik: false,
          hasServerSlikNasabah: false,
          hasServerSlikPenanggung: false,
          hasLocalSlikNasabah: false,
        };
        const hasSlikNasabah = Boolean(slikInfo.hasNasabahSlik);
        const hasSlikPenanggung = Boolean(slikInfo.hasPenanggungSlik);
        const hasSlikComplete = hasSlikNasabah && hasSlikPenanggung;
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
          nikPenanggung: nikPenanggungByPermohonan.get(noPermohonanKey) || "",
          hasDataDiri,
          hasDataPermohonan,
          hasDataUsaha,
          hasDataInstansi,
          hasDataJaminan,
          hasDataAnalisis,
          hasDataFasilitas,
          permohonanData,
          jenisKreditLabel,
          caraPengembalianKredit: caraPengembalianMap.get(noPermohonanKey) || "",
          statusPengajuan: normalizeStatus(item.statusPengajuan),
          slikFileNameNasabah: slikInfo.nasabahFileName,
          slikFileNamePenanggung: slikInfo.penanggungFileName,
          hasSlik: hasSlikComplete,
          hasSlikNasabah,
          hasSlikPenanggung,
          hasServerSlikNasabah: Boolean(slikInfo.hasServerSlikNasabah),
          hasServerSlikPenanggung: Boolean(slikInfo.hasServerSlikPenanggung),
          hasLocalSlikNasabah: Boolean(slikInfo.hasLocalSlikNasabah),
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
    const nikPenanggung = String(item.nikPenanggung ?? "").toLowerCase();
    return (
      noPermohonan.includes(normalizedQuery) ||
      nik.includes(normalizedQuery) ||
      nikPenanggung.includes(normalizedQuery)
    );
  });

  const filteredKredit = searchedKredit.filter((item) => {
    if (isAdmin) {
      if (filterStatus === "PENDING" && item.hasSlik) return false;
      if (filterStatus === "SUCCESS" && !item.hasSlik) return false;
      if (filterMonth !== "ALL") {
        const monthKey = getMonthKey(item.createdAt);
        if (monthKey !== filterMonth) return false;
      }
      return true;
    }

    if (filterStatus === "ALL") return true;
    return item.statusPengajuan === filterStatus;
  });

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
    const penyeliaPlafonValue = getFieldValue(
      kredit,
      ["plafonPermohonanPenyelia", "plafon_permohonan_penyelia", "plafonPenyelia"],
      getFieldValue(
        permohonanData,
        ["plafonPermohonanPenyelia", "plafon_permohonan_penyelia"],
        ""
      )
    );
    const officerPlafonValue = getFieldValue(
      kredit,
      ["plafonPermohonan", "plafon_permohonan", "plafon"],
      permohonanData.plafonPermohonan || ""
    );
    const plafonValue = hasInputValue(penyeliaPlafonValue)
      ? penyeliaPlafonValue
      : officerPlafonValue;
    const penyeliaSukuBungaValue = getFieldValue(
      kredit,
      ["sukuBungaPenyelia", "suku_bunga_penyelia"],
      getFieldValue(
        permohonanData,
        ["sukuBungaPenyelia", "suku_bunga_penyelia"],
        ""
      )
    );
    const officerSukuBungaValue = getFieldValue(
      kredit,
      ["sukuBunga", "suku_bunga", "sukuBungaTahun", "suku_bunga_tahun"],
      permohonanData.sukuBungaTahun || ""
    );
    const sukuBungaValue = hasInputValue(penyeliaSukuBungaValue)
      ? penyeliaSukuBungaValue
      : officerSukuBungaValue;
    const penyeliaJenisPerhitunganValue = getFieldValue(
      kredit,
      ["jenisPerhitunganPenyelia", "jenis_perhitungan_penyelia"],
      getFieldValue(
        permohonanData,
        ["jenisPerhitunganPenyelia", "jenis_perhitungan_penyelia"],
        ""
      )
    );
    const officerJenisPerhitunganValue = getFieldValue(
      kredit,
      ["jenisPerhitungan", "jenis_perhitungan", "perhitunganBunga", "perhitungan_bunga"],
      permohonanData.perhitunganBunga || ""
    );
    const jenisPerhitunganValue = hasInputValue(penyeliaJenisPerhitunganValue)
      ? penyeliaJenisPerhitunganValue
      : officerJenisPerhitunganValue;
    const resolvedJenisPerhitungan =
      normalizeJenisPerhitungan(jenisPerhitunganValue) ||
      inferJenisPerhitungan(sukuBungaValue);
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
    setJenisPerhitungan(resolvedJenisPerhitungan);
    setCaraPengembalianKredit(caraPengembalianValue);
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
    const payload = {
      keteranganPengajuan: keterangan,
    };

    if (isKomiteCabang) {
      payload.statusPengajuan = toApiStatus(statusPengajuan);
      payload.statusPermohonan = statusPermohonan;
      payload.plafonPermohonan = plafonPermohonan;
      payload.sukuBunga = sukuBunga;
      payload.jenisPerhitungan = jenisPerhitungan;
      payload.caraPengembalianKredit = caraPengembalianKredit;
    } else if (isPenyelia) {
      payload.statusPermohonan = statusPermohonan;
      payload.plafonPermohonanPenyelia = sanitizeNumericValue(plafonPermohonan);
      payload.sukuBungaPenyelia = sanitizeNumericValue(sukuBunga);
      payload.jenisPerhitunganPenyelia = jenisPerhitungan;
    }

    await axios.patch(
      API_ENDPOINTS.generate.noPermohonanDetail(selectedKredit.no_permohonan),
      payload
    );
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

  const showKeputusan = !isOfficer && !isAdmin;
  const showEditData = !isKomiteCabang && !isAdmin;
  const showJenisKredit = isOfficer;
  const showDeletePermohonan = isOfficer;
  const canEditKeputusanAll = isKomiteCabang;
  const canEditKeputusanLimited = isPenyelia;
  const canEditKeputusan = canEditKeputusanAll || canEditKeputusanLimited;
  const tableColumnCount =
    6 +
    (showKeputusan ? 1 : 0) +
    (showEditData ? 1 : 0) +
    (showJenisKredit ? 1 : 0) +
    (showDeletePermohonan ? 1 : 0);
  const adminColumnCount = 6;

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
            <StatCard
              title="Total Aktivitas"
              value={isAdmin ? adminTotalSlik : stats.totalAktivitas}
              icon={<FaUsers />}
              color="indigo"
            />
            <StatCard
              title={isAdmin ? "SLIK yang Telah Di Upload" : "Kredit Aktif"}
              value={isAdmin ? adminSlikSuccess : stats.kreditAktif}
              icon={<FaFileInvoiceDollar />}
              color="green"
            />
            <StatCard
              title={isAdmin ? "SLIK yang belum di upload" : "Kredit Pengajuan"}
              value={isAdmin ? adminSlikPending : stats.kreditPengajuan}
              icon={<FaFileInvoiceDollar />}
              color="yellow"
            />
          </div>

          {/* FILTER */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Filter Status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <FilterButton
                    label="Semua"
                    active={filterStatus === "ALL"}
                    onClick={() => setFilterStatus("ALL")}
                  />
                  {isAdmin ? (
                    <>
                      <FilterButton
                        label="Pending"
                        active={filterStatus === "PENDING"}
                        onClick={() => setFilterStatus("PENDING")}
                      />
                      <FilterButton
                        label="Success"
                        active={filterStatus === "SUCCESS"}
                        onClick={() => setFilterStatus("SUCCESS")}
                      />
                    </>
                  ) : (
                    <>
                      <FilterButton
                        label="Kredit Aktif"
                        active={filterStatus === "Approve"}
                        onClick={() => setFilterStatus("Approve")}
                      />
                      <FilterButton
                        label="Proses Pengajuan"
                        active={filterStatus === "Pending"}
                        onClick={() => setFilterStatus("Pending")}
                      />
                      <FilterButton
                        label="Ditolak"
                        active={filterStatus === "Reject"}
                        onClick={() => setFilterStatus("Reject")}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-auto">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="w-full sm:w-72">
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
                  {isAdmin ? (
                    <div className="w-full sm:w-52">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Bulan
                      </label>
                      <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      >
                        <option value="ALL">Semua Bulan</option>
                        {monthOptions.map((monthKey) => (
                          <option key={monthKey} value={monthKey}>
                            {formatMonthLabel(monthKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              {isAdmin ? (
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Kode Antrian Permohonan
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-48">
                        Jenis Kredit
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        NIK
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
                        Tanggal Masuk
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-48">
                        Upload SLIK
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
                        Status Upload
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableKredit.length === 0 ? (
                      <tr>
                        <td
                          colSpan={adminColumnCount}
                          className="px-6 py-8 text-center text-gray-400"
                        >
                          Tidak ada data
                        </td>
                      </tr>
                    ) : (
                      tableKredit.map((item) => (
                        <tr
                          key={item.no_permohonan}
                          className="border-b even:bg-gray-50/60 hover:bg-indigo-50/40 transition-colors duration-200"
                        >
                          <td className="px-4 sm:px-6 py-3 font-semibold text-gray-800">
                            {item.no_permohonan}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                            {item.jenisKreditLabel || "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                            <div className="flex flex-col gap-1">
                              <span>Nasabah: {item.nik || "-"}</span>
                              <span className="text-[11px] text-gray-400">
                                Penanggung Jawab: {item.nikPenanggung || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 text-center">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="grid gap-2 text-left">
                              <div className="grid grid-cols-[84px_1fr] items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase text-slate-500">
                                  Nasabah
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUploadSlik(item, "nasabah")}
                                    className="inline-flex h-8 min-w-[130px] items-center justify-center gap-1 rounded-lg border border-indigo-200
                                    bg-indigo-100 px-3 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-200 transition"
                                  >
                                    {item.hasSlikNasabah ? "Ulang Nasabah" : "Upload Nasabah"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlik(item, "nasabah")}
                                    disabled={!item.hasSlikNasabah}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] transition ${
                                      item.hasSlikNasabah
                                        ? "border-error-200 bg-error-500 text-slate-700 hover:bg-red-200"
                                        : "border-error-200 bg-error-500 text-slate-400 cursor-not-allowed"
                                    }`}
                                    title="Hapus SLIK Nasabah"
                                    aria-label="Hapus SLIK Nasabah"
                                  >
                                    <FaTrash aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-[84px_1fr] items-center gap-2">
                                <span className="text-[10px] font-semibold uppercase text-slate-500">
                                  Penanggung
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUploadSlik(item, "penanggung")}
                                    className="inline-flex h-8 min-w-[130px] items-center justify-center gap-1 rounded-lg border border-indigo-200
                                    bg-indigo-100 px-3 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-200 transition"
                                  >
                                    {item.hasSlikPenanggung ? "Ulang Penanggung" : "Upload Penanggung"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSlik(item, "penanggung")}
                                    disabled={!item.hasSlikPenanggung}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] transition ${
                                      item.hasSlikPenanggung
                                        ? "border-error-200 bg-error-500 text-slate-700 hover:bg-red-200"
                                        : "border-error-200 bg-error-500 text-slate-400 cursor-not-allowed"
                                    }`}
                                    title="Hapus SLIK Penanggung"
                                    aria-label="Hapus SLIK Penanggung"
                                  >
                                    <FaTrash aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="grid gap-2">
                              <div className="grid grid-cols-[84px_auto] items-center justify-center gap-2">
                                <span className="text-[10px] font-semibold uppercase text-slate-500">
                                  Nasabah
                                </span>
                                {item.hasSlikNasabah ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    Success
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-[84px_auto] items-center justify-center gap-2">
                                <span className="text-[10px] font-semibold uppercase text-slate-500">
                                  Penanggung
                                </span>
                                {item.hasSlikPenanggung ? (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    Success
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : null}
              {!isAdmin && (
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
                    {showDeletePermohonan ? (
                      <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                        Aksi
                      </th>
                    ) : null}
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
                          <div className="flex flex-col gap-1">
                            <span>Nasabah: {item.nik || "-"}</span>
                            <span className="text-[11px] text-gray-400">
                              Penanggung Jawab: {item.nikPenanggung || "-"}
                            </span>
                          </div>
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
                                      navigate(
                                        `/master-data/data-diri/${encodeURIComponent(
                                          item.no_permohonan
                                        )}`
                                      );
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

                        {showDeletePermohonan ? (
                          <td className="px-4 sm:px-6 py-3 text-center">
                            <button
                              onClick={() => handleDeletePermohonan(item)}
                              title="Hapus permohonan"
                              aria-label="Hapus permohonan"
                              className="inline-flex items-center justify-center bg-error-500 w-9 h-9 rounded-lg text-sm font-semibold transition border border-error-200 bg-red-100 text-red-700 shadow-sm hover:bg-red-200 hover:border-red-300 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]"
                            >
                              <FaTrash aria-hidden="true" />
                            </button>
                          </td>
                        ) : null}
                      </tr>

                    ))
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ================= MODAL ACCEPT ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">
              {keputusanTitle}
            </h2>

            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={!canEditKeputusan}
              className="w-full border rounded-md p-2 mb-4 text-sm resize-none disabled:bg-gray-100 disabled:text-gray-500"
              rows={3}
              placeholder="Masukkan keterangan..."
            />

            <label className="block text-sm font-medium mb-1">Status Pengajuan</label>
            <select
              value={statusPengajuan}
              onChange={(e) => setStatusPengajuan(e.target.value)}
              disabled={!canEditKeputusanAll}
              className="w-full border rounded-md p-2 mb-6 text-sm disabled:bg-gray-100 disabled:text-gray-500"
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
              disabled={!canEditKeputusan}
              className="w-full border rounded-md p-2 mb-6 text-sm disabled:bg-gray-100 disabled:text-gray-500"
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
                  disabled={!canEditKeputusanAll}
                  className="w-full border rounded-md p-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jenis Perhitungan
                </label>
                <select
                  value={jenisPerhitungan}
                  onChange={(e) => setJenisPerhitungan(e.target.value)}
                  disabled={!canEditKeputusanAll}
                  className="w-full border rounded-md p-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Pilih</option>
                  <option value="Flat">Flat</option>
                  <option value="Anuitas">Anuitas</option>
                </select>
              </div>
            </div>

            <label className="block text-sm font-medium mb-1">
              Cara Pengembalian Kredit
            </label>
            <input
              type="text"
              value={caraPengembalianKredit}
              onChange={(e) => setCaraPengembalianKredit(e.target.value)}
              disabled={!canEditKeputusanAll}
              className="w-full border rounded-md p-2 mb-6 text-sm disabled:bg-gray-100 disabled:text-gray-500"
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
