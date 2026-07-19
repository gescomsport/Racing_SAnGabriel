import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ClubProvider } from "./contexts/ClubContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RegistrationPage from "./pages/RegistrationPage";
import MemberRegistrationPage from "./pages/MemberRegistrationPage";
import { PaymentSuccessPage, PaymentCancelPage } from "./pages/PaymentResultPage";
import PublicFormPage from "./pages/PublicFormPage";

function App() {
  return (
    <ClubProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/inscripcion" element={<RegistrationPage />} />
            <Route path="/alta-socio" element={<MemberRegistrationPage />} />
            <Route path="/pago/exito" element={<PaymentSuccessPage />} />
            <Route path="/pago/cancelado" element={<PaymentCancelPage />} />
            <Route path="/registro/:formSlug" element={<PublicFormPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ClubProvider>
  );
}

export default App;
