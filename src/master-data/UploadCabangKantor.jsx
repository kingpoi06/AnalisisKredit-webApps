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

const isValidExcelFile = (file) => {
  const name = String(file?.name || "").toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
};

export default function UploadCabangKantor() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [hasLoadedList, setHasLoadedList] = useState(false);
  const [cabangList, setCabangList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    kodeKantor: "",
    namaKantor: "",
    longitude: "",
    latitude: "",
    alamatLengkap: "",
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

  const getCabangRow = (item) => ({
    kodeKantor: getFieldValue(item, [
      "kodeKantor",
      "kode_kantor",
      "kodekantor",
      "kdKantor",
      "kd_kantor",
      "kdkantor",
    ]),
    cabangKantor: getFieldValue(item, [
      "cabangKantor",
      "cabang_kantor",
      "namaKantor",
      "nama_kantor",
      "namaCabang",
      "nama_cabang",
      "cabang",
      "kantor",
    ]),
    longitude: getFieldValue(item, ["longitude", "lon", "long"]),
    latitude: getFieldValue(item, ["latitude", "lat"]),
    alamatKantor: getFieldValue(item, [
      "alamatKantor",
      "alamat_kantor",
      "alamatLengkap",
      "alamat_lengkap",
      "alamat",
    ]),
  });

  const loadCabangList = async () => {
    try {
      setLoadingList(true);
      const response = await axios.get(API_ENDPOINTS.cabangKantor.list());
      const payload =
        response.data?.Data ?? response.data?.data ?? response.data ?? [];
      const rows = normalizeList(payload).map(getCabangRow);
      setCabangList(rows);
      setHasLoadedList(true);
      setCurrentPage(1);
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Gagal mengambil data cabang kantor",
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

    const payload = new FormData();
    payload.append("file", file);

    try {
      setUploading(true);
      Swal.fire({
        title: "Mengunggah data cabang kantor...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await axios.post(
        API_ENDPOINTS.cabangKantor.upload(),
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.fire(
        "Berhasil",
        response?.data?.msg || "Upload cabang kantor berhasil",
        "success"
      );
      setFile(null);
      loadCabangList();
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Upload cabang kantor gagal",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEdit = (row) => {
    setEditForm({
      kodeKantor: row.kodeKantor || "",
      namaKantor: row.cabangKantor || "",
      longitude: row.longitude || "",
      latitude: row.latitude || "",
      alamatLengkap: row.alamatKantor || "",
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
    if (!editForm.kodeKantor) {
      Swal.fire("Error", "Kode kantor tidak ditemukan", "error");
      return;
    }

    try {
      setSavingEdit(true);
      const payload = {
        nama_kantor: editForm.namaKantor,
        longitude: editForm.longitude,
        latitude: editForm.latitude,
        alamatLengkap: editForm.alamatLengkap,
      };

      await axios.patch(
        API_ENDPOINTS.cabangKantor.update(editForm.kodeKantor),
        payload
      );

      Swal.fire("Berhasil", "Data cabang kantor diperbarui", "success");
      setIsEditOpen(false);
      loadCabangList();
    } catch (error) {
      Swal.fire(
        "Gagal",
        error.response?.data?.msg || "Gagal memperbarui data cabang kantor",
        "error"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCabangList = normalizedSearch
    ? cabangList.filter((row) => {
        const kode = String(row.kodeKantor || "").toLowerCase();
        const cabang = String(row.cabangKantor || "").toLowerCase();
        return (
          kode.includes(normalizedSearch) ||
          cabang.includes(normalizedSearch)
        );
      })
    : cabangList;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCabangList.length / pageSize)
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagedCabangList = filteredCabangList.slice(
    pageStart,
    pageStart + pageSize
  );
  const displayedTotal = normalizedSearch
    ? filteredCabangList.length
    : cabangList.length;

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
                  KANTOR CABANG BPR NTB PERSERODA
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Upload File
                </h2>
                <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Excel
                </span>
              </div>
              <div className="border-t border-slate-100 pt-4">
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
                <p className="mt-2 text-[11px] text-slate-500">
                  {file?.name || "Belum ada file dipilih."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm
                transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200
                disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Mengunggah..." : "Upload Data Cabang"}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Daftar Cabang Kantor
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Menampilkan kode kantor, nama cabang, dan alamat lengkap.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari kode/nama cabang..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={loadCabangList}
                    disabled={loadingList}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingList ? "Memuat..." : "Filter"}
                  </button>
                </div>
              </div>

              {!hasLoadedList && !loadingList ? (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Klik tombol Filter untuk menampilkan data cabang kantor.
                </div>
              ) : loadingList ? (
                <p className="mt-4 text-xs text-slate-500">Memuat data...</p>
              ) : filteredCabangList.length ? (
                <div className="mt-4 space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[840px] w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.2em] text-[10px]">
                            Kode Kantor
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.2em] text-[10px]">
                            Cabang Kantor
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.2em] text-[10px]">
                            Longitude
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.2em] text-[10px]">
                            Latitude
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.2em] text-[10px]">
                            Alamat Lengkap Kantor
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2 text-left uppercase tracking-[0.2em] text-[10px]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedCabangList.map((row, index) => (
                          <tr
                            key={`${row.kodeKantor || "cabang"}-${pageStart + index}`}
                            className={
                              (pageStart + index) % 2 ? "bg-slate-50/60" : "bg-white"
                            }
                          >
                            <td className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">
                              {row.kodeKantor || "-"}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2">
                              {row.cabangKantor || "-"}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">
                              {row.longitude || "-"}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2 whitespace-nowrap">
                              {row.latitude || "-"}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2">
                              {row.alamatKantor || "-"}
                            </td>
                            <td className="border-b border-slate-200 px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(row)}
                                className="rounded-md bg-secondary-600 px-3 py-1 text-[11px] text-white transition hover:bg-slate-800"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600">
                    <span>
                      Menampilkan{" "}
                      {Math.min(pageStart + 1, filteredCabangList.length)}-
                      {Math.min(
                        pageStart + pageSize,
                        filteredCabangList.length
                      )}{" "}
                      dari {filteredCabangList.length} data
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={safePage === 1}
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Sebelumnya
                      </button>
                      <span>
                        Halaman {safePage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={safePage === totalPages}
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  Belum ada data cabang kantor.
                </p>
              )}
            </div>
          </div>

          {isEditOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-800">
                  Edit Cabang Kantor
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Perbarui data cabang kantor dan simpan perubahan.
                </p>

                <div className="mt-4 grid gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">
                      Kode Kantor
                    </label>
                    <input
                      type="text"
                      value={editForm.kodeKantor}
                      readOnly
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">
                      Nama Kantor
                    </label>
                    <input
                      type="text"
                      value={editForm.namaKantor}
                      onChange={handleEditChange("namaKantor")}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={editForm.longitude}
                        onChange={handleEditChange("longitude")}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={editForm.latitude}
                        onChange={handleEditChange("latitude")}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">
                      Alamat Lengkap
                    </label>
                    <textarea
                      rows="3"
                      value={editForm.alamatLengkap}
                      onChange={handleEditChange("alamatLengkap")}
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
        </main>
      </div>
    </PageBackground>
  );
}
