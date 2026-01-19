import React, { useState, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import {
  FaCalculator,
  FaChartLine,
  FaCoins,
  FaClipboardCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

/* =====================
   INPUT COMPONENT
===================== */
const Input = ({
  label,
  type = "text",
  readOnly,
  inputMode,
  className = "",
  ...props
}) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-600">
      {label}
    </label>
    <input
      type={type}
      readOnly={readOnly}
      inputMode={inputMode}
      {...props}
      className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm
      focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500
      ${readOnly ? "bg-gray-100 text-gray-600" : "bg-white"} ${className}`}
    />
  </div>
);

const Select = ({ label, value, onChange, children }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-600">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-sm
      bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-500"
    >
      {children}
    </select>
  </div>
);

/* =====================
   CARD COMPONENT
===================== */
const Card = ({ title, icon, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
      <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 text-base">
        {title}
      </h3>
    </div>
    <div className="pt-4 space-y-4">
      {children}
    </div>
  </section>
);

const formatIdInteger = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const formatIdNumber = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const formatPercent = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "";
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)}%`;
};

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const sanitizeInteger = (value) => value.replace(/\D/g, "");

const sanitizeDecimal = (value) => {
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");
  const decimalPart = decimalParts.join("");
  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
};

const buildAnuitasSchedule = ({
  principal,
  annualRate,
  months,
  graceType,
  provisi,
  admin,
}) => {
  const monthlyRate = annualRate / 100 / 12;
  const graceMonths = graceType === "0" ? 0 : 3;
  const provisiRp = principal * (provisi / 100);
  const pencairanBersih = principal - provisiRp - admin;

  const annuityPayment =
    monthlyRate === 0
      ? principal / months
      :
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let sisa = principal;
  let totalBunga = 0;
  let totalBayar = provisiRp + admin;
  const rows = [];

  for (let bln = 1; bln <= months; bln += 1) {
    const bungaBln = sisa * monthlyRate;
    let pokokBln = annuityPayment - bungaBln;
    let angsuran = annuityPayment;

    if (graceType !== "0" && bln <= graceMonths) {
      angsuran = bungaBln;
      pokokBln = 0;
    }

    sisa -= pokokBln;
    totalBunga += bungaBln;
    totalBayar += angsuran;

    rows.push({
      bulan: bln,
      angsuran,
      bunga: bungaBln,
      pokok: pokokBln,
      sisa: Math.max(sisa, 0),
    });
  }

  return {
    angsuranNormal: annuityPayment,
    totalBunga,
    totalBayar,
    danaCairBersih: pencairanBersih,
    provisiRp,
    rows,
  };
};

const buildFlatSchedule = ({ principal, months, rate, penghasilan }) => {
  const bungaPerBulan = principal * (rate / 100);
  const pokokPerBulan = principal / months;
  const angsuran = pokokPerBulan + bungaPerBulan;
  const totalBunga = bungaPerBulan * months;
  const totalBayar = principal + totalBunga;
  const danaCairBersih = principal;
  const dsr = penghasilan ? (angsuran / penghasilan) * 100 : 0;
  const keputusan = dsr <= 35 ? "Approve" : "Reject";

  const rows = [];
  for (let bln = 1; bln <= months; bln += 1) {
    rows.push({
      bulan: bln,
      pokok: pokokPerBulan,
      bunga: bungaPerBulan,
      angsuran,
      sisa: Math.max(principal - pokokPerBulan * bln, 0),
    });
  }

  return {
    angsuran,
    totalBunga,
    totalBayar,
    danaCairBersih,
    dsr,
    keputusan,
    keterangan:
      keputusan === "Approve"
        ? "DSR sesuai batas aman"
        : "DSR melebihi batas aman",
    rows,
  };
};

const buildProfitSummary = ({ penghasilan, angsuran }) => {
  const income = toNumber(penghasilan);
  const installment = toNumber(angsuran);
  if (!income || !installment) return null;
  const sisa = income - installment;
  const dsr = income ? (installment / income) * 100 : 0;
  return {
    income,
    installment,
    sisa,
    dsr,
    keputusan: dsr <= 35 ? "Approve" : "Reject",
  };
};

/* =====================
   PAGE
===================== */
export default function Kalkulator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("anuitas");

  const [anuitasForm, setAnuitasForm] = useState({
    pokok: "",
    bungaTahunan: "",
    tenor: "",
    grace: "0",
    provisi: "",
    admin: "",
    penghasilan: "",
  });

  const [flatForm, setFlatForm] = useState({
    plafon: "",
    tenor: "",
    bungaTahunan: "",
    bungaBulanan: "",
    penghasilan: "",
  });

  const [anuitasResult, setAnuitasResult] = useState(null);
  const [flatResult, setFlatResult] = useState(null);
  const hasAnuitasIncome = String(anuitasForm.penghasilan ?? "").trim() !== "";
  const hasFlatIncome = String(flatForm.penghasilan ?? "").trim() !== "";
  const anuitasProfit = buildProfitSummary({
    penghasilan: anuitasForm.penghasilan,
    angsuran: anuitasResult?.angsuranNormal,
  });
  const flatProfit = buildProfitSummary({
    penghasilan: flatForm.penghasilan,
    angsuran: flatResult?.angsuran,
  });

  useEffect(() => {
    const months = toNumber(flatForm.tenor);
    const annualRate = toNumber(flatForm.bungaTahunan);
    const computedRate =
      months && annualRate ? String(months / annualRate) : "";

    setFlatForm((prev) => {
      if (prev.bungaBulanan === computedRate) return prev;
      return { ...prev, bungaBulanan: computedRate };
    });
  }, [flatForm.tenor, flatForm.bungaTahunan]);

  const handleAnuitasChange = (field) => (event) => {
    setAnuitasForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAnuitasMoney = (field) => (event) => {
    setAnuitasForm((prev) => ({
      ...prev,
      [field]: sanitizeInteger(event.target.value),
    }));
  };

  const handleAnuitasDecimal = (field) => (event) => {
    setAnuitasForm((prev) => ({
      ...prev,
      [field]: sanitizeDecimal(event.target.value),
    }));
  };

  const handleFlatMoney = (field) => (event) => {
    setFlatForm((prev) => ({
      ...prev,
      [field]: sanitizeInteger(event.target.value),
    }));
  };

  const handleFlatDecimal = (field) => (event) => {
    setFlatForm((prev) => ({
      ...prev,
      [field]: sanitizeDecimal(event.target.value),
    }));
  };

  const handleHitungAnuitas = () => {
    const principal = toNumber(anuitasForm.pokok);
    const annualRate = toNumber(anuitasForm.bungaTahunan);
    const months = toNumber(anuitasForm.tenor);

    if (!principal || !annualRate || !months) {
      Swal.fire("Lengkapi Data", "Pokok, bunga, dan tenor wajib diisi.", "warning");
      return;
    }

    const provisi = toNumber(anuitasForm.provisi);
    const admin = toNumber(anuitasForm.admin);

    setAnuitasResult(
      buildAnuitasSchedule({
        principal,
        annualRate,
        months,
        graceType: anuitasForm.grace,
        provisi,
        admin,
      })
    );
  };

  const handleHitungFlat = () => {
    const principal = toNumber(flatForm.plafon);
    const months = toNumber(flatForm.tenor);
    const annualRate = toNumber(flatForm.bungaTahunan);
    const rate = toNumber(flatForm.bungaBulanan);
    const penghasilan = toNumber(flatForm.penghasilan);

    if (!principal || !months || !annualRate) {
      Swal.fire(
        "Lengkapi Data",
        "Plafon, tenor, dan bunga tahunan wajib diisi.",
        "warning"
      );
      return;
    }

    setFlatResult(
      buildFlatSchedule({ principal, months, rate, penghasilan })
    );
  };

  return (
    <div className="kalkulator-page min-h-screen bg-[#f7f4ef] relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .kalkulator-page {
          font-family: 'Space Grotesk', sans-serif;
        }
        .kalkulator-title {
          font-family: 'DM Serif Display', serif;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
        }
        .fade-up {
          animation: fadeUp 0.6s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="absolute -top-32 -right-28 h-64 w-64 rounded-full bg-[#f7c77a] opacity-40" />
      <div className="absolute top-40 -left-20 h-64 w-64 rounded-full bg-[#94d4d2] opacity-40" />
      <div className="absolute bottom-12 right-12 h-32 w-32 rounded-full bg-[#f2ad5c] opacity-30" />

      <Sidebar />
      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-6xl mx-auto relative">
          <div className="glass-panel rounded-[28px] border border-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.12)] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 fade-up">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#1f6f78] text-white flex items-center justify-center shadow-lg">
                  <FaCalculator size={18} />
                </div>
                <div>
                  <h1 className="kalkulator-title text-2xl text-slate-800">
                    Kalkulator Kredit
                  </h1>
                  <p className="text-sm text-slate-500">
                    Simulasikan skema flat atau anuitas untuk keputusan cepat.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("anuitas")}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    activeTab === "anuitas"
                      ? "bg-[#1f6f78] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Anuitas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("flat")}
                  className={`px-4 py-2 text-sm rounded-full transition ${
                    activeTab === "flat"
                      ? "bg-[#1f6f78] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Flat
                </button>
              </div>
            </div>

            {activeTab === "anuitas" ? (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)] fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="space-y-6">
                  <Card title="Ringkasan Anuitas" icon={<FaClipboardCheck />}>
                    {anuitasResult ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Angsuran Normal</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(anuitasResult.angsuranNormal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Bunga</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(anuitasResult.totalBunga)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Pembayaran</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(anuitasResult.totalBayar)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Dana Cair Bersih</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(anuitasResult.danaCairBersih)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Masukkan data dan klik hitung untuk melihat ringkasan.
                      </p>
                    )}
                  </Card>

                  <Card title="Rincian Angsuran" icon={<FaCoins />}>
                    {anuitasResult ? (
                      <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-100">
                        <table className="min-w-full text-xs text-right">
                          <thead className="bg-slate-50 text-slate-500 sticky top-0">
                            <tr>
                              <th className="py-2 px-3 text-center">Bln</th>
                              <th className="py-2 px-3">Angsuran</th>
                              <th className="py-2 px-3">Bunga</th>
                              <th className="py-2 px-3">Pokok</th>
                              <th className="py-2 px-3">Sisa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {anuitasResult.rows.map((row) => (
                              <tr key={row.bulan} className="border-t border-slate-100">
                                <td className="py-2 px-3 text-center text-slate-500">
                                  {row.bulan}
                                </td>
                                <td className="py-2 px-3">{formatIdNumber(row.angsuran)}</td>
                                <td className="py-2 px-3">{formatIdNumber(row.bunga)}</td>
                                <td className="py-2 px-3">{formatIdNumber(row.pokok)}</td>
                                <td className="py-2 px-3">{formatIdNumber(row.sisa)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Tabel akan muncul setelah perhitungan.
                      </p>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card title="Input Anuitas" icon={<FaChartLine />}>
                    <Input
                      label="Plafon Pinjaman (Rp)"
                      type="text"
                      value={formatIdInteger(anuitasForm.pokok)}
                      onChange={handleAnuitasMoney("pokok")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Bunga per Tahun (%)"
                      type="text"
                      value={anuitasForm.bungaTahunan}
                      onChange={handleAnuitasDecimal("bungaTahunan")}
                      inputMode="decimal"
                    />
                    <Input
                      label="Tenor (Bulan)"
                      type="text"
                      value={formatIdInteger(anuitasForm.tenor)}
                      onChange={handleAnuitasMoney("tenor")}
                      inputMode="numeric"
                    />
                    <Select
                      label="Grace Period"
                      value={anuitasForm.grace}
                      onChange={handleAnuitasChange("grace")}
                    >
                      <option value="0">Tanpa Grace Period</option>
                      <option value="bunga">Bayar Bunga Saja (3 bulan)</option>
                      <option value="pokok">Tunda Pokok (3 bulan)</option>
                    </Select>
                    <Input
                      label="Biaya Provisi (%)"
                      type="text"
                      value={anuitasForm.provisi}
                      onChange={handleAnuitasDecimal("provisi")}
                      inputMode="decimal"
                    />
                    <Input
                      label="Biaya Administrasi (Rp)"
                      type="text"
                      value={formatIdInteger(anuitasForm.admin)}
                      onChange={handleAnuitasMoney("admin")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Penghasilan Bersih per Bulan (Rp)"
                      type="text"
                      value={formatIdInteger(anuitasForm.penghasilan)}
                      onChange={handleAnuitasMoney("penghasilan")}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={handleHitungAnuitas}
                      className="w-full rounded-xl bg-[#1f6f78] text-white py-2.5 text-sm font-semibold shadow-md hover:bg-[#185e64] transition"
                    >
                      Hitung Anuitas
                    </button>
                  </Card>

                  {hasAnuitasIncome ? (
                    <Card title="Profit Nasabah" icon={<FaChartLine />}>
                      {anuitasProfit ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-slate-500">Penghasilan Bersih</p>
                            <p className="text-base font-semibold text-slate-800">
                              Rp {formatIdNumber(anuitasProfit.income)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Angsuran / Bulan</p>
                            <p className="text-base font-semibold text-slate-800">
                              Rp {formatIdNumber(anuitasProfit.installment)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Sisa Profit</p>
                            <p
                              className={`text-base font-semibold ${
                                anuitasProfit.sisa >= 0 ? "text-emerald-700" : "text-red-600"
                              }`}
                            >
                              Rp {formatIdNumber(anuitasProfit.sisa)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">DSR</p>
                            <p className="text-base font-semibold text-slate-800">
                              {formatPercent(anuitasProfit.dsr)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Keputusan</p>
                            <p
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                anuitasProfit.keputusan === "Approve"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {anuitasProfit.keputusan}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Masukkan penghasilan dan hitung untuk melihat profit.
                        </p>
                      )}
                    </Card>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)] fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="space-y-6">
                  <Card title="Ringkasan Flat" icon={<FaClipboardCheck />}>
                    {flatResult ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Angsuran Normal</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(flatResult.angsuran)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Bunga</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(flatResult.totalBunga)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Pembayaran</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(flatResult.totalBayar)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Dana Cair Bersih</p>
                          <p className="text-base font-semibold text-slate-800">
                            Rp {formatIdNumber(flatResult.danaCairBersih)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Masukkan data dan klik hitung untuk melihat hasil analisa.
                      </p>
                    )}
                  </Card>

                  <Card title="Rincian Angsuran" icon={<FaCoins />}>
                    {flatResult ? (
                      <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-100">
                        <table className="min-w-full text-xs text-right">
                          <thead className="bg-slate-50 text-slate-500 sticky top-0">
                            <tr>
                              <th className="py-2 px-3 text-center">Bln</th>
                              <th className="py-2 px-3">Pokok</th>
                              <th className="py-2 px-3">Bunga</th>
                              <th className="py-2 px-3">Angsuran</th>
                              <th className="py-2 px-3">Sisa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {flatResult.rows.map((row) => (
                              <tr key={row.bulan} className="border-t border-slate-100">
                                <td className="py-2 px-3 text-center text-slate-500">
                                  {row.bulan}
                                </td>
                                <td className="py-2 px-3">{formatIdNumber(row.pokok)}</td>
                                <td className="py-2 px-3">{formatIdNumber(row.bunga)}</td>
                                <td className="py-2 px-3">{formatIdNumber(row.angsuran)}</td>
                                <td className="py-2 px-3">{formatIdNumber(row.sisa)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Tabel akan muncul setelah perhitungan.
                      </p>
                    )}
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card title="Input Flat" icon={<FaChartLine />}>
                    <Input
                      label="Plafon (Rp)"
                      type="text"
                      value={formatIdInteger(flatForm.plafon)}
                      onChange={handleFlatMoney("plafon")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Tenor (Bulan)"
                      type="text"
                      value={formatIdInteger(flatForm.tenor)}
                      onChange={handleFlatMoney("tenor")}
                      inputMode="numeric"
                    />
                    <Input
                      label="Bunga Flat / Tahun (%)"
                      type="text"
                      value={flatForm.bungaTahunan}
                      onChange={handleFlatDecimal("bungaTahunan")}
                      inputMode="decimal"
                    />
                    <Input
                      label="Bunga Flat / Bulan (%)"
                      type="text"
                      value={formatIdNumber(flatForm.bungaBulanan)}
                      readOnly
                    />
                    <Input
                      label="Penghasilan Bersih per Bulan (Rp)"
                      type="text"
                      value={formatIdInteger(flatForm.penghasilan)}
                      onChange={handleFlatMoney("penghasilan")}
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={handleHitungFlat}
                      className="w-full rounded-xl bg-[#1f6f78] text-white py-2.5 text-sm font-semibold shadow-md hover:bg-[#185e64] transition"
                    >
                      Hitung Flat
                    </button>
                  </Card>

                  {hasFlatIncome ? (
                    <Card title="Profit Nasabah" icon={<FaChartLine />}>
                      {flatProfit ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-slate-500">Penghasilan Bersih</p>
                            <p className="text-base font-semibold text-slate-800">
                              Rp {formatIdNumber(flatProfit.income)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Angsuran / Bulan</p>
                            <p className="text-base font-semibold text-slate-800">
                              Rp {formatIdNumber(flatProfit.installment)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Sisa Profit</p>
                            <p
                              className={`text-base font-semibold ${
                                flatProfit.sisa >= 0 ? "text-emerald-700" : "text-red-600"
                              }`}
                            >
                              Rp {formatIdNumber(flatProfit.sisa)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">DSR</p>
                            <p className="text-base font-semibold text-slate-800">
                              {formatPercent(flatProfit.dsr)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Keputusan</p>
                            <p
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                flatProfit.keputusan === "Approve"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {flatProfit.keputusan}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Masukkan penghasilan dan hitung untuk melihat profit.
                        </p>
                      )}
                    </Card>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-end">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 rounded-xl border border-slate-300 bg-white text-sm hover:bg-slate-50"
              >
                Kembali
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
