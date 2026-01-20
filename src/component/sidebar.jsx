import React, { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaUserShield,
  FaBars,
  FaCalculator,
  FaDatabase,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openMasterData, setOpenMasterData] = useState(false);
  const [openDashboard, setOpenDashboard] = useState(false);
  const [openKredit, setOpenKredit] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const role =
        decoded?.role ||
        decoded?.user?.role ||
        decoded?.jabatan ||
        decoded?.level ||
        "";
      setUserRole(String(role).toLowerCase());
      const title =
        decoded?.jabatan ||
        decoded?.user?.jabatan ||
        decoded?.role ||
        decoded?.user?.role ||
        decoded?.level ||
        "User";
      setUserTitle(String(title));
    } catch {
      setUserRole("");
      setUserTitle("");
    }
  }, []);

  const isActive = (path) => location.pathname === path;
  const isActivePrefix = (path) => location.pathname.startsWith(path);
  const isSuperadmin = userRole === "superadmin";
  const isOfficer = userRole === "officer";
  const dashboardPath = isSuperadmin
    ? "/dashboard-monitoring-users"
    : "/dashboard";
  const tabunganPath = "/dashboard-tabungan";

  useEffect(() => {
    if (isActivePrefix("/master-data")) {
      setOpenMasterData(true);
    }
    if (
      isActivePrefix("/dashboard") ||
      isActivePrefix("/dashboard-tabungan")
    ) {
      setOpenDashboard(true);
    }
    if (isActivePrefix("/generate/no-permohonan") || isActivePrefix("/kalkulator")) {
      setOpenKredit(true);
    }
  }, [location.pathname]);

  const menuClass = (path) =>
    `flex items-center gap-3 px-4 py-2 mx-3 rounded-md cursor-pointer transition
    ${
      isActive(path)
        ? "bg-indigo-600 text-white font-semibold"
        : "text-gray-300 hover:bg-gray-800"
    }`;


  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar?",
      text: "Anda akan keluar dari sistem",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      {/* TOGGLE MOBILE */}
      <button
        className="fixed top-4 left-4 z-50 text-gray-700 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <FaBars size={22} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 z-50
        transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-indigo-950/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 ring-1 ring-indigo-400/40">
            <FaUserShield className="text-indigo-400" />
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-indigo-200">
              SAKTI GEN. 1
            </div>
            <div className="text-[10px] uppercase text-gray-400 tracking-[0.18em]">
              {userTitle}
            </div>
          </div>
        </div>

      {/* MENU */}
      <nav className="mt-4 space-y-1">
        {/* DASHBOARD */}
        <div>
          <div
            className={`flex items-center justify-between px-4 py-2 mx-3 rounded-md cursor-pointer transition
            ${
              isActivePrefix("/dashboard")
                ? "bg-indigo-600 text-white font-semibold"
                : "text-gray-300 hover:bg-gray-800"
            }`}
            onClick={() => setOpenDashboard((prev) => !prev)}
          >
            <div className="flex items-center gap-3">
              <FaTachometerAlt />
              <span>Dashboard</span>
            </div>
            <span className="text-xs">{openDashboard ? "^" : "v"}</span>
          </div>
          {openDashboard ? (
            <div className="mt-1 space-y-1">
              <div
                className={`flex items-center gap-3 px-6 py-2 mx-3 rounded-md cursor-pointer transition
                ${
                  isActive(dashboardPath)
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
                onClick={() => {
                  navigate(dashboardPath);
                  setIsOpen(false);
                }}
              >
                <span>Kredit</span>
              </div>
              {/* <div
                className={`flex items-center gap-3 px-6 py-2 mx-3 rounded-md cursor-pointer transition
                ${
                  isActive(tabunganPath)
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
                onClick={() => {
                  navigate(tabunganPath);
                  setIsOpen(false);
                }}
              >
                <span>Tabungan</span>
              </div> */}
            </div>
          ) : null}
        </div>

        {isSuperadmin ? (
          <div>
            <div
              className={`flex items-center justify-between px-4 py-2 mx-3 rounded-md cursor-pointer transition
              ${
                isActivePrefix("/master-data")
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => setOpenMasterData((prev) => !prev)}
            >
              <div className="flex items-center gap-3">
                <FaDatabase />
                <span>Master Data</span>
              </div>
              <span className="text-xs">{openMasterData ? "^" : "v"}</span>
            </div>
            {openMasterData ? (
              <div className="mt-1 space-y-1">
                <div
                  className={`flex items-center gap-3 px-6 py-2 mx-3 rounded-md cursor-pointer transition
                  ${
                    isActive("/master-data/cabang-kantor")
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    navigate("/master-data/cabang-kantor");
                    setIsOpen(false);
                  }}
                >
                  <span> Kantor Cabang</span>
                </div>
                <div
                  className={`flex items-center gap-3 px-6 py-2 mx-3 rounded-md cursor-pointer transition
                  ${
                    isActive("/master-data/pegawai")
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    navigate("/master-data/pegawai");
                    setIsOpen(false);
                  }}
                >
                  <span> Pegawai</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isOfficer ? (
          <div>
            <div
              className={`flex items-center justify-between px-4 py-2 mx-3 rounded-md cursor-pointer transition
              ${
                isActivePrefix("/generate/no-permohonan") || isActivePrefix("/kalkulator")
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
              onClick={() => setOpenKredit((prev) => !prev)}
            >
              <div className="flex items-center gap-3">
                <FaDatabase />
                <span>Kredit</span>
              </div>
              <span className="text-xs">{openKredit ? "^" : "v"}</span>
            </div>
            {openKredit ? (
              <div className="mt-1 space-y-1">
                <div
                  className={`flex items-center gap-3 px-6 py-2 mx-3 rounded-md cursor-pointer transition
                  ${
                    isActive("/generate/no-permohonan")
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    navigate("/generate/no-permohonan");
                    setIsOpen(false);
                  }}
                >
                  <span>Permohonan</span>
                </div>
                <div
                  className={`flex items-center gap-3 px-6 py-2 mx-3 rounded-md cursor-pointer transition
                  ${
                    isActive("/kalkulator")
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    navigate("/kalkulator");
                    setIsOpen(false);
                  }}
                >
                  <span>Kalkulator</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* NO Permohonan */}
            {userRole !== "komitecabang" && !isSuperadmin ? (
              <div
                className={menuClass("/generate/no-permohonan")}
                onClick={() => {
                  navigate("/generate/no-permohonan");
                  setIsOpen(false);
                }}
              >
                <FaDatabase />
                <span>Permohonan</span>
              </div>
            ) : null}

            {/* KALKULATOR */}
            {!isSuperadmin ? (
              <div
                className={menuClass("/kalkulator")}
                onClick={() => {
                  navigate("/kalkulator");
                  setIsOpen(false);
                }}
              >
                <FaCalculator />
                <span>Kalkulator</span>
              </div>
            ) : null}
          </>
        )}

          {/* LOGOUT */}
          <div
            className="flex items-center gap-3 px-4 py-2 mx-3 rounded-md cursor-pointer
            text-gray-300 hover:bg-gray-800 transition mt-4"
            onClick={handleLogout}
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </div>
        </nav>
      </aside>
    </>
  );
}
