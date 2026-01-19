import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "./config/apiEndpoints";
import Swal from "sweetalert2";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE_URL;

let sessionAlertShown = false;
const SESSION_ALERT_KEY = "sessionExpiredAlert";

const redirectToLogin = () => {
  localStorage.removeItem("accessToken");
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
};

const notifySessionExpired = ({ persist = true } = {}) => {
  if (sessionAlertShown) return;
  sessionAlertShown = true;
  if (persist) {
    sessionStorage.setItem(SESSION_ALERT_KEY, "1");
  }
  localStorage.removeItem("accessToken");
  delete axios.defaults.headers.common.Authorization;
  Swal.fire({
    icon: "warning",
    title: "Sesi Berakhir",
    text: "Sesi Anda berakhir atau akun dipakai di tempat lain. Silakan login kembali.",
    confirmButtonText: "Login ulang",
    allowOutsideClick: false,
  }).then(() => {
    sessionStorage.removeItem(SESSION_ALERT_KEY);
    redirectToLogin();
  });
};

const bootstrapSession = async () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken || window.location.pathname === "/") return;

  axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

  try {
    const response = await axios.post(API_ENDPOINTS.auth.token());
    const newAccessToken = response?.data?.accessToken;
    if (newAccessToken) {
      localStorage.setItem("accessToken", newAccessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
    }
  } catch (error) {
    // Global interceptor handles 401 with session alert.
  }
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "");
    const hasToken =
      Boolean(localStorage.getItem("accessToken")) ||
      Boolean(error?.config?.headers?.Authorization);

    if (status === 401 && hasToken && !requestUrl.includes("/login")) {
      notifySessionExpired();
    }

    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById("root"));

const startApp = async () => {
  if (sessionStorage.getItem(SESSION_ALERT_KEY)) {
    notifySessionExpired({ persist: false });
  } else {
    await bootstrapSession();
  }
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

startApp();
