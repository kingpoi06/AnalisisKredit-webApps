import React, { useState, useMemo } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import { FaCalculator, FaCoins, FaClipboardCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

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
    <label className="text-xs font-semibold text-gray-600">{label}</label>
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
    <label className="text-xs font-semibold text-gray-600">{label}</label>
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
      <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
    </div>
    <div className="pt-4 space-y-4">{children}</div>
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

const TABUNGAN_PRODUCTS = [
  {
    key: "tabunganku",
    label: "TabunganKu",
    rate: 3,
    initialDeposit: 10000,
    note: "Setoran awal Rp 10.000",
  },
  {
    key: "simbada",
    label: "Tabungan Simbada",
    rate: 5,
    initialDeposit: 100000,
    note: "Setoran awal mulai Rp 100.000",
  },
  {
    key: "siswa",
    label: "Tabungan Siswa",
    rate: 4,
    initialDeposit: null,
    note: "Setoran awal sesuai ketentuan",
  },
  {
    key: "deposito",
    label: "Deposito Berjangka",
    rateMin: 5,
    tenors: [1, 3, 6, 12],
    minDeposit: 5000000,
    note: "Suku bunga mulai 5% per tahun (sesuai ketentuan LPS)",
  },
];

/* =====================
   PAGE
===================== */
export default function KalkulatorTabungan() {
  const navigate = useNavigate();
  const [productKey, setProductKey] = useState("tabunganku");
  const [form, setForm] = useState({
    nominal: "",
    periode: "12",
    depositoRate: "5",
    depositoTenor: "1",
  });

  const product = useMemo(
    () => TABUNGAN_PRODUCTS.find((item) => item.key === productKey),
    [productKey]
  );

  const isDeposito = product?.key === "deposito";
  const nominal = toNumber(form.nominal);
  const tenorMonths = isDeposito
    ? toNumber(form.depositoTenor)
    : toNumber(form.periode);
  const baseRate = isDeposito ? toNumber(form.depositoRate) : product?.rate;
  const rate = isDeposito ? Math.max(baseRate, product?.rateMin ?? 0) : baseRate;
  const bunga =
    nominal && tenorMonths ? nominal * (rate / 100) * (tenorMonths / 12) : 0;
  const total = nominal + bunga;
  const minDeposit = product?.minDeposit ?? 0;
  const isBelowMinimum = isDeposito && nominal > 0 && nominal < minDeposit;

  const handleNominalChange = (event) => {
    setForm((prev) => ({
      ...prev,
      nominal: sanitizeInteger(event.target.value),
    }));
  };

  const handlePeriodeChange = (event) => {
    setForm((prev) => ({
      ...prev,
      periode: sanitizeInteger(event.target.value),
    }));
  };

  const handleDepositoRateChange = (event) => {
    setForm((prev) => ({
      ...prev,
      depositoRate: sanitizeDecimal(event.target.value),
    }));
  };

  const handleDepositoTenorChange = (event) => {
    setForm((prev) => ({
      ...prev,
      depositoTenor: event.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <Sidebar />
      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-[#1f6f78] text-white flex items-center justify-center shadow-lg">
              <FaCalculator size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">
                Kalkulator Tabungan
              </h1>
              <p className="text-sm text-slate-500">
                Simulasikan bunga tabungan dan deposito sesuai produk.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
            <div className="space-y-6">
              <Card title="Informasi Produk" icon={<FaClipboardCheck />}>
                <Select
                  label="Jenis Produk"
                  value={productKey}
                  onChange={(event) => setProductKey(event.target.value)}
                >
                  {TABUNGAN_PRODUCTS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </Select>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Suku Bunga</span>
                    <span className="font-semibold text-slate-800">
                      {isDeposito
                        ? `Mulai ${product?.rateMin}% p.a`
                        : `${product?.rate}% p.a`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Setoran Awal</span>
                    <span className="font-semibold text-slate-800">
                      {product?.initialDeposit
                        ? `Rp ${formatIdInteger(product.initialDeposit)}`
                        : product?.minDeposit
                        ? `Rp ${formatIdInteger(product.minDeposit)}`
                        : "-"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {product?.note}
                  </div>
                </div>
              </Card>

              <Card title="Hasil Simulasi" icon={<FaCoins />}>
                {nominal && tenorMonths ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Nominal</p>
                      <p className="text-base font-semibold text-slate-800">
                        Rp {formatIdInteger(nominal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tenor / Periode</p>
                      <p className="text-base font-semibold text-slate-800">
                        {tenorMonths} Bulan
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Suku Bunga</p>
                      <p className="text-base font-semibold text-slate-800">
                        {formatIdNumber(rate)}% p.a
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Estimasi Bunga</p>
                      <p className="text-base font-semibold text-slate-800">
                        Rp {formatIdNumber(bunga)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Saldo Akhir</p>
                      <p className="text-base font-semibold text-emerald-700">
                        Rp {formatIdNumber(total)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Masukkan nominal dan tenor/periode untuk melihat hasil.
                  </p>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Input Simulasi" icon={<FaCalculator />}>
                <Input
                  label="Nominal Simpanan (Rp)"
                  type="text"
                  value={formatIdInteger(form.nominal)}
                  onChange={handleNominalChange}
                  inputMode="numeric"
                />

                {isDeposito ? (
                  <>
                    <Input
                      label="Suku Bunga Deposito (% p.a)"
                      type="text"
                      value={form.depositoRate}
                      onChange={handleDepositoRateChange}
                      inputMode="decimal"
                    />
                    <Select
                      label="Tenor Deposito (Bulan)"
                      value={form.depositoTenor}
                      onChange={handleDepositoTenorChange}
                    >
                      {product?.tenors?.map((tenor) => (
                        <option key={tenor} value={String(tenor)}>
                          {tenor} Bulan
                        </option>
                      ))}
                    </Select>
                  </>
                ) : (
                  <Input
                    label="Periode Simulasi (Bulan)"
                    type="text"
                    value={formatIdInteger(form.periode)}
                    onChange={handlePeriodeChange}
                    inputMode="numeric"
                  />
                )}

                {isBelowMinimum ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                    Nominal deposito di bawah setoran minimal Rp {formatIdInteger(minDeposit)}.
                  </div>
                ) : null}
              </Card>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border border-slate-300 bg-white text-sm hover:bg-slate-50"
            >
              Kembali
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}