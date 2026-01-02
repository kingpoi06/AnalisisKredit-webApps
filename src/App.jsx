import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import Login from "./views/loginpage/index";
import Dashboard from"./admin/dashboard";
import DataDiriNasabah from "./admin/DataDiri";
import DataUsaha from "./admin/DataUsaha";
import DataJaminan from "./admin/DataJaminan";


function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />
        
        {/* Fitur */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Data Diri Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-diri" element={<DataDiriNasabah/>}/>

        {/* Data Usaha Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-usaha" element={<DataUsaha/>}/>

        {/* Data Jaminan Nasabah (MASTER DATA) */}
        <Route path="/master-data/data-jaminan" element={<DataJaminan/>}/>

      </Routes>
    </Router>
  );
}

export default App;
