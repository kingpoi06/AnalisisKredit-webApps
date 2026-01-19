import React, { useState, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

/* =====================
   INPUT COMPONENT
===================== */
const Input = ({ label, type = "text", options = [], readOnly, ...props }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500">
      {label}
    </label>

    {type === "select" ? (
      <select
        {...props}
        className="w-full rounded-xl border border-gray-200
        px-4 py-3 text-sm bg-white shadow-sm
        focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
      >
        <option value="">Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        readOnly={readOnly}
        {...props}
        className={`w-full rounded-xl border px-4 py-3 text-sm shadow-sm
        ${
          readOnly
            ? "bg-gray-100 cursor-not-allowed text-gray-600"
            : "bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
        }`}
      />
    )}
  </div>
);

/* =====================
   CARD COMPONENT
===================== */
const Card = ({ title, icon, children }) => (
  <section
    className="bg-white rounded-2xl p-6 shadow-md
    border border-gray-100 space-y-6"
  >
    <div className="flex items-center gap-3 pb-4 border-b">
      <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-800 text-base">
        {title}
      </h3>
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
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
      bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
    >
      {children}
    </select>
  </div>
);

/* =====================
   PAGE
===================== */
export default function Permohonan() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    jenisKredit: "",
    tglInput: "",
  });

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* AUTH */
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

const handleSave = async () => {
  const required = ["jenisKredit", "tglInput"];
  const empty = required.filter((k) => !formData[k]);

  if (empty.length) {
    Swal.fire(
      "Data belum lengkap",
      `Field wajib belum diisi: ${empty.join(", ")}`,
      "warning"
    );
    return;
  }

  try {
    Swal.fire({
      title: "Menyimpan...",
      text: "Sedang generate nomor permohonan",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await axios.post(
      API_ENDPOINTS.generate.noPermohonan(), 
      {
        jenisKredit: formData.jenisKredit,
        tglInput: formData.tglInput,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    Swal.fire(
      "Berhasil",
      response.data?.msg || "Nomor Permohonan berhasil digenerate",
      "success"
    );

    navigate("/dashboard");
  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || err.message || "Gagal menyimpan",
      "error"
    );
  }
};


  return (
    <PageBackground>
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-5xl mx-auto">

          {/* TITLE */}
          <div className="mb-12 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
              <FaBriefcase size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Generate Antrian Permohonan
              </h1>
              <p className="text-sm text-gray-500">
                Form Pembuatan Nomor Permohonan Kredit
              </p>
            </div>
          </div>

          {/* CARD */}
          <div className="grid grid-cols-1 place-items-center">
            <div className="w-full md:w-2/3">
              <Card
                title="Generate Antrian Permohonan"
                icon={<FaUser />}
              >
                <Select
                label="Jenis Permohonan Kredit"
                value={formData.jenisKredit}
                onChange={(e) =>
                    updateForm("jenisKredit", e.target.value)
                }
                >
                <option value="">Pilih Jenis Kredit</option>
                <option value="121">121 - Kredit Modal Kerja</option>
                <option value="122">122 - Kredit Investasi</option>
                <option value="123">123 - Kredit Konsumtif / Pegawai</option>
                </Select>

                <Input
                  label="Tanggal Input"
                  type="date"
                  value={formData.tglInput}
                  onChange={(e) =>
                    updateForm("tglInput", e.target.value)
                  }
                />
              </Card>
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-12">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border bg-white text-sm hover:bg-gray-50"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800"
            >
              Simpan & Lanjut
            </button>
          </div>

        </main>
      </div>
    </PageBackground>
  );
}
