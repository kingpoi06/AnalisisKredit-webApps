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

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";
const OCR_SPACE_API_KEY = "K83392095988957";
const OCR_SPACE_LANGUAGE = "eng";
const OCR_SPACE_ENGINE_PRIMARY = "2";
const OCR_SPACE_ENGINE_FALLBACK = "1";
const OCR_FIELD_MIN_SCORE = 6;

const normalizeOcrText = (text) => String(text ?? "").replace(/\r/g, "").trim();
const normalizeLine = (line) => String(line ?? "").replace(/\s+/g, " ").trim();
const getOcrLines = (text) =>
  normalizeOcrText(text)
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

const NAME_CUTOFF_KEYWORDS = [
  "TEMPAT",
  "TGL",
  "TTL",
  "LAHIR",
  "JENIS",
  "KELAMIN",
  "ALAMAT",
  "GOL",
  "DARAH",
];
const NAME_INVALID_TOKENS = [
  "TEMPAT",
  "TGL",
  "TTL",
  "LAHIR",
  "JENIS",
  "KELAMIN",
  "ALAMAT",
  "GOL",
  "DARAH",
  "AGAMA",
  "STATUS",
  "KEWARGANEGARAAN",
  "PEKERJAAN",
  "KEL",
  "DESA",
  "KECAMATAN",
  "KAB",
  "KOTA",
  "PROVINSI",
  "RT",
  "RW",
];
const ADDRESS_STOP_PREFIXES = [
  "RT/RW",
  "RT",
  "RW",
  "KEL",
  "DESA",
  "KELURAHAN",
  "KECAMATAN",
  "KAB",
  "KOTA",
  "PROVINSI",
  "AGAMA",
  "STATUS",
  "PEKERJAAN",
  "KEWARGANEGARAAN",
  "GOL",
  "DARAH",
  "NIK",
  "NAMA",
  "TEMPAT",
  "TGL",
  "TTL",
  "JENIS",
];

const hasAnyKeyword = (value, keywords) => {
  const upper = String(value ?? "").toUpperCase();
  return keywords.some((keyword) => upper.includes(keyword));
};

const startsWithAnyKeyword = (value, keywords) => {
  const normalized = String(value ?? "")
    .replace(/\s*\/\s*/g, "/")
    .trim()
    .toUpperCase();
  return keywords.some((keyword) => normalized.startsWith(keyword));
};

const normalizeLabelToken = (value) =>
  normalizeLine(value)
    .toUpperCase()
    .replace(/[0O]/g, "O")
    .replace(/[1I]/g, "I")
    .replace(/[5S]/g, "S")
    .replace(/[4A]/g, "A")
    .replace(/[7T]/g, "T");

const simplifyLabel = (value) =>
  normalizeLabelToken(value).replace(/[^A-Z/]/g, "");

const isRtRwLabel = (value) => {
  const simplified = simplifyLabel(value);
  if (simplified.includes("RTRW") || simplified.includes("RT/RW")) return true;
  return /R[TI1]\s*\/?\s*R[WV]/i.test(value);
};

const isKelDesaLabel = (value) => {
  const simplified = simplifyLabel(value);
  const relaxed = simplified.replace(/I/g, "L");
  return (
    simplified.startsWith("KELDESA") ||
    simplified.startsWith("KEL/DESA") ||
    simplified.startsWith("KELURAHAN") ||
    simplified.startsWith("DESA") ||
    relaxed.startsWith("KELDESA") ||
    relaxed.startsWith("KEL/DESA") ||
    relaxed.startsWith("KELURAHAN") ||
    relaxed.startsWith("DESA")
  );
};

const isJenisKelaminLabel = (value) => {
  const simplified = simplifyLabel(value);
  return /JENISK[ELI]{1,2}AMIN/.test(simplified);
};

const isAlamatLabel = (value) => {
  const simplified = simplifyLabel(value);
  return simplified.startsWith("ALAMAT") || simplified.startsWith("ALAMT");
};

const pickFirstMatch = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return "";
};

