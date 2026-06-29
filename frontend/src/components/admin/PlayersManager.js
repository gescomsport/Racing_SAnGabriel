import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, User, Search, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import ax from "../../api";

const EMPTY_FORM = {
  name: "", surname: "", position: "", number: "", team_id: "",
  birthdate: "", dni: "", address: "", city: "", postal_code: "",
  phone: "", email: "", jersey_size: "", season: "2025/2026",
  medical_notes: "", blood_type: "", family_id: "",
  status: "active", notes: "", image_url: ""
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"];
const POSITIONS = ["Portero", "Defensa central", "Lateral derecho", "Lateral izquierdo",
  "Centrocampista", "Mediapunta", "Extremo derecho", "Extremo izquierdo", "Delantero centro"];

export default function PlayersManager() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [open, setOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [p, t] = await Promise.all([ax.get("/players"), ax.get("/teams")]);
    setPlayers(p.data);
    setTeams(t.data);
  };

  const openCreate = () => {
    setEditPlayer(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (player) => {
    setEditPlayer(player);
    setForm({ ...EMPTY_FORM, ...player, number: player.number ?? "" });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, number: form.number ? parseInt(form.number) : null };
    if (editPlayer) {
      await ax.put(`/players/${editPlayer.id}`, payload);
    } else {
      await ax.post("/players", payload);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar jugador?")) return;
    await ax.delete(`/players/${id}`);
    load();
  };

  const filtered = players.filter(p => {
    const matchSearch = search === "" ||
      `${p.name} ${p.surname}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.dni || "").toLowerCase().includes(search.toLowerCase());
    const matchTeam = filterTeam === "all" || p.team_id === filterTeam;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchTeam && matchStatus;
  });

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "Sin equipo";

  const statusColor = (s) => s === "active" ? "bg-green-50 text-green-700" :
    s === "injured" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  const statusLabel = (s) => s === "active" ? "Activo" : s === "injured" ? "Lesionado" : "Inactivo";

  const isMinor = (birthdate) => {
    if (!birthdate) return null;
    const age = (new Date() - new Date(birthdate)) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Jugadores</h2>
          <p className="text-sm text-[#475569]">{filtered.length} de {players.length} jugadores</p>
        </div>
        <Button onClick={openCreate} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
          <Plus size={16} className="mr-1" /> Nuevo Jugador
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Equipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los equipos</SelectItem>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="injured">Lesionados</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#475569]">
            <User size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay jugadores que coincidan</p>
          </div>
        )}
        {filtered.map(player => (
          <div key={player.id} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F4F7FB]"
              onClick={() => setExpandedId(expandedId === player.id ? null : player.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F4F7FB] flex items-center justify-center">
                  {player.image_url
                    ? <img src={player.image_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : <User size={16} className="text-[#00296B]" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#0F172A] text-sm">
                      {player.name} {player.surname}
                    </span>
                    {player.number && <span className="text-xs text-[#94A3B8]">#{player.number}</span>}
                    {player.birthdate && isMinor(player.birthdate) && (
                      <Badge className="text-xs bg-blue-50 text-blue-700">Menor</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#475569]">
                    {getTeamName(player.team_id)} {player.position ? `· ${player.position}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${statusColor(player.status)}`}>{statusLabel(player.status)}</Badge>
                <ChevronDown size={14} className={`text-[#94A3B8] transition-transform ${expandedId === player.id ? "rotate-180" : ""}`} />
              </div>
            </div>

            {expandedId === player.id && (
              <div className="border-t border-[#E2E8F0] p-4 bg-[#F4F7FB]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                  {player.birthdate && <div><span className="text-[#94A3B8]">Nacimiento:</span> <span className="text-[#0F172A]">{player.birthdate}</span></div>}
                  {player.dni && <div><span className="text-[#94A3B8]">DNI:</span> <span className="text-[#0F172A]">{player.dni}</span></div>}
                  {player.phone && <div><span className="text-[#94A3B8]">Teléfono:</span> <span className="text-[#0F172A]">{player.phone}</span></div>}
                  {player.email && <div><span className="text-[#94A3B8]">Email:</span> <span className="text-[#0F172A]">{player.email}</span></div>}
                  {player.city && <div><span className="text-[#94A3B8]">Ciudad:</span> <span className="text-[#0F172A]">{player.city}</span></div>}
                  {player.blood_type && <div><span className="text-[#94A3B8]">Sangre:</span> <span className="text-[#0F172A]">{player.blood_type}</span></div>}
                  {player.jersey_size && <div><span className="text-[#94A3B8]">Talla:</span> <span className="text-[#0F172A]">{player.jersey_size}</span></div>}
                  {player.season && <div><span className="text-[#94A3B8]">Temporada:</span> <span className="text-[#0F172A]">{player.season}</span></div>}
                </div>
                {player.medical_notes && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-3">
                    Notas médicas: {player.medical_notes}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => openEdit(player)} variant="outline" size="sm" className="text-xs">
                    <Edit size={12} className="mr-1" /> Editar
                  </Button>
                  <Button onClick={() => handleDelete(player.id)} variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700">
                    <Trash2 size={12} className="mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              {editPlayer ? "Editar Jugador" : "Nuevo Jugador"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Apellidos</Label><Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} className="mt-1" /></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-sm">Fecha nacimiento</Label><Input type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">DNI/NIE</Label><Input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="mt-1" /></div>
              <div>
                <Label className="text-sm">Grupo sanguíneo</Label>
                <Select value={form.blood_type} onValueChange={v => setForm({ ...form, blood_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{BLOOD_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Teléfono *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+34 600 000 000" /></div>
              <div><Label className="text-sm">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="jugador@email.com" /></div>
            </div>

            <div>
              <Label className="text-sm">Dirección</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" placeholder="Calle, número, piso..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Ciudad</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Código postal</Label><Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className="mt-1" /></div>
            </div>

            <hr className="border-[#E2E8F0]" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Equipo *</Label>
                <Select value={form.team_id} onValueChange={v => setForm({ ...form, team_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Posición</Label>
                <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-sm">Dorsal</Label><Input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Talla camiseta</Label><Input value={form.jersey_size} onChange={e => setForm({ ...form, jersey_size: e.target.value })} className="mt-1" placeholder="S, M, L, XL..." /></div>
              <div><Label className="text-sm">Temporada</Label><Input value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} className="mt-1" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="injured">Lesionado</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm">ID Familiar</Label><Input value={form.family_id} onChange={e => setForm({ ...form, family_id: e.target.value })} className="mt-1" placeholder="Para vincular hermanos" /></div>
            </div>

            <div>
              <Label className="text-sm">Notas médicas</Label>
              <Textarea value={form.medical_notes} onChange={e => setForm({ ...form, medical_notes: e.target.value })} rows={2} className="mt-1" placeholder="Alergias, condiciones especiales..." />
            </div>

            <div>
              <Label className="text-sm">URL Foto</Label>
              <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label className="text-sm">Notas internas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name || !form.team_id || !form.phone || !form.email}
              className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
            >
              {editPlayer ? "Guardar cambios" : "Crear jugador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
