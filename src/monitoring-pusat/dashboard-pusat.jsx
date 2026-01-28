import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import PageBackground from "../component/PageBackground";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaClipboardList, FaEye, FaUsers, FaUserShield } from "react-icons/fa";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { API_ENDPOINTS } from "../config/apiEndpoints";

const ROLE_KEYS = ["role", "jabatan", "level", "userRole", "user_role"];
const NAME_KEYS = [
  "namaLengkap",
  "nama_lengkap",
  "namalengkap",
  "name",
  "nama",
  "namaPegawai",
  "nama_pegawai",
];
const USERNAME_KEYS = ["username", "userName", "user_name", "email"];
const KD_PEGAWAI_KEYS = [
  "kdpegawai",
  "kd_pegawai",
  "kdPegawai",
  "kodePegawai",
  "kode_pegawai",
];
const KODE_PEGAWAI_KEYS = [
  "kodePegawai",
  "kode_pegawai",
  "kdPegawai",
  "kd_pegawai",
  "kdpegawai",
  "kd_pegawai",
  "nip",
  "NIP",
  "no",
  "No",
];
const NAMA_PEGAWAI_KEYS = [
  "Nama_Pegawai",
  "namaPegawai",
  "nama_pegawai",
  "namaLengkap",
  "nama_lengkap",
  "namalengkap",
  "Nama Pegawai",
  "name",
  "nama",
];
const JABATAN_PEGAWAI_KEYS = [
  "Nama_Jabatan",
  "jabatan",
  "namaJabatan",
  "nama_jabatan",
  "jabatanPegawai",
  "jabatan_pegawai",
];
const KODE_KANTOR_KEYS = [
  "kodeKantor",
  "kode_kantor",
  "kodekantor",
  "kdkantor",
  "kd_kantor",
  "kdKantor",
  "cabangKantor",
  "cabang_kantor",
  "kodeCabang",
  "kode_cabang",
  "kodeKantorCabang",
  "kode_kantor_cabang",
  "kodeCabangKantor",
  "kode_cabang_kantor",
  "kdCabang",
  "kd_cabang",
];
const CABANG_KANTOR_KEYS = [
  "cabangKantor",
  "cabang_kantor",
  "namaCabang",
  "nama_cabang",
  "namaKantor",
  "nama_kantor",
];
const NESTED_KODE_KANTOR_KEYS = [...KODE_KANTOR_KEYS, "kode", "id"];
const NESTED_CABANG_KANTOR_KEYS = [
  ...CABANG_KANTOR_KEYS,
  "nama",
  "name",
  "label",
  "kode",
  "id",
];
const CREATED_AT_KEYS = [
  "createdAt",
  "created_at",
  "tanggalDibuat",
  "tanggal_dibuat",
  "createdDate",
  "created_date",
];
const CREATOR_KEYS = [
  "kdPegawaiPengusul",
  "kd_pegawai_pengusul",
  "kdPengusul",
  "kd_pengusul",
  "kdPegawai",
  "kd_pegawai",
  "kdpegawai",
  "kodePegawai",
  "kode_pegawai",
  "createdBy",
  "created_by",
  "createdUser",
  "created_user",
  "inputBy",
  "input_by",
  "userInput",
  "user_input",
  "userId",
  "user_id",
  "idUser",
  "id_user",
  "username",
  "userName",
  "user_name",
  "email",
  "namaPengusul",
  "nama_pengusul",
  "namaAO",
  "nama_ao",
  "namaPetugas",
  "nama_petugas",
  "petugasInput",
  "petugas_input",
  "namaPegawai",
  "nama_pegawai",
  "namaUser",
  "nama_user",
];
const ALAMAT_KANTOR_KEYS = [
  "alamatKantor",
  "alamat_kantor",
  "alamatLengkap",
  "alamat_lengkap",
  "alamat",
];
const ROLE_LABELS = {
  officer: "Officer",
  komitecabang: "Komite Cabang",
  penyelia: "Penyelia",
  admin: "Admin",
  superadmin: "Superadmin",
  headofficer: "Head Officer",
};

const normalizeList = (data) => {
  if (!Array.isArray(data)) return data ? [data] : [];
  return Array.isArray(data[0]) ? data.flat() : data;
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

const normalizeRole = (value) =>
  String(value ?? "").toLowerCase().replace(/[_\s]+/g, "");

const normalizeKodeKantor = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "-") return "";
  const digits = raw.replace(/\D/g, "");
  if (digits && digits.length <= 3) {
    return digits.padStart(3, "0");
  }
  return raw.toLowerCase();
};

const formatRoleLabel = (value) => {
  if (!value) return "-";
  const normalized = normalizeRole(value);
  return ROLE_LABELS[normalized] || String(value).replace(/_/g, " ");
};

const formatDate = (date) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeCabangKantorValue = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return getFieldValue(value, NESTED_CABANG_KANTOR_KEYS);
  }
  return String(value);
};

const normalizeCabangName = (value) =>
  String(value ?? "").trim().toLowerCase();

const getCabangKantorValue = (user) => {
  const directValue = normalizeCabangKantorValue(
    getFieldValue(user, CABANG_KANTOR_KEYS)
  );
  return (
    directValue ||
    normalizeCabangKantorValue(user?.cabangKantor) ||
    normalizeCabangKantorValue(user?.kantor) ||
    normalizeCabangKantorValue(user?.cabang) ||
    normalizeCabangKantorValue(user?.office) ||
    normalizeCabangKantorValue(user?.branch) ||
    normalizeCabangKantorValue(user?.unit) ||
    ""
  );
};

const getKodeKantorValue = (user) =>
  getFieldValue(user, KODE_KANTOR_KEYS) ||
  getFieldValue(user?.kantor, NESTED_KODE_KANTOR_KEYS) ||
  getFieldValue(user?.cabang, NESTED_KODE_KANTOR_KEYS) ||
  getFieldValue(user?.office, NESTED_KODE_KANTOR_KEYS) ||
  getFieldValue(user?.branch, NESTED_KODE_KANTOR_KEYS) ||
  getFieldValue(user?.unit, NESTED_KODE_KANTOR_KEYS) ||
  "";

const buildUserRow = (user) => {
  const roleValue = getFieldValue(user, ROLE_KEYS);
  return {
    id: getFieldValue(user, [
      "id",
      "_id",
      "userId",
      "user_id",
      "kdpegawai",
      "kd_pegawai",
      "kdPegawai",
      "kodePegawai",
      "kode_pegawai",
    ]),
    name: getFieldValue(user, NAME_KEYS) || "-",
    username: getFieldValue(user, USERNAME_KEYS) || "-",
    role: normalizeRole(roleValue),
    roleLabel: formatRoleLabel(roleValue),
    kdPegawai: getFieldValue(user, KD_PEGAWAI_KEYS) || "-",
    kodeKantor: getKodeKantorValue(user) || "-",
    cabangKantor: getCabangKantorValue(user) || "-",
    alamatKantor: getFieldValue(user, ALAMAT_KANTOR_KEYS) || "-",
    createdAt: getFieldValue(user, CREATED_AT_KEYS),
  };
};