const stripAfterKeywords = (value, keywords) => {
  if (!value) return "";
  const upper = value.toUpperCase();
  let cutIndex = value.length;
  keywords.forEach((keyword) => {
    const idx = upper.indexOf(keyword);
    if (idx > 0 && idx < cutIndex) {
      cutIndex = idx;
    }
  });
  return value.slice(0, cutIndex).replace(/[,:-]+$/, "").trim();
};

const cleanNamaCandidate = (value) => {
  const cleaned = stripAfterKeywords(value, NAME_CUTOFF_KEYWORDS);
  const normalized = normalizeLine(cleaned);
  if (!normalized) return "";
  if (hasAnyKeyword(normalized, NAME_INVALID_TOKENS)) return "";
  if (/\d{3,}/.test(normalized)) return "";
  return normalized;
};

const getNextValueExcluding = (lines, startIndex, invalidTokens) => {
  for (let i = startIndex; i < lines.length; i += 1) {
    const candidate = normalizeLine(lines[i]);
    if (!candidate) continue;
    if (hasAnyKeyword(candidate, invalidTokens)) continue;
    if (/^\d+$/.test(candidate)) continue;
    return candidate;
  }
  return "";
};

const extractNamaLengkap = (lines, text) => {
  const patterns = [
    /NAMA LENGKAP\s*[:\-]?\s*([^\n]+)/i,
    /N\s*A\s*M\s*A\s*L\s*E\s*N\s*G\s*K\s*A\s*P\s*[:\-]?\s*([^\n]+)/i,
    /NAMA\s*[:\-]?\s*([^\n]+)/i,
    /N\s*A\s*M\s*A\s*[:\-]?\s*([^\n]+)/i,
    /N[4A]M[4A]\s*[:\-]?\s*([^\n]+)/i,
  ];
  const direct = cleanNamaCandidate(pickFirstMatch(text, patterns));
  if (direct) return direct;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/N[1I]K/.test(line) && /\d{10,}/.test(line)) {
      const candidate = cleanNamaCandidate(
        getNextValueExcluding(lines, i + 1, NAME_INVALID_TOKENS)
      );
      if (candidate) return candidate;
    }
  }

  return "";
};

const cleanAlamatCandidate = (value) => {
  const cleaned = stripAfterKeywords(value, [
    "RT/RW",
    "RT",
    "RW",
    "KEL",
    "DESA",
    "KECAMATAN",
    "KAB",
    "KOTA",
    "PROVINSI",
  ]);
  const normalized = normalizeLine(cleaned).replace(
    /^(ALAMAT|ALAMT|ALAMAI|ALAM4T)\s*[:\-]?\s*/i,
    ""
  );
  if (!normalized) return "";
  if (startsWithAnyKeyword(normalized, ADDRESS_STOP_PREFIXES)) return "";
  return normalized;
};

const extractAlamatLengkap = (lines, text) => {
  const labelPatterns = [
    /ALAMAT LENGKAP\s*[:\-]?\s*([^\n]*)/i,
    /ALAMAT\s*[:\-]?\s*([^\n]*)/i,
    /ALAMT\s*[:\-]?\s*([^\n]*)/i,
    /ALAMAI\s*[:\-]?\s*([^\n]*)/i,
    /ALAM4T\s*[:\-]?\s*([^\n]*)/i,
    /A\s*L\s*A\s*M\s*A\s*T\s*[:\-]?\s*([^\n]*)/i,
  ];
  const direct = cleanAlamatCandidate(pickFirstMatch(text, labelPatterns));
  if (direct) return direct;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = labelPatterns.find((pattern) => pattern.test(line));
    if (!match && !isAlamatLabel(line)) continue;
    const matchValue = match ? line.match(match) : null;
    const addressParts = [];
    const inlineValue = cleanAlamatCandidate(matchValue?.[1] || "");
    if (inlineValue) {
      addressParts.push(inlineValue);
    }
    for (let j = i + 1; j < lines.length; j += 1) {
      const nextLine = normalizeLine(lines[j]);
      if (!nextLine) continue;
      if (startsWithAnyKeyword(nextLine, ADDRESS_STOP_PREFIXES)) break;
      addressParts.push(nextLine);
    }
    const combined = normalizeLine(addressParts.join(" "));
    if (combined) return combined;
  }

  for (let i = 0; i < lines.length; i += 1) {
    let anchorIndex = -1;
    if (isRtRwLabel(lines[i])) {
      anchorIndex = i;
    } else if (
      /^\d{1,3}\s*[\/\-]\s*\d{1,3}/.test(lines[i]) &&
      i > 0 &&
      isRtRwLabel(lines[i - 1])
    ) {
      anchorIndex = i - 1;
    }
    if (anchorIndex === -1) continue;

    for (let j = anchorIndex - 1; j >= 0; j -= 1) {
      const candidate = normalizeLine(lines[j]);
      if (!candidate) continue;
      if (
        isAlamatLabel(candidate) ||
        isJenisKelaminLabel(candidate) ||
        isKelDesaLabel(candidate)
      ) {
        continue;
      }
      if (startsWithAnyKeyword(candidate, ADDRESS_STOP_PREFIXES)) break;
      const cleanedCandidate = cleanAlamatCandidate(candidate);
      if (cleanedCandidate) return cleanedCandidate;
      break;
    }
  }

  return "";
};

