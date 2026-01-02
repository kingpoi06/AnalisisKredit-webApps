import "tailwindcss/tailwind.css";
import Sidebar from "../../component/sidebar";
import Header from "../../component/header";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import useAxios from "../../useAxios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const EditNews = () => {
  const [namalengkap, setNamalengkap] = useState("");
  const navigate = useNavigate();
  const axiosInstance = useAxios();
  const token = localStorage.getItem("accessToken");
  
  const [formData, setFormData] = useState({});
  const newsToEdit =  JSON.parse(localStorage.getItem("newsToEdit"));


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Fungsi untuk menangani perubahan file gambar
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
      text: "Apakah Anda yakin ingin menyimpan data NEWS ini?",
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
        data.append("author", formData.author);
        data.append("kategori", formData.kategori);
        data.append("tags", formData.tags);
        data.append("title", formData.title);
        data.append("content", formData.content);
        if (formData.image) data.append("image", formData.image); // Tambahkan file gambar jika ada

        const response = await axiosInstance.patch(`/news/${newsToEdit.id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.status === 201) {
          Swal.fire("Data News telah disimpan!", "", "success");
          navigate("/news"); // Arahkan ke halaman lain jika berhasil
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
    Edit Data Berita
  </h2>
  <form onSubmit={handleSubmit} className="space-y-6">
    {/* AUTHOR */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Penulis
      </label>
      <input
        type="text"
        name="author"
        value={formData.author}
        onChange={handleInputChange}
        placeholder="Masukkan nama penulis"
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
                onChange={handleInputChange}
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

    {/* TAGS */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Tag
      </label>
      <input
        type="text"
        name="tags"
        value={formData.tags}
        onChange={handleInputChange}
        placeholder="Masukkan tags terkait"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
        required
      />
    </div>

    {/* TITLE */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Judul
      </label>
      <input
        type="text"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        placeholder="Masukkan judul berita"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
        required
      />
    </div>

    {/* GAMBAR */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Gambar Berita
      </label>
      <input
        type="file"
        id="image"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
      />
    </div>

    {/* ISI KONTEN */}
    <div>
      <label className="block text-sm font-semibold text-gray-600 mb-2">
        Isi Berita
      </label>
      <textarea
        name="content"
        value={formData.content}
        onChange={handleInputChange}
        placeholder="Masukkan isi konten berita"
        rows={5}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none focus:border-indigo-500"
        required
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

export default EditNews;
