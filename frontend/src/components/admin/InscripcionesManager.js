import { useState, useEffect, useCallback } from "react";
import {
  Users, CheckCircle, XCircle, Clock, Link2, Copy, ChevronDown, ChevronUp,
  User, Shield, Euro, Calendar, Phone, Mail, MapPin, RefreshCw, AlertTriangle
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import ax from "../../api";

const STATUS_META = {
  pending:         { label: "Pendiente",       color: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_payment: { label: "Pago pendiente",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  active:          { label: "Activo",          color: "bg-green-50 text-green-700 border-green-200" },
  inactive:        { label: "Baja",            color: "bg-gray-100 text-gray-500" },
};

function daysAgo(dateStr) {
  if (!dateStr) return null;
  const diff = (Date.now() - new Date(dateStr)) / 86400000;
  if (diff < 1) return "hoy";
  if (diff < 2) return "ayer";
  return `hace ${Math.floor(diff)} días`;
}

function calcAge(birthdate) {
  if (!birthdate) return null;
  return Math.floor((Date.now() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 365.25));
}

export default function InscripcionesManager() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending,pending_payment");
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, tr, fr] = await Promise.all([ax.get("/players"), ax.get("/teams"), ax.get("/fees")]);
      setPlayers(pr.data);
      setTeams(tr.data);
      setFees(fr.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));
  const feeMap = Object.fromEntries(fees.map(f => [f.id, f.name]));

  const filtered = players.filter(p => {
    const statuses = statusFilter === "all" ? null : statusFilter.split(",");
    if (statuses && !statuses.includes(p.status)) return false;
    return true;
  }).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  const pendingCount = players.filter(p => ["pending", "pending_payment"].includes(p.status)).length;
  const thisWeek = players.filter(p => {
    if (!p.created_at) return false;
    return (Date.now() - new Date(p.created_at)) / 86400000 <= 7;
  }).length;
  const thisMonth = players.filter(p => {
    if (!p.created_at) return false;
    return (Date.now() - new Date(p.created_at)) / 86400000 <= 30;
  }).length;

  const handleAccept = async (player) => {
    try {
      await ax.put(`/players/${player.id}`, { status: "active" });
      setActionMsg({ ok: true, msg: `${player.name} ${player.surname} activado correctamente.` });
      load();
    } catch {
      setActionMsg({ ok: false, msg: "Error al activar el jugador." });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleReject = async (player) => {
    if (!window.confirm(`¿Rechazar y eliminar la inscripción de ${player.name} ${player.surname}?`)) return;
    try {
      await ax.delete(`/players/${player.id}`);
      setActionMsg({ ok: true, msg: "Inscripción eliminada." });
      load();
    } catch {
      setActionMsg({ ok: false, msg: "Error al eliminar." });
    }
    setTimeout(() => setActionMsg(null), 4000);
  };

  const registrationUrl = `${window.location.origin}/register`;

  const copyUrl = () => {
    navigator.clipboard.writeText(registrationUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Inscripciones</h2>
          <p className="text-sm text-[#475569] mt-0.5">Solicitudes recibidas del formulario público de inscripción</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="text-[#475569] text-sm">
          <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Pendientes de revisión", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Nuevas esta semana",     value: thisWeek,    color: "text-[#2460FF]",  bg: "bg-blue-50" },
          { label: "Nuevas este mes",        value: thisMonth,   color: "text-[#2460FF]",  bg: "bg-blue-50" },
          { label: "Total jugadores",        value: players.length, color: "text-[#00296B]", bg: "bg-[#EEF2FF]" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#475569] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Registration link */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Link2 size={16} className="text-[#2460FF]" />
          <p className="font-semibold text-[#00296B] text-sm">Enlace de inscripción para familias</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F4F7FB] rounded-lg px-3 py-2">
          <code className="text-xs text-[#475569] flex-1 truncate">{registrationUrl}</code>
          <Button size="sm" variant="outline" onClick={copyUrl} className="text-xs text-[#2460FF] border-[#2460FF] flex-shrink-0">
            <Copy size={12} className="mr-1" />
            {copied ? "¡Copiado!" : "Copiar"}
          </Button>
        </div>
        <p className="text-xs text-[#94A3B8] mt-2">Comparte este enlace con las familias para que completen el formulario de inscripción online.</p>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${actionMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {actionMsg.ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {actionMsg.msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <p className="text-sm font-medium text-[#475569]">Mostrar:</p>
        {[
          { value: "pending,pending_payment", label: "Solo pendientes" },
          { value: "active", label: "Activos" },
          { value: "all", label: "Todos" },
        ].map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === f.value ? "bg-[#00296B] text-white border-[#00296B]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B]"}`}>
            {f.label}
          </button>
        ))}
        <span className="text-xs text-[#94A3B8] ml-auto">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center text-[#94A3B8]">
          <Users size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay inscripciones en este estado</p>
          <p className="text-sm mt-1">Cuando una familia complete el formulario, aparecerá aquí.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(p => {
          const isExpanded = expandedId === p.id;
          const age = calcAge(p.birthdate);
          const isMinor = age !== null && age < 18;
          const meta = STATUS_META[p.status] || STATUS_META.pending;
          const isPending = ["pending", "pending_payment"].includes(p.status);

          return (
            <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F8FAFF]"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center font-bold text-[#2460FF] text-sm flex-shrink-0">
                  {(p.name?.[0] || "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#0F172A]">{p.name} {p.surname}</p>
                    <Badge className={`text-xs border ${meta.color}`}>{meta.label}</Badge>
                    {isMinor && <Badge className="text-xs bg-purple-50 text-purple-600 border-purple-200">Menor</Badge>}
                    {p.created_at && <span className="text-xs text-[#94A3B8]">{daysAgo(p.created_at)}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[#94A3B8] flex-wrap">
                    {age !== null && <span>{age} años</span>}
                    {p.team_id && teamMap[p.team_id] && <span className="flex items-center gap-1"><Users size={10} />{teamMap[p.team_id]}</span>}
                    {p.phone && <span className="flex items-center gap-1"><Phone size={10} />{p.phone}</span>}
                    {p.email && <span className="flex items-center gap-1"><Mail size={10} />{p.email}</span>}
                  </div>
                </div>
                {isPending && (
                  <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <Button size="sm" onClick={() => handleAccept(p)} className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3">
                      <CheckCircle size={12} className="mr-1" />Aceptar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(p)} className="text-red-500 border-red-200 text-xs h-8 px-3">
                      <XCircle size={12} className="mr-1" />Rechazar
                    </Button>
                  </div>
                )}
                {isExpanded ? <ChevronUp size={14} className="text-[#94A3B8] flex-shrink-0" /> : <ChevronDown size={14} className="text-[#94A3B8] flex-shrink-0" />}
              </div>

              {isExpanded && (
                <div className="border-t border-[#F1F5F9] px-4 pb-4 pt-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Player details */}
                    <div>
                      <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-2 flex items-center gap-1.5"><User size={12} />Datos del deportista</p>
                      <div className="space-y-1 text-sm">
                        <Row label="Nombre" value={`${p.name} ${p.surname}`} />
                        <Row label="Fecha nac." value={p.birthdate} />
                        <Row label="DNI/NIE" value={p.dni} />
                        <Row label="Teléfono" value={p.phone} />
                        <Row label="Email" value={p.email} />
                        <Row label="Dirección" value={[p.address, p.city, p.postal_code].filter(Boolean).join(", ")} />
                        <Row label="Equipo" value={teamMap[p.team_id] || p.team_id} />
                        {p.medical_notes && <Row label="Notas médicas" value={p.medical_notes} />}
                        {p.bank_iban && <Row label="IBAN" value={p.bank_iban} />}
                      </div>
                    </div>

                    {/* Payment / registration meta */}
                    <div>
                      <p className="text-xs font-bold text-[#475569] uppercase tracking-wide mb-2 flex items-center gap-1.5"><Euro size={12} />Inscripción</p>
                      <div className="space-y-1 text-sm">
                        <Row label="Estado" value={meta.label} />
                        <Row label="Registrado" value={p.created_at ? new Date(p.created_at).toLocaleString("es-ES") : "—"} />
                        {p.notes && <Row label="Notas" value={p.notes} />}
                      </div>
                      {p.status === "pending" && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                          <p className="font-bold mb-1">Pendiente de revisión</p>
                          <p>Revisa los datos y haz clic en "Aceptar" para activar al jugador, o "Rechazar" para eliminarlo.</p>
                        </div>
                      )}
                      {p.status === "pending_payment" && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                          <p className="font-bold mb-1">Esperando pago por transferencia</p>
                          <p>Cuando recibas el ingreso en tu cuenta, haz clic en "Aceptar" para activar al jugador.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[#94A3B8] w-24 flex-shrink-0">{label}:</span>
      <span className="text-[#0F172A] flex-1">{value}</span>
    </div>
  );
}
