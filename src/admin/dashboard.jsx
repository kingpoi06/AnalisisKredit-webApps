import React, { useEffect, useState } from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaBriefcase,
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAktivitas: 0,
    kreditAktif: 0,
    kreditPengajuan: 0,
  });

  const [listKredit, setListKredit] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");


  const apiUrl = "http://localhost:8080"; // backend

  /* ===============================
     🔐 AUTH & FETCH DASHBOARD
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      // set header axios
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      fetchDashboard();
    } catch (err) {
      console.error("Token error:", err);
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);

  /* ===============================
     📡 FETCH DASHBOARD DATA
  =============================== */
  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${apiUrl}/datanasabah/data-diri`);
      setStats({
        totalAktivitas: res.data.totalAktivitas,
        kreditAktif: res.data.kreditAktif,
        kreditPengajuan: res.data.kreditPengajuan,
      });
      setListKredit(res.data.listKredit || []);
    } catch (err) {
      console.error("Fetch dashboard gagal:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }
  
   /* ===============================
     🔍 FILTERED DATA
  =============================== */
  const filteredKredit =
    filterStatus === "ALL"
      ? listKredit
      : listKredit.filter(
          (item) => item.status === filterStatus
        );

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-16 md:pt-20 px-4 pb-10">
          {/* TITLE */}
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
              <FaBriefcase />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-gray-500">
                Selamat datang di sistem
              </p>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Aktivitas"
              value={stats.totalAktivitas}
              icon={<FaUsers />}
              color="indigo"
            />
            <StatCard
              title="Kredit Aktif"
              value={stats.kreditAktif}
              icon={<FaFileInvoiceDollar />}
              color="green"
            />
            <StatCard
              title="Kredit Tahap Pengajuan"
              value={stats.kreditPengajuan}
              icon={<FaFileInvoiceDollar />}
              color="yellow"
            />
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between">
              <h3 className="font-semibold">Monitoring Kredit</h3>
              <button
                onClick={() => navigate("/master-data/data-diri")}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                + Tambah Data
              </button>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">No</th>
                  <th className="px-6 py-3 text-left">Nama Nasabah</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {listKredit.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center">
                      Data belum tersedia
                    </td>
                  </tr>
                ) : (
                  listKredit.map((item, index) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4">{item.namalengkap}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-200 px-3 py-1 rounded-full text-xs">
                          {item.statusPengajuan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===============================
   🔹 COMPONENT CARD
=============================== */
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm flex gap-4">
    <div className={`bg-${color}-100 text-${color}-600 p-3 rounded-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  </div>
);