import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import PageBackground from "../component/PageBackground";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaUsers, FaArrowLeft } from "react-icons/fa";
import { ResponsiveBar } from "@nivo/bar";
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

const parseCurrencyValue = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  const normalized = raw.replace(/[^0-9,.-]/g, "");
  if (!normalized) return 0;
  const numeric = normalized.replace(/\./g, "").replace(",", ".");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

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
    alamatKantor: getFieldValue(user, ["alamatKantor", "alamat_kantor", "alamat"]) || "-",
  };
};

const isOfficerRole = (role) => String(role ?? "").includes("officer");
const isKomiteCabangRole = (role) => normalizeRole(role) === "komitecabang";

const getUserIdentifier = (user) => {
  const candidate = user?.kdPegawai || user?.id || "";
  const trimmed = String(candidate ?? "").trim();
  return trimmed && trimmed !== "-" ? trimmed : "";
};

const StatusBadge = ({ status }) => {
  const normalized = normalizeStatusPengajuan(status);
  const colorClass =
    normalized === "Approve"
      ? "bg-emerald-100 text-emerald-700"
      : normalized === "Reject"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
      {normalized}
    </span>
  );
};

export default function ViewCabang() {
  const navigate = useNavigate();
  const { kodeKantor: kodeParam } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [monitoringList, setMonitoringList] = useState([]);
  const [monthFilter, setMonthFilter] = useState("ALL");

  const normalizedKodeParam = normalizeKodeKantor(kodeParam);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    if (!normalizedKodeParam) {
      Swal.fire("Gagal", "Kode kantor tidak ditemukan.", "error").then(() => {
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
        const [usersRes, listRes, dataPermohonanRes] = await Promise.all([
          axios.get(API_ENDPOINTS.users.list()),
          axios.get(API_ENDPOINTS.generate.noPermohonan()),
          axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
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
        const permohonanMap = new Map(
          permohonanList.map((item) => [
            item.no_permohonan ?? item.noPermohonan,
            item,
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
          const plafonRaw = getFieldValue(permohonanData, [
            "plafonPermohonan",
            "plafon_permohonan",
            "plafonPinjaman",
            "plafon_pinjaman",
            "plafon",
            "plafonKredit",
            "plafon_kredit",
            "plafonDiajukan",
            "plafon_diajukan",
          ]);
          const creatorValue =
            getFieldValue(item, CREATOR_KEYS) ||
            getFieldValue(permohonanData, CREATOR_KEYS) ||
            "";
          const kodeKantorValue =
            getFieldValue(item, KODE_KANTOR_KEYS) ||
            getFieldValue(permohonanData, KODE_KANTOR_KEYS) ||
            "";

          return {
            noPermohonan,
            statusPengajuan: normalizeStatusPengajuan(statusValue),
            createdAt,
            creatorValue,
            kodeKantor: normalizeKodeKantor(kodeKantorValue) || kodeKantorValue,
            plafonValue: parseCurrencyValue(plafonRaw),
          };
        });
        setMonitoringList(normalizedMonitoring);
      } catch (err) {
        console.error("VIEW CABANG ERROR:", err);
        Swal.fire(
          "Gagal",
          err.response?.data?.msg || "Gagal memuat data cabang.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, normalizedKodeParam]);

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

  const leaderUser = useMemo(
    () =>
      users.find(
        (user) =>
          isKomiteCabangRole(user.role) &&
          normalizeKodeKantor(user.kodeKantor) === normalizedKodeParam
      ) || null,
    [users, normalizedKodeParam]
  );

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

  const monthOptions = useMemo(() => {
    const months = new Set();
    monitoringList.forEach((item) => {
      const key = getMonthKey(item.createdAt);
      if (key) months.add(key);
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [monitoringList]);

  const filteredMonitoringList =
    monthFilter === "ALL"
      ? monitoringList
      : monitoringList.filter(
          (item) => getMonthKey(item.createdAt) === monthFilter
        );

  const officerRows = useMemo(() => {
    const map = new Map();
    const targetKode = normalizedKodeParam;
    const officers = users.filter(
      (user) =>
        isOfficerRole(user.role) &&
        normalizeKodeKantor(user.kodeKantor) === targetKode
    );

    officers.forEach((officer) => {
      const key = getUserIdentifier(officer);
      if (!key || map.has(key)) return;
      map.set(key, {
        ...officer,
        total: 0,
        approve: 0,
        reject: 0,
        pending: 0,
      });
    });

    filteredMonitoringList.forEach((item) => {
      const creatorUser = resolveUserByKey(item.creatorValue);
      if (!creatorUser || !isOfficerRole(creatorUser.role)) return;
      if (normalizeKodeKantor(creatorUser.kodeKantor) !== targetKode) return;
      const key = getUserIdentifier(creatorUser);
      if (!key) return;
      const entry =
        map.get(key) ||
        {
          ...creatorUser,
          total: 0,
          approve: 0,
          reject: 0,
          pending: 0,
        };
      if (item.statusPengajuan === "Approve") entry.approve += 1;
      else if (item.statusPengajuan === "Reject") entry.reject += 1;
      else entry.pending += 1;
      entry.total += 1;
      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? ""))
    );
  }, [users, filteredMonitoringList, normalizedKodeParam]);


  const approvedPlafonByOfficer = useMemo(() => {
    const map = new Map();
    filteredMonitoringList.forEach((item) => {
      if (item.statusPengajuan !== "Approve") return;
      const creatorUser = resolveUserByKey(item.creatorValue);
      if (!creatorUser || !isOfficerRole(creatorUser.role)) return;
      if (normalizeKodeKantor(creatorUser.kodeKantor) !== normalizedKodeParam) {
        return;
      }
      const key = getUserIdentifier(creatorUser);
      if (!key) return;
      const current = map.get(key) || 0;
      map.set(key, current + (item.plafonValue || 0));
    });
    return map;
  }, [filteredMonitoringList, normalizedKodeParam]);

  const totalApprovedPlafon = useMemo(() => {
    let sum = 0;
    approvedPlafonByOfficer.forEach((value) => {
      sum += value || 0;
    });
    return sum;
  }, [approvedPlafonByOfficer]);

  const barChartData = useMemo(
    () =>
      officerRows.map((officer) => ({
        officer: officer.name,
        Approve: officer.approve,
        Reject: officer.reject,
        userKey: getUserIdentifier(officer),
      })),
    [officerRows]
  );

  const handleBarClick = (bar) => {
    if (bar?.id !== "Approve") return;
    const userKey = bar?.data?.userKey;
    if (!userKey) return;
    const totalPlafon = approvedPlafonByOfficer.get(userKey) || 0;
    Swal.fire({
      icon: "info",
      title: "Total Plafon Approve Komite Cabang",
      text: formatCurrency(totalPlafon),
    });
  };

  const cabangName =
    leaderUser?.cabangKantor || location.state?.cabangKantor || "-";
  const cabangAlamat =
    leaderUser?.alamatKantor || location.state?.alamatKantor || "-";

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
                <h1 className="text-2xl font-bold">Data Pegawai Cabang</h1>
                <p className="text-sm text-gray-500">
                  Ringkasan permohonan per officer
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
              Pemimpin Cabang
            </p>
            <h2 className="mt-1 text-lg font-semibold text-gray-800">
              {leaderUser?.name || "-"}
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              <p>Kode Kantor: {normalizedKodeParam || kodeParam || "-"}</p>
              <p>Nama Cabang: {cabangName}</p>
              <p>Alamat Kantor: {cabangAlamat}</p>
              <p>
                Total Plafon yang ter-Approve seluruh Pegawai:{" "}
                <span className="font-semibold text-gray-700">
                  {formatCurrency(totalApprovedPlafon)}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  Hasil Permohonan per Pegawai
                </h2>
                <p className="text-xs text-gray-500">
                  Perbandingan Approve dan Reject
                </p>
              </div>
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
            </div>
            <div className="mt-4 w-full overflow-hidden">
              <div className="w-full min-w-0 h-64 sm:h-72">
                {barChartData.length ? (
                  <ResponsiveBar
                    data={barChartData}
                    keys={["Approve", "Reject"]}
                    indexBy="officer"
                    margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
                    padding={0.4}
                    colors={{ scheme: "set2" }}
                    axisBottom={{
                      tickRotation: -25,
                      tickSize: 5,
                      tickPadding: 8,
                      legend: "",
                    }}
                    axisLeft={{
                      tickSize: 4,
                      tickPadding: 6,
                      legend: "Jumlah",
                      legendPosition: "middle",
                      legendOffset: -45,
                    }}
                    enableLabel={false}
                    onClick={handleBarClick}
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
                    Tidak ada data permohonan.
                  </div>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Klik bar Approve untuk melihat total plafon yang disetujui komite cabang.
            </p>
            <div className="mt-3 text-sm font-semibold text-gray-700">
              Total Plafon Approve (Semua Officer): {formatCurrency(totalApprovedPlafon)}
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
                      Nama Pegawai
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Kode Pegawai
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Total
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Approve
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Reject
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-40">
                      Plafon Approve
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-24">
                      Pending
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-32">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {officerRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        Tidak ada data pegawai officer.
                      </td>
                    </tr>
                  ) : (
                    officerRows.map((officer, index) => (
                      (() => {
                        const officerKey = getUserIdentifier(officer);
                        const plafonApproveValue =
                          approvedPlafonByOfficer.get(officerKey) || 0;
                        return (
                      <tr
                        key={`${officer.id || officer.kdPegawai}-${index}`}
                        className="border-b even:bg-gray-50/60 hover:bg-indigo-50/40 transition-colors duration-200"
                      >
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-500 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-gray-800">
                          {officer.name}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-600">
                          {officer.kdPegawai || "-"}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-gray-700">
                          {officer.total}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-emerald-600 font-semibold">
                          {officer.approve}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-rose-600 font-semibold">
                          {officer.reject}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-right text-sm text-gray-700">
                          {formatCurrency(plafonApproveValue)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center text-sm text-amber-600 font-semibold">
                          {officer.pending}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const targetId = officer.kdPegawai || officer.id;
                              if (!targetId || targetId === "-") {
                                Swal.fire(
                                  "Gagal",
                                  "Kode pegawai tidak ditemukan.",
                                  "error"
                                );
                                return;
                              }
                              navigate(
                                `/view-pegawai/${encodeURIComponent(targetId)}`,
                                {
                                  state: {
                                    officerName: officer.name,
                                    kodeKantor: officer.kodeKantor,
                                    cabangKantor: officer.cabangKantor,
                                    alamatKantor: officer.alamatKantor,
                                  },
                                }
                              );
                            }}
                            className="inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 shadow-sm transition hover:bg-indigo-50"
                          >
                            Detail Lihat Data
                          </button>
                        </td>
                      </tr>
                        );
                      })()
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
