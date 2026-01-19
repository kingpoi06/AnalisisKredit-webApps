const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const buildUrl = (path) => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const API_ENDPOINTS = {
  baseUrl: API_BASE_URL,
  auth: {
    login: () => buildUrl("/login"),
    token: () => buildUrl("/token"),
  },
  users: {
    list: () => buildUrl("/users"),
    detail: (id) => buildUrl(`/users/${encodeURIComponent(id)}`),
    create: () => buildUrl("/users"),
    updateAll: (id) => buildUrl(`/usersUpdateAll/${encodeURIComponent(id)}`),
    updateProfile: (id) =>
      buildUrl(`/userUpdateProfile/${encodeURIComponent(id)}`),
    editPassword: (id) =>
      buildUrl(`/usersEditPassword/${encodeURIComponent(id)}`),
    delete: (id) => buildUrl(`/users/${encodeURIComponent(id)}`),
  },
  generate: {
    noPermohonan: () => buildUrl("/generate/no-permohonan"),
    noPermohonanDetail: (id) =>
      buildUrl(`/generate/no-permohonan/${encodeURIComponent(id)}`),
  },
  datanasabah: {
    dashboard: () => buildUrl("/datanasabah/dashboard-nasabah"),
    ocrKtp: () => buildUrl("/datanasabah/ocr-ktp"),
    dataDiri: {
      list: () => buildUrl("/datanasabah/data-diri"),
      detail: (id) =>
        buildUrl(`/datanasabah/data-diri/${encodeURIComponent(id)}`),
      create: () => buildUrl("/datanasabah/data-diri"),
    },
    dataPermohonan: {
      list: () => buildUrl("/datanasabah/data-permohonan"),
      detail: (id) =>
        buildUrl(`/datanasabah/data-permohonan/${encodeURIComponent(id)}`),
    },
    dataUsaha: {
      list: () => buildUrl("/datanasabah/data-usaha"),
      detail: (id) =>
        buildUrl(`/datanasabah/data-usaha/${encodeURIComponent(id)}`),
    },
    dataInstansi: {
      list: () => buildUrl("/datanasabah/data-instansi"),
      detail: (id) =>
        buildUrl(`/datanasabah/data-instansi/${encodeURIComponent(id)}`),
    },
    dataJaminan: {
      list: () => buildUrl("/datanasabah/data-jaminan"),
      detail: (id) =>
        buildUrl(`/datanasabah/data-jaminan/${encodeURIComponent(id)}`),
    },
    dataAnalisis: {
      list: () => buildUrl("/datanasabah/data-analisis"),
      detail: (id) =>
        buildUrl(`/datanasabah/data-analisis/${encodeURIComponent(id)}`),
      create: () => buildUrl("/datanasabah/data-analisis"),
    },
  },
  uploads: (filename = "") => {
    const trimmed = String(filename ?? "").trim();
    if (!trimmed) return buildUrl("/uploads/");
    if (trimmed.startsWith("/uploads/")) {
      return `${API_BASE_URL}${trimmed}`;
    }
    return buildUrl(`/uploads/${encodeURIComponent(trimmed)}`);
  },
};

export { API_BASE_URL, buildUrl };
