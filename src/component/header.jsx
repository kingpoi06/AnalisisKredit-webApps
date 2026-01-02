import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LogoBPR from "./bpr.png";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.includes("dashboard"))
      return "Dashboard — Analisis Kredit";
    return "Analisis Kredit";
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
      {/* LEFT : LOGO + TITLE */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={LogoBPR}
          alt="BPR NTB"
          className="h-7 sm:h-8 object-contain"
        />

        <div className="hidden sm:block border-l h-8 border-gray-300"></div>

        <h1 className="text-xs sm:text-sm font-semibold text-gray-700 tracking-wide truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* RIGHT : PROFILE */}
      <div className="relative flex items-center gap-3">
        {/* Nama statis / dummy */}
        <div className="hidden sm:block text-right leading-tight">
          <p className="text-sm font-semibold text-gray-800">
            Account Officer
          </p>
          <p className="text-xs text-gray-500">
            PRASETYO FAJAR ISLAM
          </p>
        </div>

        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="focus:outline-none"
        >
          <img
            src="/profil.jpg"
            alt="Profile"
            className="
              w-9 h-9 rounded-full
              border border-gray-300
              object-cover
            "
          />
        </button>

        {/* DROPDOWN */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-12 w-44 bg-white border rounded-md shadow-lg overflow-hidden">
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Profil Saya
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => navigate("/")}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
