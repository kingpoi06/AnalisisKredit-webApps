import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import PageBackground from "../component/PageBackground";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaUsers, FaUserShield } from "react-icons/fa";
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
  superadmin: "Superadmin",
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

const formatRoleLabel = (value) => {
  if (!value) return "-";
  const normalized = normalizeRole(value);
  return ROLE_LABELS[normalized] || String(value).replace(/_/g, " ");
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
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

export default function DashboardUsers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [cabangKantorList, setCabangKantorList] = useState([]);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      if (normalizedRole !== "superadmin") {
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
      { value: "superadmin", label: "Superadmin" },
    ],
    []
  );

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
      <div className="md:ml-64">
        <Header />
        <main className="pt-20 px-4 pb-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                <FaUserShield />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Akun Pengguna</h1>
                <p className="text-sm text-gray-500">Monitoring Users</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2 mb-8">
            <StatCard
              title="Total User Officer"
              value={officerCount}
              icon={<FaUsers />}
              color="indigo"
            />
            <StatCard
              title="Total User Komite Cabang"
              value={komiteCabangCount}
              icon={<FaUsers />}
              color="green"
            />
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Filter Role
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <FilterButton
                    label="Semua"
                    active={filterRole === "ALL"}
                    onClick={() => setFilterRole("ALL")}
                  />
                  <FilterButton
                    label="Officer"
                    active={filterRole === "OFFICER"}
                    onClick={() => setFilterRole("OFFICER")}
                  />
                  <FilterButton
                    label="Komite Cabang"
                    active={filterRole === "KOMITECABANG"}
                    onClick={() => setFilterRole("KOMITECABANG")}
                  />
                  <FilterButton
                    label="Superadmin"
                    active={filterRole === "SUPERADMIN"}
                    onClick={() => setFilterRole("SUPERADMIN")}
                  />
                </div>
              </div>
              <div className="w-full lg:w-auto">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Pencarian
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Cari nama / username / role..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition sm:w-72"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    onClick={openCreateModal}
                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:w-auto"
                  >
                    Tambah User
                  </button>
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
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Nama Lengkap
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
                      Role
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Kode Pegawai
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Kode Kantor
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Cabang Kantor
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
                      Tanggal Dibuat
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Tidak ada data user
                      </td>
                    </tr>
                  ) : (
                    searchedUsers.map((user, index) => (
                      <tr
                        key={user.id || `${user.username}-${index}`}
                        className="border-b even:bg-gray-50/60 hover:bg-indigo-50/40 transition-colors duration-200"
                      >
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-500 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3 font-semibold text-gray-800">
                          {user.name}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {user.roleLabel}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {user.kdPegawai}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {user.kodeKantor}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {user.cabangKantor}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 text-center">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={deletingId === getUserIdentifier(user)}
                              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-error-100 text-error-700 hover:bg-red-200 transition disabled:cursor-not-allowed"
                            >
                              Hapus
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
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
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