const extractNikFromText = (text) => {
  const direct = text.match(/N[1I]K\s*[:\-]?\s*([0-9]{16})/i);
  if (direct) return direct[1];

  const spaced = text.match(/N[1I]K\s*[:\-]?\s*([0-9\s]{16,20})/i);
  if (spaced) {
    const digits = spaced[1].replace(/\D/g, "");
    if (digits.length === 16) return digits;
  }

  const fallback = text.match(/\b\d{16}\b/);
  return fallback ? fallback[0] : "";
};

const normalizeJenisKelamin = (value) => {
  const cleaned = stripAfterKeywords(value, ["GOL", "DARAH"]);
  const upper = normalizeLabelToken(cleaned);
  if (upper.includes("PEREMPUAN") || upper.includes("WANITA")) {
    return "Perempuan";
  }
  if (upper.includes("LAKI") || upper.includes("PRIA") || upper.includes("LELAKI")) {
    return "Laki-laki";
  }
  return cleaned.trim();
};

const isGenderValue = (value) => {
  const upper = normalizeLabelToken(value);
  return /PEREMPUAN|WANITA|LAKI|PRIA|LELAKI/.test(upper);
};

const normalizeDateDigits = (value) =>
  String(value ?? "")
    .replace(/[Oo]/g, "0")
    .replace(/[Il]/g, "1")
    .replace(/S/g, "5");

const normalizeYearValue = (value) => {
  const trimmed = normalizeDateDigits(value).trim();
  if (!trimmed) return NaN;
  if (trimmed.length === 2) {
    const yearValue = Number(trimmed);
    if (!Number.isFinite(yearValue)) return NaN;
    return yearValue >= 30 ? 1900 + yearValue : 2000 + yearValue;
  }
  const yearValue = Number(trimmed);
  return Number.isFinite(yearValue) ? yearValue : NaN;
};

const formatTanggalLahir = (day, month, year) => {
  const dayValue = Number(normalizeDateDigits(day));
  const monthValue = Number(normalizeDateDigits(month));
  const yearValue =
    typeof year === "number" ? year : normalizeYearValue(year);
  if (
    !Number.isFinite(dayValue) ||
    !Number.isFinite(monthValue) ||
    !Number.isFinite(yearValue)
  ) {
    return "";
  }
  if (dayValue < 1 || dayValue > 31 || monthValue < 1 || monthValue > 12) {
    return "";
  }
  if (yearValue < 1900 || yearValue > 2100) return "";
  return `${yearValue}-${String(monthValue).padStart(2, "0")}-${String(
    dayValue
  ).padStart(2, "0")}`;
};

const findTanggalLahirInText = (value) => {
  if (!value) return null;
  const patterns = [
    /([0-9OIlS]{2})\s*[-/.]\s*([0-9OIlS]{2})\s*[-/.]\s*([0-9OIlS]{4})/i,
    /\b([0-9OIlS]{2})\s*([0-9OIlS]{2})\s*([0-9OIlS]{4})\b/i,
    /([0-9OIlS]{2})\s*[-/.]\s*([0-9OIlS]{2})\s*[-/.]\s*([0-9OIlS]{2})/i,
    /\b([0-9OIlS]{2})\s*([0-9OIlS]{2})\s*([0-9OIlS]{2})\b/i,
  ];

  for (const pattern of patterns) {
    const match = String(value).match(pattern);
    if (!match) continue;
    const [, day, month, year] = match;
    const formatted = formatTanggalLahir(day, month, year);
    if (formatted) {
      return { formatted, raw: match[0] };
    }
  }

  return null;
};

