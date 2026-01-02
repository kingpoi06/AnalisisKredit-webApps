import "tailwindcss/tailwind.css";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useAxios from "../../useAxios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const AddFoto = () => {
  const [namalengkap, setNamalengkap] = useState("");
  const navigate = useNavigate();
  const axiosInstance = useAxios();
  const token = localStorage.getItem("accessToken");
  const [formData, setFormData] = useState({
    titleimage: "",
    kategori: "",
    image: null,
  });
  const newsToEdit =  JSON.parse(localStorage.getItem("newsToEdit"));

  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
    ...prevData,
    [name]: value,
  }));
};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file); // Debug log
      setFormData({
        ...formData,
        image: file,
      });
    } else {
      console.log("No file selected");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Konfirmasi sebelum menyimpan
    const result = await Swal.fire({
      title: "Simpan Data?",
      text: "Apakah Anda yakin ingin menyimpan data Galeri Foto ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        // Menggunakan FormData untuk mengirimkan data form
        const data = new FormData();
        data.append("titleimage", formData.titleimage);
        data.append("kategori", formData.kategori);
        if (formData.image) data.append("image", formData.image); // Tambahkan file gambar jika ada

        const response = await axiosInstance.patch(`/galeripoto/${newsToEdit.id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.status === 201) {
          Swal.fire("Data Galeri Foto telah disimpan!", "", "success");
          navigate("/foto"); 
        } else {
          Swal.fire("Gagal menyimpan data!", "Coba lagi nanti.", "error");
        }
      } catch (error) {
        Swal.fire("Error", "Terjadi kesalahan: " + error.message, "error");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
          navigate("/");
          return;
        }

        if (accessToken) {
          const decoded = jwtDecode(accessToken);
          setNamalengkap(decoded.namalengkap);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching token:", error);
        navigate("/");
      }
    };

    fetchData();
  }, [axiosInstance, navigate]);

  return (
    <div className="">
      {/* Sidebar */}
      <Header/>
      <div className="flex">
        <div className="absolute">
        <Sidebar />
        </div>
      <div className="m-auto">
      <div className="mt-20 max-w-xl mx-auto p-8 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-lg border border-gray-200">
  <h2 className="text-3xl font-extrabold text-center text-gray-700 mb-6">
    Edit Data Galeri Foto
  </h2>
  <form onSubmit={handleSubmit} className="space-y-6">

    {/* TITLE Image */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Judul Gambar
      </label>
      <input
        type="text"
        name="titleimage"
        value={formData.titleimage}
        onChange={handleChange}
        placeholder="Masukkan judul berita"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
        required
      />
    </div>

    {/* KATEGORI */}
    <div>
        <label className="block text-sm font-semibold text-gray-600 mb-2">
            Kategori
            </label>
            <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
                required
            >
            <option value="" disabled>
                Pilih Kategori
            </option>
                <option value="Geoarkeologi">Geoarkeologi</option>
                <option value="Sosiokultural">Sosiokultural</option>
                <option value="Situs budaya">Situs budaya</option>
            </select>
    </div>


    {/* GAMBAR */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Gambar
      </label>
      <input
        type="file"
        id="image"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
      />
    </div>

    {/* SUBMIT BUTTON */}
    <div className="flex justify-center">
      <button
        type="submit"
        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
      >
        Simpan
      </button>
    </div>
  </form>
</div>
      </div>
      </div>
      
    </div>
  );
};

export default AddFoto;
