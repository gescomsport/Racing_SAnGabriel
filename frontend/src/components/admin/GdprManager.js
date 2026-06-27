import { useState, useEffect } from "react";
import axios from "axios";
import { Download, Trash2, CheckCircle2, XCircle, AlertTriangle, Search, Shield, FileText, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const TABS = [
  { id: "consents",  label: "Consentimientos",   icon: Shield },
  { id: "arco",      label: "Derechos ARCO",      icon: FileText },
  { id: "log",       label: "Registro auditoría", icon: Clock },
  { id: "policy",    label: "Política de privacidad", icon: FileText },
];

export default function GdprManager() {
  const [tab, setTab]             = useState("consents");
  const [consents, setConsents]   = useState({ players: [], members: [] });
  const [auditLog, setAuditLog]   = useState([]);
  const [policy, setPolicy]       = useState("");
  const [policyClub, setPolicyClub] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [c, l, p] = await Promise.all([
        ax.get("/gdpr/consents"),
        ax.get("/gdpr/log"),
        ax.get("/gdpr/privacy-policy"),
      ]);
      setConsents(c.data);
      setAuditLog(l.data);
      setPolicy(p.data.privacy_policy || "");
      setPolicyClub(p.data.club_name || "");
    } catch {}
  };

  const handleExport = async (type, id, name) => {
    try {
      const res = await ax.get(`/gdpr/export/${type}/${id}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `datos_rgpd_${name.replace(/ /g,"_")}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      // Log the export
      await ax.post ? null : null; // server logs it automatically
    } catch (e) {
      alert("Error al exportar los datos");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      await ax.delete(`/gdpr/delete/${deleteDialog.type}/${deleteDialog.id}`);
      setDeleteDialog(null);
      loadAll();
    } catch (e) {
      alert(e.response?.data?.detail || "Error al eliminar los datos");
    }
    setDeleting(false);
  };

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      await ax.put("/settings", { privacy_policy: policy });
      alert("Política de privacidad guardada correctamente.");
    } catch {
      alert("Error al guardar.");
    }
    setSavingPolicy(false);
  };

  const allPeople = [
    ...consents.players.map(p => ({ ...p, type: "player", typeLabel: "Jugador/a" })),
    ...consents.members.map(m => ({ ...m, type: "member", typeLabel: "Socio/a" })),
  ].filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.name + " " + p.surname + " " + (p.email || "")).toLowerCase().includes(q);
  });

  const withConsent    = allPeople.filter(p => p.consent_gdpr);
  const withoutConsent = allPeople.filter(p => !p.consent_gdpr);
  const withComms      = allPeople.filter(p => p.consent_communications);

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-[#2460FF]" />
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Protección de Datos — RGPD</h2>
        </div>
        <p className="text-xs text-[#475569]">
          Cumplimiento RGPD (UE 2016/679) · LOPDGDD · Responsable: {policyClub || "el Club"} · Encargado: SUDEPORTE
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#2460FF] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]"}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CONSENTIMIENTOS ─────────────────────────────────────── */}
      {tab === "consents" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total personas", value: allPeople.length, color: "text-[#00296B]", icon: "👤" },
              { label: "Con consentimiento RGPD", value: withConsent.length, color: "text-green-600", icon: "✅" },
              { label: "Sin consentimiento", value: withoutConsent.length, color: "text-amber-600", icon: "⚠️" },
              { label: "Aceptan comunicaciones", value: withComms.length, color: "text-blue-600", icon: "📧" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span>{s.icon}</span>
                  <p className="text-xs text-[#475569]">{s.label}</p>
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {withoutConsent.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <b>{withoutConsent.length} persona{withoutConsent.length > 1 ? "s" : ""} sin consentimiento RGPD registrado.</b> Estos
                registros fueron creados desde el panel de administración (no a través del formulario web).
                Para regularizarlos, debes obtener el consentimiento por escrito o email y marcarlo manualmente.
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3">
              <Search size={14} className="text-[#94A3B8]" />
              <Input placeholder="Buscar por nombre o email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border-0 shadow-none text-sm p-0 h-auto focus-visible:ring-0" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] text-xs text-[#475569] uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Persona</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-center">RGPD</th>
                    <th className="px-4 py-3 text-center">Comunicaciones</th>
                    <th className="px-4 py-3 text-center">Tutor (menor)</th>
                    <th className="px-4 py-3 text-left">Fecha consentimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {allPeople.map(p => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#0F172A]">{p.name} {p.surname}</p>
                        <p className="text-xs text-[#94A3B8]">{p.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.type === "player" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {p.typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.consent_gdpr ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> : <XCircle size={16} className="text-amber-400 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.consent_communications ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> : <XCircle size={16} className="text-gray-300 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.consent_guardian_gdpr === true ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> :
                         p.consent_guardian_gdpr === false ? <XCircle size={16} className="text-red-400 mx-auto" /> :
                         <span className="text-xs text-[#CBD5E1]">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#475569]">
                        {p.consent_date ? new Date(p.consent_date).toLocaleString("es-ES") : <span className="text-[#CBD5E1]">Sin registro</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPeople.length === 0 && (
                <div className="py-10 text-center text-[#94A3B8] text-sm">No hay registros</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DERECHOS ARCO ───────────────────────────────────────── */}
      {tab === "arco" && (
        <div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-800">
            <b>Derechos ARCO (Arts. 15-22 RGPD)</b>: Acceso, Rectificación, Cancelación/Supresión, Oposición y Portabilidad.
            Tienes <b>1 mes</b> para responder a cualquier solicitud (prorrogable a 3 meses).
            Registra cada solicitud en el log de auditoría.
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E2E8F0] px-4 py-3">
              <Search size={14} className="text-[#94A3B8] flex-shrink-0" />
              <Input placeholder="Buscar persona para exportar o eliminar sus datos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="border-0 shadow-none text-sm p-0 h-auto focus-visible:ring-0" />
            </div>
          </div>

          <div className="space-y-2">
            {allPeople.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#0F172A] text-sm">{p.name} {p.surname}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.type === "player" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>{p.typeLabel}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8]">{p.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport(p.type, p.id, `${p.name}_${p.surname}`)}
                    variant="outline" size="sm" className="text-[#2460FF] border-[#2460FF] text-xs">
                    <Download size={12} className="mr-1" /> Exportar datos
                  </Button>
                  <Button onClick={() => setDeleteDialog({ type: p.type, id: p.id, name: `${p.name} ${p.surname}` })}
                    variant="outline" size="sm" className="text-red-500 border-red-300 text-xs">
                    <Trash2 size={12} className="mr-1" /> Eliminar (derecho al olvido)
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {allPeople.length === 0 && searchQuery && (
            <div className="text-center py-8 text-[#94A3B8] text-sm">No se encontraron personas con ese nombre</div>
          )}
          {!searchQuery && (
            <div className="text-center py-8 text-[#94A3B8] text-sm">
              Escribe un nombre para buscar a la persona y gestionar sus datos
            </div>
          )}
        </div>
      )}

      {/* ── TAB: LOG AUDITORÍA ───────────────────────────────────────── */}
      {tab === "log" && (
        <div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="p-4 border-b border-[#E2E8F0]">
              <h3 className="font-medium text-[#00296B] text-sm">Registro de auditoría RGPD</h3>
              <p className="text-xs text-[#475569] mt-0.5">Acciones relacionadas con derechos y datos personales — conservado 3 años</p>
            </div>
            {auditLog.length === 0 ? (
              <div className="py-10 text-center text-[#94A3B8] text-sm">No hay registros de auditoría</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] text-xs text-[#475569] uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Acción</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">ID persona</th>
                    <th className="px-4 py-3 text-left">Realizado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {auditLog.map(l => (
                    <tr key={l.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-xs text-[#475569]">{new Date(l.date).toLocaleString("es-ES")}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          l.action === "deletion" ? "bg-red-50 text-red-600" :
                          l.action === "export"   ? "bg-blue-50 text-blue-600" :
                          "bg-gray-100 text-gray-600"}`}>
                          {l.action === "deletion" ? "Eliminación" : l.action === "export" ? "Exportación" : l.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#475569]">{l.person_type}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[#94A3B8]">{l.person_id?.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-xs text-[#475569]">{l.requested_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: POLÍTICA DE PRIVACIDAD ──────────────────────────────── */}
      {tab === "policy" && (
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800">
            <b>Importante:</b> Esta política de privacidad debe redactarse o ser revisada por un abogado o consultor LOPD.
            El texto que guardes aquí aparecerá en la web pública del club. Tienes una plantilla de partida en
            <code className="mx-1 bg-amber-100 px-1 rounded">legal/politica-privacidad.md</code>
            que puedes personalizar.
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <Label className="text-sm font-bold text-[#00296B]">Texto de la Política de Privacidad (formato Markdown)</Label>
            <Textarea
              value={policy}
              onChange={e => setPolicy(e.target.value)}
              rows={22}
              className="mt-2 font-mono text-xs"
              placeholder="# POLÍTICA DE PRIVACIDAD&#10;&#10;**Responsable:** [NOMBRE DEL CLUB]&#10;..."
            />
            <div className="flex items-center gap-3 mt-3">
              <Button onClick={handleSavePolicy} disabled={savingPolicy} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
                {savingPolicy ? "Guardando..." : "Guardar política"}
              </Button>
              <Button variant="outline" onClick={() => window.open("/api/gdpr/privacy-policy", "_blank")} className="text-[#475569] text-xs">
                Vista previa (JSON)
              </Button>
            </div>
          </div>

          <div className="mt-5 bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="font-bold text-[#00296B] text-sm mb-3">Documentos legales generados</h3>
            <div className="space-y-2">
              {[
                { name: "Política de Privacidad (plantilla)", file: "legal/politica-privacidad.md", desc: "Personaliza con los datos del club y revisa con un abogado" },
                { name: "Contrato de Encargo de Tratamiento (DPA)", file: "legal/contrato-encargo-tratamiento.md", desc: "Firma con cada club cliente — Art. 28 RGPD" },
                { name: "Cláusulas para formularios web", file: "legal/clausula-informativa-formulario.md", desc: "Textos e instrucciones para los checkboxes de consentimiento" },
              ].map(d => (
                <div key={d.file} className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <FileText size={16} className="text-[#2460FF] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0F172A]">{d.name}</p>
                    <p className="text-xs text-[#475569]">{d.desc}</p>
                    <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{d.file}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Diálogo confirmación eliminación ─────────────────────────── */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600">Eliminar datos — Derecho al olvido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              <b>Esta acción es irreversible.</b> Se eliminarán todos los datos personales de
              <b> {deleteDialog?.name}</b>. Se conservará únicamente un registro mínimo anonimizado
              por obligación fiscal (Art. 17.3.b RGPD).
              Los mandatos SEPA activos quedarán cancelados.
            </div>
            <p className="text-sm text-[#475569]">
              Escribe <b>ELIMINAR</b> para confirmar:
            </p>
            <Input id="delete-confirm" placeholder="ELIMINAR" className="font-mono" />
            <div className="flex gap-2">
              <Button onClick={() => setDeleteDialog(null)} variant="outline" className="flex-1">Cancelar</Button>
              <Button
                onClick={() => {
                  const val = document.getElementById("delete-confirm")?.value;
                  if (val !== "ELIMINAR") { alert("Escribe ELIMINAR para confirmar"); return; }
                  handleDelete();
                }}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                {deleting ? "Eliminando..." : "Confirmar eliminación"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
