import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Star, CreditCard, AlertCircle, Loader2, Landmark, CheckCircle2, Copy
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg";

const MEMBER_TYPES = [
  { value: "socio_adulto", label: "Socio Adulto" },
  { value: "socio_juvenil", label: "Socio Juvenil (menores de 18)" },
  { value: "socio_familiar", label: "Socio Familiar" },
  { value: "abonado", label: "Abonado" },
];

export default function MemberRegistrationPage() {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [bankInfo, setBankInfo] = useState(null);
  const [redsysForm, setRedsysForm] = useState(null);

  const [form, setForm] = useState({
    name: "", surname: "", birthdate: "", dni: "",
    phone: "", email: "", address: "", city: "", postal_code: "",
    member_type: "socio_adulto", bank_iban: ""
  });

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/fees?active_only=true`),
      axios.get(`${API}/settings`),
    ]).then(([f, s]) => {
      setFees(f.data.filter(f => ["socio", "cuota_mensual", "cuota_temporada"].includes(f.fee_type)));
      setSettings(s.data);
    }).catch(() => {});
  }, []);

  const selectedFee = fees.find(f => f.id === selectedFeeId);
  const formValid = form.name && form.surname && form.phone && form.email && selectedFeeId;

  // Build list of enabled payment methods
  const availablePaymentMethods = [];
  if (settings.stripe_enabled || settings.stripe_public_key) availablePaymentMethods.push({ id: "stripe", label: "Tarjeta de crédito/débito", icon: CreditCard, note: "Pago seguro online" });
  if (settings.redsys_enabled) availablePaymentMethods.push({ id: "redsys", label: "TPV Virtual (Redsys)", icon: CreditCard, note: "Pago con tarjeta vía banco" });
  if (settings.bank_transfer_enabled) availablePaymentMethods.push({ id: "bank_transfer", label: "Transferencia bancaria", icon: Landmark, note: "El club confirmará el pago" });
  const methods = availablePaymentMethods.length > 0 ? availablePaymentMethods : [{ id: "stripe", label: "Tarjeta de crédito/débito", icon: CreditCard, note: "Pago seguro online" }];

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/register/member`, {
        ...form,
        fee_id: selectedFeeId,
        payment_method: paymentMethod,
        success_url: window.location.origin + "/pago/exito?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: window.location.origin + "/pago/cancelado",
      });
      if (res.data.payment_method === "stripe") {
        window.location.href = res.data.checkout_url;
      } else if (res.data.payment_method === "bank_transfer") {
        setBankInfo(res.data);
      } else if (res.data.payment_method === "redsys") {
        setRedsysForm(res.data);
        setTimeout(() => document.getElementById("redsys-form")?.submit(), 300);
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Error al procesar el alta. Inténtalo de nuevo.");
    }
    setLoading(false);
  };

  const clubName = settings.club_name || "Racing San Gabriel A.D.C.";

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Header */}
      <div className="bg-[#00296B] text-white py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-blue-200 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <img src={LOGO_URL} alt="" className="h-10 w-10" />
          <div>
            <p className="text-blue-200 text-xs uppercase tracking-widest">Alta de Socio</p>
            <h1 className="font-heading font-bold text-lg">{clubName}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* BANK TRANSFER SUCCESS PANEL */}
        {bankInfo && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 size={28} />
              <div>
                <h2 className="font-heading font-bold text-[#00296B] text-lg">¡Alta de socio recibida!</h2>
                <p className="text-sm text-[#475569]">Realiza la transferencia para completar el proceso</p>
              </div>
            </div>
            {bankInfo.member_number && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-[#475569]">Tu número de socio (provisional)</p>
                <p className="font-heading font-bold text-[#00296B] text-2xl">{bankInfo.member_number}</p>
              </div>
            )}
            <div className="bg-[#F4F7FB] rounded-xl p-5 space-y-3">
              <p className="text-sm font-bold text-[#00296B]">Datos para la transferencia</p>
              {[
                { label: "Titular", value: bankInfo.bank_holder },
                { label: "Banco", value: bankInfo.bank_name },
                { label: "IBAN", value: bankInfo.bank_iban },
                { label: "BIC/SWIFT", value: bankInfo.bank_bic },
                { label: "Importe", value: `${bankInfo.amount?.toFixed(2)} €` },
                { label: "Concepto", value: bankInfo.concept },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#475569] w-20 flex-shrink-0">{row.label}</span>
                  <span className="font-mono text-sm text-[#0F172A] flex-1 truncate">{row.value}</span>
                  <button onClick={() => navigator.clipboard.writeText(row.value)} className="text-[#94A3B8] hover:text-[#2460FF]"><Copy size={13} /></button>
                </div>
              ))}
            </div>
            {bankInfo.bank_transfer_instructions && (
              <p className="text-sm text-[#475569] bg-amber-50 rounded-lg p-3">{bankInfo.bank_transfer_instructions}</p>
            )}
            <p className="text-xs text-[#94A3B8]">Una vez recibida la transferencia, el club activará tu alta y recibirás confirmación por email.</p>
            <Button onClick={() => navigate("/")} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Volver al inicio</Button>
          </div>
        )}

        {/* REDSYS auto-submit form */}
        {redsysForm && (
          <form id="redsys-form" method="POST" action={redsysForm.gateway_url} style={{ display: "none" }}>
            <input type="hidden" name="Ds_SignatureVersion" value={redsysForm.Ds_SignatureVersion} />
            <input type="hidden" name="Ds_MerchantParameters" value={redsysForm.Ds_MerchantParameters} />
            <input type="hidden" name="Ds_Signature" value={redsysForm.Ds_Signature} />
          </form>
        )}

        {!bankInfo && !redsysForm && (
          <>
            {/* Personal data */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500" />
                <h2 className="font-heading font-bold text-[#00296B] text-lg">Datos personales</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-sm">Apellidos *</Label><Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm">Fecha de nacimiento</Label><Input type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-sm">DNI / NIE</Label><Input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm">Teléfono *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+34 600 000 000" /></div>
                <div><Label className="text-sm">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="socio@email.com" /></div>
              </div>
              <div><Label className="text-sm">Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm">Ciudad</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-sm">Código postal</Label><Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className="mt-1" /></div>
              </div>
              <div>
                <Label className="text-sm">Tipo de socio</Label>
                <Select value={form.member_type} onValueChange={v => setForm({ ...form, member_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MEMBER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">IBAN (opcional — para domiciliación futura)</Label>
                <Input value={form.bank_iban} onChange={e => setForm({ ...form, bank_iban: e.target.value })} className="mt-1 font-mono" placeholder="ES00 0000 0000 0000 0000 0000" />
              </div>
            </div>

            {/* Fee + Payment selection */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#2460FF]" />
                <h2 className="font-heading font-bold text-[#00296B] text-lg">Modalidad y pago</h2>
              </div>

              {fees.length === 0 ? (
                <p className="text-sm text-[#94A3B8] bg-[#F4F7FB] rounded-lg p-4">No hay tarifas de socio disponibles. Contacta con el club.</p>
              ) : (
                <div className="space-y-2">
                  {fees.map(fee => (
                    <label key={fee.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedFeeId === fee.id ? "border-[#2460FF] bg-blue-50" : "border-[#E2E8F0] hover:border-[#2460FF]/40"}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="fee" value={fee.id} checked={selectedFeeId === fee.id} onChange={() => setSelectedFeeId(fee.id)} className="accent-[#2460FF]" />
                        <div>
                          <p className="font-medium text-[#0F172A] text-sm">{fee.name}</p>
                          {fee.description && <p className="text-xs text-[#475569]">{fee.description}</p>}
                        </div>
                      </div>
                      <span className="font-heading font-bold text-[#00296B] text-lg">{fee.amount?.toFixed(2)}€</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Payment method selector */}
              {methods.length > 1 && (
                <div>
                  <Label className="text-sm mb-2 block">Método de pago</Label>
                  <div className="space-y-2">
                    {methods.map(m => (
                      <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === m.id ? "border-[#2460FF] bg-blue-50" : "border-[#E2E8F0]"}`}>
                        <input type="radio" name="payment_method" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-[#2460FF]" />
                        <m.icon size={16} className="text-[#475569]" />
                        <div>
                          <p className="font-medium text-[#0F172A] text-sm">{m.label}</p>
                          <p className="text-xs text-[#94A3B8]">{m.note}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[#94A3B8] bg-[#F4F7FB] rounded-lg p-3">
                Al completar el alta, acepta que sus datos sean tratados por {clubName} conforme al RGPD (UE) 2016/679. Los datos no serán cedidos a terceros.
              </p>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!formValid || loading}
                className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
              >
                {loading ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Procesando...</>
                ) : paymentMethod === "bank_transfer" ? (
                  <>Completar alta <CheckCircle2 size={16} className="ml-2" /></>
                ) : (
                  <>Pagar {selectedFee ? `${selectedFee.amount?.toFixed(2)}€` : ""} <CreditCard size={16} className="ml-2" /></>
                )}
              </Button>
              {paymentMethod === "stripe" && <p className="text-xs text-center text-[#94A3B8]">Pago seguro mediante Stripe · No almacenamos datos de tarjeta</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
