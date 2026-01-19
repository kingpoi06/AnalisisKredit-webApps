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
  const [userRole, setUserRole] = useState("");
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
    } catch {
      setUserRole("");
    }
  }, []);

  const isActive = (path) => location.pathname === path;
  const isSuperadmin = userRole === "superadmin";
  const dashboardPath = isSuperadmin
    ? "/dashboard-monitoring-users"
    : "/dashboard";

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
        <div className="flex items-center justify-center h-16 border-b border-gray-800">
          <FaUserShield className="text-xl text-indigo-500" />
          <span className="ml-2 font-bold text-gray-100">Account Officer</span>
        </div>

      {/* MENU */}
      <nav className="mt-4 space-y-1">
        {/* DASHBOARD */}
        <div
          className={menuClass(dashboardPath)}
          onClick={() => {
            navigate(dashboardPath);
            setIsOpen(false);
          }}
        >
          <FaTachometerAlt />
          <span>Dashboard</span>
        </div>

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
