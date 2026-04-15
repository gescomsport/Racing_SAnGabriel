import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") setError(detail);
      else if (Array.isArray(detail)) setError(detail.map(e => e.msg || JSON.stringify(e)).join(" "));
      else setError("Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center px-4" data-testid="login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="RSGADC" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-[#00296B] text-2xl">Panel de Administracion</h1>
          <p className="text-sm text-[#475569] mt-1">Racing San Gabriel ADC</p>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={18} className="text-[#2460FF]" />
            <h2 className="font-heading font-bold text-[#00296B]">Iniciar Sesion</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-[#0F172A]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1 border-[#E2E8F0]"
                data-testid="login-email-input"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[#0F172A]">Contrasena</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="border-[#E2E8F0] pr-10"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569]"
                  onClick={() => setShowPw(!showPw)}
                  data-testid="toggle-password-visibility"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500" data-testid="login-error">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white font-heading font-bold"
              data-testid="login-submit-button"
            >
              {loading ? "Iniciando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          <a href="/" className="hover:text-[#2460FF] transition-colors" data-testid="back-to-home-link">Volver a la web</a>
        </p>
      </div>
    </div>
  );
}