const TEMPAT_TGL_LINE_PATTERNS = [
  /TEMPAT\s*\/?\s*T(?:GL|G1|GI|OL|0L|G|CL|O1)?\s*LAH[I1]R\s*[:\-]?\s*(.*)/i,
  /TEMPAT\s+LAH[I1]R\s*[:\-]?\s*(.*)/i,
  /TGL\s*LAH[I1]R\s*[:\-]?\s*(.*)/i,
  /TANGGAL\s*LAH[I1]R\s*[:\-]?\s*(.*)/i,
  /TTL\s*[:\-]?\s*(.*)/i,
];

const extractTempatTanggalLahir = (lines, text) => {
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const matchedPattern = TEMPAT_TGL_LINE_PATTERNS.find((pattern) =>
      pattern.test(line)
    );
    if (!matchedPattern) continue;

    const match = line.match(matchedPattern);
    const inlineValue = normalizeLine(match?.[1] || "");
    const candidateValue =
      inlineValue ||
      normalizeLine(getNextValueExcluding(lines, i + 1, NAME_INVALID_TOKENS));

    const result = splitTempatTanggalLahir(candidateValue);
    if (result.tempatLahir || result.tanggalLahir) return result;
  }

  const fallbackRaw = pickFirstMatch(text, [
    /TEMPAT\/TGL LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TEMPAT\/TGL\s*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TEMPAT LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TEMPAT\s*TGL\s*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TGL\s*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TANGGAL\s*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TEMPAT.*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    /TTL\s*[:\-]?\s*([^\n]+)/i,
  ]);

  return splitTempatTanggalLahir(fallbackRaw);
};

const splitTempatTanggalLahir = (value) => {
  const cleaned = stripAfterKeywords(value, ["JENIS KELAMIN", "GOL"]);
  if (!cleaned) return { tempatLahir: "", tanggalLahir: "" };

  const dateMatch = findTanggalLahirInText(cleaned);
  if (!dateMatch) {
    return { tempatLahir: cleaned.trim(), tanggalLahir: "" };
  }

  const tanggalLahir = dateMatch.formatted;
  const tempatLahir = cleaned
    .replace(dateMatch.raw, "")
    .replace(/[,\s]+$/, "")
    .trim();

  return { tempatLahir, tanggalLahir };
};

const normalizeRtRwDigits = (value) => normalizeDateDigits(value);

const parseRtRwFromString = (value) => {
  if (!value) return null;
  const normalized = normalizeRtRwDigits(value);
  let match = normalized.match(/(\d{1,3})\s*[\/\-]\s*(\d{1,3})/);
  if (match) {
    return { rt: match[1], rw: match[2] };
  }
  match = normalized.match(/RT[^0-9]*([0-9]{1,3}).*RW[^0-9]*([0-9]{1,3})/i);
  if (match) {
    return { rt: match[1], rw: match[2] };
  }
  match = normalized.match(/\b(\d{2,3})\s+(\d{2,3})\b/);
  if (match) {
    return { rt: match[1], rw: match[2] };
  }
  return null;
};

const extractRtRw = (lines, text) => {
  const directMatch = text.match(
    /RT\s*\/\s*RW\s*[:\-]?\s*([0-9OIlS]{1,3})\s*[\/\-]\s*([0-9OIlS]{1,3})/i
  );
  if (directMatch) {
    return {
      rt: normalizeRtRwDigits(directMatch[1]),
      rw: normalizeRtRwDigits(directMatch[2]),
    };
  }
  const directAlt = text.match(
    /RT\s*[:\-]?\s*([0-9OIlS]{1,3}).*RW\s*[:\-]?\s*([0-9OIlS]{1,3})/i
  );
  if (directAlt) {
    return {
      rt: normalizeRtRwDigits(directAlt[1]),
      rw: normalizeRtRwDigits(directAlt[2]),
    };
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isRtRwLabel(line) || /RT\s*\/?\s*RW/i.test(line)) {
      const inlineParsed = parseRtRwFromString(line);
      if (inlineParsed) return inlineParsed;
      const nextLine = lines[i + 1] || "";
      const nextParsed = parseRtRwFromString(nextLine);
      if (nextParsed) return nextParsed;
    }
  }

  for (const line of lines) {
    if (/\d{1,3}\s*[\/\-]\s*\d{1,3}/.test(line) && !/\d{4}/.test(line)) {
      const parsed = parseRtRwFromString(line);
      if (parsed) return parsed;
    }
  }

  return { rt: "", rw: "" };
};

