import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatIdInteger = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const formatIdNumber = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = toNumber(value);
  if (!Number.isFinite(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const normalizeList = (data) => {
  if (!Array.isArray(data)) return data ? [data] : [];
  return Array.isArray(data[0]) ? data.flat() : data;
};

const matchByPermohonan = (list, noPermohonan) =>
  list.find(
    (item) => String(item?.no_permohonan ?? item?.noPermohonan) === noPermohonan
  );

const Row = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 text-sm">
    <div className="col-span-12 sm:col-span-4 text-gray-500">{label}</div>
    <div className="col-span-12 sm:col-span-8 text-gray-900">{value || "-"}</div>
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="border-b border-gray-300 pb-1 mb-3">
    <h2 className="text-sm font-semibold text-gray-800 uppercase">
      {children}
    </h2>
  </div>
);

export default function PrintPDFKomite() {
  const navigate = useNavigate();
  const { no_permohonan } = useParams();
  const contentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    permohonan: null,
    dataDiri: null,
    dataPermohonan: null,
    dataUsaha: null,
    dataAnalisis: null,
    dataJaminan: [],
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("accessToken");
        navigate("/");
        return;
      }

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } catch {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (!no_permohonan) return;

    const fetchData = async () => {
      try {
        const [
          permohonanRes,
          dataDiriRes,
          dataPermohonanRes,
          dataUsahaRes,
          dataJaminanRes,
          dataAnalisisRes,
        ] = await Promise.all([
          axios.get(API_ENDPOINTS.generate.noPermohonan()),
          axios.get(API_ENDPOINTS.datanasabah.dataDiri.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataPermohonan.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataUsaha.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataJaminan.list()),
          axios.get(API_ENDPOINTS.datanasabah.dataAnalisis.list()),
        ]);

        const permohonanList = normalizeList(permohonanRes.data?.Data);
        const dataDiriList = normalizeList(dataDiriRes.data?.Data);
        const dataPermohonanList = normalizeList(
          dataPermohonanRes.data?.Data
        );
        const dataUsahaList = normalizeList(dataUsahaRes.data?.Data);
        const dataJaminanList = normalizeList(dataJaminanRes.data?.Data);
        const dataAnalisisList = normalizeList(dataAnalisisRes.data?.Data);

        setReportData({
          permohonan: matchByPermohonan(permohonanList, no_permohonan),
          dataDiri: matchByPermohonan(dataDiriList, no_permohonan),
          dataPermohonan: matchByPermohonan(dataPermohonanList, no_permohonan),
          dataUsaha: matchByPermohonan(dataUsahaList, no_permohonan),
          dataAnalisis: matchByPermohonan(dataAnalisisList, no_permohonan),
          dataJaminan: dataJaminanList.filter(
            (item) =>
              String(item?.no_permohonan ?? item?.noPermohonan) ===
              no_permohonan
          ),
        });
      } catch (error) {
        Swal.fire(
          "Gagal",
          error.response?.data?.msg || "Gagal mengambil data PDF",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [no_permohonan]);

  const handleDownload = async () => {
    if (!contentRef.current) return;

    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 10,
      filename: `Nota-Analisa-${no_permohonan}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(contentRef.current).save();
  };

  const permohonan = reportData.permohonan || {};
  const dataDiri = reportData.dataDiri || {};
  const dataPermohonan = reportData.dataPermohonan || {};
  const dataUsaha = reportData.dataUsaha || {};
  const dataAnalisis = reportData.dataAnalisis || {};
  const dataJaminan = reportData.dataJaminan || [];

  const kesimpulan = dataPermohonan.plafonPermohonan
    ? `DAPAT diberikan KREDIT sebesar Rp ${formatIdNumber(
        dataPermohonan.plafonPermohonan
      )} Jangka Waktu ${dataPermohonan.jangkaWaktuKredit || "-"} bulan`
    : "-";

  return (
    <PageBackground>
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Nota Analisa Kredit
              </h1>
              <p className="text-sm text-gray-500">
                No Permohonan: {no_permohonan || "-"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50"
              >
                Kembali
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-900"
              >
                Download PDF
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
              Memuat data...
            </div>
          ) : (
            <div
              ref={contentRef}
              className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 text-sm text-gray-800"
            >
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold uppercase">
                  Nota Analisa Kredit
                </h2>
                <p>No. Permohonan: {no_permohonan || "-"}</p>
                <p>Tanggal: {formatDate(permohonan.tglInput || permohonan.createdAt)}</p>
              </div>

              <section>
                <SectionTitle>I. Data Debitur / Calon Debitur</SectionTitle>
                <div className="space-y-2">
                  <Row label="Nama Debitur" value={dataDiri.namaLengkap} />
                  <Row label="NIK" value={dataDiri.nik} />
                  <Row
                    label="Tempat, Tgl Lahir"
                    value={
                      dataDiri.tempatLahir || dataDiri.tanggalLahir
                        ? `${dataDiri.tempatLahir || "-"}, ${formatDate(
                            dataDiri.tanggalLahir
                          )}`
                        : "-"
                    }
                  />
                  <Row label="No. HP" value={dataDiri.kontakPribadi} />
                  <Row label="Pekerjaan" value={dataDiri.jenispekerjaan} />
                  <Row
                    label="Alamat"
                    value={dataDiri.alamatLengkap || dataDiri.alamat}
                  />
                  <Row label="Status Perkawinan" value={dataDiri.statusPerkawinan} />
                  <Row label="Nama Ibu Kandung" value={dataDiri.namaIbuKandung} />
                </div>
              </section>

              <section>
                <SectionTitle>II. Data Fasilitas dan Aktivitas</SectionTitle>
                <div className="space-y-2">
                  <Row
                    label="Jenis Kredit"
                    value={dataPermohonan.jenisKredit}
                  />
                  <Row
                    label="Tujuan Penggunaan Kredit"
                    value={dataPermohonan.tujuanPenggunaanKredit}
                  />
                  <Row
                    label="Plafon"
                    value={
                      dataPermohonan.plafonPermohonan
                        ? `Rp ${formatIdNumber(dataPermohonan.plafonPermohonan)}`
                        : "-"
                    }
                  />
                  <Row
                    label="Jangka Waktu"
                    value={
                      dataPermohonan.jangkaWaktuKredit
                        ? `${dataPermohonan.jangkaWaktuKredit} Bulan`
                        : "-"
                    }
                  />
                  <Row
                    label="Suku Bunga / Tahun"
                    value={
                      dataPermohonan.sukuBungaTahun
                        ? `${formatIdNumber(dataPermohonan.sukuBungaTahun)}%`
                        : "-"
                    }
                  />
                  <Row
                    label="Suku Bunga / Bulan"
                    value={
                      dataPermohonan.sukuBungaBulan
                        ? `${formatIdNumber(dataPermohonan.sukuBungaBulan)}%`
                        : "-"
                    }
                  />
                  <Row
                    label="Cara Perhitungan"
                    value={dataPermohonan.perhitunganBunga}
                  />
                  <Row
                    label="Sumber Pengembalian"
                    value={dataPermohonan.sumberPengembalian}
                  />
                  <Row
                    label="Cara Angsuran Kredit"
                    value={dataPermohonan.caraAngsuranKredit}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-gray-700">
                    Data Usaha
                  </h3>
                  <Row label="Nama Usaha" value={dataUsaha.namaUsaha} />
                  <Row label="Jenis Usaha" value={dataUsaha.jenisUsaha} />
                  <Row label="Bidang Usaha" value={dataUsaha.bidangUsaha} />
                  <Row label="Bentuk Usaha" value={dataUsaha.statusUsaha} />
                  <Row label="Alamat Usaha" value={dataUsaha.alamatUsaha} />
                </div>
              </section>

              <section>
                <SectionTitle>III. Analisa 5C</SectionTitle>
                <div className="space-y-2">
                  <Row label="Character" value={dataAnalisis.character} />
                  <Row label="Capital" value={dataAnalisis.capital1} />
                  <Row label="Capacity" value={dataAnalisis.capacity1} />
                  <Row label="Condition" value={dataAnalisis.capacity2} />
                  <Row label="Collateral" value={dataAnalisis.capacity3} />
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-gray-700">Pendapatan</h3>
                  <Row
                    label="Omzet Per Bulan"
                    value={
                      dataAnalisis.omsetPerbulan
                        ? `Rp ${formatIdNumber(dataAnalisis.omsetPerbulan)}`
                        : "-"
                    }
                  />
                  <Row
                    label="Harga Pokok Penjualan"
                    value={
                      dataAnalisis.hargaPokokPenjualan
                        ? `Rp ${formatIdNumber(
                            dataAnalisis.hargaPokokPenjualan
                          )}`
                        : "-"
                    }
                  />
                  <Row
                    label="Jumlah Pendapatan"
                    value={
                      dataAnalisis.jumlahPendapatan
                        ? `Rp ${formatIdNumber(dataAnalisis.jumlahPendapatan)}`
                        : "-"
                    }
                  />
                  <Row
                    label="Laba Netto"
                    value={
                      dataAnalisis.labaNettoLainnya
                        ? `Rp ${formatIdNumber(dataAnalisis.labaNettoLainnya)}`
                        : "-"
                    }
                  />
                </div>
              </section>

              <section>
                <SectionTitle>IV. Jaminan</SectionTitle>
                {dataJaminan.length === 0 ? (
                  <p className="text-gray-500">Belum ada data jaminan.</p>
                ) : (
                  dataJaminan.map((jaminan, index) => (
                    <div key={index} className="mb-4 space-y-2">
                      <h3 className="font-semibold text-gray-700">
                        Jaminan {index + 1} - {jaminan.jenisjaminan || "-"}
                      </h3>
                      <Row label="Nomor ID Agunan" value={jaminan.noidAgunan} />
                      <Row label="Deskripsi" value={jaminan.deskripsiAgunan} />
                      {jaminan.jenisjaminan === "Sertifikat" && (
                        <>
                          <Row label="Jenis Sertifikat" value={jaminan.jenisSertifikat} />
                          <Row label="No Sertifikat" value={jaminan.noSertifikat} />
                          <Row label="Letak" value={jaminan.letak} />
                          <Row
                            label="Luas"
                            value={
                              jaminan.luas
                                ? `${formatIdNumber(jaminan.luas)}`
                                : "-"
                            }
                          />
                          <Row
                            label="Taksiran Pasar"
                            value={
                              jaminan.taksiranPasar
                                ? `Rp ${formatIdNumber(jaminan.taksiranPasar)}`
                                : "-"
                            }
                          />
                          <Row
                            label="Nilai PPAP"
                            value={
                              jaminan.nilaiPPAP
                                ? `Rp ${formatIdNumber(jaminan.nilaiPPAP)}`
                                : "-"
                            }
                          />
                          <Row
                            label="Nilai NJOP"
                            value={
                              jaminan.nilaiNJOP
                                ? `Rp ${formatIdNumber(jaminan.nilaiNJOP)}`
                                : "-"
                            }
                          />
                          <Row
                            label="Pengikatan Jaminan"
                            value={jaminan.pengikatanJaminan}
                          />
                        </>
                      )}
                      {jaminan.jenisjaminan === "BPKB" && (
                        <>
                          <Row label="Nama Pemilik" value={jaminan.namaPemilikBPKB} />
                          <Row label="Tipe BPKB" value={jaminan.tipeBPKB} />
                          <Row label="Pengikatan" value={jaminan.pengikatan} />
                          <Row
                            label="Rerata Nilai Pasar"
                            value={
                              jaminan.rerataNilaiPasar
                                ? `Rp ${formatIdNumber(
                                    jaminan.rerataNilaiPasar
                                  )}`
                                : "-"
                            }
                          />
                          <Row
                            label="Nilai Likuidasi"
                            value={
                              jaminan.nilaiLikuidasi
                                ? `Rp ${formatIdNumber(
                                    jaminan.nilaiLikuidasi
                                  )}`
                                : "-"
                            }
                          />
                          <Row label="No BPKB" value={jaminan.noBPKB} />
                          <Row label="Merek" value={jaminan.merek} />
                          <Row label="No Mesin" value={jaminan.noMesin} />
                          <Row label="No Rangka" value={jaminan.noRangka} />
                        </>
                      )}
                      {jaminan.jenisjaminan === "Deposito" && (
                        <>
                          <Row label="Nama Debitur" value={jaminan.namaDebitur} />
                          <Row label="No Bilyet" value={jaminan.noBilyet} />
                          <Row label="Tipe Deposito" value={jaminan.tipeDeposito} />
                          <Row
                            label="Nilai Pasar"
                            value={
                              jaminan.nilaiPasarDeposit
                                ? `Rp ${formatIdNumber(
                                    jaminan.nilaiPasarDeposit
                                  )}`
                                : "-"
                            }
                          />
                        </>
                      )}
                      {jaminan.jenisjaminan === "Tabungan" && (
                        <>
                          <Row label="Tipe Tabungan" value={jaminan.tipeTabungan} />
                          <Row label="Lokasi Jaminan" value={jaminan.lokasiJaminan} />
                          <Row label="No Rekening" value={jaminan.noRekening} />
                        </>
                      )}
                    </div>
                  ))
                )}
              </section>

              <section>
                <SectionTitle>V. Kesimpulan & Usulan AO</SectionTitle>
                <div className="space-y-2">
                  <Row
                    label="Pertimbangan Kewajiban Bank Lain"
                    value={dataAnalisis.pertimbanganKewajiban || "-"}
                  />
                  <Row
                    label="Pertimbangan"
                    value={dataAnalisis.pertimbangan || "-"}
                  />
                  <Row label="Kesimpulan" value={kesimpulan} />
                </div>
                <div className="mt-3 space-y-2">
                  <Row
                    label="Pokok (Anuitas)"
                    value={
                      dataAnalisis.pokokPerBulan
                        ? `Rp ${formatIdNumber(dataAnalisis.pokokPerBulan)}`
                        : "-"
                    }
                  />
                  <Row
                    label="Bunga (Anuitas)"
                    value={
                      dataAnalisis.totalBungaPerbulan
                        ? `Rp ${formatIdNumber(dataAnalisis.totalBungaPerbulan)}`
                        : "-"
                    }
                  />
                  <Row
                    label="Total (Anuitas)"
                    value={
                      dataAnalisis.angsuranPembiayaan
                        ? `Rp ${formatIdNumber(dataAnalisis.angsuranPembiayaan)}`
                        : "-"
                    }
                  />
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </PageBackground>
  );
}
