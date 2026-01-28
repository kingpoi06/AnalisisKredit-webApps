import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import PageBackground from "../component/PageBackground";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaUsers, FaArrowLeft } from "react-icons/fa";
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
const NIK_KEYS = [
  "nik",
  "NIK",
  "nikNasabah",
  "nik_nasabah",
  "no_ktp",
  "noKtp",
  "noKTP",
  "ktp",
  "nomorKtp",
  "nomor_ktp",
];
const NAMA_NASABAH_KEYS = [
  "namaNasabah",
  "nama_nasabah",
  "nama",
  "namaLengkap",
  "nama_lengkap",
  "namalengkap",
  "namaPemohon",
  "nama_pemohon",
];

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
    kdPegawai: getFieldValue(user, KD_PEGAWAI_KEYS) || "-",
    kodeKantor: getFieldValue(user, KODE_KANTOR_KEYS) || "-",
    cabangKantor: getFieldValue(user, CABANG_KANTOR_KEYS) || "-",
    alamatKantor: getFieldValue(user, [
      "alamatKantor",
      "alamat_kantor",
      "alamat",
    ]) || "-",
  };
};

const isOfficerRole = (role) => String(role ?? "").includes("officer");

const getUserIdentifier = (user) => {
  const candidate = user?.kdPegawai || user?.id || "";
  const trimmed = String(candidate ?? "").trim();
  return trimmed && trimmed !== "-" ? trimmed : "";
};

