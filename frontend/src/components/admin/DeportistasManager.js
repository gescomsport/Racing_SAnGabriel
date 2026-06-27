import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Download, Search, Filter, X, ChevronDown, ChevronUp, Users, Shield, Star, Plus, Edit2, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const STATUS_COLORS = {
  active: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  injured: "bg-orange-50 text-orange-700 border-orange-200",
};
const STATUS_LABELS = { active: "Activo", pending: "Pendiente", inactive: "Baja", rejected: "Rechazado", injured: "Lesionado" };

function calcAge(birthdate) {
  if (!birthdate) return null;
  try {
    const bd = new Date(birthdate);
    return Math.floor((new Date() - bd) / (365.25 * 24 * 3600 * 1000));
  } catch { return null; }
}

// ──────────────────────────────────────────────────────────
// DEPORTISTAS TAB
// ──────────────────────────────────────────────────────────
function DeportistasTab() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({ search: "", team_id: "", status: "", birth_year: "", has_siblings: "" });
  const [expanded, setExpanded] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const BLANK_PLAYER = {
    name: "", surname: "", birthdate: "", dni: "", email: "", phone: "",
    team_id: "", status: "pending", address: "", notes: "",
    tutor_name: "", tutor_surname: "", tutor_dni: "", tutor_phone: "", tutor_email: "", tutor_relationship: "padre",
  };
  const [newForm, setNewForm] = useState(BLANK_PLAYER);
  const setNF = (k, v) => setNewForm(f => ({ ...f, [k]: v }));

  const isNewMinor = () => {
    if (!newForm.birthdate) return false;
    const age = calcAge(newForm.birthdate);
    return age !== null && age < 18;
  };

  const handleCreate = async () => {
    if (!newForm.name.trim() || !newForm.surname.trim()) return;
    await ax.post("/players", {
      name: newForm.name, surname: newForm.surname, birthdate: newForm.birthdate,
      dni: newForm.dni, email: newForm.email, phone: newForm.phone,
      team_id: newForm.team_id, status: newForm.status, address: newForm.address, notes: newForm.notes,
    });
    setNewOpen(false);
    setNewForm(BLANK_PLAYER);
    load();
  };

  const load = useCallback(async () => {
    const [pr, tr] = await Promise.all([ax.get("/players"), ax.get("/teams")]);
    setPlayers(pr.data);
    setTeams(tr.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  // Siblings detection
  const familyCount = {};
  players.forEach(p => { if (p.family_id) familyCount[p.family_id] = (familyCount[p.family_id] || 0) + 1; });

  const filtered = players.filter(p => {
    const age = calcAge(p.birthdate);
    const team = teamMap[p.team_id] || {};
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(`${p.name} ${p.surname} ${p.dni} ${p.email}`).toLowerCase().includes(q)) return false;
    }
    if (filters.team_id && p.team_id !== filters.team_id) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.birth_year) {
      const yr = p.birthdate ? p.birthdate.slice(0, 4) : "";
      if (yr !== filters.birth_year) return false;
    }
    if (filters.has_siblings === "yes") {
      const siblings = p.family_id ? (familyCount[p.family_id] - 1) : 0;
      if (siblings < 1) return false;
    }
    if (filters.has_siblings === "no") {
      const siblings = p.family_id ? (familyCount[p.family_id] - 1) : 0;
      if (siblings > 0) return false;
    }
    return true;
  });

  const handleStatusChange = async (id, status) => {
    await ax.put(`/players/${id}`, { status });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar deportista?")) return;
    await ax.delete(`/players/${id}`);
    load();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.team_id) params.set("team_id", filters.team_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.birth_year) params.set("birth_year", filters.birth_year);
    if (filters.has_siblings === "yes") params.set("has_siblings", "true");
    if (filters.has_siblings === "no") params.set("has_siblings", "false");
    const url = `${API}/export/players?${params}`;
    const res = await ax.get(url, { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "deportistas.xlsx";
    a.click();
  };

  const birthYears = [...new Set(players.map(p => p.birthdate?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const categories = [...new Set(teams.map(t => t.category))].sort();

  return (
    <div>
      {/* New player dialog */}
      <div className="flex justify-end mb-4">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white"><Plus size={14} className="mr-1" />Nuevo deportista</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Alta manual de deportista</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Nombre *</Label><Input value={newForm.name} onChange={e => setNF("name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">Apellidos *</Label><Input value={newForm.surname} onChange={e => setNF("surname", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Fecha de nacimiento</Label><Input type="date" value={newForm.birthdate} onChange={e => setNF("birthdate", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">NIF / NIE / Pasaporte</Label><Input value={newForm.dni} onChange={e => setNF("dni", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Email</Label><Input type="email" value={newForm.email} onChange={e => setNF("email", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">Móvil</Label><Input value={newForm.phone} onChange={e => setNF("phone", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Equipo</Label>
                  <Select value={newForm.team_id} onValueChange={v => setNF("team_id", v === "_none" ? "" : v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                    <SelectContent><SelectItem value="_none">Sin equipo</SelectItem>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Estado</Label>
                  <Select value={newForm.status} onValueChange={v => setNF("status", v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-sm">Dirección</Label><Input value={newForm.address} onChange={e => setNF("address", e.target.value)} className="mt-1" /></div>
              <div><Label className="text-sm">Notas internas</Label><Input value={newForm.notes} onChange={e => setNF("notes", e.target.value)} className="mt-1" /></div>

              {/* Tutor section (auto for minors) */}
              {isNewMinor() && (
                <div className="border border-amber-200 rounded-xl p-3 bg-amber-50">
                  <p className="text-xs font-bold text-amber-700 uppercase mb-3">Datos del tutor / padre (menor detectado)</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-sm">Nombre tutor</Label><Input value={newForm.tutor_name} onChange={e => setNF("tutor_name", e.target.value)} className="mt-1" /></div>
                      <div><Label className="text-sm">Apellidos</Label><Input value={newForm.tutor_surname} onChange={e => setNF("tutor_surname", e.target.value)} className="mt-1" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-sm">DNI tutor</Label><Input value={newForm.tutor_dni} onChange={e => setNF("tutor_dni", e.target.value)} className="mt-1" /></div>
                      <div>
                        <Label className="text-sm">Relación</Label>
                        <Select value={newForm.tutor_relationship} onValueChange={v => setNF("tutor_relationship", v)}>
                          <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="padre">Padre</SelectItem>
                            <SelectItem value="madre">Madre</SelectItem>
                            <SelectItem value="tutor_legal">Tutor legal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-sm">Email tutor</Label><Input type="email" value={newForm.tutor_email} onChange={e => setNF("tutor_email", e.target.value)} className="mt-1" /></div>
                      <div><Label className="text-sm">Móvil tutor</Label><Input value={newForm.tutor_phone} onChange={e => setNF("tutor_phone", e.target.value)} className="mt-1" /></div>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleCreate} disabled={!newForm.name.trim() || !newForm.surname.trim()} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Guardar deportista</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", val: players.length, color: "text-[#2460FF]" },
          { label: "Activos", val: players.filter(p => p.status === "active").length, color: "text-green-600" },
          { label: "Pendientes", val: players.filter(p => p.status === "pending").length, color: "text-amber-500" },
          { label: "Con hermanos", val: players.filter(p => p.family_id && (familyCount[p.family_id] || 0) > 1).length, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#475569]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input placeholder="Buscar nombre, DNI, email..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="pl-8 text-sm" />
          </div>
          <Select value={filters.team_id} onValueChange={v => setFilters(f => ({ ...f, team_id: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Todos los equipos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los equipos</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={`_cat_${cat}`} disabled className="font-bold text-xs text-[#94A3B8] uppercase">{cat}</SelectItem>
              ))}
              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.birth_year} onValueChange={v => setFilters(f => ({ ...f, birth_year: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Año nacimiento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los años</SelectItem>
              {birthYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.has_siblings} onValueChange={v => setFilters(f => ({ ...f, has_siblings: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Hermanos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="yes">Con hermanos en el club</SelectItem>
              <SelectItem value="no">Sin hermanos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#475569]">{filtered.length} deportistas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilters({ search: "", team_id: "", status: "", birth_year: "", has_siblings: "" })} className="text-xs">
              <X size={12} className="mr-1" />Limpiar
            </Button>
            <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs">
              <Download size={12} className="mr-1" />Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide">Deportista</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden lg:table-cell">Edad</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden md:table-cell">Equipo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden lg:table-cell">Hermanos</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const age = calcAge(p.birthdate);
              const isMinor = age !== null && age < 18;
              const siblings = p.family_id ? (familyCount[p.family_id] || 0) - 1 : 0;
              const team = teamMap[p.team_id] || {};
              return (
                <>
                  <tr key={p.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF] cursor-pointer"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#00296B] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(p.name || "?")[0]}{(p.surname || "")[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A]">{p.name} {p.surname}</p>
                          <p className="text-xs text-[#94A3B8]">{p.dni || p.email || "—"}</p>
                        </div>
                        {isMinor && <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200 ml-1">Menor</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#475569] hidden lg:table-cell">{age != null ? `${age} años` : "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-[#475569]">{team.name || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[p.status] || STATUS_COLORS.inactive}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {siblings > 0 ? <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs">{siblings} hermano{siblings > 1 ? "s" : ""}</Badge> : <span className="text-[#CBD5E1]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {expanded === p.id ? <ChevronUp size={14} className="text-[#94A3B8] inline" /> : <ChevronDown size={14} className="text-[#94A3B8] inline" />}
                    </td>
                  </tr>
                  {expanded === p.id && (
                    <tr key={`${p.id}-exp`} className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                          <div><p className="text-xs text-[#94A3B8] mb-1">Teléfono</p><p className="font-medium">{p.phone || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">Email</p><p className="font-medium">{p.email || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">F.Nacimiento</p><p className="font-medium">{p.birthdate || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">Talla camiseta</p><p className="font-medium">{p.jersey_size || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">Dirección</p><p className="font-medium">{[p.address, p.city, p.postal_code].filter(Boolean).join(", ") || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">Grupo sanguíneo</p><p className="font-medium">{p.blood_type || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">Notas médicas</p><p className="font-medium">{p.medical_notes || "—"}</p></div>
                          <div><p className="text-xs text-[#94A3B8] mb-1">ID Familiar</p><p className="font-medium font-mono text-xs">{p.family_id || "—"}</p></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(STATUS_LABELS).map(s => (
                            <Button key={s} size="sm" variant={p.status === s ? "default" : "outline"}
                              className={`text-xs ${p.status === s ? "bg-[#2460FF] text-white" : ""}`}
                              onClick={() => handleStatusChange(p.id, s)}>
                              {STATUS_LABELS[s]}
                            </Button>
                          ))}
                          <Button size="sm" variant="outline" className="text-red-500 border-red-200 ml-auto text-xs"
                            onClick={() => handleDelete(p.id)}>
                            <Trash2 size={12} className="mr-1" />Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-[#94A3B8]">Sin resultados con los filtros aplicados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// TUTORES TAB
// ──────────────────────────────────────────────────────────
function TutoresTab() {
  const [guardians, setGuardians] = useState([]);
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const [gr, pr] = await Promise.all([ax.get("/guardians"), ax.get("/players")]);
    setGuardians(gr.data);
    setPlayers(pr.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const playerMap = Object.fromEntries(players.map(p => [p.id, `${p.name} ${p.surname}`.trim()]));

  const filtered = guardians.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${g.name} ${g.surname} ${g.dni} ${g.email}`.toLowerCase().includes(q);
  });

  const handleExport = async () => {
    const res = await ax.get("/export/guardians", { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "tutores.xlsx";
    a.click();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar tutor?")) return;
    await ax.delete(`/guardians/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input placeholder="Buscar tutor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 text-sm" />
        </div>
        <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs">
          <Download size={12} className="mr-1" />Exportar Excel
        </Button>
        <span className="text-xs text-[#475569] ml-auto">{filtered.length} tutores</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide">Tutor / Tutora</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden md:table-cell">Relación</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden lg:table-cell">Contacto</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide">Deportistas</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <>
                <tr key={g.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF] cursor-pointer"
                  onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0F172A]">{g.name} {g.surname}</p>
                    <p className="text-xs text-[#94A3B8]">{g.dni || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-[#475569] capitalize hidden md:table-cell">{g.relationship || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-[#475569]">{g.phone || "—"}</p>
                    <p className="text-xs text-[#94A3B8]">{g.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(g.player_ids || []).slice(0, 2).map(pid => (
                        <Badge key={pid} className="text-xs bg-blue-50 text-blue-700 border-blue-200">{playerMap[pid] || pid}</Badge>
                      ))}
                      {(g.player_ids || []).length > 2 && <Badge className="text-xs">+{g.player_ids.length - 2}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {expanded === g.id ? <ChevronUp size={14} className="text-[#94A3B8] inline" /> : <ChevronDown size={14} className="text-[#94A3B8] inline" />}
                  </td>
                </tr>
                {expanded === g.id && (
                  <tr key={`${g.id}-exp`} className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-xs text-[#94A3B8] mb-1">Teléfono</p><p>{g.phone || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Email</p><p>{g.email || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Dirección</p><p>{[g.address, g.city].filter(Boolean).join(", ") || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">IBAN</p><p className="font-mono text-xs">{g.bank_iban || "—"}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-red-500 border-red-200 text-xs"
                          onClick={() => handleDelete(g.id)}>
                          <Trash2 size={12} className="mr-1" />Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Sin tutores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// SOCIOS TAB
// ──────────────────────────────────────────────────────────
function SociosTab() {
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({ search: "", member_type: "", status: "" });
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const r = await ax.get("/members");
    setMembers(r.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const TYPES = {
    socio_adulto: "Adulto", socio_juvenil: "Juvenil", socio_familiar: "Familiar",
    socio_honor: "Honor", abonado: "Abonado",
  };

  const filtered = members.filter(m => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!`${m.name} ${m.surname} ${m.dni} ${m.member_number}`.toLowerCase().includes(q)) return false;
    }
    if (filters.member_type && m.member_type !== filters.member_type) return false;
    if (filters.status && m.status !== filters.status) return false;
    return true;
  });

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.member_type) params.set("member_type", filters.member_type);
    if (filters.status) params.set("status", filters.status);
    const res = await ax.get(`/export/members?${params}`, { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "socios.xlsx";
    a.click();
  };

  const handleStatusChange = async (id, status) => {
    await ax.put(`/members/${id}`, { status });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar socio?")) return;
    await ax.delete(`/members/${id}`);
    load();
  };

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total socios", val: members.length, color: "text-amber-500" },
          { label: "Activos", val: members.filter(m => m.status === "active").length, color: "text-green-600" },
          { label: "Adultos", val: members.filter(m => m.member_type === "socio_adulto").length, color: "text-[#2460FF]" },
          { label: "Familiares", val: members.filter(m => m.member_type === "socio_familiar").length, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#475569]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input placeholder="Nombre, DNI, nº socio..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="pl-8 text-sm" />
          </div>
          <Select value={filters.member_type} onValueChange={v => setFilters(f => ({ ...f, member_type: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Tipo de socio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los tipos</SelectItem>
              {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Baja</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs flex-1"
              onClick={() => setFilters({ search: "", member_type: "", status: "" })}>
              <X size={12} className="mr-1" />Limpiar
            </Button>
            <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1">
              <Download size={12} className="mr-1" />Excel
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Nº Socio</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden md:table-cell">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <>
                <tr key={m.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF] cursor-pointer"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-[#475569]">{m.member_number || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0F172A]">{m.name} {m.surname}</p>
                    <p className="text-xs text-[#94A3B8]">{m.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475569] hidden md:table-cell">{TYPES[m.member_type] || m.member_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${m.status === "active" ? STATUS_COLORS.active : STATUS_COLORS.inactive}`}>
                      {m.status === "active" ? "Activo" : "Baja"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {expanded === m.id ? <ChevronUp size={14} className="text-[#94A3B8] inline" /> : <ChevronDown size={14} className="text-[#94A3B8] inline" />}
                  </td>
                </tr>
                {expanded === m.id && (
                  <tr key={`${m.id}-exp`} className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-xs text-[#94A3B8] mb-1">DNI/NIE</p><p>{m.dni || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Teléfono</p><p>{m.phone || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Dirección</p><p>{[m.address, m.city].filter(Boolean).join(", ") || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">IBAN</p><p className="font-mono text-xs">{m.bank_iban || "—"}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className={`text-xs ${m.status === "active" ? "text-slate-600" : "text-green-600"}`}
                          onClick={() => handleStatusChange(m.id, m.status === "active" ? "inactive" : "active")}>
                          {m.status === "active" ? "Dar de baja" : "Reactivar"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-200 text-xs"
                          onClick={() => handleDelete(m.id)}>
                          <Trash2 size={12} className="mr-1" />Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Sin socios con los filtros aplicados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────
export default function DeportistasManager() {
  const [tab, setTab] = useState("deportistas");
  const tabs = [
    { id: "deportistas", label: "Deportistas", icon: Users },
    { id: "tutores", label: "Tutores / Padres", icon: Shield },
    { id: "socios", label: "Socios", icon: Star },
  ];
  return (
    <div data-testid="admin-deportistas-manager">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-5">Gestión de Personas</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#00296B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#00296B]"}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      {tab === "deportistas" && <DeportistasTab />}
      {tab === "tutores" && <TutoresTab />}
      {tab === "socios" && <SociosTab />}
    </div>
  );
}
