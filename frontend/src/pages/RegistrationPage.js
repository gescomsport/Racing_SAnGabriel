import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, User, Shield, CreditCard, AlertCircle, ChevronRight, Loader2, Landmark, CheckCircle2, Copy } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg";

const POSITIONS = ["Portero", "Defensa central", "Lateral derecho", "Lateral izquierdo",
  "Centrocampista", "Mediapunta", "Extremo derecho", "Extremo izquierdo", "Delantero centro", "Sin definir"];

const RELATIONSHIPS = [
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "tutor_legal", label: "Tutor legal" },
  { value: "abuelo", label: "Abuelo/a" },
  { value: "hermano", label: "Hermano/a mayor" },
  { value: "otro", label: "Otro" },
];

function calcAge(birthdate) {
  if (!birthdate) return null;
  return (new Date() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 365.25);
}

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [fees, setFees] = useState([]);
  const [settings, setSettings] = useState({});
  const [step, setStep] = useState(1); // 1: player data, 2: guardian (if minor), 3: fee + confirm
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [player, setPlayer] = useState({
    name: "", surname: "", birthdate: "", dni: "",
    phone: "", email: "", address: "", city: "", postal_code: "",
    team_id: "", position: "", jersey_size: "", medical_notes: ""
  });

  const [guardian, setGuardian] = useState({
    name: "", surname: "", dni: "", phone: "", email: "", relationship: "padre"
  });

  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [bankInfo, setBankInfo] = useState(null); // set after bank_transfer submission
  const [redsysForm, setRedsysForm] = useState(null); // set after redsys submission

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/teams`),
      axios.get(`${API}/fees?active_only=true`),
      axios.get(`${API}/settings`),
    ]).then(([t, f, s]) => {
      setTeams(t.data);
      setFees(f.data.filter(f => ["inscripcion", "cuota_temporada"].includes(f.fee_type)));
      setSettings(s.data);
    }).catch(() => {});
  }, []);

  const isMinor = calcAge(player.birthdate) !== null && calcAge(player.birthdate) < 18;
  const selectedFee = fees.find(f => f.id === selectedFeeId);

  const step1Valid = player.name && player.surname && player.birthdate &&
    player.phone && player.email && player.team_id;

  const step2Valid = !isMinor || (guardian.name && guardian.phone && guardian.email);

  const step3Valid = selectedFeeId !== "";

  // Build list of enabled payment methods based on settings
  const availablePaymentMethods = [];
  if (settings.stripe_enabled || settings.stripe_public_key) availablePaymentMethods.push({ id: "stripe", label: "Tarjeta de crédito/débito", icon: CreditCard, note: "Pago seguro online" });
  if (settings.redsys_enabled) availablePaymentMethods.push({ id: "redsys", label: "TPV Virtual (Redsys)", icon: CreditCard, note: "Pago con tarjeta vía banco" });
  if (settings.bank_transfer_enabled) availablePaymentMethods.push({ id: "bank_transfer", label: "Transferencia bancaria", icon: Landmark, note: "El club confirmará el pago" });
  // Always show all methods if settings not yet loaded
  const methods = availablePaymentMethods.length > 0 ? availablePaymentMethods : [{ id: "stripe", label: "Tarjeta de crédito/débito", icon: CreditCard, note: "Pago seguro online" }];

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...player,
        guardian: isMinor ? guardian : null,
        fee_id: selectedFeeId,
        payment_method: paymentMethod,
        success_url: window.location.origin + "/pago/exito?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: window.location.origin + "/pago/cancelado",
      };
      const res = await axios.post(`${API}/register/player`, payload);
      if (res.data.payment_method === "stripe") {
        window.location.href = res.data.checkout_url;
      } else if (res.data.payment_method === "bank_transfer") {
        setBankInfo(res.data);
      } else if (res.data.payment_method === "redsys") {
        setRedsysForm(res.data);
        // Auto-submit redsys form after state update
        setTimeout(() => document.getElementById("redsys-form")?.submit(), 300);
      }
    } catch (e) {
      setError(e.response?.data?.detail || "Error al procesar la inscripción. Inténtalo de nuevo.");
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
            <p className="text-blue-200 text-xs uppercase tracking-widest">Inscripción</p>
            <h1 className="font-heading font-bold text-lg">{clubName}</h1>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {[
              { n: 1, label: "Jugador" },
              { n: isMinor ? 2 : null, label: "Tutor" },
              { n: isMinor ? 3 : 2, label: "Pago" },
            ].filter(s => s.n !== null).map((s, i, arr) => (
              <div key={s.n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? "bg-[#2460FF] text-white" : "bg-[#E2E8F0] text-[#94A3B8]"}`}>
                  {s.n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.n ? "text-[#00296B]" : "text-[#94A3B8]"}`}>{s.label}</span>
                {i < arr.length - 1 && <ChevronRight size={14} className="text-[#E2E8F0]" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* STEP 1 — Player data */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <User size={18} className="text-[#2460FF]" />
              <h2 className="font-heading font-bold text-[#00296B] text-lg">Datos del jugador</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Nombre *</Label>
                <Input value={player.name} onChange={e => setPlayer({ ...player, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Apellidos *</Label>
                <Input value={player.surname} onChange={e => setPlayer({ ...player, surname: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Fecha de nacimiento *</Label>
                <Input type="date" value={player.birthdate} onChange={e => setPlayer({ ...player, birthdate: e.target.value })} className="mt-1" />
                {isMinor && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> Menor de edad — se solicitarán datos del tutor
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm">DNI / NIE</Label>
                <Input value={player.dni} onChange={e => setPlayer({ ...player, dni: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Teléfono *</Label>
                <Input value={player.phone} onChange={e => setPlayer({ ...player, phone: e.target.value })} className="mt-1" placeholder="+34 600 000 000" />
              </div>
              <div>
                <Label className="text-sm">Email *</Label>
                <Input type="email" value={player.email} onChange={e => setPlayer({ ...player, email: e.target.value })} className="mt-1" placeholder="jugador@email.com" />
              </div>
            </div>

            <div>
              <Label className="text-sm">Dirección</Label>
              <Input value={player.address} onChange={e => setPlayer({ ...player, address: e.target.value })} className="mt-1" placeholder="Calle, número, piso..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Ciudad</Label>
                <Input value={player.city} onChange={e => setPlayer({ ...player, city: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Código postal</Label>
                <Input value={player.postal_code} onChange={e => setPlayer({ ...player, postal_code: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Categoría / Equipo *</Label>
                <Select value={player.team_id} onValueChange={v => setPlayer({ ...player, team_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona equipo" /></SelectTrigger>
                  <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Posición</Label>
                <Select value={player.position} onValueChange={v => setPlayer({ ...player, position: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Notas médicas (alergias, condiciones especiales...)</Label>
              <Textarea value={player.medical_notes} onChange={e => setPlayer({ ...player, medical_notes: e.target.value })} rows={2} className="mt-1" />
            </div>

            <Button
              onClick={() => setStep(isMinor ? 2 : 2)}
              disabled={!step1Valid}
              className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
            >
              Continuar <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2 — Guardian (if minor) */}
        {step === 2 && isMinor && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-[#2460FF]" />
              <h2 className="font-heading font-bold text-[#00296B] text-lg">Datos del tutor legal</h2>
            </div>
            <p className="text-sm text-[#475569] -mt-2">
              El jugador es menor de edad. Necesitamos los datos del tutor o representante legal.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Nombre *</Label>
                <Input value={guardian.name} onChange={e => setGuardian({ ...guardian, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Apellidos</Label>
                <Input value={guardian.surname} onChange={e => setGuardian({ ...guardian, surname: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">DNI / NIE</Label>
                <Input value={guardian.dni} onChange={e => setGuardian({ ...guardian, dni: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Relación</Label>
                <Select value={guardian.relationship} onValueChange={v => setGuardian({ ...guardian, relationship: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Teléfono *</Label>
                <Input value={guardian.phone} onChange={e => setGuardian({ ...guardian, phone: e.target.value })} className="mt-1" placeholder="+34 600 000 000" />
              </div>
              <div>
                <Label className="text-sm">Email *</Label>
                <Input type="email" value={guardian.email} onChange={e => setGuardian({ ...guardian, email: e.target.value })} className="mt-1" placeholder="tutor@email.com" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">Atrás</Button>
              <Button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 bg-[#2460FF] hover:bg-[#00296B] text-white">
                Continuar <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* BANK TRANSFER SUCCESS PANEL */}
        {bankInfo && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 size={28} />
              <div>
                <h2 className="font-heading font-bold text-[#00296B] text-lg">¡Inscripción recibida!</h2>
                <p className="text-sm text-[#475569]">Realiza la transferencia para completar el proceso</p>
              </div>
            </div>
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
            <p className="text-xs text-[#94A3B8]">Una vez recibida la transferencia, el club activará tu inscripción y recibirás confirmación por email.</p>
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

        {/* STEP 2 or 3 — Fee selection + confirm */}
        {!bankInfo && !redsysForm && ((step === 2 && !isMinor) || step === 3) && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} className="text-[#2460FF]" />
              <h2 className="font-heading font-bold text-[#00296B] text-lg">Modalidad y pago</h2>
            </div>

            {/* Summary */}
            <div className="bg-[#F4F7FB] rounded-xl p-4 text-sm space-y-1">
              <p className="font-medium text-[#00296B]">{player.name} {player.surname}</p>
              <p className="text-[#475569]">{teams.find(t => t.id === player.team_id)?.name} · {player.position || "Sin posición"}</p>
              {isMinor && <p className="text-[#475569]">Tutor: {guardian.name} {guardian.surname}</p>}
            </div>

            {/* Fee selection */}
            <div>
              <Label className="text-sm mb-2 block">Selecciona la modalidad de inscripción *</Label>
              {fees.length === 0 ? (
                <p className="text-sm text-[#94A3B8] bg-[#F4F7FB] rounded-lg p-4">No hay tarifas disponibles. Contacta con el club.</p>
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
            </div>

            {/* Payment method selection */}
            {methods.length > 1 && (
              <div>
                <Label className="text-sm mb-2 block">Método de pago *</Label>
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

            {/* RGPD notice */}
            <p className="text-xs text-[#94A3B8] bg-[#F4F7FB] rounded-lg p-3">
              Al completar la inscripción, acepta que sus datos sean tratados por {clubName} para la gestión deportiva del club, conforme al RGPD (UE) 2016/679. Los datos no serán cedidos a terceros.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => setStep(isMinor ? 2 : 1)} variant="outline" className="flex-1">Atrás</Button>
              <Button
                onClick={handleSubmit}
                disabled={!step3Valid || loading}
                className="flex-1 bg-[#2460FF] hover:bg-[#00296B] text-white"
              >
                {loading ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Procesando...</>
                ) : paymentMethod === "bank_transfer" ? (
                  <>Completar inscripción <CheckCircle2 size={16} className="ml-2" /></>
                ) : (
                  <>Pagar {selectedFee ? `${selectedFee.amount?.toFixed(2)}€` : ""} <CreditCard size={16} className="ml-2" /></>
                )}
              </Button>
            </div>

            {paymentMethod === "stripe" && <p className="text-xs text-center text-[#94A3B8]">Pago seguro mediante Stripe · No almacenamos datos de tarjeta</p>}
          </div>
        )}
      </div>
    </div>
  );
}