const isOfficerRole = (role) => String(role ?? "").includes("officer");
const isKomiteCabangRole = (role) =>
  String(role ?? "").includes("komitecabang");
const isPenyeliaRole = (role) => String(role ?? "").includes("penyelia");
const isAdminRole = (role) => String(role ?? "").includes("admin");
const isExcludedCabangRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "superadmin" || normalized === "headofficer";
};
const getEmptyCreateForm = () => ({
  name: "",
  username: "",
  email: "",
  role: "",
  jabatan: "",
  kdPegawai: "",
  kdkantor: "",
  cabangKantor: "",
  alamatKantor: "",
  telpKantor: "",
});

export default function DashboardPusat() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [monitoringList, setMonitoringList] = useState([]);
  const [cabangKantorList, setCabangKantorList] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    role: "",
    kdPegawai: "",
    kdkantor: "",
    cabangKantor: "",
    alamatKantor: "",
    telpKantor: "",
    password: "",
    confPassword: "",
  });
  const [createForm, setCreateForm] = useState(getEmptyCreateForm);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [showCabangModal, setShowCabangModal] = useState(false);
  const [selectedCabang, setSelectedCabang] = useState(null);

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
      const normalizedRole = normalizeRole(roleValue);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      if (normalizedRole !== "headofficer") {
        navigate("/dashboard");
        return;
      }

      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUsers();
      fetchCabangKantorList();
      fetchPegawaiList();
    } catch (err) {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!users.length) return;
    fetchMonitoringData();
  }, [users]);

  const normalizeStatusPengajuan = (status) => {
    if (!status) return "Pending";
    const normalized = String(status).toLowerCase();
    if (normalized.includes("approve") || normalized.includes("diterima")) {
      return "Approve";
    }
    if (normalized.includes("reject") || normalized.includes("ditolak")) {
      return "Reject";
    }
    if (normalized.includes("pending") || normalized.includes("proses")) {
      return "Pending";
    }
    return "Pending";
  };

  const normalizeLookupValue = (value) => {
    const cleaned = String(value ?? "").trim();
    if (!cleaned || cleaned === "-") return "";
    return cleaned.toLowerCase();
  };

  const userLookup = useMemo(() => {
    const byKdPegawai = new Map();
    const byId = new Map();
    const byUsername = new Map();
    const byEmail = new Map();
    const byName = new Map();

    const assign = (map, key, user) => {
      if (!key || map.has(key)) return;
      map.set(key, user);
    };

    users.forEach((user) => {
      if (isExcludedCabangRole(user?.role || user?.roleLabel)) return;
      const kdPegawai = normalizeLookupValue(user?.kdPegawai);
      const idValue = normalizeLookupValue(user?.id);
      const username = normalizeLookupValue(user?.username);
      const email = normalizeLookupValue(user?.email);
      const name = normalizeLookupValue(user?.name);

      assign(byKdPegawai, kdPegawai, user);
      assign(byId, idValue, user);
      assign(byUsername, username, user);
      assign(byEmail, email, user);
      assign(byName, name, user);
    });

    return { byKdPegawai, byId, byUsername, byEmail, byName };
  }, [users]);

  const resolveUserByKey = (value) => {
    const key = normalizeLookupValue(value);
    if (!key) return null;
    return (
      userLookup.byKdPegawai.get(key) ||
      userLookup.byId.get(key) ||
      userLookup.byUsername.get(key) ||
      userLookup.byEmail.get(key) ||
      userLookup.byName.get(key) ||
      null
    );
  };

  const userCabangMap = useMemo(() => {
    const map = new Map();
    users.forEach((user) => {
      if (isExcludedCabangRole(user?.role || user?.roleLabel)) return;
      const kode = normalizeKodeKantor(user?.kodeKantor);
      if (!kode) return;
      if (map.has(kode)) return;
      map.set(kode, {
        cabangKantor: user?.cabangKantor || "",
        alamatKantor: user?.alamatKantor || "",
      });
    });
    return map;
  }, [users]);

  const resolveCabangLabel = (kodeKantor, fallbackName) => {
    const normalizedKode = normalizeKodeKantor(kodeKantor);
    const userMatch = userCabangMap.get(normalizedKode);
    if (userMatch?.cabangKantor) return userMatch.cabangKantor;
    return fallbackName || String(kodeKantor ?? "").trim() || "-";
  };

  const resolveCabangAlamat = (kodeKantor, cabangName) => {
    const normalizedKode = normalizeKodeKantor(kodeKantor);
    const normalizedName = normalizeCabangName(cabangName);
    const userMatch = userCabangMap.get(normalizedKode);
    if (userMatch?.alamatKantor) return userMatch.alamatKantor;
    if (normalizedName) {
      const fallback = Array.from(userCabangMap.values()).find(
        (row) =>
          normalizeCabangName(row.cabangKantor) === normalizedName
      );
      if (fallback?.alamatKantor) return fallback.alamatKantor;
    }
    return "-";
  };

  const resolveCabangKey = (kodeKantor, cabangName) => {
    const normalizedKode = normalizeKodeKantor(kodeKantor);
    if (normalizedKode && userCabangMap.has(normalizedKode)) {
      return normalizedKode;
    }
    const normalizedName = normalizeCabangName(cabangName);
    if (!normalizedName) return "";
    for (const [key, row] of userCabangMap.entries()) {
      if (normalizeCabangName(row.cabangKantor) === normalizedName) {
        return key;
      }
    }
    return "";
  };

  const isSameCabang = (item, row) => {
    const kodeItem = normalizeKodeKantor(item?.kodeKantor);
    const kodeRow = normalizeKodeKantor(row?.kodeKantor);
    if (kodeItem && kodeRow && kodeItem === kodeRow) return true;
    const nameItem = String(item?.cabangKantor ?? "").trim().toLowerCase();
    const nameRow = String(row?.cabangKantor ?? "").trim().toLowerCase();
    return Boolean(nameItem && nameRow && nameItem === nameRow);
  };

  const getUserIdentifier = (user) => {
    const candidate = user?.kdPegawai || user?.id || user?.kdpegawai || "";
    const trimmed = String(candidate ?? "").trim();
    return trimmed && trimmed !== "-" ? trimmed : "";
  };

  const buildEditFormFromUser = (user) => ({
    name: user?.name && user.name !== "-" ? user.name : "",
    username: user?.username && user.username !== "-" ? user.username : "",
    role: user?.role || "",
    kdPegawai: user?.kdPegawai && user.kdPegawai !== "-" ? user.kdPegawai : "",
    kdkantor:
      user?.kodeKantor && user.kodeKantor !== "-" ? user.kodeKantor : "",
    cabangKantor:
      user?.cabangKantor && user.cabangKantor !== "-"
        ? user.cabangKantor
        : "",
    alamatKantor:
      user?.alamatKantor && user.alamatKantor !== "-"
        ? user.alamatKantor
        : "",
    telpKantor:
      user?.telpKantor && user.telpKantor !== "-"
        ? user.telpKantor
        : "",
    password: "",
    confPassword: "",
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.users.list());
      const payload =
        response.data?.Data ?? response.data?.data ?? response.data ?? [];
      const list = normalizeList(payload).map(buildUserRow);
      setUsers(list);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal mengambil data user.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitoringData = async () => {
    try {
      const [listRes, dataPermohonanRes] = await Promise.all([
        axios.get(API_ENDPOINTS.generate.noPermohonan()),
        axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
      ]);
      const listData = normalizeList(
        listRes.data?.Data ?? listRes.data?.data ?? listRes.data ?? []
      );
      const permohonanList = normalizeList(
        dataPermohonanRes.data?.Data ??
          dataPermohonanRes.data?.data ??
          dataPermohonanRes.data ??
          []
      );
      const permohonanMap = new Map(
        permohonanList.map((item) => [
          item.no_permohonan ?? item.noPermohonan,
          item,
        ])
      );
      const normalized = listData.map((item) => {
        const noPermohonan = item.no_permohonan ?? item.noPermohonan;
        const permohonanData = permohonanMap.get(noPermohonan) || {};
        const statusValue =
          item.statusPengajuan ??
          item.status_pengajuan ??
          permohonanData.statusPengajuan ??
          permohonanData.status_pengajuan ??
          "";
        const createdAt =
          getFieldValue(item, CREATED_AT_KEYS) ||
          getFieldValue(permohonanData, CREATED_AT_KEYS) ||
          item.createdAt ||
          permohonanData.createdAt ||
          "";
        const creatorValue =
          getFieldValue(item, CREATOR_KEYS) ||
          getFieldValue(permohonanData, CREATOR_KEYS) ||
          "";
        const creatorUser = resolveUserByKey(creatorValue);

        let kodeKantor =
          getFieldValue(item, KODE_KANTOR_KEYS) ||
          getFieldValue(permohonanData, KODE_KANTOR_KEYS) ||
          "";
        let cabangKantor =
          getFieldValue(item, CABANG_KANTOR_KEYS) ||
          getFieldValue(permohonanData, CABANG_KANTOR_KEYS) ||
          "";
        if (!kodeKantor && creatorUser?.kodeKantor) {
          kodeKantor = creatorUser.kodeKantor;
        }
        if (!cabangKantor && creatorUser?.cabangKantor) {
          cabangKantor = creatorUser.cabangKantor;
        }
        const normalizedKodeKantor = normalizeKodeKantor(kodeKantor);
        const cabangInfo = {
          kodeKantor: normalizedKodeKantor || kodeKantor,
          cabangKantor: resolveCabangLabel(kodeKantor, cabangKantor),
        };
        return {
          noPermohonan,
          statusPengajuan: normalizeStatusPengajuan(statusValue),
          createdAt,
          kodeKantor: cabangInfo.kodeKantor,
          cabangKantor: cabangInfo.cabangKantor,
        };
      });
      setMonitoringList(normalized);
    } catch (err) {
      console.error("FETCH MONITORING ERROR:", err);
    }
  };

  const buildCabangKantorRow = (item) => ({
    kodeKantor: getFieldValue(item, KODE_KANTOR_KEYS),
    cabangKantor: getFieldValue(item, CABANG_KANTOR_KEYS),
    alamatKantor: getFieldValue(item, ALAMAT_KANTOR_KEYS),
  });

  const fetchCabangKantorList = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.cabangKantor.list());
      const payload =
        response.data?.Data ?? response.data?.data ?? response.data ?? [];
      const list = normalizeList(payload)
        .map(buildCabangKantorRow)
        .filter((row) => row.kodeKantor || row.cabangKantor || row.alamatKantor);
      setCabangKantorList(list);
    } catch (err) {
      console.error("FETCH CABANG KANTOR ERROR:", err);
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal mengambil data cabang kantor.",
        "error"
      );
    }
  };

  const buildPegawaiRow = (item) => {
    const cabang =
      item?.cabangKantor ||
      item?.cabangkantor ||
      item?.kantor ||
      item?.cabang ||
      item?.office ||
      item?.branch ||
      item?.unit ||
      null;
    const kodeKantor = getFieldValue(item, KODE_KANTOR_KEYS);
    const resolvedCabang = resolveCabangByKode(kodeKantor);
    return {
      kodePegawai: getFieldValue(item, KODE_PEGAWAI_KEYS),
      namaPegawai: getFieldValue(item, NAMA_PEGAWAI_KEYS),
      jabatan: getFieldValue(item, JABATAN_PEGAWAI_KEYS),
      kodeKantor,
      cabangKantor:
        getFieldValue(cabang, CABANG_KANTOR_KEYS) ||
        resolvedCabang?.cabangKantor ||
        "",
      alamatKantor:
        getFieldValue(cabang, ALAMAT_KANTOR_KEYS) ||
        resolvedCabang?.alamatKantor ||
        "",
    };
  };

  const fetchPegawaiList = async () => {
    const endpoint = API_ENDPOINTS.pegawai?.list?.();
    if (!endpoint) {
      setPegawaiList([]);
      return;
    }
    try {
      const response = await axios.get(endpoint);
      const payload =
        response.data?.Data ?? response.data?.data ?? response.data ?? [];
      const list = normalizeList(payload)
        .map(buildPegawaiRow)
        .filter(
          (row) =>
            row.kodePegawai ||
            row.namaPegawai ||
            row.jabatan ||
            row.kodeKantor
        );
      setPegawaiList(list);
    } catch (err) {
      console.error("FETCH PEGAWAI ERROR:", err);
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal mengambil data pegawai.",
        "error"
      );
    }
  };

  const resolveCabangByKode = (kodeKantor) => {
    const target = String(kodeKantor ?? "").trim().toLowerCase();
    if (!target) return null;
    return (
      cabangKantorList.find(
        (row) =>
          String(row.kodeKantor ?? "").trim().toLowerCase() === target
      ) || null
    );
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm(buildEditFormFromUser(user));
    setShowEditModal(true);
  };

  const handleEditChange = (field) => (event) => {
    const value = event.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateChange = (field) => (event) => {
    const value = event.target.value;
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleKodeKantorChange = (formSetter) => (event) => {
    const value = event.target.value;
    const selected = resolveCabangByKode(value);
    formSetter((prev) => ({
      ...prev,
      kdkantor: value,
      cabangKantor: selected?.cabangKantor || "",
      alamatKantor: selected?.alamatKantor || "",
    }));
  };

  const handlePegawaiSelect = (pegawai) => {
    if (!pegawai) return;
    const kodePegawai = String(pegawai.kodePegawai ?? "").trim();
    setCreateForm((prev) => ({
      ...prev,
      kdPegawai: kodePegawai,
      name: pegawai.namaPegawai || "",
      jabatan: pegawai.jabatan || "",
      kdkantor: pegawai.kodeKantor || "",
      cabangKantor: pegawai.cabangKantor || "",
      alamatKantor: pegawai.alamatKantor || "",
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const userId = getUserIdentifier(editingUser);
    if (!userId) {
      Swal.fire("Gagal", "ID user tidak ditemukan.", "error");
      return;
    }

    const payload = {};
    if (editForm.name.trim()) payload.namalengkap = editForm.name.trim();
    if (editForm.username.trim()) payload.username = editForm.username.trim();
    if (editForm.role) payload.role = editForm.role;
    if (editForm.kdPegawai.trim()) {
      payload.kdpegawai = editForm.kdPegawai.trim();
    }
    if (editForm.kdkantor.trim()) {
      payload.kdkantor = editForm.kdkantor.trim();
    }
    if (editForm.cabangKantor.trim()) {
      payload.cabangKantor = editForm.cabangKantor.trim();
    }
    if (editForm.alamatKantor.trim()) {
      payload.alamatKantor = editForm.alamatKantor.trim();
    }
    if (editForm.telpKantor.trim()) {
      payload.telpKantor = editForm.telpKantor.trim();
    }
    const passwordValue = editForm.password.trim();
    const confPasswordValue = editForm.confPassword.trim();
    if (passwordValue || confPasswordValue) {
      if (!passwordValue || !confPasswordValue) {
        Swal.fire(
          "Gagal",
          "Password dan Konfirmasi Password wajib diisi.",
          "error"
        );
        return;
      }
      if (passwordValue !== confPasswordValue) {
        Swal.fire(
          "Gagal",
          "Password dan Konfirmasi Password tidak cocok.",
          "error"
        );
        return;
      }
      payload.password = passwordValue;
      payload.confPassword = confPasswordValue;
    }

    if (!Object.keys(payload).length) {
      Swal.fire("Perhatian", "Tidak ada perubahan untuk disimpan.", "warning");
      return;
    }

    const confirmSave = await Swal.fire({
      title: "Simpan Perubahan?",
      text: "Data user akan diperbarui.",
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
      const hasPassword = Boolean(payload.password);
      const endpoint = hasPassword
        ? API_ENDPOINTS.users.updateAll(userId)
        : API_ENDPOINTS.users.updateProfile(userId);
      await axios.patch(endpoint, payload);
      Swal.fire("Berhasil", "Data user berhasil diperbarui.", "success");
      fetchUsers();
      setShowEditModal(false);
    } catch (err) {
      console.error("ERROR UPDATE USER:", err);
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal memperbarui data user.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    const userId = getUserIdentifier(user);
    if (!userId) {
      Swal.fire("Gagal", "ID user tidak ditemukan.", "error");
      return;
    }

    const confirmDelete = await Swal.fire({
      title: "Hapus User?",
      text: "Data user akan dihapus permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#9ca3af",
    });
    if (!confirmDelete.isConfirmed) return;

    try {
      setDeletingId(userId);
      Swal.fire({
        title: "Menghapus...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await axios.delete(API_ENDPOINTS.users.delete(userId));
      Swal.fire("Berhasil", "User berhasil dihapus.", "success");
      fetchUsers();
    } catch (err) {
      console.error("ERROR DELETE USER:", err);
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal menghapus user.",
        "error"
      );
    } finally {
      setDeletingId("");
    }
  };

  const openCreateModal = () => {
    setCreateForm(getEmptyCreateForm());
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    const requiredFields = [
      { key: "name", label: "Nama Lengkap" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "jabatan", label: "Jabatan" },
      { key: "kdPegawai", label: "Kode Pegawai" },
      { key: "kdkantor", label: "Kode Kantor" },
    ];
    const missing = requiredFields
      .filter(({ key }) => !String(createForm[key] ?? "").trim())
      .map(({ label }) => label);
    if (missing.length) {
      Swal.fire(
        "Gagal",
        `Field wajib diisi: ${missing.join(", ")}`,
        "error"
      );
      return;
    }

    const confirmCreate = await Swal.fire({
      title: "Tambah User?",
      text: "Akun baru akan dibuat.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Tambah",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#9ca3af",
    });
    if (!confirmCreate.isConfirmed) return;

    const payload = {
      kdpegawai: createForm.kdPegawai.trim(),
      username: createForm.username.trim(),
      namalengkap: createForm.name.trim(),
      jabatan: createForm.jabatan.trim(),
      kdkantor: createForm.kdkantor.trim(),
      email: createForm.email.trim(),
      role: createForm.role,
    };

    if (createForm.cabangKantor.trim()) {
      payload.cabangKantor = createForm.cabangKantor.trim();
    }
    if (createForm.alamatKantor.trim()) {
      payload.alamatKantor = createForm.alamatKantor.trim();
    }
    if (createForm.telpKantor.trim()) {
      payload.telpKantor = createForm.telpKantor.trim();
    }

    try {
      setCreating(true);
      Swal.fire({
        title: "Menyimpan...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await axios.post(API_ENDPOINTS.users.create(), payload);
      Swal.fire("Berhasil", "User berhasil ditambahkan.", "success");
      fetchUsers();
      setShowCreateModal(false);
      setCreateForm(getEmptyCreateForm());
    } catch (err) {
      console.error("ERROR CREATE USER:", err);
      Swal.fire(
        "Gagal",
        err.response?.data?.msg || "Gagal menambahkan user.",
        "error"
      );
    } finally {
      setCreating(false);
    }
  };

  const officerCount = useMemo(
    () => users.filter((user) => isOfficerRole(user.role)).length,
    [users]
  );
  const komiteCabangCount = useMemo(
    () => users.filter((user) => isKomiteCabangRole(user.role)).length,
    [users]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    if (filterRole === "OFFICER") return isOfficerRole(user.role);
    if (filterRole === "KOMITECABANG") return isKomiteCabangRole(user.role);
    if (filterRole === "PENYELIA") return isPenyeliaRole(user.role);
    if (filterRole === "ADMIN") return isAdminRole(user.role);
    if (filterRole === "SUPERADMIN") return user.role === "superadmin";
    return true;
  });

  const searchedUsers = filteredUsers.filter((user) => {
    if (!normalizedQuery) return true;
    const haystack = [
      user.name,
      user.username,
      user.roleLabel,
      user.kdPegawai,
      user.kodeKantor,
      user.cabangKantor,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const kantorOptions = useMemo(
    () =>
      cabangKantorList
        .map((row) => {
          const kode = row.kodeKantor || "";
          if (!kode) return null;
          const label = row.cabangKantor ? `${kode} - ${row.cabangKantor}` : kode;
          return { value: kode, label };
        })
        .filter(Boolean),
    [cabangKantorList]
  );
  const pegawaiOptions = useMemo(
    () =>
      pegawaiList
        .map((pegawai) => {
          const kode = String(pegawai.kodePegawai ?? "").trim();
          if (!kode) return null;
          const nama = String(pegawai.namaPegawai ?? "").trim();
          const label = `${kode} - ${nama || "-"}`;
          return { value: kode, label, pegawai };
        })
        .filter(Boolean),
    [pegawaiList]
  );
  const roleOptions = useMemo(
    () => [
      { value: "officer", label: "Officer" },
      { value: "komitecabang", label: "Komite Cabang" },
      { value: "penyelia", label: "Penyelia" },
      { value: "admin", label: "Admin" },
      { value: "superadmin", label: "Superadmin" },
      { value: "headofficer", label: "Head Officer" },
    ],
    []
  );

  const parseDateValue = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const getMonthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

  const formatMonthLabel = (key) => {
    if (!key) return "";
    const [yearRaw, monthRaw] = String(key).split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    if (!year || !month) return key;
    const date = new Date(year, month - 1, 1);
    if (Number.isNaN(date.getTime())) return key;
    return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  const buildMonthRange = (startKey, endKey) => {
    if (!startKey || !endKey) return [];
    const [startYear, startMonth] = String(startKey).split("-").map(Number);
    const [endYear, endMonth] = String(endKey).split("-").map(Number);
    if (!startYear || !startMonth || !endYear || !endMonth) return [];
    const months = [];
    let year = startYear;
    let month = startMonth;
    while (year < endYear || (year === endYear && month <= endMonth)) {
      months.push(`${year}-${String(month).padStart(2, "0")}`);
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return months;
  };

  const monthOptions = useMemo(() => {
    const months = new Set();
    monitoringList.forEach((item) => {
      const date = parseDateValue(item.createdAt);
      if (!date) return;
      months.add(getMonthKey(date));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [monitoringList]);

  const filteredMonitoringList =
    monthFilter === "ALL"
      ? monitoringList
      : monitoringList.filter((item) => {
          const date = parseDateValue(item.createdAt);
          if (!date) return false;
          return getMonthKey(date) === monthFilter;
        });

  const branchStats = useMemo(() => {
    const map = new Map();
    userCabangMap.forEach((row, kode) => {
      const label = row.cabangKantor || kode || "Cabang";
      const key = kode || label;
      if (!map.has(key)) {
        map.set(key, {
          kodeKantor: kode,
          cabangKantor: label,
          approve: 0,
          reject: 0,
          pending: 0,
          total: 0,
        });
      }
    });

    filteredMonitoringList.forEach((item) => {
      const key = resolveCabangKey(item.kodeKantor, item.cabangKantor);
      if (!key) return;
      const label = resolveCabangLabel(key, item.cabangKantor);
      const entry =
        map.get(key) || {
          kodeKantor: key,
          cabangKantor: label,
          approve: 0,
          reject: 0,
          pending: 0,
          total: 0,
        };
      const status = normalizeStatusPengajuan(item.statusPengajuan);
      if (status === "Approve") entry.approve += 1;
      else if (status === "Reject") entry.reject += 1;
      else entry.pending += 1;
      entry.total += 1;
      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredMonitoringList, userCabangMap]);

  const statusTotals = useMemo(() => {
    return branchStats.reduce(
      (acc, item) => {
        acc.approve += item.approve;
        acc.reject += item.reject;
        acc.pending += item.pending;
        acc.total += item.total;
        return acc;
      },
      { approve: 0, reject: 0, pending: 0, total: 0 }
    );
  }, [branchStats]);

  const performanceStats = useMemo(() => {
    const candidates = branchStats.filter((item) => item.total > 0);
    if (!candidates.length) return { top: null, bottom: null };
    const withRate = candidates.map((item) => ({
      ...item,
      approveRate: item.total ? item.approve / item.total : 0,
    }));
    const sorted = [...withRate].sort((a, b) => b.approveRate - a.approveRate);
    return {
      top: sorted[0],
      bottom: sorted[sorted.length - 1],
    };
  }, [branchStats]);

  const barChartData = useMemo(
    () =>
      branchStats
        .filter((item) => item.total > 0)
        .map((item) => ({
          cabang: item.cabangKantor,
          Approve: item.approve,
          Reject: item.reject,
          Pending: item.pending,
        })),
    [branchStats]
  );
  const barChartPadding = useMemo(() => {
    const count = barChartData.length;
    if (count <= 2) return 0.6;
    if (count <= 4) return 0.5;
    return 0.35;
  }, [barChartData]);
  const barChartBottomMargin = useMemo(() => {
    const longest = barChartData.reduce((max, item) => {
      const label = String(item.cabang ?? "");
      return Math.max(max, label.length);
    }, 0);
    if (isMobile) return longest > 20 ? 105 : 90;
    if (longest > 34) return 110;
    if (longest > 24) return 95;
    return 80;
  }, [barChartData, isMobile]);
  const barChartMargin = useMemo(
    () => ({
      top: 20,
      right: isMobile ? 10 : 20,
      bottom: barChartBottomMargin,
      left: isMobile ? 48 : 60,
    }),
    [barChartBottomMargin, isMobile]
  );
  const formatCabangTick = (value) => {
    const label = String(value ?? "");
    const maxLength = isMobile ? 18 : 28;
    if (label.length > maxLength) return `${label.slice(0, maxLength)}...`;
    return label;
  };
  const lineChartMargin = useMemo(
    () =>
      isMobile
        ? { top: 10, right: 10, bottom: 50, left: 45 }
        : { top: 20, right: 20, bottom: 50, left: 60 },
    [isMobile]
  );
  const lineChartLegends = useMemo(
    () =>
      isMobile
        ? [
            {
              anchor: "bottom",
              direction: "row",
              translateY: 40,
              itemWidth: 70,
              itemHeight: 14,
              symbolSize: 10,
              symbolShape: "circle",
            },
          ]
        : [
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 90,
              itemWidth: 80,
              itemHeight: 16,
              symbolSize: 10,
              symbolShape: "circle",
            },
          ],
    [isMobile]
  );
  const pieChartMargin = useMemo(
    () =>
      isMobile
        ? { top: 10, right: 10, bottom: 40, left: 10 }
        : { top: 10, right: 80, bottom: 10, left: 80 },
    [isMobile]
  );
  const pieChartLegends = useMemo(
    () =>
      isMobile
        ? [
            {
              anchor: "bottom",
              direction: "row",
              translateY: 34,
              itemWidth: 70,
              itemHeight: 16,
              symbolSize: 10,
              symbolShape: "circle",
            },
          ]
        : [
            {
              anchor: "right",
              direction: "column",
              translateX: 60,
              itemWidth: 80,
              itemHeight: 18,
              symbolSize: 12,
              symbolShape: "circle",
            },
          ],
    [isMobile]
  );

  const lineChartData = useMemo(() => {
    const map = new Map();
    filteredMonitoringList.forEach((item) => {
      const date = parseDateValue(item.createdAt);
      if (!date) return;
      const key = getMonthKey(date);
      const entry = map.get(key) || { approve: 0, reject: 0 };
      const status = normalizeStatusPengajuan(item.statusPengajuan);
      if (status === "Approve") entry.approve += 1;
      if (status === "Reject") entry.reject += 1;
      map.set(key, entry);
    });
    if (!map.size) return [];
    const keys = Array.from(map.keys()).sort();
    const months = buildMonthRange(keys[0], keys[keys.length - 1]);
    const approveData = months.map((key) => ({
      x: formatMonthLabel(key),
      y: map.get(key)?.approve ?? 0,
    }));
    const rejectData = months.map((key) => ({
      x: formatMonthLabel(key),
      y: map.get(key)?.reject ?? 0,
    }));
    return [
      { id: "Approve", data: approveData },
      { id: "Reject", data: rejectData },
    ];
  }, [filteredMonitoringList]);

  const donutChartData = useMemo(
    () => [
      { id: "Approve", label: "Approve", value: statusTotals.approve },
      { id: "Reject", label: "Reject", value: statusTotals.reject },
      { id: "Pending", label: "Pending", value: statusTotals.pending },
    ],
    [statusTotals]
  );

  const totalCabangValue = userCabangMap.size || branchStats.length || 0;

  const topCabangLabel = performanceStats.top
    ? `${performanceStats.top.cabangKantor} (${Math.round(
        performanceStats.top.approveRate * 100
      )}%)`
    : "-";
  const bottomCabangLabel = performanceStats.bottom
    ? `${performanceStats.bottom.cabangKantor} (${Math.round(
        performanceStats.bottom.approveRate * 100
      )}%)`
    : "-";

  const cabangTableRows = useMemo(() => {
    const map = new Map();
    userCabangMap.forEach((row, kode) => {
      const cabangName = row.cabangKantor || kode || "Cabang";
      const key = kode || cabangName;
      if (!map.has(key)) {
        map.set(key, {
          kodeKantor: kode,
          cabangKantor: cabangName,
          alamatKantor: row.alamatKantor || "-",
          approve: 0,
          reject: 0,
          pending: 0,
          total: 0,
        });
      }
    });

    filteredMonitoringList.forEach((item) => {
      const kode = item.kodeKantor || "";
      const cabangName = resolveCabangLabel(kode, item.cabangKantor);
      const key = resolveCabangKey(kode, cabangName);
      if (!key) return;
      const entry =
        map.get(key) || {
          kodeKantor: key,
          cabangKantor: resolveCabangLabel(key, cabangName),
          alamatKantor: resolveCabangAlamat(key, cabangName),
          approve: 0,
          reject: 0,
          pending: 0,
          total: 0,
        };
      const status = normalizeStatusPengajuan(item.statusPengajuan);
      if (status === "Approve") entry.approve += 1;
      else if (status === "Reject") entry.reject += 1;
      else entry.pending += 1;
      entry.total += 1;
      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.cabangKantor ?? "").localeCompare(String(b.cabangKantor ?? ""))
    );
  }, [filteredMonitoringList, userCabangMap]);

  const normalizedCabangQuery = searchQuery.trim().toLowerCase();
  const searchedCabangRows = cabangTableRows.filter((row) => {
    if (!normalizedCabangQuery) return true;
    const haystack = [
      row.kodeKantor,
      row.cabangKantor,
      row.alamatKantor,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedCabangQuery);
  });

  const cabangModalData = useMemo(() => {
    if (!selectedCabang) return { rows: [], total: 0, approve: 0, reject: 0, pending: 0 };
    const summary = {
      total: selectedCabang.total || 0,
      approve: selectedCabang.approve || 0,
      reject: selectedCabang.reject || 0,
      pending: selectedCabang.pending || 0,
    };
    const map = new Map();
    filteredMonitoringList.forEach((item) => {
      if (!isSameCabang(item, selectedCabang)) return;
      const date = parseDateValue(item.createdAt);
      if (!date) return;
      const key = getMonthKey(date);
      const entry = map.get(key) || { approve: 0, reject: 0, pending: 0 };
      const status = normalizeStatusPengajuan(item.statusPengajuan);
      if (status === "Approve") entry.approve += 1;
      else if (status === "Reject") entry.reject += 1;
      else entry.pending += 1;
      map.set(key, entry);
    });
    if (!map.size) return { rows: [], ...summary };
    const keys = Array.from(map.keys()).sort();
    const months = buildMonthRange(keys[0], keys[keys.length - 1]);
    const rows = months.map((key) => {
      const entry = map.get(key) || { approve: 0, reject: 0, pending: 0 };
      const total = entry.approve + entry.reject + entry.pending;
      return {
        month: formatMonthLabel(key),
        ...entry,
        total,
      };
    });
    return { rows, ...summary };
  }, [selectedCabang, filteredMonitoringList]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <PageBackground>
      <Sidebar />
      <div className="w-full md:ml-64 md:w-[calc(100%-16rem)]">
        <Header />
        <main className="pt-20 px-4 pb-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                <FaUserShield />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Monitoring Cabang</h1>
                <p className="text-sm text-gray-500">
                  Kinerja persetujuan kredit per cabang
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <StatCard
              title="Total Cabang"
              value={totalCabangValue}
              icon={<FaUsers />}
              color="indigo"
            />
            <StatCard
              title="Total Permohonan"
              value={statusTotals.total}
              icon={<FaUsers />}
              color="emerald"
            />
            <StatCard
              title="Cabang Tertinggi"
              value={topCabangLabel}
              icon={<FaUserShield />}
              color="amber"
            />
            <StatCard
              title="Cabang Terendah"
              value={bottomCabangLabel}
              icon={<FaUserShield />}
              color="rose"
            />
          </div>

          <div className="grid gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Perbandingan Kinerja Cabang
                  </h2>
                  <p className="text-xs text-gray-500">
                    Approve vs Reject vs Pending
                  </p>
              </div>
            </div>
              <div className="w-full overflow-hidden">
                <div className="w-full min-w-0 h-60 sm:h-80">
                  {barChartData.length ? (
                    <ResponsiveBar
                      data={barChartData}
                      keys={["Approve", "Reject", "Pending"]}
                      indexBy="cabang"
                      margin={barChartMargin}
                      padding={barChartPadding}
                      colors={{ scheme: "set2" }}
                      axisBottom={{
                        tickRotation: isMobile ? -35 : -20,
                        tickSize: 5,
                        tickPadding: isMobile ? 6 : 8,
                        legend: "",
                        format: formatCabangTick,
                      }}
                      axisLeft={{
                        tickSize: 4,
                        tickPadding: 6,
                        legend: "Jumlah",
                        legendPosition: "middle",
                        legendOffset: isMobile ? -40 : -45,
                      }}
                      enableLabel={false}
                      tooltip={({ id, value, indexValue }) => (
                        <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow">
                          <div className="font-semibold text-gray-800">
                            {indexValue}
                          </div>
                          <div className="text-gray-600">
                            {id}: {value}
                          </div>
                        </div>
                      )}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      Tidak ada data cabang.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Tren Bulanan Nasabah Masuk
                  </h2>
                  <p className="text-xs text-gray-500">
                    Perbandingan Approve dan Reject per bulan
                  </p>
                </div>
                <div className="h-60 sm:h-72 overflow-hidden">
                  {lineChartData.length ? (
                    <ResponsiveLine
                      data={lineChartData}
                      margin={lineChartMargin}
                      xScale={{ type: "point" }}
                      yScale={{
                        type: "linear",
                        min: 0,
                        max: "auto",
                        stacked: false,
                      }}
                      axisBottom={{
                        tickRotation: isMobile ? -35 : -25,
                        tickPadding: isMobile ? 6 : 8,
                      }}
                      axisLeft={{
                        tickPadding: 6,
                        legend: "Jumlah",
                        legendPosition: "middle",
                        legendOffset: isMobile ? -40 : -45,
                      }}
                      colors={{ scheme: "set2" }}
                      pointSize={isMobile ? 4 : 6}
                      pointBorderWidth={isMobile ? 1 : 2}
                      pointBorderColor={{ from: "serieColor" }}
                      useMesh
                      legends={lineChartLegends}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      Tidak ada data tren.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Proporsi Status Pengajuan
                  </h2>
                  <p className="text-xs text-gray-500">
                    Perbandingan Approve, Reject, Pending
                  </p>
                </div>
                <div className="h-60 sm:h-72 overflow-hidden">
                  {statusTotals.total ? (
                    <ResponsivePie
                      data={donutChartData}
                      margin={pieChartMargin}
                      innerRadius={0.6}
                      padAngle={1}
                      cornerRadius={4}
                      colors={{ scheme: "set2" }}
                      activeOuterRadiusOffset={8}
                      borderWidth={1}
                      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor="#1f2937"
                      legends={pieChartLegends}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">
                      Tidak ada data status.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Data Cabang
                </p>
                <p className="text-xs text-gray-500">
                  Cari cabang berdasarkan kode, nama, atau alamat kantor.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
                <div className="w-full sm:w-52">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Filter Bulan
                  </label>
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="ALL">Semua Bulan</option>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {formatMonthLabel(month)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-72">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Pencarian
                  </label>
                  <input
                    type="text"
                    placeholder="Cari kode / nama cabang..."
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-16">
                      No
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Kode Kantor
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Nama Cabang
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Alamat Kantor
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Total
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Approve
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Reject
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Pending
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchedCabangRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Tidak ada data cabang.
                      </td>
                    </tr>
                  ) : (
                    searchedCabangRows.map((row, index) => (
                      <tr
                        key={`${row.kodeKantor}-${row.cabangKantor}-${index}`}
                        className="border-b even:bg-gray-50/60 hover:bg-indigo-50/40 transition-colors duration-200"
                      >
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-500 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-gray-800">
                          {row.kodeKantor || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                          {row.cabangKantor || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {row.alamatKantor || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-gray-700">
                          {row.total}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-emerald-600 font-semibold">
                          {row.approve}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-rose-600 font-semibold">
                          {row.reject}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-amber-600 font-semibold">
                          {row.pending}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCabang(row);
                                setShowCabangModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 shadow-sm transition hover:bg-indigo-50 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            >
                              <FaClipboardList className="text-[12px]" />
                              Rekap
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const kode = String(row.kodeKantor ?? "").trim();
                                if (!kode || kode === "-") {
                                  Swal.fire(
                                    "Gagal",
                                    "Kode kantor tidak ditemukan.",
                                    "error"
                                  );
                                  return;
                                }
                                navigate(`/view-cabang/${encodeURIComponent(kode)}`, {
                                  state: {
                                    cabangKantor: row.cabangKantor,
                                    alamatKantor: row.alamatKantor,
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-indigo-500 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            >
                              <FaEye className="text-[12px]" />
                              View Data
                            </button>
                          </div>
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

      {showCabangModal && selectedCabang ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Kinerja Cabang
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedCabang.cabangKantor || "Cabang"}{" "}
                  {selectedCabang.kodeKantor
                    ? `(${selectedCabang.kodeKantor})`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCabangModal(false);
                  setSelectedCabang(null);
                }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-center">
                <p className="text-xs text-gray-500">Total Nasabah</p>
                <p className="text-lg font-semibold text-gray-800">
                  {cabangModalData.total}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-center">
                <p className="text-xs text-emerald-700">Approve</p>
                <p className="text-lg font-semibold text-emerald-700">
                  {cabangModalData.approve}
                </p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-error-200 px-3 py-3 text-center">
                <p className="text-xs text-rose-700">Reject</p>
                <p className="text-lg font-semibold text-rose-700">
                  {cabangModalData.reject}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-center">
                <p className="text-xs text-amber-700">Pending</p>
                <p className="text-lg font-semibold text-amber-700">
                  {cabangModalData.pending}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Nasabah Masuk per Bulan
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full text-sm divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Bulan
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Approve
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Reject
                      </th>
                      <th className="px-4 py-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cabangModalData.rows.length ? (
                      cabangModalData.rows.map((row) => (
                        <tr key={row.month} className="even:bg-gray-50/60">
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {row.month}
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-700">
                            {row.total}
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-emerald-700 font-semibold">
                            {row.approve}
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-rose-700 font-semibold">
                            {row.reject}
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-amber-700 font-semibold">
                            {row.pending}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-6 text-center text-sm text-gray-400"
                        >
                          Belum ada data bulanan untuk cabang ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">
              Tambah User
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode Pegawai
                </label>
                <SearchablePegawaiSelect
                  value={createForm.kdPegawai}
                  options={pegawaiOptions}
                  placeholder="Cari kode atau nama pegawai..."
                  onSelect={handlePegawaiSelect}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  readOnly
                  className="w-full border rounded-md bg-gray-50 p-2 text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Alamat Kantor
                </label>
                <input
                  type="text"
                  value={createForm.alamatKantor}
                  readOnly
                  className="w-full border rounded-md bg-gray-50 p-2 text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={createForm.jabatan}
                  readOnly
                  className="w-full border rounded-md bg-gray-50 p-2 text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode Kantor
                </label>
                <SearchableKantorSelect
                  value={createForm.kdkantor}
                  options={kantorOptions}
                  placeholder="Pilih Kode Kantor"
                  onChange={(value) =>
                    handleKodeKantorChange(setCreateForm)({
                      target: { value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cabang Kantor
                </label>
                <input
                  type="text"
                  value={createForm.cabangKantor}
                  readOnly
                  className="w-full border rounded-md bg-gray-50 p-2 text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateChange("email")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Telp Kantor
                </label>
                <input
                  type="text"
                  value={createForm.telpKantor}
                  onChange={handleCreateChange("telpKantor")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={handleCreateChange("username")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <SearchableRoleSelect
                  value={createForm.role}
                  options={roleOptions}
                  placeholder="Pilih Role"
                  onChange={(value) =>
                    handleCreateChange("role")({ target: { value } })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                className={`px-4 py-2 rounded-md w-full sm:w-auto ${
                  creating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {creating ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">
              Edit User
            </h2>

            <label className="block text-sm font-medium mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={handleEditChange("name")}
              className="w-full border rounded-md p-2 mb-4 text-sm"
            />

            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={handleEditChange("username")}
              className="w-full border rounded-md p-2 mb-4 text-sm"
            />

            <label className="block text-sm font-medium mb-1">Role</label>
            <SearchableRoleSelect
              value={editForm.role}
              options={roleOptions}
              placeholder="Pilih Role"
              onChange={(value) => handleEditChange("role")({ target: { value } })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode Pegawai
                </label>
                <input
                  type="text"
                  value={editForm.kdPegawai}
                  onChange={handleEditChange("kdPegawai")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode Kantor
                </label>
                <SearchableKantorSelect
                  value={editForm.kdkantor}
                  options={kantorOptions}
                  placeholder="Pilih Kode Kantor"
                  onChange={(value) =>
                    handleKodeKantorChange(setEditForm)({
                      target: { value },
                    })
                  }
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Cabang Kantor
              </label>
              <input
                type="text"
                value={editForm.cabangKantor}
                readOnly
                className="w-full border rounded-md p-2 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Alamat Kantor
              </label>
              <input
                type="text"
                value={editForm.alamatKantor}
                readOnly
                className="w-full border rounded-md p-2 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Telp Kantor
              </label>
              <input
                type="text"
                value={editForm.telpKantor}
                onChange={handleEditChange("telpKantor")}
                className="w-full border rounded-md p-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={handleEditChange("password")}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Kosongkan jika tidak diubah"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  value={editForm.confPassword}
                  onChange={handleEditChange("confPassword")}
                  className="w-full border rounded-md p-2 text-sm"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 w-full sm:w-auto"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className={`px-4 py-2 rounded-md w-full sm:w-auto ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-success-600 hover:bg-green-700 text-white"
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

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`bg-${color}-100 text-${color}-600 p-3 rounded-xl`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2
        className={`font-bold text-gray-800 ${
          typeof value === "string" && value.length > 14
            ? "text-sm sm:text-base"
            : "text-2xl sm:text-3xl"
        }`}
      >
        {value}
      </h2>
    </div>
  </div>
);

const SearchableKantorSelect = ({
  value,
  options,
  onChange,
  placeholder = "Pilih Kode Kantor",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const label = String(option.label ?? "").toLowerCase();
        const val = String(option.value ?? "").toLowerCase();
        return label.includes(normalizedQuery) || val.includes(normalizedQuery);
      })
    : options;

  const selectedLabel =
    options.find((option) => option.value === value)?.label || "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={selectedLabel ? "text-gray-700" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kode atau nama kantor..."
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-48 overflow-auto py-1 text-sm">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`block w-full px-3 py-2 text-left hover:bg-indigo-50 ${
                    option.value === value ? "bg-indigo-100 text-indigo-700" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400">
                Tidak ada hasil.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SearchableRoleSelect = ({
  value,
  options,
  onChange,
  placeholder = "Pilih Role",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const label = String(option.label ?? "").toLowerCase();
        const val = String(option.value ?? "").toLowerCase();
        return label.includes(normalizedQuery) || val.includes(normalizedQuery);
      })
    : options;

  const selectedLabel =
    options.find((option) => option.value === value)?.label || "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={selectedLabel ? "text-gray-700" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari role..."
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-48 overflow-auto py-1 text-sm">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`block w-full px-3 py-2 text-left hover:bg-indigo-50 ${
                    option.value === value ? "bg-indigo-100 text-indigo-700" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400">
                Tidak ada hasil.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SearchablePegawaiSelect = ({
  value,
  options,
  onSelect,
  placeholder = "Cari kode atau nama pegawai...",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const label = String(option.label ?? "").toLowerCase();
        const val = String(option.value ?? "").toLowerCase();
        return label.includes(normalizedQuery) || val.includes(normalizedQuery);
      })
    : [];

  const selectedLabel =
    options.find((option) => option.value === value)?.label || "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={selectedLabel ? "text-gray-700" : "text-gray-400"}>
          {selectedLabel || placeholder}
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-48 overflow-auto py-1 text-sm">
            {!normalizedQuery ? (
              <div className="px-3 py-2 text-gray-400">
                Ketik kode atau nama pegawai untuk mencari.
              </div>
            ) : filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => {
                    onSelect(option.pegawai);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`block w-full px-3 py-2 text-left hover:bg-indigo-50 ${
                    option.value === value ? "bg-indigo-100 text-indigo-700" : ""
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-400">
                Tidak ada hasil.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
