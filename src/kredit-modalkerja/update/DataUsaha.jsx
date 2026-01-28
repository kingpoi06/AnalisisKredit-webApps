import { useState, useRef, useEffect } from "react";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import PageBackground from "../../component/PageBackground";
import { FaBriefcase, FaMapMarkerAlt, FaFileAlt, FaCamera } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

/* =======================
   REUSABLE COMPONENTS
======================= */

const Card = ({ title, icon, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-800 text-[13px]">
        {title}
      </h3>
    </div>
    {children}
  </section>
);



const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  readOnly = false,
  inputMode,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      inputMode={inputMode}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition
      focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
      placeholder:text-slate-400 ${
        readOnly ? "bg-slate-50 text-slate-600 cursor-not-allowed" : "bg-white text-slate-800"
      }`}
    />
  </div>
);


const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
      bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
      disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => {
        const normalizedOption =
          typeof option === "string" ? { value: option, label: option } : option;

        return (
          <option key={normalizedOption.value} value={normalizedOption.value}>
            {normalizedOption.label}
          </option>
        );
      })}
    </select>
  </div>
);

const TextArea = ({
  label,
  rows = 3,
  value,
  onChange,
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">
      {label}
    </label>
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
      text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
      placeholder:text-slate-400"
    />
  </div>
);

/* =======================
   UPLOAD CAMERA (FIXED)
======================= */

const UploadButton = ({ label, file, existingName, onChange }) => {
  const inputRef = useRef(null);
  const displayName = file?.name || existingName || "Belum ada foto";

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2
        border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700
        hover:bg-slate-50 transition"
      >
        <FaCamera className="text-slate-600" />
        Open Camera
      </button>

      <div className="text-[11px] text-slate-500">
        {displayName}
      </div>
    </div>
  );
};

const JENIS_USAHA_OPTIONS = [
  "Pertanian / Perkebunan",
  "Peternakan / Perikanan",
  "Pertambangan",
  "Pabrikasi / Perindustrian",
  "Konstruksi",
  "Perdagangan",
  "Jasa Keuangan",
  "Jasa Perorangan",
  "Jasa Umum",
  "Jasa Wisata",
  "Kehutanan",
  "Transportasi",
];

const normalizeJenisUsahaKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const BIDANG_USAHA_OPTIONS = {
  pertanianperkebunan: [
    "Padi / Palawija",
    "Hortikultura (Sayur & Buah)",
    "Tanaman Perkebunan (Kelapa, Kopi, Kakao, Tebu)",
    "Bibit / Benih",
    "Pupuk & Sarana Pertanian",
    "Penggilingan Padi",
    "Hasil Pertanian (Distributor/Gudang)",
  ],
  peternakanperikanan: [
    "Peternakan Sapi",
    "Peternakan Kambing",
    "Peternakan Ayam Petelur",
    "Peternakan Ayam Pedaging",
    "Peternakan Itik",
    "Pakan Ternak",
    "Budidaya Ikan Air Tawar",
    "Budidaya Ikan Air Laut",
    "Nelayan / Penangkapan Ikan",
    "Pengolahan Hasil Perikanan",
  ],
  pertambangan: [
    "Galian C (Pasir, Batu, Kerikil)",
    "Tambang Batu Bara",
    "Tambang Emas",
    "Tambang Nikel",
    "Tambang Batu Kapur",
    "Tambang Tanah Liat",
    "Jasa Alat Berat Tambang",
  ],
  pabrikasiperindustrian: [
    "Industri Makanan & Minuman",
    "Industri Roti / Kue",
    "Industri Penggilingan / Pengolahan",
    "Industri Tekstil / Konveksi",
    "Industri Furniture / Kayu",
    "Industri Percetakan",
    "Industri Plastik",
    "Industri Kerajinan",
    "Industri Material Bangunan",
  ],
  konstruksi: [
    "Kontraktor Bangunan",
    "Kontraktor Jalan / Infrastruktur",
    "Kontraktor Listrik",
    "Kontraktor Air / Plumbing",
    "Tukang Bangunan / Borongan",
    "Supplier Material Bangunan",
    "Jasa Arsitek / Desain Interior",
  ],
  perdagangan: [
    "Toko Sembako / Grosir",
    "Warung Kelontong",
    "Minimarket",
    "Toko Pakaian",
    "Toko Elektronik",
    "Toko Bangunan",
    "Apotek / Alkes",
    "Penjualan Motor / Mobil",
    "Penjualan Online (Marketplace)",
    "Distributor / Agen",
  ],
  jasakeuangan: [
    "Koperasi Simpan Pinjam",
    "Agen BRILink / Agen Bank",
    "Pegadaian / Gadai",
    "Leasing / Pembiayaan",
    "Money Changer",
    "Asuransi (Agen)",
    "Akuntan / Konsultan Pajak",
  ],
  jasaperorangan: [
    "Salon / Barbershop",
    "Laundry",
    "Penjahit / Konveksi Kecil",
    "Bengkel Motor",
    "Bengkel Mobil",
    "Tukang Las",
    "Jasa Service Elektronik",
    "Jasa Fotokopi / ATK",
  ],
  jasaumum: [
    "Event Organizer",
    "Cleaning Service",
    "Keamanan (Security)",
    "Rental Mobil / Motor",
    "Jasa Titip (Jastip)",
    "Jasa Pengiriman / Kurir",
    "Percetakan / Advertising",
  ],
  jasawisata: [
    "Travel / Tour Agent",
    "Hotel / Penginapan",
    "Homestay",
    "Restoran / Rumah Makan",
    "Cafe / Kuliner",
    "Rental Peralatan Wisata",
    "Jasa Guide Wisata",
    "Oleh-oleh / Souvenir",
  ],
  kehutanan: [
    "Penebangan Kayu (Resmi)",
    "Pengolahan Kayu",
    "Industri Meubel Kayu",
    "Persemaian Bibit",
    "Hasil Hutan Non Kayu (Madu, Rotan)",
    "Distributor Kayu",
  ],
  transportasi: [
    "Angkutan Barang (Truk)",
    "Angkutan Penumpang (Travel)",
    "Ojek Online / Ojek Pangkalan",
    "Ekspedisi / Logistik",
    "Rental Kendaraan",
    "Kapal / Perahu Penyeberangan",
    "Jasa Deliver",
  ],
};

const getBidangUsahaOptions = (jenisUsaha) =>
  BIDANG_USAHA_OPTIONS[normalizeJenisUsahaKey(jenisUsaha)] || [];

const resolveJenisUsahaValue = (value) => {
  if (!value) return value;
  const normalized = normalizeJenisUsahaKey(value);
  const match = JENIS_USAHA_OPTIONS.find(
    (option) => normalizeJenisUsahaKey(option) === normalized
  );
  return match || value;
};

const BENTUK_USAHA_OPTIONS = ["Perseorangan", "CV", "PT"];


const STATUS_ALAMAT_USAHA_OPTIONS = [
  { value: "Milik Sendiri", label: "Milik Sendiri" },
  { value: "Sewa", label: "Sewa" },
];

const DATA_USAHA_FIELDS = [
  { key: "namaUsaha", label: "Nama Usaha", type: "input" },
  {
    key: "jenisUsaha",
    label: "Jenis Usaha",
    type: "select",
    options: JENIS_USAHA_OPTIONS,
    placeholder: "Pilih Jenis Usaha",
  },
  { key: "bidangUsaha", label: "Bidang Usaha", type: "select" },
  {
    key: "statusUsaha",
    label: "Bentuk Usaha",
    type: "select",
    options: BENTUK_USAHA_OPTIONS,
    placeholder: "Pilih",
  },
  {
    key: "plafonPinjaman",
    label: "Plafon Pinjaman",
    type: "input",
    inputType: "number",
  },
  { key: "npwp", label: "NPWP Usaha", type: "input" },
];

const ALAMAT_FIELDS = [
  { key: "desaKelurahan", label: "Desa / Kelurahan" },
  { key: "kecamatan", label: "Kecamatan" },
  { key: "kabupatenKota", label: "Kabupaten / Kota" },
  { key: "provinsi", label: "Provinsi" },
];


const LEGALITAS_FIELDS = [
  { key: "nib", label: "NIB", note: "Wajib diisi jika kredit Program" },
  { key: "tglNIB", label: "Masa NIB", type: "date" },
  { key: "sku", label: "SKU" },
  { key: "tglSKU", label: "Masa SKU", type: "date" },
];

const LEGALITAS_UPLOADS = [
  { key: "fotoNPWP", label: "Foto NPWP" },
];

const DOKUMENTASI_UPLOADS = [
  { key: "fotodepan", label: "Dokumentasi Tempat Usaha" },
];

const initialFormData = {
  namaUsaha: "",
  jenisUsaha: "",
  bidangUsaha: "",
  statusUsaha: "",
  plafonPinjaman: "",
  npwp: "",

  // ALAMAT USAHA
  alamatUsaha: "",
  desaKelurahan: "",
  kecamatan: "",
  kabupatenKota: "",
  provinsi: "",
  statusAlamatUsaha: "",
  titikmaps: "",

  // LEGALITAS
  nib: "",
  tglNIB: "",
  sku: "",
  tglSKU: "",
  izinKhusus: "",

  fotoNIB: null,
  fotoNPWP: null,
  fotoSKU: null,
  fotodepan: null,
};

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const digitsOnly = String(value).replace(/\D/g, "");
  if (!digitsOnly) return 0;
  const numericValue = Number(digitsOnly);
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

const formatDateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeList = (data) => {
  if (!Array.isArray(data)) return data ? [data] : [];
  return Array.isArray(data[0]) ? data.flat() : data;
};

const getFieldValue = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return fallback;
};

const normalizeDataUsaha = (data) => ({
  namaUsaha: getFieldValue(
    data,
    ["namaUsaha", "namausaha", "nama_usaha"],
    undefined
  ),
  jenisUsaha: resolveJenisUsahaValue(
    getFieldValue(data, ["jenisUsaha", "jenisusaha", "jenis_usaha"], undefined)
  ),
  bidangUsaha: getFieldValue(
    data,
    ["bidangUsaha", "bidangusaha", "bidang_usaha"],
    undefined
  ),
  statusUsaha: getFieldValue(
    data,
    [
    "statusUsaha",
    "statususaha",
    "status_usaha",
    "bentukUsaha",
    "bentukusaha",
    "bentuk_usaha",
    ],
    undefined
  ),
  plafonPinjaman: getFieldValue(
    data,
    [
    "plafonPinjaman",
    "plafon_pinjaman",
    "plafonPermohonan",
    "plafon_permohonan",
    ],
    undefined
  ),
  npwp: getFieldValue(data, ["npwp", "npwpUsaha", "npwp_usaha"], undefined),
  alamatUsaha: getFieldValue(
    data,
    [
    "alamatUsaha",
    "alamatusaha",
    "alamat_usaha",
    "alamatlengkap",
    "alamat_lengkap",
    ],
    undefined
  ),
  desaKelurahan: getFieldValue(
    data,
    [
    "desaKelurahan",
    "desakelurahan",
    "desa_kelurahan",
    ],
    undefined
  ),
  kecamatan: getFieldValue(data, ["kecamatan"], undefined),
  kabupatenKota: getFieldValue(
    data,
    [
    "kabupatenKota",
    "kabupatenkota",
    "kabupaten_kota",
    "kabupaten",
    ],
    undefined
  ),
  provinsi: getFieldValue(data, ["provinsi"], undefined),
  statusAlamatUsaha: getFieldValue(
    data,
    [
    "statusAlamatUsaha",
    "statusalamatusaha",
    "status_alamat_usaha",
    "jenisalamatusaha",
    "jenis_alamat_usaha",
    "statuskepemilikan",
    "status_kepemilikan",
    ],
    undefined
  ),
  titikmaps: getFieldValue(
    data,
    ["titikmaps", "titikMaps", "titik_maps"],
    undefined
  ),
  nib: getFieldValue(data, ["nib"], undefined),
  tglNIB: formatDateInput(
    getFieldValue(data, ["tglNIB", "tgl_nib", "tglnib"], undefined)
  ),
  sku: getFieldValue(data, ["sku"], undefined),
  tglSKU: formatDateInput(
    getFieldValue(data, ["tglSKU", "tgl_sku", "tglsku"], undefined)
  ),
  izinKhusus: getFieldValue(data, ["izinKhusus", "izin_khusus"], undefined),
});


const pickAddressValue = (address, keys) => {
  for (const key of keys) {
    const value = address?.[key];
    if (value) return value;
  }
  return "";
};

const normalizeNominatimResponse = (response) => {
  if (!response) return null;
  return {
    displayName: response.display_name,
    address: response.address,
  };
};

const normalizeBigDataCloudResponse = (response) => {
  if (!response) return null;

  const administrative = response.localityInfo?.administrative || [];
  const findAdminLevel = (levels) =>
    administrative.find((item) => levels.includes(item.adminLevel))?.name || "";

  const provinsi =
    response.principalSubdivision || findAdminLevel([4]);
  const kabupatenKota =
    response.city || findAdminLevel([5, 6]) || response.locality || "";
  const kecamatan = findAdminLevel([7, 8, 9]);
  const desaKelurahan =
    response.locality || findAdminLevel([10, 11, 12]);

  return {
    displayName: [
      response.locality,
      response.city,
      response.principalSubdivision,
      response.countryName,
    ]
      .filter(Boolean)
      .join(", "),
    address: {
      village: desaKelurahan || "",
      suburb: desaKelurahan || "",
      neighbourhood: desaKelurahan || "",
      city_district: kecamatan || "",
      district: kecamatan || "",
      sub_district: kecamatan || "",
      city: kabupatenKota || "",
      county: kabupatenKota || "",
      municipality: kabupatenKota || "",
      state: provinsi || "",
      province: provinsi || "",
      state_district: kabupatenKota || "",
    },
  };
};

const fetchReverseGeocodeMapsCo = async (latitude, longitude, zoom) => {
  const url = new URL("https://geocode.maps.co/reverse");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  if (zoom) {
    url.searchParams.set("zoom", String(zoom));
  }

  const response = await fetch(url.toString(), {
    headers: { "Accept-Language": "id" },
  });

  if (!response.ok) {
    throw new Error(`Maps.co reverse geocode failed: ${response.status}`);
  }

  return normalizeNominatimResponse(await response.json());
};

const fetchReverseGeocodeNominatim = async (latitude, longitude, zoom) => {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("addressdetails", "1");
  if (zoom) {
    url.searchParams.set("zoom", String(zoom));
  }

  const response = await fetch(url.toString(), {
    headers: { "Accept-Language": "id" },
  });

  if (!response.ok) {
    throw new Error(`Nominatim reverse geocode failed: ${response.status}`);
  }

  return normalizeNominatimResponse(await response.json());
};

const fetchReverseGeocodeBigDataCloud = async (latitude, longitude) => {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("localityLanguage", "id");

  const response = await fetch(url.toString(), {
    headers: { "Accept-Language": "id" },
  });

  if (!response.ok) {
    throw new Error(`BigDataCloud reverse geocode failed: ${response.status}`);
  }

  return normalizeBigDataCloudResponse(await response.json());
};

const resolveAddressFields = (address) => ({
  desaKelurahan: pickAddressValue(address, [
    "village",
    "suburb",
    "hamlet",
    "neighbourhood",
    "quarter",
    "locality",
  ]),
  kecamatan: pickAddressValue(address, [
    "city_district",
    "district",
    "suburb",
    "sub_district",
  ]),
  kabupatenKota: pickAddressValue(address, [
    "city",
    "county",
    "municipality",
    "town",
    "state_district",
    "region",
  ]),
  provinsi: pickAddressValue(address, ["state", "province", "region"]),
});

const getBestReverseGeocode = async (latitude, longitude) => {
  const zoomLevels = [18, 16, 14, 12];
  const providers = [
    fetchReverseGeocodeMapsCo,
    fetchReverseGeocodeBigDataCloud,
    fetchReverseGeocodeNominatim,
  ];

  let lastResponse = null;
  let lastResolved = null;
  let lastError = null;

  for (const zoom of zoomLevels) {
    for (const provider of providers) {
      try {
        const response = await provider(latitude, longitude, zoom);
        if (!response) continue;

        const address = response.address;
        const resolved = address ? resolveAddressFields(address) : null;

        lastResponse = response;
        lastResolved = resolved;

        if (resolved && Object.values(resolved).some(Boolean)) {
          return { response, resolved };
        }
      } catch (error) {
        lastError = error;
      }
    }
  }

  if (lastResponse) {
    return { response: lastResponse, resolved: lastResolved };
  }

  if (lastError) {
    throw lastError;
  }

  return null;
};

/* =======================
   PAGE
======================= */

export default function UpdateDataUsaha() {

const navigate = useNavigate();
const { no_permohonan } = useParams();

const [formData, setFormData] = useState(initialFormData);
const [existingUploads, setExistingUploads] = useState({
  fotoNIB: "",
  fotoNPWP: "",
  fotoSKU: "",
  fotodepan: "",
});
const [showNibFields, setShowNibFields] = useState(false);
const shouldShowNpwp = toNumber(formData.plafonPinjaman) > 100000000;

  
  
  /* ===============================
     AUTH
  =============================== */
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
  
  useEffect(() => {
    if (!no_permohonan) return;

    const fetchPermohonan = async () => {
      try {
        const response = await axios.get(
          API_ENDPOINTS.datanasabah.dataPermohonan.detail(no_permohonan)
        );
        const data = response.data?.Data ?? response.data?.data;
        const permohonan = Array.isArray(data) ? data[0] : data;
        const plafon = permohonan?.plafonPermohonan ?? "";

        setFormData((prev) => {
          if (String(prev.plafonPinjaman ?? "").trim() !== "") {
            return prev;
          }
          if (prev.plafonPinjaman === plafon) {
            return prev;
          }
          return { ...prev, plafonPinjaman: plafon };
        });
      } catch {
        setFormData((prev) =>
          prev.plafonPinjaman === "" ? prev : { ...prev, plafonPinjaman: "" }
        );
      }
    };

    fetchPermohonan();
  }, [no_permohonan]);

  const fetchDataUsaha = async (requestNo) => {
    if (!requestNo) return;

    const applyUsahaData = (usaha) => {
      if (!usaha) return;

      const normalized = normalizeDataUsaha(usaha);
      setFormData((prev) => {
        const next = { ...prev };
        Object.entries(normalized).forEach(([key, value]) => {
          if (value !== undefined) {
            next[key] = value;
          }
        });
        return next;
      });

      const fotoNIB = getFieldValue(usaha, ["fotoNIB", "foto_nib", "fotonib"]);
      const fotoNPWP = getFieldValue(usaha, ["fotoNPWP", "foto_npwp", "fotonpwp"]);
      const fotoSKU = getFieldValue(usaha, ["fotoSKU", "foto_sku", "fotosku"]);
      const fotoDepan = getFieldValue(usaha, ["fotodepan", "foto_depan", "fotoDepan"]);

      setExistingUploads((prev) => ({
        ...prev,
        fotoNIB,
        fotoNPWP,
        fotoSKU,
        fotodepan: fotoDepan,
      }));

      setShowNibFields((prev) => prev || Boolean(normalized.nib || fotoNIB));
    };

    const matchByPermohonan = (list) =>
      list.find(
        (item) =>
          String(item?.no_permohonan ?? item?.noPermohonan) === String(requestNo)
      );

    try {
      const response = await axios.get(
        API_ENDPOINTS.datanasabah.dataUsaha.detail(requestNo)
      );
      const data = normalizeList(response.data?.Data ?? response.data?.data ?? response.data);
      const usaha = Array.isArray(data) ? data[0] : data;

      if (usaha) {
        applyUsahaData(usaha);
        return;
      }
    } catch (error) {
      try {
        const listResponse = await axios.get(
          API_ENDPOINTS.datanasabah.dataUsaha.list()
        );
        const data = normalizeList(
          listResponse.data?.Data ?? listResponse.data?.data ?? listResponse.data
        );
        const usaha = matchByPermohonan(data);
        if (usaha) {
          applyUsahaData(usaha);
          return;
        }
      } catch (fallbackError) {
        Swal.fire(
          "Gagal",
          fallbackError.response?.data?.msg || "Gagal mengambil data usaha",
          "error"
        );
        return;
      }

      Swal.fire(
        "Data tidak ditemukan",
        "Data usaha untuk no permohonan ini belum tersedia",
        "warning"
      );
    }
  };

  useEffect(() => {
    if (!no_permohonan) return;
    fetchDataUsaha(no_permohonan);
  }, [no_permohonan]);


  const openMaps = () => {
  if (!navigator.geolocation) {
    Swal.fire("Error", "Browser tidak mendukung GPS", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      const lokasiString = `${latitude}, ${longitude}`;

      // simpan ke formData
      setFormData((prev) => ({
        ...prev,
        titikmaps: lokasiString,
      }));

      try {
        const result = await getBestReverseGeocode(latitude, longitude);
        const response = result?.response;
        const address = response?.address;

        if (address) {
          const alamatUsaha =
            response?.displayName ||
            [address.road, address.house_number, address.neighbourhood]
              .filter(Boolean)
              .join(", ");
          const resolved = result?.resolved || resolveAddressFields(address);

          setFormData((prev) => ({
            ...prev,
            alamatUsaha: alamatUsaha || prev.alamatUsaha,
            desaKelurahan: resolved.desaKelurahan || prev.desaKelurahan,
            kecamatan: resolved.kecamatan || prev.kecamatan,
            kabupatenKota: resolved.kabupatenKota || prev.kabupatenKota,
            provinsi: resolved.provinsi || prev.provinsi,
          }));
        } else {
          Swal.fire("Error", "Alamat tidak ditemukan dari koordinat", "error");
        }
      } catch {
        Swal.fire("Error", "Gagal mengambil alamat dari koordinat", "error");
      }

      // buka Google Maps (opsional)
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(mapsUrl, "_blank", "noopener,noreferrer");
    },
    () => Swal.fire("Error", "Izin lokasi ditolak", "error")
  );
};

const handleFieldChange = (field) => (event) => {
  const value = event.target.value;
  if (field === "jenisUsaha") {
    setFormData((prev) => {
      const nextBidangOptions = getBidangUsahaOptions(value);
      const shouldReset =
        prev.bidangUsaha && !nextBidangOptions.includes(prev.bidangUsaha);
      return {
        ...prev,
        jenisUsaha: value,
        bidangUsaha: shouldReset ? "" : prev.bidangUsaha,
      };
    });
    return;
  }

  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));
};

const handleNumberFieldChange = (field) => (event) => {
  const rawValue = event.target.value;
  const cleanedValue = rawValue.replace(/\D/g, "");

  setFormData((prev) => ({
    ...prev,
    [field]: cleanedValue,
  }));
};
const handleFileChange = (field) => (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFormData((prev) => ({
    ...prev,
    [field]: file,
  }));
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

const handleSave = async () => {
  if (!no_permohonan) {
    Swal.fire("Error", "No Permohonan tidak ditemukan di URL", "error");
    return;
  }

  if (showNibFields && String(formData.nib || "").trim() === "") {
    Swal.fire("Error", "Nomor NIB wajib diisi", "error");
    return;
  }

  const payload = new FormData();

  payload.append("no_permohonan", no_permohonan);

  Object.entries(formData).forEach(([key, value]) => {
    if (!showNibFields && ["nib", "tglNIB", "fotoNIB"].includes(key)) {
      return;
    }
    if (value instanceof File) {
      payload.append(key, value);
    } else if (value !== null && value !== "") {
      payload.append(key, value);
    }
  });


  try {
    Swal.fire({
      title: "Menyimpan Data Usaha...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    await axios.patch(
      API_ENDPOINTS.datanasabah.dataUsaha.detail(no_permohonan),
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Berhasil", "Data Usaha berhasil diperbaharui", "success");

    const plafonValue = toNumber(formData.plafonPinjaman);
    const nextRoute =
      plafonValue > 10000000
        ? `/update-data/data-jaminan/${encodeURIComponent(no_permohonan)}`
        : "/dashboard";
    navigate(nextRoute);

  } catch (err) {
    Swal.fire(
      "Gagal",
      err.response?.data?.msg || "Gagal menyimpan Data Usaha",
      "error"
    );
  }
};

  
  return (
    <PageBackground>
      <Sidebar />

      <div className="md:ml-64">
        <Header />

        <main className="pt-20 px-4 sm:px-6 pb-16 max-w-7xl mx-auto">

          {/* TITLE */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <FaBriefcase className="text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Data Usaha <span className="text-slate-400 font-normal">Nasabah</span>
              </h1>
              <p className="text-xs text-slate-500">
                Lengkapi informasi usaha untuk kebutuhan analisis kredit.
              </p>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* DATA USAHA */}
            <Card title="Data Usaha" icon={<FaBriefcase />}>
              {DATA_USAHA_FIELDS.map((field) => {
                if (field.key === "npwp" && !shouldShowNpwp) {
                  return null;
                }

                return field.type === "select" ? (
                  <Select
                    key={field.key}
                    label={field.label}
                    value={formData[field.key]}
                    onChange={handleFieldChange(field.key)}
                    options={
                      field.key === "bidangUsaha"
                        ? getBidangUsahaOptions(formData.jenisUsaha)
                        : field.options
                    }
                    placeholder={
                      field.key === "bidangUsaha"
                        ? formData.jenisUsaha
                          ? "Pilih Bidang Usaha"
                          : "Pilih Jenis Usaha terlebih dahulu"
                        : field.placeholder
                    }
                    disabled={
                      field.key === "bidangUsaha" && !formData.jenisUsaha
                    }
                  />
                ) : (
                  <Input
                    key={field.key}
                    label={field.label}
                    type={field.key === "plafonPinjaman" ? "text" : field.inputType}
                    value={
                      field.key === "plafonPinjaman"
                        ? formatIdInteger(formData[field.key])
                        : formData[field.key]
                    }
                    onChange={
                      field.key === "plafonPinjaman"
                        ? handleNumberFieldChange(field.key)
                        : handleFieldChange(field.key)
                    }
                    inputMode={field.key === "plafonPinjaman" ? "numeric" : undefined}
                  />
                );
              })}
            </Card>


            {/* LOKASI & ALAMAT */}
            <Card title="Lokasi dan Alamat Usaha" icon={<FaMapMarkerAlt />}>

            {/* INPUT TITIK LOKASI USAHA */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Titik Lokasi Usaha (Nomor Seri Koordinat)
                </label>
                <input
                  type="text"
                  value={formData.titikmaps}
                  readOnly
                  placeholder="Klik tombol Open Google Maps"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm
                  bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>

              {/* TOMBOL MAPS */}
              <button
                type="button"
                onClick={openMaps}
                className="w-full mt-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700
                hover:bg-slate-50 transition"
              >
                Open Koordinat Maps
              </button>

              <div className="space-y-1">
                <TextArea
                  label="Alamat Lengkap"
                  value={formData.alamatUsaha}
                  onChange={handleFieldChange("alamatUsaha")}
                />

                {ALAMAT_FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    label={field.label}
                    value={formData[field.key]}
                    onChange={handleFieldChange(field.key)}
                  />
                ))}

              {/* JENIS ALAMAT USAHA */}
              <Select
                label="Status Tempat Usaha"
                value={formData.statusAlamatUsaha}
                onChange={handleFieldChange("statusAlamatUsaha")}
                options={STATUS_ALAMAT_USAHA_OPTIONS}
                placeholder="Pilih"
              />
              </div>
            </Card>


            {/* LEGALITAS */}
            <Card title="Legalitas & Perizinan Usaha" icon={<FaFileAlt />}>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={showNibFields}
                  onChange={(event) => setShowNibFields(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                />
                Tampilkan NIB
              </label>

              {LEGALITAS_FIELDS.map((field) => {
                if ((field.key === "nib" || field.key === "tglNIB") && !showNibFields) {
                  return null;
                }

                return (
                  <div key={field.key} className="space-y-1.5">
                    <Input
                      label={field.label}
                      type={field.type}
                      value={formData[field.key]}
                      onChange={handleFieldChange(field.key)}
                    />
                    {field.note ? (
                      <p className="text-[11px] text-slate-500">{field.note}</p>
                    ) : null}
                    {field.key === "tglNIB" && showNibFields ? (
                      <UploadButton
                        label="Foto NIB"
                        file={formData.fotoNIB}
                        existingName={existingUploads.fotoNIB}
                        onChange={handleFileChange("fotoNIB")}
                      />
                    ) : null}
                    {field.key === "tglSKU" ? (
                      <UploadButton
                        label="Foto SKU"
                        file={formData.fotoSKU}
                        existingName={existingUploads.fotoSKU}
                        onChange={handleFileChange("fotoSKU")}
                      />
                    ) : null}
                  </div>
                );
              })}

              <div className="pt-2">
                {DOKUMENTASI_UPLOADS.map((upload) => (
                  <UploadButton
                    key={upload.key}
                    label={upload.label}
                    file={formData[upload.key]}
                    existingName={existingUploads[upload.key]}
                    onChange={handleFileChange(upload.key)}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-success-800 text-white text-sm shadow-sm hover:bg-slate-900"
            >
              Simpan Data Nasabah
            </button>
          </div>

        </main>
      </div>
    </PageBackground>
  );
}