const cleanDesaCandidate = (value) => {
  const cleaned = stripAfterKeywords(value, [
    "KECAMATAN",
    "KAB",
    "KOTA",
    "PROVINSI",
  ]);
  const normalized = normalizeLine(cleaned).replace(
    /^(KEL\s*\/\s*DESA|KEL\/DESA|KELURAHAN|DESA)\s*[:\-]?\s*/i,
    ""
  );
  if (!normalized) return "";
  if (startsWithAnyKeyword(normalized, ADDRESS_STOP_PREFIXES)) return "";
  return normalized;
};

const extractDesaKelurahan = (lines, text) => {
  const patterns = [
    /KEL\s*\/\s*DESA\s*[:\-]?\s*([^\n]+)/i,
    /KEL\s+DESA\s*[:\-]?\s*([^\n]+)/i,
    /KEL\/DESA\s*[:\-]?\s*([^\n]+)/i,
    /KELURAHAN\s*[:\-]?\s*([^\n]+)/i,
    /DESA\s*[:\-]?\s*([^\n]+)/i,
  ];
  const direct = cleanDesaCandidate(pickFirstMatch(text, patterns));
  if (direct) return direct;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (isKelDesaLabel(line) || /KEL\s*\/?\s*DESA/i.test(line)) {
      const inlineValue = cleanDesaCandidate(pickFirstMatch(line, patterns));
      if (inlineValue) return inlineValue;
      const nextLine = lines[i + 1] || "";
      const nextValue = cleanDesaCandidate(nextLine);
      if (nextValue) return nextValue;
    }
  }

  return "";
};

const extractJenisKelamin = (lines, text) => {
  const patterns = [
    /JENIS KELAM[I1]N\s*[:\-]?\s*([^\n]+)/i,
    /JENIS\s*KELAM[I1]N\s*[:\-]?\s*([^\n]+)/i,
    /JENIS KEL\.?\s*[:\-]?\s*([^\n]+)/i,
  ];
  const direct = normalizeJenisKelamin(pickFirstMatch(text, patterns));
  if (direct && isGenderValue(direct)) return direct;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!isJenisKelaminLabel(line) && !/KELAM[I1]N/i.test(line)) continue;
    const inlineValue = normalizeJenisKelamin(pickFirstMatch(line, patterns));
    if (inlineValue && isGenderValue(inlineValue)) return inlineValue;
    const nextLine = lines[i + 1] || "";
    const nextValue = normalizeJenisKelamin(nextLine);
    if (nextValue && isGenderValue(nextValue)) return nextValue;
  }

  for (const line of lines) {
    if (/PEREMPUAN|WANITA|LAKI|PRIA/i.test(line)) {
      const candidate = normalizeJenisKelamin(line);
      if (candidate) return candidate;
    }
  }

  return "";
};

