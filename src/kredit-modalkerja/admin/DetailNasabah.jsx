import React, { useEffect, useState } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase, FaUser, FaMapMarkedAlt, FaMoneyBillWave } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

export default function printPDFStatus() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [formDataUsaha, setFormDataUsaha] = useState({});
  const [formDataJaminan, setFormDataJaminan] = useState({});


  // 🔐 AUTH
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

  // 📡 FETCH DATA NASABAH
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.datanasabah.dataDiri.list());
      setFormData(res.data.Data[0] || {});
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", "Gagal mengambil data nasabah", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


const fetchDataUsaha = async () => {
  setLoading(true);
  try {
    const res = await axios.get(API_ENDPOINTS.datanasabah.dataUsaha.list());
    setFormDataUsaha(res.data.Data?.[0]?.[0] || {});
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Gagal mengambil data usaha nasabah", "error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDataUsaha();
}, []);

const fetchDataJaminan = async () => {
  setLoading(true);
  try {
    const res = await axios.get(API_ENDPOINTS.datanasabah.dataJaminan.list());
    setFormDataJaminan(res.data.Data?.[0]?.[0] || {});
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Gagal mengambil data Jaminan nasabah", "error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchDataJaminan();
}, []);
  

  // Fungsi untuk render label + value
  const RenderField = ({ label, value }) => (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500">{label}</label>
      <p className="mt-1 text-gray-700 bg-gray-100 rounded-xl px-4 py-2">{value || "-"}</p>
    </div>
  );

  return (
    <PageBackground>
      <Sidebar />
      <div className="md:ml-64">
        <Header />
        <main className="pt-16 md:pt-20 px-4 md:px-8 pb-14 max-w-7xl mx-auto">

          {/* PAGE TITLE */}
          <div className="mb-10 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg flex items-center justify-center">
              <FaBriefcase size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Data Diri Nasabah</h1>
              <p className="text-sm text-gray-500">Detail data nasabah {formData.namalengkap}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <img
                src="/bpr.png"
                alt="Logo BPR"
                className="h-16 w-16 object-contain"
              />
              <p className="mt-2 text-sm font-semibold text-gray-600">
                Mohon ditunggu...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* DATA PRIBADI */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaUser className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700 text-lg">Data Pribadi</h2>
                </div>
                <RenderField label="Nama Lengkap" value={formData.namalengkap} />
                <RenderField label="Tempat Lahir" value={formData.tempatlahir} />
                <RenderField label="Tanggal Lahir" value={formData.tanggallahir} />
                <RenderField label="Jenis Kelamin" value={formData.jeniskelamin} />
                <RenderField label="NIK" value={formData.nik} />
                <RenderField label="Agama" value={formData.agama} />
                <RenderField label="Kewarganegaraan" value={formData.kewarganegaraan} />
                <RenderField label="No HP" value={formData.nohp} />
                <RenderField label="Status Perkawinan" value={formData.statusperkawinan} />
              </div>

              {/* ALAMAT DOMISILI */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaMapMarkedAlt className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700 text-lg">Alamat Domisili</h2>
                </div>
                <RenderField label="Alamat Lengkap" value={formData.alamatlengkap} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RenderField label="RT" value={formData.rt} />
                  <RenderField label="RW" value={formData.rw} />
                </div>
                <RenderField label="Desa / Kelurahan" value={formData.desakelurahan} />
                <RenderField label="Kecamatan" value={formData.kecamatan} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RenderField label="Kabupaten" value={formData.kabupaten} />
                  <RenderField label="Provinsi" value={formData.provinsi} />
                </div>
                <RenderField label="Jenis Alamat Domisili" value={formData.jenisalamat} />
              </div>

              {/* PEKERJAAN & KEUANGAN */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaMoneyBillWave className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700 text-lg">Data Pekerjaan & Keuangan</h2>
                </div>
                <RenderField label="Jenis Pekerjaan" value={formData.jenispekerjaan} />
                <RenderField label="Nama Usaha" value={formData.namausaha} />
                <RenderField label="Lama Bekerja (Tahun)" value={formData.lamabekerja} />
                <RenderField label="Penghasilan Perbulan" value={formData.penghasilanperbulan} />
                <RenderField label="Alamat Pekerjaan" value={formData.alamatpekerjaan} />
                <RenderField label="Penghasilan Tambahan" value={formData.penghasilantambahan} />
                <RenderField label="Total Penghasilan" value={formData.totalpenghasilan} />
                <RenderField label="Pengeluaran Bulanan" value={formData.pengeluaranbulanan} />
                <RenderField label="Cicilan" value={formData.cicilan} />
              </div>

              {/* DATA USAHA */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaBriefcase className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700 text-lg">Data Usaha</h2>
                </div>
                <RenderField label="Nama Usaha" value={formDataUsaha.namausaha} />
                <RenderField label="Jenis Usaha" value={formDataUsaha.jenisusaha} />
                <RenderField label="Bidang Usaha" value={formDataUsaha.bidangusaha} />
                <RenderField label="Bentuk Usaha" value={formDataUsaha.bentukusaha} />
                <RenderField label="Status Kepemilikan" value={formDataUsaha.statuskepemilikan} />
                <RenderField label="Alamat Lengkap" value={formDataUsaha.alamatlengkap} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RenderField label="RT" value={formDataUsaha.rt} />
                  <RenderField label="RW" value={formDataUsaha.rw} />
                </div>
                <RenderField label="Desa / Kelurahan" value={formDataUsaha.desakelurahan} />
                <RenderField label="Kecamatan" value={formDataUsaha.kecamatan} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RenderField label="Kabupaten / Kota" value={formDataUsaha.kabupatenkota} />
                  <RenderField label="Provinsi" value={formDataUsaha.provinsi} />
                </div>
                <RenderField label="Jenis Alamat Usaha" value={formDataUsaha.jenisalamatusaha} />
                <RenderField label="Titik Maps" value={formDataUsaha.titikmaps} />

                {/* Legalitas & Foto */}
                <RenderField label="NIB" value={formDataUsaha.nib} />
                <RenderField label="NPWP" value={formDataUsaha.npwp} />
                <RenderField label="SIUP" value={formDataUsaha.siup} />
                <RenderField label="Izin Khusus" value={formDataUsaha.izinkhusus} />
              </div>

              {/* DOKUMENTASAI LEGALITAS */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaBriefcase className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700 text-lg">DOKUMENTASI LEGALITAS</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto KTP</label>
                    {formDataUsaha.fotoKTP ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotoKTP || "")} alt="fotoKTP" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Selfie KTP</label>
                    {formDataUsaha.selfieKTP ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.selfieKTP)} alt="Selfie KTP" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto NPWP</label>
                    {formDataUsaha.fotoNPWP ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotoNPWP)} alt="NPWP" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto NIB</label>
                    {formDataUsaha.fotoNIB ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotoNIB)} alt="NIB" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto Usaha Bagian Depan</label>
                    {formDataUsaha.fotodepan ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotodepan)} alt="fotodepan" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto Usaha Bagian Belakang</label>
                    {formDataUsaha.fotobelakang ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotobelakang)} alt="fotobelakang" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto Usaha Bagian Kiri</label>
                    {formDataUsaha.fotokiri ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotokiri)} alt="fotokiri" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto Usaha Bagian Kanang</label>
                    {formDataUsaha.fotokanan ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotokanan)} alt="fotokanan" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Foto Usaha Bagian Dalam</label>
                    {formDataUsaha.fotodalam ? (
                      <img src={API_ENDPOINTS.uploads(formDataUsaha.fotodalam)} alt="fotodalam" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                </div>
              </div>

              {/* DATA AGUNAN */}
              <div className="bg-white shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaBriefcase className="text-blue-600" />
                  <h2 className="font-semibold text-gray-700 text-lg">Data AGUNAN NASABAH</h2>
                </div>
                <RenderField label="Jenis Jaminan" value={formDataJaminan.jenisjaminan} />
                <RenderField label="Hubungan Dengan Nasabah" value={formDataJaminan.hubungandengannasabah} />
                <RenderField label="No ID Agunan" value={formDataJaminan.noidAgunan} />
                <RenderField label="Deskripsi Agunan" value={formDataJaminan.deskripsiAgunan} />
                <RenderField label="Nilai Agunan" value={formDataJaminan.nilaiAgunan} />
                <div>
                    <label className="block text-xs font-semibold text-gray-500">Dokumentasi Agunan</label>
                    {formDataJaminan.dokumentasiAgunan ? (
                      <img src={API_ENDPOINTS.uploads(formDataJaminan.dokumentasiAgunan)} alt="Dokumentasi Agunan" className="rounded-lg shadow-md w-48 h-48 object-cover" />
                    ) : "-"}
                  </div>
                <RenderField label="Status Agunan" value={formDataJaminan.statusAgunan} />
              </div>
            </div>
          )}
          {/* BUTTON KEMBALI */}
          <div className="flex justify-end gap-4 mt-12">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50"
            >
              Kembali
            </button>
          </div>
        </main>
      </div>
    </PageBackground>
  );
}
