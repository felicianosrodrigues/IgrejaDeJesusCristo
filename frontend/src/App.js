import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import PrayerWall from "@/pages/PrayerWall";
import Testimonies from "@/pages/Testimonies";
import Agenda from "@/pages/Agenda";
import Contributions from "@/pages/Contributions";
import Admin from "@/pages/Admin";
import ResetPassword from "@/pages/ResetPassword";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/oracao" element={<PrayerWall />} />
              <Route path="/testemunhos" element={<Testimonies />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/contribuicoes" element={<Contributions />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
