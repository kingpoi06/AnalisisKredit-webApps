import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoBPR from "./bpr.png";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [namalengkap, setNamalengkap] = useState("");
  const [username, setUsername] = useState("");
  const [jabatan, setJabatan] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  /* ===============================
     🔐 AUTH & USER DATA
  =============================== */
  useEffect(() => {
    if (location.pathname.includes("kalkulator")) {
      setNamalengkap("Guest User");
      // setUsername("Guest");
      setJabatan("Kalkulator");
      return;
    }

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

      // 🔥 SET USER DATA DARI JWT
       setNamalengkap(decoded.namalengkap || "-");
      // setUsername(decoded.username || "-");
      setJabatan(decoded.jabatan || "-");

      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } catch (err) {
      localStorage.removeItem("accessToken");
      navigate("/");
    }
  }, [navigate, location.pathname]);

  /* ===============================
     TITLE
  =============================== */
  const getPageTitle = () => {
    if (location.pathname.includes("dashboard"))
      return "Dashboard — Analisis Kredit";
    if (location.pathname.includes("data-diri"))
      return "Data Diri Nasabah";
    if (location.pathname.includes("data-usaha"))
      return "Data Usaha Nasabah";
    if (location.pathname.includes("data-jaminan"))
      return "Data Jaminan Nasabah";
    if (location.pathname.includes("kalkulator"))
      return "Kalkulator Kredit";

    return "Analisis Kredit";
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  return (
    <header
      className="
        fixed top-0 right-0 z-40
        h-16 bg-white border-b shadow-sm
        flex items-center justify-between
        px-4 sm:px-6
        left-0 sm:left-64
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={LogoBPR}
          alt="BPR NTB"
          className="h-7 sm:h-8 object-contain"
        />

        <div className="hidden sm:block border-l h-8 border-gray-300" />

        <h1 className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="relative flex items-center gap-3">
        {/* USER INFO */}
        <div className="hidden sm:block text-right leading-tight">
          <p className="text-sm font-semibold text-gray-800">
            {namalengkap}
          </p>
          <p className="text-xs text-gray-500">
            {jabatan}
          </p>
        </div>

        {/* AVATAR */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="focus:outline-none"
        >
          <img
            src="/profil.jpg"
            alt="Profile"
            className="w-9 h-9 rounded-full border object-cover"
          />
        </button>

        {/* DROPDOWN */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-12 w-44 bg-white border rounded-md shadow-lg">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