export default function ViewPegawai() {
  const navigate = useNavigate();
  const { kdpegawai: pegawaiParam } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [monitoringList, setMonitoringList] = useState([]);
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const normalizedPegawaiParam = normalizeLookupValue(pegawaiParam);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    if (!normalizedPegawaiParam) {
      Swal.fire("Gagal", "Kode pegawai tidak ditemukan.", "error").then(() => {
        navigate(-1);
      });
      return;
    }

    const loadData = async () => {
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

        setLoading(true);
        const [usersRes, listRes, dataPermohonanRes, dataDiriRes] = await Promise.all([
          axios.get(API_ENDPOINTS.users.list()),
          axios.get(API_ENDPOINTS.generate.noPermohonan()),
          axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataDiri.list()),
        ]);

        const usersPayload =
          usersRes.data?.Data ?? usersRes.data?.data ?? usersRes.data ?? [];
        const userList = normalizeList(usersPayload).map(buildUserRow);
        setUsers(userList);

        const listData = normalizeList(
          listRes.data?.Data ?? listRes.data?.data ?? listRes.data ?? []
        );
        const permohonanList = normalizeList(
          dataPermohonanRes.data?.Data ??
            dataPermohonanRes.data?.data ??
            dataPermohonanRes.data ??
            []
        );
        const dataDiriList = normalizeList(
          dataDiriRes.data?.Data ?? dataDiriRes.data?.data ?? dataDiriRes.data ?? []
        );
        const permohonanMap = new Map(
          permohonanList.map((item) => [
            item.no_permohonan ?? item.noPermohonan,
            item,
          ])
        );
        const nikByPermohonan = new Map(
          dataDiriList.map((item) => [
            item.no_permohonan ?? item.noPermohonan,
            getFieldValue(item, NIK_KEYS),
          ])
        );
        const namaByPermohonan = new Map(
          dataDiriList.map((item) => [
            item.no_permohonan ?? item.noPermohonan,
            getFieldValue(item, NAMA_NASABAH_KEYS),
          ])
        );
        const normalizedMonitoring = listData.map((item) => {
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
          const nikValue =
            getFieldValue(permohonanData, NIK_KEYS) ||
            nikByPermohonan.get(noPermohonan) ||
            getFieldValue(item, NIK_KEYS) ||
            "";
          const namaNasabah =
            getFieldValue(permohonanData, NAMA_NASABAH_KEYS) ||
            namaByPermohonan.get(noPermohonan) ||
            getFieldValue(item, NAMA_NASABAH_KEYS) ||
            "";

          return {
            noPermohonan,
            statusPengajuan: normalizeStatusPengajuan(statusValue),
            createdAt,
            creatorValue,
            nikNasabah: nikValue,
            namaNasabah,
          };
        });
        setMonitoringList(normalizedMonitoring);
      } catch (err) {
        console.error("VIEW PEGAWAI ERROR:", err);
        Swal.fire(
          "Gagal",
          err.response?.data?.msg || "Gagal memuat data pegawai.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, normalizedPegawaiParam]);

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
      assign(byKdPegawai, normalizeLookupValue(user?.kdPegawai), user);
      assign(byId, normalizeLookupValue(user?.id), user);
      assign(byUsername, normalizeLookupValue(user?.username), user);
      assign(byEmail, normalizeLookupValue(user?.email), user);
      assign(byName, normalizeLookupValue(user?.name), user);
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

  const officerUser = useMemo(() => {
    if (!normalizedPegawaiParam) return null;
    const matches = (user) => {
      if (!user || !isOfficerRole(user.role)) return false;
      return (
        normalizeLookupValue(user.kdPegawai) === normalizedPegawaiParam ||
        normalizeLookupValue(user.id) === normalizedPegawaiParam ||
        normalizeLookupValue(user.username) === normalizedPegawaiParam ||
        normalizeLookupValue(user.name) === normalizedPegawaiParam
      );
    };
    return users.find(matches) || null;
  }, [users, normalizedPegawaiParam]);

  useEffect(() => {
    if (loading) return;
    if (!officerUser) {
      Swal.fire("Gagal", "Pegawai tidak ditemukan.", "error").then(() => {
        navigate(-1);
      });
    }
  }, [loading, officerUser, navigate]);

  const officerKey = useMemo(
    () => (officerUser ? getUserIdentifier(officerUser) : ""),
    [officerUser]
  );

  const baseOfficerMonitoringList = useMemo(() => {
    if (!officerKey) return [];
    return monitoringList.filter((item) => {
      const creatorUser = resolveUserByKey(item.creatorValue);
      if (!creatorUser) return false;
      return getUserIdentifier(creatorUser) === officerKey;
    });
  }, [monitoringList, officerKey, resolveUserByKey]);

  const getMonthKey = (dateValue) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

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

  const yearOptions = useMemo(() => {
    const years = new Set();
    baseOfficerMonitoringList.forEach((item) => {
      const parsed = new Date(item.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      years.add(parsed.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [baseOfficerMonitoringList]);

  const monthOptions = useMemo(() => {
    const months = new Set();
    baseOfficerMonitoringList.forEach((item) => {
      const key = getMonthKey(item.createdAt);
      if (!key) return;
      if (yearFilter !== "ALL") {
        const [yearRaw] = key.split("-");
        if (Number(yearRaw) !== Number(yearFilter)) return;
      }
      months.add(key);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [baseOfficerMonitoringList, yearFilter]);

  useEffect(() => {
    if (monthFilter === "ALL") return;
    if (!monthOptions.includes(monthFilter)) {
      setMonthFilter("ALL");
    }
  }, [monthFilter, monthOptions]);

  const filteredOfficerMonitoringList = useMemo(() => {
    return baseOfficerMonitoringList.filter((item) => {
      const parsed = new Date(item.createdAt);
      if (Number.isNaN(parsed.getTime())) return false;
      if (yearFilter !== "ALL" && parsed.getFullYear() !== Number(yearFilter)) {
        return false;
      }
      if (monthFilter !== "ALL" && getMonthKey(parsed) !== monthFilter) {
        return false;
      }
      return true;
    });
  }, [baseOfficerMonitoringList, yearFilter, monthFilter]);

  const summary = useMemo(() => {
    return filteredOfficerMonitoringList.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.statusPengajuan === "Approve") acc.approve += 1;
        else if (item.statusPengajuan === "Reject") acc.reject += 1;
        else acc.pending += 1;
        return acc;
      },
      { total: 0, approve: 0, reject: 0, pending: 0 }
    );
  }, [filteredOfficerMonitoringList]);

  const permohonanRows = useMemo(() => {
    return filteredOfficerMonitoringList
      .map((item) => ({
        noPermohonan: item.noPermohonan,
        nikNasabah: item.nikNasabah || "-",
        namaNasabah: item.namaNasabah || "-",
        createdAt: item.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [filteredOfficerMonitoringList]);

  const officerDisplayName =
    officerUser?.name || location.state?.officerName || "-";
  const officerKode = officerUser?.kdPegawai || pegawaiParam || "-";
  const cabangName = officerUser?.cabangKantor || location.state?.cabangKantor || "-";
  const cabangAlamat = officerUser?.alamatKantor || location.state?.alamatKantor || "-";

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <PageBackground>
      <Sidebar />
      <div className="md:ml-64 md:w-[calc(100%-16rem)] w-full">
        <Header />
        <main className="pt-20 px-4 pb-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                <FaUsers />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Detail Pegawai</h1>
                <p className="text-sm text-gray-500">
                  Ringkasan permohonan per pegawai
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50"
            >
              <FaArrowLeft className="text-[12px]" />
              Kembali
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pegawai
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-800">
              {officerDisplayName}
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              <p>Kode Pegawai: {officerKode}</p>
              <p>Cabang: {cabangName}</p>
              <p>Alamat Kantor: {cabangAlamat}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Filter Data</h2>
                <p className="text-xs text-gray-500">
                  Pilih bulan dan tahun untuk melihat detail permohonan
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <div className="w-full sm:w-40">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Tahun
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="ALL">Semua Tahun</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-48">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Bulan
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
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total Permohonan
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-800">
                {summary.total}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Approve
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {summary.approve}
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Reject
              </p>
              <p className="mt-2 text-2xl font-semibold text-rose-700">
                {summary.reject}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Pending
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">
                {summary.pending}
              </p>
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
                      No Permohonan
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      NIK Nasabah
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Nama Nasabah
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Tanggal Input
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-28">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permohonanRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Tidak ada data permohonan untuk pegawai ini.
                      </td>
                    </tr>
                  ) : (
                    permohonanRows.map((row, index) => (
                      <tr
                        key={row.noPermohonan || index}
                        className="border-b even:bg-gray-50/60 hover:bg-indigo-50/40 transition-colors duration-200"
                      >
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-500 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                          {row.noPermohonan || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                          {row.nikNasabah || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                          {row.namaNasabah || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (!row.noPermohonan) return;
                              navigate(
                                `/printPDF-nasabah/${encodeURIComponent(row.noPermohonan)}`
                              );
                            }}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                          >
                            View Data
                          </button>
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
    </PageBackground>
  );
}
