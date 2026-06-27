import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Home } from "lucide-react";
import { Button } from "../components/ui/button";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md w-full text-center">
        <img src={LOGO_URL} alt="" className="h-16 w-16 mx-auto mb-4" />
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h1 className="font-heading font-bold text-[#00296B] text-2xl mb-2">¡Pago completado!</h1>
        <p className="text-[#475569] text-sm mb-2">Tu inscripción ha sido procesada correctamente.</p>
        <p className="text-[#475569] text-sm mb-6">
          Recibirás un email de confirmación en breve. El club se pondrá en contacto contigo para completar el proceso.
        </p>
        <Button onClick={() => navigate("/")} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
          <Home size={16} className="mr-2" /> Volver al inicio
        </Button>
      </div>
    </div>
  );
}

export function PaymentCancelPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md w-full text-center">
        <img src={LOGO_URL} alt="" className="h-16 w-16 mx-auto mb-4" />
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-400" />
        </div>
        <h1 className="font-heading font-bold text-[#00296B] text-2xl mb-2">Pago cancelado</h1>
        <p className="text-[#475569] text-sm mb-6">
          No se ha procesado ningún cargo. Puedes volver a intentarlo cuando quieras.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate(-1)} variant="outline" className="flex-1">Reintentar</Button>
          <Button onClick={() => navigate("/")} className="flex-1 bg-[#2460FF] hover:bg-[#00296B] text-white">
            <Home size={16} className="mr-2" /> Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
