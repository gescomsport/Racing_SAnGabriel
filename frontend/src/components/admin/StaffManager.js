import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, Download, Search, X, ChevronDown, ChevronUp, Users } from "lucide-react";
import DocumentUploader from "./DocumentUploader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const ROLES = {
  entrenador:     { label: "Entrenador/a",     color: "bg-blue-100 text-blue-700" },
  auxiliar:       { label: "Auxiliar técnico",  color: "bg-indigo-100 text-indigo-700" },
  administrativo: { label: "Administrativo/a",  color: "bg-amber-100 text-amber-700" },
  directivo:      { label: "Directivo/a",       color: "bg-purple-100 text-purple-700" },
  medico:         { label: "Médico/a",           color: "bg-green-100 text-green-700" },
  fisioterapeuta: { label: "Fisioterapeuta",     color: "bg-teal-100 text-teal-700" },
  delegado:       { label: "Delegado/a",         color: "bg-orange-100 text-orange-700" },
  otro:           { label: "Otro",               color: "bg-gray-100 text-gray-600" },
};

const CONTRACT = { voluntario: "Voluntario", laboral: "Laboral", autonomo: "Autónomo" };

const BLANK_FORM = {
  name: "", surname: "", role: "entrenador", team_ids: [],
  dni: "", phone: "", email: "", address: "", city: "",
  contract_type: "", contract_start: "", contract_end: "",
  bank_iban: "", photo_url: "", dni_front_url: "", dni_back_url: "",
  notes: "", active: true,
};