const extractKtpFieldsFromText = (text) => {
  const normalized = normalizeOcrText(text);
  if (!normalized) return {};
  const lines = getOcrLines(normalized);

  const nik = extractNikFromText(normalized);
  const namaLengkap = extractNamaLengkap(lines, normalized);
  const { tempatLahir, tanggalLahir } = extractTempatTanggalLahir(
    lines,
    normalized
  );
  let tanggalLahirValue = tanggalLahir;
  if (!tanggalLahirValue) {
    const tglOnlyRaw = pickFirstMatch(normalized, [
      /TGL\s*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
      /TANGGAL\s*LAH[I1]R\s*[:\-]?\s*([^\n]+)/i,
    ]);
    const dateFallback = findTanggalLahirInText(tglOnlyRaw || normalized);
    if (dateFallback?.formatted) {
      tanggalLahirValue = dateFallback.formatted;
    }
  }
  const jenisKelamin = extractJenisKelamin(lines, normalized);
  const agama = stripAfterKeywords(
    pickFirstMatch(normalized, [/AGAMA\s*[:\-]?\s*([^\n]+)/i]),
    ["STATUS", "PEKERJAAN"]
  );
  const statusPerkawinan = stripAfterKeywords(
    pickFirstMatch(normalized, [
      /STATUS PERKAW[I1]NAN\s*[:\-]?\s*([^\n]+)/i,
      /STATUS KAW[I1]N\s*[:\-]?\s*([^\n]+)/i,
    ]),
    ["PEKERJAAN", "KEWARGANEGARAAN"]
  );
  const jenispekerjaan = stripAfterKeywords(
    pickFirstMatch(normalized, [/PEKERJAAN\s*[:\-]?\s*([^\n]+)/i]),
    ["KEWARGANEGARAAN"]
  );
  const kewarganegaraan = pickFirstMatch(normalized, [
    /KEWARGANEGARAAN\s*[:\-]?\s*([^\n]+)/i,
  ]);
  const alamatLengkap = extractAlamatLengkap(lines, normalized);
  const { rt, rw } = extractRtRw(lines, normalized);
  const desaKelurahan = extractDesaKelurahan(lines, normalized);
  const kecamatan = pickFirstMatch(normalized, [
    /KECAMATAN\s*[:\-]?\s*([^\n]+)/i,
  ]);
  const kabupaten = pickFirstMatch(normalized, [
    /KABUPATEN\s*[:\-]?\s*([^\n]+)/i,
    /KAB\/KOTA\s*[:\-]?\s*([^\n]+)/i,
    /KOTA\s*[:\-]?\s*([^\n]+)/i,
  ]);
  const provinsi = pickFirstMatch(normalized, [
    /PROVINSI\s*[:\-]?\s*([^\n]+)/i,
  ]);

  return {
    nik,
    namaLengkap,
    tempatLahir,
    tanggalLahir: tanggalLahirValue,
    jenisKelamin,
    statusPerkawinan,
    agama,
    kewarganegaraan,
    jenispekerjaan,
    alamatLengkap,
    rt,
    rw,
    desaKelurahan,
    kecamatan,
    kabupaten,
    provinsi,
  };
};

const mergeIfPresent = (prev, updates) => {
  const next = { ...prev };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      next[key] = value;
    }
  });
  return next;
};

const readOcrSpaceText = (data) => {
  const errorMessage = data?.ErrorMessage;
  if (data?.IsErroredOnProcessing) {
    const message = Array.isArray(errorMessage)
      ? errorMessage.join(", ")
      : errorMessage;
    throw new Error(message || "OCR gagal diproses.");
  }

  const parsedText = (data?.ParsedResults || [])
    .map((item) => item?.ParsedText || "")
    .join("\n")
    .trim();

  if (!parsedText) {
    throw new Error("Hasil OCR kosong.");
  }

  return parsedText;
};

const requestOcrSpace = async (file, options = {}) => {
  const { language = OCR_SPACE_LANGUAGE, engine = OCR_SPACE_ENGINE_PRIMARY } =
    options;
  const formDataUpload = new FormData();
  formDataUpload.append("apikey", OCR_SPACE_API_KEY);
  formDataUpload.append("language", language);
  formDataUpload.append("isOverlayRequired", "false");
  formDataUpload.append("OCREngine", engine);
  formDataUpload.append("scale", "true");
  formDataUpload.append("detectOrientation", "true");
  formDataUpload.append("file", file);

  const response = await fetch(OCR_SPACE_ENDPOINT, {
    method: "POST",
    body: formDataUpload,
  });

  if (!response.ok) {
    throw new Error("Gagal menghubungi layanan OCR.");
  }

  return response.json();
};

const countFilledFields = (fields) =>
  Object.values(fields || {}).filter((value) =>
    String(value ?? "").trim()
  ).length;

