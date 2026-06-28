import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Send, List, History, Plus, Trash2, Users, Eye, Mail, CheckCircle, XCircle, ChevronDown, ChevronUp, Search, Paperclip, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const FILTER_TYPE_LABELS = {
  manual: "Manual (selección)",
  all_players: "Todos los deportistas activos",
  all_members: "Todos los socios activos",
  all_guardians: "Todos los tutores/padres",
  team: "Por equipo",
  category: "Por categoría",
};

// ──────────────────────────────────────────────────────────
// COMPOSE TAB
// ──────────────────────────────────────────────────────────
function ComposeTab({ lists, people }) {
  const [form, setForm] = useState({ subject: "", body_html: "", list_id: "", recipient_emails: "" });
  const [attachments, setAttachments] = useState([]);
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useState(null);
  const [personSearch, setPersonSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = personSearch.length > 1
    ? (people || []).filter(p =>
        !selectedPeople.find(s => s.id === p.id) &&
        (`${p.name} ${p.email}`.toLowerCase().includes(personSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const addPerson = (p) => {
    setSelectedPeople(prev => [...prev, p]);
    setPersonSearch("");
    setShowSuggestions(false);
  };

  const removePerson = (id) => setSelectedPeople(prev => prev.filter(p => p.id !== id));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePreviewList = async () => {
    if (!form.list_id) return;
    const r = await ax.get(`/communications/preview-list/${form.list_id}`);
    setPreview(r.data);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body_html.trim()) {
      setStatus({ type: "error", msg: "Asunto y cuerpo son obligatorios." });
      return;
    }
    if (!form.list_id && !form.recipient_emails.trim() && selectedPeople.length === 0) {
      setStatus({ type: "error", msg: "Selecciona una lista, busca un destinatario o escribe emails." });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const manualEmails = form.recipient_emails
        ? form.recipient_emails.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
        : [];
      const peopleEmails = selectedPeople.map(p => p.email);
      const allEmails = [...new Set([...peopleEmails, ...manualEmails])];

      let r;
      if (attachments.length > 0) {
        const fd = new FormData();
        fd.append("subject", form.subject);
        fd.append("body_html", form.body_html);
        fd.append("list_id", form.list_id || "");
        allEmails.forEach(e => fd.append("recipient_emails", e));
        attachments.forEach(f => fd.append("attachments", f, f.name));
        r = await ax.post("/communications/send-with-attachments", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const payload = {
          subject: form.subject,
          body_html: form.body_html,
          list_id: form.list_id || "",
          recipient_emails: allEmails,
        };
        r = await ax.post("/communications/send", payload);
      }
      setStatus({ type: "ok", msg: `Enviado a ${r.data.sent} de ${r.data.total} destinatarios.${r.data.errors?.length ? ` (${r.data.errors.length} errores)` : ""}` });
      setForm({ subject: "", body_html: "", list_id: "", recipient_emails: "" });
      setSelectedPeople([]);
      setAttachments([]);
      setPreview(null);
    } catch (e) {
      setStatus({ type: "error", msg: e.response?.data?.detail || "Error al enviar" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="font-heading font-bold text-[#00296B] mb-4 flex items-center gap-2"><Mail size={16} />Nueva comunicación</h3>

        {/* Destinatarios */}
        <div className="mb-4">
          <Label className="text-sm mb-1 block">Lista de distribución</Label>
          <div className="flex gap-2">
            <Select value={form.list_id} onValueChange={v => { set("list_id", v === "_none" ? "" : v); setPreview(null); }}>
              <SelectTrigger className="flex-1 text-sm"><SelectValue placeholder="Seleccionar lista..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Sin lista —</SelectItem>
                {lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.list_id && (
              <Button variant="outline" size="sm" onClick={handlePreviewList} className="text-xs text-[#2460FF]">
                <Eye size={12} className="mr-1" />Vista previa
              </Button>
            )}
          </div>
          {preview && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
              <strong>{preview.count} destinatarios</strong> con email válido.
              {preview.emails.length > 0 && <span> Ej: {preview.emails.slice(0, 3).join(", ")}{preview.count > 3 ? "..." : ""}</span>}
            </div>
          )}
        </div>

        {/* Búsqueda individual de personas */}
        <div className="mb-4">
          <Label className="text-sm mb-1 block">Buscar destinatario individual</Label>
          <div className="relative">
            <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#2460FF] focus-within:border-transparent bg-white">
              <Search size={14} className="text-[#94A3B8] flex-shrink-0" />
              <input
                value={personSearch}
                onChange={e => { setPersonSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Buscar por nombre o email..."
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
                {suggestions.map(p => (
                  <button key={p.id} onMouseDown={() => addPerson(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F4F7FB] text-left transition-colors">
                    <div className="w-7 h-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#2460FF] flex-shrink-0">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{p.name}</p>
                      <p className="text-xs text-[#94A3B8] truncate">{p.email}</p>
                    </div>
                    <span className="text-xs bg-[#F4F7FB] text-[#475569] px-2 py-0.5 rounded-full flex-shrink-0">{p.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedPeople.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedPeople.map(p => (
                <span key={p.id} className="flex items-center gap-1.5 bg-[#EEF2FF] text-[#2460FF] text-xs px-2.5 py-1 rounded-full font-medium">
                  {p.name}
                  <button onClick={() => removePerson(p.id)} className="text-[#2460FF] hover:text-red-500 ml-0.5">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <span className="text-xs text-[#94A3B8] self-center ml-1">{selectedPeople.length} persona{selectedPeople.length !== 1 ? "s" : ""} seleccionada{selectedPeople.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <Label className="text-sm mb-1 block">O añadir emails directos (separados por coma, punto y coma o nueva línea)</Label>
          <textarea
            value={form.recipient_emails}
            onChange={e => set("recipient_emails", e.target.value)}
            rows={3}
            placeholder="email1@ejemplo.com, email2@ejemplo.com"
            className="w-full text-sm border border-[#E2E8F0] rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#2460FF] focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <Label className="text-sm mb-1 block">Asunto</Label>
          <Input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Asunto del email" className="text-sm" />
        </div>

        <div className="mb-4">
          <Label className="text-sm mb-1 block">Cuerpo del mensaje (HTML o texto)</Label>
          <textarea
            value={form.body_html}
            onChange={e => set("body_html", e.target.value)}
            rows={10}
            placeholder="<p>Estimado socio/deportista,</p>
<p>...</p>
<p>Un saludo,<br>Racing San Gabriel A.D.C.</p>"
            className="w-full text-sm border border-[#E2E8F0] rounded-lg p-3 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#2460FF]"
          />
          <p className="text-xs text-[#94A3B8] mt-1">Puedes usar HTML básico: &lt;p&gt;, &lt;strong&gt;, &lt;br&gt;, &lt;a href=...&gt;, etc.</p>
        </div>

        {/* Adjuntos */}
        <div className="mb-4">
          <Label className="text-sm mb-1 block">Archivos adjuntos</Label>
          <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-[#CBD5E1] rounded-lg cursor-pointer hover:border-[#2460FF] hover:bg-blue-50 transition-colors text-sm text-[#475569]">
            <Paperclip size={14} className="text-[#2460FF]" />
            <span>Clic para adjuntar archivos</span>
            <input type="file" multiple className="hidden" onChange={handleFileChange} />
          </label>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#F4F7FB] rounded-lg px-3 py-1.5 text-xs">
                  <Paperclip size={11} className="text-[#94A3B8]" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-[#94A3B8]">{formatSize(f.size)}</span>
                  <button onClick={() => removeAttachment(i)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                </div>
              ))}
              <p className="text-xs text-[#94A3B8]">{attachments.length} adjunto{attachments.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        {status && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm mb-4 ${status.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {status.type === "ok" ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> : <XCircle size={14} className="mt-0.5 flex-shrink-0" />}
            {status.msg}
          </div>
        )}

        <Button onClick={handleSend} disabled={sending} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
          <Send size={14} className="mr-2" />{sending ? "Enviando..." : "Enviar comunicación"}
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// LISTS TAB
// ──────────────────────────────────────────────────────────
function ListsTab({ lists, teams, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", filter_type: "manual", filter_value: "", recipient_type: "player" });
  const [expandedId, setExpandedId] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    await ax.post("/communications/lists", form);
    setOpen(false);
    setForm({ name: "", description: "", filter_type: "manual", filter_value: "", recipient_type: "player" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar lista?")) return;
    await ax.delete(`/communications/lists/${id}`);
    onRefresh();
  };

  const categories = [...new Set(teams.map(t => t.category))].sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-[#00296B]">Listas de distribución</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white text-sm">
              <Plus size={14} className="mr-1" />Nueva lista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva lista de distribución</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm">Nombre de la lista</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" placeholder="Ej: Padres Benjamín A" /></div>
              <div><Label className="text-sm">Descripción</Label><Input value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" /></div>
              <div>
                <Label className="text-sm">Tipo de lista</Label>
                <Select value={form.filter_type} onValueChange={v => set("filter_type", v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FILTER_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.filter_type === "team" && (
                <div>
                  <Label className="text-sm">Equipo</Label>
                  <Select value={form.filter_value} onValueChange={v => set("filter_value", v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                    <SelectContent>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.filter_type === "category" && (
                <div>
                  <Label className="text-sm">Categoría</Label>
                  <Select value={form.filter_value} onValueChange={v => set("filter_value", v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.filter_type === "manual" && (
                <div>
                  <Label className="text-sm">Tipo de destinatario</Label>
                  <Select value={form.recipient_type} onValueChange={v => set("recipient_type", v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Deportistas</SelectItem>
                      <SelectItem value="member">Socios</SelectItem>
                      <SelectItem value="guardian">Tutores</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[#94A3B8] mt-1">Los destinatarios se añaden manualmente desde la ficha de cada persona.</p>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Crear lista</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {lists.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[#94A3B8] text-sm">
            No hay listas creadas. Crea tu primera lista de distribución.
          </div>
        )}
        {lists.map(l => (
          <div key={l.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F8FAFF]"
              onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#EEF2FF] rounded-xl flex items-center justify-center">
                  <Users size={16} className="text-[#2460FF]" />
                </div>
                <div>
                  <p className="font-medium text-[#0F172A]">{l.name}</p>
                  <p className="text-xs text-[#94A3B8]">{FILTER_TYPE_LABELS[l.filter_type] || l.filter_type}
                    {l.filter_value ? ` · ${l.filter_value}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-red-500 border-red-200 text-xs"
                  onClick={e => { e.stopPropagation(); handleDelete(l.id); }}>
                  <Trash2 size={12} />
                </Button>
                {expandedId === l.id ? <ChevronUp size={14} className="text-[#94A3B8]" /> : <ChevronDown size={14} className="text-[#94A3B8]" />}
              </div>
            </div>
            {expandedId === l.id && (
              <div className="px-4 pb-4 border-t border-[#F1F5F9]">
                <p className="text-sm text-[#475569] mt-3">{l.description || "Sin descripción"}</p>
                <p className="text-xs text-[#94A3B8] mt-2">Creada: {l.created_at ? new Date(l.created_at).toLocaleDateString("es-ES") : "—"}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// HISTORY TAB
// ──────────────────────────────────────────────────────────
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    ax.get("/communications/history").then(r => setHistory(r.data));
  }, []);

  return (
    <div>
      <h3 className="font-heading font-bold text-[#00296B] mb-4">Historial de envíos</h3>
      {history.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[#94A3B8] text-sm">
          No hay comunicaciones enviadas aún.
        </div>
      )}
      <div className="space-y-3">
        {history.map(h => (
          <div key={h.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-start justify-between p-4 cursor-pointer hover:bg-[#F8FAFF]"
              onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-[#0F172A] text-sm">{h.subject}</p>
                  <Badge className={`text-xs ${h.sent_count === h.recipient_count ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {h.sent_count}/{h.recipient_count} enviados
                  </Badge>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {h.sent_at ? new Date(h.sent_at).toLocaleString("es-ES") : "—"} · Por {h.sent_by}
                </p>
              </div>
              {expanded === h.id ? <ChevronUp size={14} className="text-[#94A3B8] mt-1" /> : <ChevronDown size={14} className="text-[#94A3B8] mt-1" />}
            </div>
            {expanded === h.id && (
              <div className="px-4 pb-4 border-t border-[#F1F5F9]">
                <div className="mt-3 p-3 bg-[#F4F7FB] rounded-lg text-sm text-[#475569] max-h-40 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: h.body_html }} />
                {h.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-red-600 mb-1">Errores de entrega:</p>
                    {h.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-500">{e.email}: {e.error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────
export default function ComunicacionesManager() {
  const [tab, setTab] = useState("compose");
  const [lists, setLists] = useState([]);
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);

  const loadLists = useCallback(async () => {
    const [lr, tr, pr, gr, mr] = await Promise.all([
      ax.get("/communications/lists"), ax.get("/teams"),
      ax.get("/players"), ax.get("/guardians"), ax.get("/members"),
    ]);
    setLists(lr.data);
    setTeams(tr.data);
    const all = [
      ...pr.data.map(p => ({ id: `p_${p.id}`, name: `${p.name} ${p.surname || ""}`.trim(), email: p.email || "", type: "Deportista" })),
      ...gr.data.map(p => ({ id: `g_${p.id}`, name: `${p.name} ${p.surname || ""}`.trim(), email: p.email || "", type: "Tutor" })),
      ...mr.data.map(p => ({ id: `m_${p.id}`, name: `${p.name} ${p.surname || ""}`.trim(), email: p.email || "", type: "Socio" })),
    ].filter(p => p.email.includes("@"));
    setPeople(all);
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  const tabs = [
    { id: "compose", label: "Nueva comunicación", icon: Send },
    { id: "lists", label: "Listas", icon: List },
    { id: "history", label: "Historial", icon: History },
  ];

  return (
    <div data-testid="admin-comunicaciones">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-5">Comunicaciones</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#00296B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#00296B]"}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      {tab === "compose" && <ComposeTab lists={lists} people={people} />}
      {tab === "lists" && <ListsTab lists={lists} teams={teams} onRefresh={loadLists} />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
}
