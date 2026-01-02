import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "./bpr.png";
import Illustration from "./illustration.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // 🔥 TANPA FETCH / TANPA AUTH
    navigate("/dashboard", { replace: true });
  };

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
              bg-blue-600 text-black font-semibold
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
          START DASHBOARD
        </button>
      </div>
    </div>
  );
};

export default Login;
