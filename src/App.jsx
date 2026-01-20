import { BrowserRouter as Router, Routes, Route } from "react-router-dom";



import Login from "./views/loginpage/index";
import Dashboard from "./kredit-modalkerja/admin/dashboard";
import DashboardUsers from "./monitoring-users/dashboard-users";
import DataDiriNasabah from "./kredit-modalkerja/admin/DataDiri";
import DataUsaha from "./kredit-modalkerja/admin/DataUsaha";
import DataJaminan from "./kredit-modalkerja/admin/DataJaminan";
// import DetailNasabah from "./admin/DetailNasabah";
import DataPermohonan from "./kredit-modalkerja/admin/DataPermohonan";
import Permohonan from "./kredit-modalkerja/admin/Permohonan";
import Analisis from "./kredit-modalkerja/admin/Analisis";
import Kalkulator from "./kredit-modalkerja/admin/Kalkulator";
// import RekomdanKesimpulan from "./admin/RekomdanKesimpulan";
import PrintPDF from "./kredit-modalkerja/admin/printPDF";
import DataInstansi from "./kredit-konsumtif/admin/DataInstansi";
import UploadCabangKantor from "./master-data/UploadCabangKantor";
import UploadPegawai from "./master-data/UploadPegawai";

//UPDATE DATE
import UpdateDataDiriNasabah from "./kredit-modalkerja/update/DataDiri";
import UpdateDataPermohonan from "./kredit-modalkerja/update/DataPermohonan";
import UpdateDataJaminan from "./kredit-modalkerja/update/DataJaminan";
import UpdateDataUsaha from "./kredit-modalkerja/update/DataUsaha";
import UpdateAnalisis from "./kredit-modalkerja/update/Analisis";
import UpdateDataInstansi from "./kredit-konsumtif/update/DataInstansi";


function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />
        
        {/* Fitur */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-monitoring-users" element={<DashboardUsers />} />

        <Route path="/generate/no-permohonan" element={<Permohonan />} />
        <Route path="/kalkulator" element={<Kalkulator />} />

        {/* Data Diri Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-diri" element={<DataDiriNasabah/>}/>

        {/* Data Usaha Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-usaha/:no_permohonan" element={<DataUsaha/>}/>

        {/* Data Pemohonan Kredit Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-permohonan/:no_permohonan" element={<DataPermohonan/>}/>
        
        {/* Data Jaminan Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-jaminan/:no_permohonan" element={<DataJaminan/>}/>

        <Route path="/analisis-nasabah/:no_permohonan" element={<Analisis/>}/>
        {/* <Route path="/rekomendasi-dan-kesimpulan/:no_permohonan" element={<RekomdanKesimpulan/>}/> */}


        {/* UPDATE DATA*/}
        <Route path="/update-data/data-diri/:no_permohonan" element={<UpdateDataDiriNasabah/>}/>
        <Route path="/update-data/data-jaminan/:no_permohonan" element={<UpdateDataJaminan/>}/>
        <Route path="/update-data/data-permohonan/:no_permohonan" element={<UpdateDataPermohonan/>}/>
        <Route path="/update-data/data-usaha/:no_permohonan" element={<UpdateDataUsaha/>}/>
        <Route path="/update-data/analisis/:no_permohonan" element={<UpdateAnalisis/>}/>
        <Route path="/update-data/data-instansi/:no_permohonan" element={<UpdateDataInstansi/>}/>

        <Route path="/master-data/data-instansi/:no_permohonan" element={<DataInstansi/>}/>
        <Route path="/master-data/cabang-kantor" element={<UploadCabangKantor />} />
        <Route path="/master-data/pegawai" element={<UploadPegawai />} />

        {/* Data Nasabah (DETAIL DATA NASABAH) */}
        <Route path="/printPDF-nasabah/:no_permohonan" element={<PrintPDF />} />

      </Routes>
    </Router>
  );
}

export default App;
