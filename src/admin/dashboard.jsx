import React from "react";
import Sidebar from "../component/sidebar";
import Header from "../component/header";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaBriefcase,
} from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="md:ml-64">
        <Header />

        <main className="pt-16 md:pt-20 px-4 sm:px-6 md:px-8 pb-10">
          {/* PAGE TITLE */}
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
              <FaBriefcase className="text-lg md:text-xl" />
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Selamat datang di sistem
              </p>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">

            {/* TOTAL AKTIVITAS */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex items-center gap-4">
              <div className="bg-indigo-100 text-indigo-600 p-3 md:p-4 rounded-lg">
                <FaUsers className="text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">
                  Total Aktivitas
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  0
                </h2>
              </div>
            </div>

            {/* KREDIT AKTIF */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 md:p-4 rounded-lg">
                <FaFileInvoiceDollar className="text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">
                  Kredit Aktif
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  0
                </h2>
              </div>
            </div>

            {/* KREDIT TAHAP PENGAJUAN */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex items-center gap-4">
              <div className="bg-yellow-100 text-yellow-600 p-3 md:p-4 rounded-lg">
                <FaFileInvoiceDollar className="text-lg md:text-xl" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-500">
                  Kredit Tahap Pengajuan
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  0
                </h2>
              </div>
            </div>

          </div>

          {/* TABLE SECTION */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-700">
                Monitoring Kredit
              </h3>

              <button
                onClick={() => navigate("/master-data/data-diri")}
                className="bg-indigo-600 hover:bg-indigo-700
                text-white px-4 py-2 rounded-md text-sm transition
                w-full sm:w-auto"
              >
                + Tambah Data
              </button>
            </div>

            {/* MOBILE */}
            <div className="block md:hidden p-4 space-y-4">
              <div className="border rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">No</span>
                  <span className="font-medium">1</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nama Nasabah</span>
                  <span className="font-medium">—</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    Belum Ada
                  </span>
                </div>
              </div>
            </div>

            {/* DESKTOP */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">No</th>
                    <th className="px-6 py-3 text-left font-medium">
                      Nama Nasabah
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      Status Pengajuan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t hover:bg-gray-50 transition">
                    <td className="px-6 py-4">1</td>
                    <td className="px-6 py-4">—</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        Belum Ada
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
