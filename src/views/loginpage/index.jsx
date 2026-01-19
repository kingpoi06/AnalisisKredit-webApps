import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_ENDPOINTS } from "../../config/apiEndpoints";

import Logo from "./bpr.png";
import Illustration from "./illustration.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const response = await axios.post(
        API_ENDPOINTS.auth.login(),
        { username, password },
        { withCredentials: true }
      );

      const { accessToken } = response.data;

      if (!accessToken) {
        setMsg("Token tidak ditemukan");
        return;
      }

      const decoded = jwtDecode(accessToken);
      const role = decoded.role?.toLowerCase();

      // simpan token
      localStorage.setItem("accessToken", accessToken);

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;

      // 🔑 ROUTING BERDASARKAN ROLE
      switch (role) {
        case "officer":
          navigate("/dashboard");
          break;
        case "komitecabang":
          navigate("/dashboard");
          break;
        case "superadmin":
          navigate("/dashboard-monitoring-users");
          break;
        default:
          setMsg("Role tidak dikenali");
      }
    } catch (error) {
      console.error(error);
      setMsg(
        error.response?.data?.msg || "Login gagal, silakan coba lagi"
      );
    }
  };

  // 🔁 Auto redirect jika sudah login
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role = decoded.role?.toLowerCase();

        if (role === "officer") navigate("/dashboard");
        if (role === "komitecabang") navigate("/dashboard-acc");
        if (role === "superadmin") navigate("/dashboard-monitoring-users");
      } catch (err) {
        localStorage.removeItem("accessToken");
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-sans">

      {/* LEFT */}
      <div className="flex items-center justify-center bg-white">
        <div className="w-full max-w-md px-8">
          <img src={Logo} alt="Logo" className="w-32 mb-8" />

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Selamat Datang
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Akses informasi Analisis Kredit Nasabah secara aman
            dan cepat melalui sistem ini.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Username
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-gray-300 px-4 py-2.5
                focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-md 
              bg-success-600 text-black font-semibold
              hover:bg-blue-700 transition-all duration-200"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-[#F1F2E8] to-[#E6E8D8] px-10">
        <img
          src={Illustration}
          alt="Illustration"
          className="w-80 mb-8 drop-shadow-md"
        />

        <p className="text-center text-gray-700 max-w-sm leading-relaxed mb-6">
          Informasi Analisis Kredit Nasabah Anda
          dapat diakses dengan cepat dan aman
          dalam satu sistem terintegrasi.
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="px-8 py-2.5 border border-gray-700 rounded-md
          hover:bg-gray-700 hover:text-white transition"
        >
          CONTACT PERSON
        </button>
      </div>
    </div>
  );
};

export default Login;
