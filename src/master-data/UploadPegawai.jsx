import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import PageBackground from "../component/PageBackground";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import axios from "axios";
import { FaUpload } from "react-icons/fa";
import { API_ENDPOINTS } from "../config/apiEndpoints";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PAGE_SIZE = 10;

const isValidExcelFile = (file) => {
  const name = String(file?.name || "").toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
};

export default function UploadPegawai() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [hasLoadedList, setHasLoadedList] = useState(false);
  const [pegawaiList, setPegawaiList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    no: "",
    originalNo: "",
    namaPegawai: "",
    nrp: "",
    namaJabatan: "",
    kodeKantor: "",
  });
  const navigate = useNavigate();

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

  const getPegawaiRow = (item) => {
    const cabang = item?.cabangkantor || item?.Cabangkantor || item?.cabang;
    return {
      kodePegawai: getFieldValue(item, [
        "No",
        "no",
        "kodePegawai",
        "kode_pegawai",
        "kdPegawai",
        "kd_pegawai",
      ]),
      namaPegawai: getFieldValue(item, [
        "Nama_Pegawai",
        "nama_pegawai",
        "namaPegawai",
        "nama",
      ]),
      nrp: getFieldValue(item, ["NRP", "nrp"]),
      jabatan: getFieldValue(item, [
        "Nama_Jabatan",
        "nama_jabatan",
        "namaJabatan",
        "jabatan",
      ]),
      kodeKantor: getFieldValue(item, [
        "kode_kantor",
        "kodeKantor",
        "kdkantor",
        "kd_kantor",
      ]),
      cabangKantor: getFieldValue(cabang, [
        "nama_kantor",
        "namaKantor",
        "cabangKantor",
        "cabang_kantor",
        "namaCabang",
        "nama_cabang",
      ]),
      alamatKantor: getFieldValue(cabang, [
        "alamatLengkap",
        "alamat_lengkap",
        "alamat",
      ]),
    };
  };

  const loadPegawaiList = async () => {
    try {
      setLoadingList(true);
      const response = await axios.get(API_ENDPOINTS.pegawai.list());
      const payload =
        response.data?.Data ?? response.data?.data ?? response.data ?? [];
      const rows = normalizeList(payload).map(getPegawaiRow);
      setPegawaiList(rows);
      setHasLoadedList(true);
      setCurrentPage(1);
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Gagal mengambil data pegawai",
        "error"
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      if (String(roleValue).toLowerCase() !== "superadmin") {
        navigate("/dashboard");
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!isValidExcelFile(nextFile)) {
      Swal.fire("Error", "File harus berformat .xlsx atau .xls", "error");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      Swal.fire("Error", "Ukuran file maksimum 10MB", "error");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(nextFile);
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

  const handleUpload = async () => {
    if (!file) {
      Swal.fire("Error", "Silakan pilih file Excel terlebih dahulu", "error");
      return;
    }

    const uploadEndpoint = API_ENDPOINTS.pegawai?.upload?.();
    if (!uploadEndpoint) {
      Swal.fire(
        "Info",
        "Endpoint upload pegawai belum disiapkan.",
        "info"
      );
      return;
    }

    const payload = new FormData();
    payload.append("file", file);

    try {
      setUploading(true);
      Swal.fire({
        title: "Mengunggah data pegawai...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await axios.post(uploadEndpoint, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire(
        "Berhasil",
        response?.data?.msg || "Upload pegawai berhasil",
        "success"
      );
      setFile(null);
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Upload pegawai gagal",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (row) => {
    const kodePegawai = row?.kodePegawai || "";
    setEditForm({
      no: kodePegawai,
      originalNo: kodePegawai,
      namaPegawai: row?.namaPegawai || "",
      nrp: row?.nrp || "",
      namaJabatan: row?.jabatan || "",
      kodeKantor: row?.kodeKantor || "",
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (field) => (event) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editForm.no) {
      Swal.fire("Error", "Kode pegawai tidak ditemukan", "error");
      return;
    }
    const targetNo = editForm.originalNo || editForm.no;
    if (!targetNo) {
      Swal.fire("Error", "Kode pegawai tidak ditemukan", "error");
      return;
    }

    try {
      setSavingEdit(true);
      const payload = {
        kode_pegawai: editForm.no,
        Nama_Pegawai: editForm.namaPegawai,
        NRP: editForm.nrp,
        Nama_Jabatan: editForm.namaJabatan,
        kode_kantor: editForm.kodeKantor,
      };

      await axios.patch(API_ENDPOINTS.pegawai.update(targetNo), payload);

      Swal.fire("Berhasil", "Data pegawai diperbarui", "success");
      setIsEditOpen(false);
      loadPegawaiList();
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Gagal memperbarui data pegawai",
        "error"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRefresh = () => {
    if (loadingList) return;
    loadPegawaiList();
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPegawaiList = normalizedSearch
    ? pegawaiList.filter((row) => {
        const kode = String(row?.kodePegawai || "").toLowerCase();
        const nama = String(row?.namaPegawai || "").toLowerCase();
        return (
          kode.includes(normalizedSearch) ||
          nama.includes(normalizedSearch)
        );
      })
    : pegawaiList;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPegawaiList.length / PAGE_SIZE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedPegawaiList = filteredPegawaiList.slice(
    pageStart,
    pageStart + PAGE_SIZE
  );
  const displayedTotal = normalizedSearch
    ? filteredPegawaiList.length
    : pegawaiList.length;

  return (
    <PageBackground>
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="pt-20 px-4 pb-12 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 shadow-sm">
                <FaUpload />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Master Data
                </h1>
                <p className="text-sm text-slate-500">
                  Upload data pegawai (Excel)
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {hasLoadedList
                ? `${displayedTotal} data tersedia`
                : "Data belum dimuat"}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Upload File
                </h2>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Excel
                </span>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="text-[11px] font-medium text-slate-600">
                  File Excel (.xlsx / .xls)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-xs text-slate-600
                  file:mr-4 file:rounded-lg file:border-0
                  file:bg-slate-100 file:px-4 file:py-2
                  file:text-xs file:font-semibold file:text-slate-700
                  hover:file:bg-slate-200"
                />
                <p className="text-[11px] text-slate-500">
                  {file?.name || "Belum ada file dipilih."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm
                transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60
                disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Mengunggah..." : "Upload Data Pegawai"}
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Daftar Pegawai
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Menampilkan data pegawai dari file yang diunggah.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari nama/kode pegawai..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loadingList}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingList ? "Memuat..." : "Filter"}
                  </button>
                </div>
              </div>

              {!hasLoadedList && !loadingList ? (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Klik tombol Filter untuk menampilkan data pegawai.
                </div>
              ) : loadingList ? (
                <p className="mt-4 text-xs text-slate-500">Memuat data...</p>
              ) : filteredPegawaiList.length ? (
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-[960px] w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px] whitespace-nowrap">
                          Kode Pegawai
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px]">
                          Nama Pegawai
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px] whitespace-nowrap">
                          NRP
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px]">
                          Jabatan
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px] whitespace-nowrap">
                          Kode Kantor
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px]">
                          Cabang Kantor
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px]">
                          Alamat Kantor
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.18em] text-[10px]">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPegawaiList.map((row, index) => (
                        <tr
                          key={`${row?.kodePegawai || "pegawai"}-${pageStart + index}`}
                          className={
                            (pageStart + index) % 2 ? "bg-slate-50/60" : "bg-white"
                          }
                        >
                          <td className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">
                            {row?.kodePegawai || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {row?.namaPegawai || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">
                            {row?.nrp || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {row?.jabatan || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">
                            {row?.kodeKantor || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {row?.cabangKantor || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            {row?.alamatKantor || "-"}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(row)}
                              className="rounded-md bg-secondary-500 px-3 py-1 text-[11px] text-white transition hover:bg-slate-900"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  Belum ada data pegawai.
                </p>
              )}

              {hasLoadedList && filteredPegawaiList.length ? (
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Halaman {safePage} dari {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safePage === 1}
                      className="rounded-md border border-slate-200 px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={safePage >= totalPages}
                      className="rounded-md border border-slate-200 px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </main>
        {isEditOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-slate-800">
                Edit Data Pegawai
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Perbarui data pegawai dan simpan perubahan.
              </p>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600">
                    Kode Pegawai
                  </label>
                  <input
                    type="text"
                    value={editForm.no}
                    onChange={handleEditChange("no")}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">
                    Nama Pegawai
                  </label>
                  <input
                    type="text"
                    value={editForm.namaPegawai}
                    onChange={handleEditChange("namaPegawai")}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">
                    NRP
                  </label>
                  <input
                    type="text"
                    value={editForm.nrp}
                    onChange={handleEditChange("nrp")}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    value={editForm.namaJabatan}
                    onChange={handleEditChange("namaJabatan")}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">
                    Kode Kantor
                  </label>
                  <input
                    type="text"
                    value={editForm.kodeKantor}
                    onChange={handleEditChange("kodeKantor")}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageBackground>
  );
}