const isStrongOcrResult = (fields) => {
  const score = countFilledFields(fields);
  if (score >= OCR_FIELD_MIN_SCORE) return true;
  return Boolean(fields?.nik && fields?.namaLengkap && fields?.tanggalLahir);
};

const runOcrSpaceWithFallback = async (file) => {
  const attempts = [
    { language: OCR_SPACE_LANGUAGE, engine: OCR_SPACE_ENGINE_PRIMARY },
    { language: OCR_SPACE_LANGUAGE, engine: OCR_SPACE_ENGINE_FALLBACK },
  ];
  let bestFields = {};
  let bestScore = 0;
  let lastError = null;

  for (const attempt of attempts) {
    try {
      const ocrResponse = await requestOcrSpace(file, attempt);
      const ocrText = readOcrSpaceText(ocrResponse);
      const parsedFields = extractKtpFieldsFromText(ocrText);
      const score = countFilledFields(parsedFields);
      if (score > bestScore) {
        bestScore = score;
        bestFields = parsedFields;
      }
      if (isStrongOcrResult(parsedFields)) {
        return parsedFields;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (bestScore > 0) return bestFields;
  throw lastError || new Error("Hasil OCR kosong.");
};


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

export default function DataDiriNasabah() {
  const navigate = useNavigate();
  const ktpRef = useRef(null);
  const ktpRefPasangan = useRef(null);
  const selfieRef = useRef(null);
  const { no_permohonan } = useParams();

  const [fotoKtp, setFotoKtp] = useState(null);
  const [fotoKtpPasangan, setFotoKtpPasangan] = useState(null);
  const [selfieKtp, setSelfieKtp] = useState(null);

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
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);
  

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
    Swal.fire({
      title: "Validasi KTP",
      text: "Sedang memproses data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const parsedFields = await runOcrSpaceWithFallback(fotoKtp);
    const hasData = Object.values(parsedFields).some((value) =>
      String(value ?? "").trim()
    );
    if (!hasData) {
      throw new Error("Hasil OCR belum terbaca. Coba foto ulang.");
    }

    setFormData((prev) => mergeIfPresent(prev, parsedFields));

    Swal.fire("Berhasil", "Data KTP berhasil divalidasi", "success");
  } catch (error) {
    Swal.fire(
      "Gagal",
      error?.message || "Validasi KTP gagal",
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
    Swal.fire({
      title: "Validasi KTP",
      text: "Sedang memproses data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const parsedFields = await runOcrSpaceWithFallback(fotoKtpPasangan);
    const pasanganFields = {
      nikPenanggungJawab: parsedFields.nik || "",
      namaPenanggungJawab: parsedFields.namaLengkap || "",
      pekerjaanPenanggungJawab: parsedFields.jenispekerjaan || "",
      tempatLahirPenanggungJawab: parsedFields.tempatLahir || "",
      tanggalLahirPenanggungJawab: parsedFields.tanggalLahir || "",
    };
    const hasData = Object.values(pasanganFields).some((value) =>
      String(value ?? "").trim()
    );
    if (!hasData) {
      throw new Error("Hasil OCR belum terbaca. Coba foto ulang.");
    }

    setFormData((prev) => mergeIfPresent(prev, pasanganFields));

    Swal.fire("Berhasil", "Data KTP berhasil divalidasi", "success");
  } catch (error) {
    Swal.fire(
      "Gagal",
      error?.message || "Validasi KTP gagal",
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

    if (!fotoKtp || !selfieKtp || !fotoKtpPasangan) {
      Swal.fire("Error", "Foto KTP & Selfie wajib diupload", "error");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    payload.append("fotoKTP", fotoKtp);
    payload.append("selfieKTP", selfieKtp);
    payload.append("fotoKTPPenanggungJawab", fotoKtpPasangan);

    try {
      Swal.showLoading();
      const response = await axios.post(API_ENDPOINTS.datanasabah.dataDiri.create(), payload);
      const savedNoPermohonan =
        response.data?.no_permohonan || response.data?.noPermohonan;
      if (!savedNoPermohonan) {
        Swal.fire("Gagal", "No permohonan tidak ditemukan dari server", "error");
        return;
      }
      Swal.fire("Berhasil", "Data Diri tersimpan", "success");
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
