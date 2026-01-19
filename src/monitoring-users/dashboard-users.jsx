import React, { useEffect, useMemo, useState } from "react";
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
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={handleCreateChange("name")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
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
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={createForm.role}
                  onChange={handleCreateChange("role")}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="">Pilih Role</option>
                  <option value="officer">Officer</option>
                  <option value="komitecabang">Komite Cabang</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jabatan
                </label>
                <input
                  type="text"
                  value={createForm.jabatan}
                  onChange={handleCreateChange("jabatan")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode Pegawai
                </label>
                <input
                  type="text"
                  value={createForm.kdPegawai}
                  onChange={handleCreateChange("kdPegawai")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Kode Kantor
                </label>
                <input
                  type="text"
                  value={createForm.kdkantor}
                  onChange={handleCreateChange("kdkantor")}
                  className="w-full border rounded-md p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cabang Kantor
                </label>
                <input
                  type="text"
                  value={createForm.cabangKantor}
                  onChange={handleCreateChange("cabangKantor")}
                  className="w-full border rounded-md p-2 text-sm"
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
                  onChange={handleCreateChange("alamatKantor")}
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
            <select
              value={editForm.role}
              onChange={handleEditChange("role")}
              className="w-full border rounded-md p-2 mb-4 text-sm"
            >
              <option value="">Pilih Role</option>
              <option value="officer">Officer</option>
              <option value="komitecabang">Komite Cabang</option>
              <option value="superadmin">Superadmin</option>
            </select>

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
                <input
                  type="text"
                  value={editForm.kdkantor}
                  onChange={handleEditChange("kdkantor")}
                  className="w-full border rounded-md p-2 text-sm"
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
                onChange={handleEditChange("cabangKantor")}
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