// ── StaffForm — defined at MODULE scope to avoid React cursor-bug ──────────────
function StaffForm({ form, setForm, teams, onSave, saveLabel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleTeam = (id) =>
    setForm(f => {
      const ids = f.team_ids.includes(id)
        ? f.team_ids.filter(x => x !== id)
        : [...f.team_ids, id];
      return { ...f, team_ids: ids };
    });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Nombre *</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Apellidos</Label>
          <Input value={form.surname} onChange={e => set("surname", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Rol / Cargo</Label>
          <Select value={form.role} onValueChange={v => set("role", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLES).map(([k, { label }]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">DNI / NIE</Label>
          <Input value={form.dni} onChange={e => set("dni", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Teléfono</Label>
          <Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Email</Label>
          <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Dirección</Label>
          <Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Ciudad</Label>
          <Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-sm">Tipo contrato</Label>
          <Select value={form.contract_type || "_none"} onValueChange={v => set("contract_type", v === "_none" ? "" : v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin especificar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin especificar</SelectItem>
              <SelectItem value="voluntario">Voluntario</SelectItem>
              <SelectItem value="laboral">Laboral</SelectItem>
              <SelectItem value="autonomo">Autónomo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Inicio contrato</Label>
          <Input type="date" value={form.contract_start} onChange={e => set("contract_start", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Fin contrato</Label>
          <Input type="date" value={form.contract_end} onChange={e => set("contract_end", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div>
        <Label className="text-sm">IBAN bancario</Label>
        <Input value={form.bank_iban} onChange={e => set("bank_iban", e.target.value)} className="mt-1" placeholder="ES00 0000 0000 00 0000000000" />
      </div>

      <div>
        <Label className="text-sm">Equipos asignados</Label>
        {teams.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-3 border-2 border-[#E2E8F0] rounded-xl mt-1 max-h-32 overflow-y-auto bg-[#F8FAFF]">
            {teams.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTeam(t.id)}
                className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-colors ${
                  form.team_ids.includes(t.id)
                    ? "bg-[#00296B] text-white border-[#00296B]"
                    : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B] hover:text-[#00296B]"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8] mt-1">No hay equipos disponibles.</p>
        )}
      </div>

      <div>
        <Label className="text-sm">Estado</Label>
        <Select value={form.active ? "true" : "false"} onValueChange={v => set("active", v === "true")}>
          <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Activo</SelectItem>
            <SelectItem value="false">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm">Notas</Label>
        <Input value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" />
      </div>

      <Button
        onClick={onSave}
        disabled={!form.name.trim()}
        className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
      >
        {saveLabel}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StaffManager() {
  const [staff, setStaff]       = useState([]);
  const [teams, setTeams]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters]   = useState({ search: "", role: "", active: "" });

  const [newOpen, setNewOpen]   = useState(false);
  const [newForm, setNewForm]   = useState({ ...BLANK_FORM });

  const [editOpen, setEditOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm]   = useState({ ...BLANK_FORM });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sr, tr] = await Promise.all([ax.get("/staff"), ax.get("/teams")]);
      setStaff(sr.data);
      setTeams(tr.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const total       = staff.length;
  const activos     = staff.filter(s => s.active).length;
  const entrenadores = staff.filter(s => s.role === "entrenador").length;
  const voluntarios = staff.filter(s => s.contract_type === "voluntario").length;

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = staff.filter(s => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!`${s.name} ${s.surname} ${s.dni} ${s.email}`.toLowerCase().includes(q)) return false;
    }
    if (filters.role && s.role !== filters.role) return false;
    if (filters.active === "true"  && !s.active) return false;
    if (filters.active === "false" &&  s.active) return false;
    return true;
  });

  // ── CRUD handlers ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newForm.name.trim()) return;
    await ax.post("/staff", newForm);
    setNewOpen(false);
    setNewForm({ ...BLANK_FORM });
    load();
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setEditForm({
      name: s.name || "", surname: s.surname || "",
      role: s.role || "entrenador", team_ids: s.team_ids || [],
      dni: s.dni || "", phone: s.phone || "", email: s.email || "",
      address: s.address || "", city: s.city || "",
      contract_type: s.contract_type || "",
      contract_start: s.contract_start || "", contract_end: s.contract_end || "",
      bank_iban: s.bank_iban || "",
      photo_url: s.photo_url || "", dni_front_url: s.dni_front_url || "", dni_back_url: s.dni_back_url || "",
      notes: s.notes || "", active: s.active !== false,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    await ax.put(`/staff/${editTarget.id}`, editForm);
    setEditOpen(false);
    setEditTarget(null);
    load();
  };

  const handleToggleActive = async (s) => {
    await ax.put(`/staff/${s.id}`, { active: !s.active });
    load();
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`¿Eliminar a ${s.name} ${s.surname}?`)) return;
    await ax.delete(`/staff/${s.id}`);
    if (expanded === s.id) setExpanded(null);
    load();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.role)   params.set("role", filters.role);
    if (filters.active) params.set("active", filters.active);
    const res = await ax.get(`/export/staff?${params}`, { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "personal.xlsx";
    a.click();
  };

  const handleDocUpdated = (memberId, field, url) => {
    setStaff(prev => prev.map(s => s.id === memberId ? { ...s, [field]: url } : s));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#00296B]">Personal del Club</h2>
          <p className="text-sm text-[#475569] mt-0.5">Gestiona entrenadores, técnicos, directivos y voluntarios</p>
        </div>
        <Button
          className="bg-[#2460FF] hover:bg-[#00296B] text-white"
          onClick={() => { setNewForm({ ...BLANK_FORM }); setNewOpen(true); }}
        >
          <Plus size={14} className="mr-1" />
          Nuevo empleado / técnico
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total personal",  value: total,        color: "text-[#00296B]" },
          { label: "Activos",         value: activos,      color: "text-green-700" },
          { label: "Entrenadores",    value: entrenadores, color: "text-blue-700"  },
          { label: "Voluntarios",     value: voluntarios,  color: "text-amber-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-1">
            <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold font-heading ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs text-[#475569] mb-1">Buscar</Label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="Nombre, DNI, email…"
              className="pl-8 text-sm"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <Label className="text-xs text-[#475569] mb-1">Rol</Label>
          <Select value={filters.role || "_all"} onValueChange={v => setFilters(f => ({ ...f, role: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los roles</SelectItem>
              {Object.entries(ROLES).map(([k, { label }]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <Label className="text-xs text-[#475569] mb-1">Estado</Label>
          <Select value={filters.active || "_all"} onValueChange={v => setFilters(f => ({ ...f, active: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filters.search || filters.role || filters.active) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ search: "", role: "", active: "" })}
            className="text-[#94A3B8] hover:text-[#475569]"
          >
            <X size={14} className="mr-1" /> Limpiar
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={handleExport} className="border-[#E2E8F0] text-[#475569]">
          <Download size={14} className="mr-1" /> Excel
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#94A3B8] text-sm">Cargando personal…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={32} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-sm text-[#94A3B8]">No se encontró personal</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFF]">
                <th className="text-left py-3 px-4 font-semibold text-[#00296B] text-xs uppercase tracking-wide">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-[#00296B] text-xs uppercase tracking-wide">Rol</th>
                <th className="text-left py-3 px-4 font-semibold text-[#00296B] text-xs uppercase tracking-wide hidden md:table-cell">Equipos</th>
                <th className="text-left py-3 px-4 font-semibold text-[#00296B] text-xs uppercase tracking-wide hidden lg:table-cell">Contacto</th>
                <th className="text-left py-3 px-4 font-semibold text-[#00296B] text-xs uppercase tracking-wide hidden lg:table-cell">Contrato</th>
                <th className="text-left py-3 px-4 font-semibold text-[#00296B] text-xs uppercase tracking-wide">Estado</th>
                <th className="py-3 px-4 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <>
                  <tr
                    key={s.id}
                    className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFF] transition-colors cursor-pointer ${expanded === s.id ? "bg-[#F0F5FF]" : ""}`}
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    {/* Name + avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EFF3FF] flex items-center justify-center text-[#2460FF] font-bold text-sm flex-shrink-0 overflow-hidden">
                          {s.photo_url ? (
                            <img
                              src={s.photo_url.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${s.photo_url}` : s.photo_url}
                              alt=""
                              className="w-full h-full object-cover rounded-full"
                              onError={e => { e.target.style.display = "none"; }}
                            />
                          ) : (
                            `${(s.name || "?")[0]}${(s.surname || "")[0] || ""}`.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1E293B]">{s.name} {s.surname}</p>
                          {s.dni && <p className="text-xs text-[#94A3B8]">{s.dni}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLES[s.role]?.color || "bg-gray-100 text-gray-600"}`}>
                        {ROLES[s.role]?.label || s.role}
                      </span>
                    </td>

                    {/* Teams */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(s.team_ids || []).length === 0 ? (
                          <span className="text-xs text-[#CBD5E1]">—</span>
                        ) : (
                          (s.team_ids || []).slice(0, 3).map(tid => (
                            <span key={tid} className="text-xs bg-[#EFF3FF] text-[#2460FF] px-2 py-0.5 rounded-full">
                              {teamMap[tid] || tid}
                            </span>
                          ))
                        )}
                        {(s.team_ids || []).length > 3 && (
                          <span className="text-xs text-[#94A3B8]">+{s.team_ids.length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="text-xs space-y-0.5">
                        {s.phone && <p className="text-[#475569]">{s.phone}</p>}
                        {s.email && <p className="text-[#94A3B8]">{s.email}</p>}
                        {!s.phone && !s.email && <span className="text-[#CBD5E1]">—</span>}
                      </div>
                    </td>

                    {/* Contract type */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <span className="text-xs text-[#475569]">
                        {CONTRACT[s.contract_type] || <span className="text-[#CBD5E1]">—</span>}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4">
                      {s.active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Baja
                        </span>
                      )}
                    </td>

                    {/* Expand */}
                    <td className="py-3 px-4 text-[#94A3B8]">
                      {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expanded === s.id && (
                    <tr key={`${s.id}-expanded`} className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <td colSpan={7} className="px-6 py-5">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                          {/* Col 1: personal + contact details */}
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide">Datos personales</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {s.dni        && <><span className="text-[#94A3B8]">DNI/NIE</span><span className="text-[#1E293B] font-medium">{s.dni}</span></>}
                              {s.phone      && <><span className="text-[#94A3B8]">Teléfono</span><span className="text-[#1E293B] font-medium">{s.phone}</span></>}
                              {s.email      && <><span className="text-[#94A3B8]">Email</span><span className="text-[#1E293B] font-medium break-all">{s.email}</span></>}
                              {s.address    && <><span className="text-[#94A3B8]">Dirección</span><span className="text-[#1E293B] font-medium">{s.address}</span></>}
                              {s.city       && <><span className="text-[#94A3B8]">Ciudad</span><span className="text-[#1E293B] font-medium">{s.city}</span></>}
                              {s.bank_iban  && <><span className="text-[#94A3B8]">IBAN</span><span className="text-[#1E293B] font-medium font-mono">{s.bank_iban}</span></>}
                            </div>

                            {(s.contract_type || s.contract_start || s.contract_end) && (
                              <>
                                <p className="text-xs font-bold text-[#475569] uppercase tracking-wide pt-2">Contrato</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {s.contract_type  && <><span className="text-[#94A3B8]">Tipo</span><span className="text-[#1E293B] font-medium">{CONTRACT[s.contract_type] || s.contract_type}</span></>}
                                  {s.contract_start && <><span className="text-[#94A3B8]">Inicio</span><span className="text-[#1E293B] font-medium">{s.contract_start}</span></>}
                                  {s.contract_end   && <><span className="text-[#94A3B8]">Fin</span><span className="text-[#1E293B] font-medium">{s.contract_end}</span></>}
                                </div>
                              </>
                            )}

                            {s.notes && (
                              <>
                                <p className="text-xs font-bold text-[#475569] uppercase tracking-wide pt-2">Notas</p>
                                <p className="text-xs text-[#475569] bg-white border border-[#E2E8F0] rounded-lg p-2">{s.notes}</p>
                              </>
                            )}
                          </div>

                          {/* Col 2: teams */}
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-[#475569] uppercase tracking-wide">Equipos asignados</p>
                            {(s.team_ids || []).length === 0 ? (
                              <p className="text-xs text-[#CBD5E1]">Sin equipos asignados</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {(s.team_ids || []).map(tid => (
                                  <span key={tid} className="text-xs bg-[#EFF3FF] text-[#2460FF] border border-[#C7D9FF] px-2.5 py-1 rounded-full font-medium">
                                    {teamMap[tid] || tid}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Col 3: documents + actions */}
                          <div className="space-y-4">
                            <DocumentUploader
                              personType="staff"
                              personId={s.id}
                              data={s}
                              onUpdated={(field, url) => handleDocUpdated(s.id, field, url)}
                            />

                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#E2E8F0] text-[#475569] hover:bg-[#EFF3FF] hover:text-[#2460FF]"
                                onClick={e => { e.stopPropagation(); openEdit(s); }}
                              >
                                <Edit2 size={12} className="mr-1" /> Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={s.active
                                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                  : "border-green-200 text-green-700 hover:bg-green-50"}
                                onClick={e => { e.stopPropagation(); handleToggleActive(s); }}
                              >
                                {s.active ? "Dar de baja" : "Activar"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={e => { e.stopPropagation(); handleDelete(s); }}
                              >
                                <Trash2 size={12} className="mr-1" /> Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New staff dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">Alta de personal</DialogTitle>
          </DialogHeader>
          <StaffForm
            form={newForm}
            setForm={setNewForm}
            teams={teams}
            onSave={handleCreate}
            saveLabel="Crear empleado"
          />
        </DialogContent>
      </Dialog>

      {/* Edit staff dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              Editar — {editTarget?.name} {editTarget?.surname}
            </DialogTitle>
          </DialogHeader>
          <StaffForm
            form={editForm}
            setForm={setEditForm}
            teams={teams}
            onSave={handleEdit}
            saveLabel="Guardar cambios"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
