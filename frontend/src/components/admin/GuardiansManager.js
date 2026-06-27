import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Edit, Shield, Search, ChevronDown, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const EMPTY_FORM = {
  name: "", surname: "", dni: "", phone: "", email: "",
  address: "", city: "", relationship: "padre",
  player_ids: [], family_id: "", bank_iban: "", notes: ""
};

const RELATIONSHIPS = [
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "tutor_legal", label: "Tutor legal" },
  { value: "abuelo", label: "Abuelo/a" },
  { value: "hermano", label: "Hermano/a mayor" },
  { value: "otro", label: "Otro" },
];

export default function GuardiansManager() {
  const [guardians, setGuardians] = useState([]);
  const [players, setPlayers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editGuardian, setEditGuardian] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [g, p] = await Promise.all([ax.get("/guardians"), ax.get("/players")]);
    setGuardians(g.data);
    setPlayers(p.data);
  };

  const openCreate = () => {
    setEditGuardian(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (g) => {
    setEditGuardian(g);
    setForm({ ...EMPTY_FORM, ...g });
    setOpen(true);
  };

  const togglePlayer = (playerId) => {
    setForm(f => ({
      ...f,
      player_ids: f.player_ids.includes(playerId)
        ? f.player_ids.filter(id => id !== playerId)
        : [...f.player_ids, playerId]
    }));
  };

  const handleSave = async () => {
    if (editGuardian) {
      await ax.put(`/guardians/${editGuardian.id}`, form);
    } else {
      await ax.post("/guardians", form);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar tutor?")) return;
    await ax.delete(`/guardians/${id}`);
    load();
  };

  const getPlayerName = (id) => {
    const p = players.find(p => p.id === id);
    return p ? `${p.name} ${p.surname || ""}`.trim() : "Desconocido";
  };

  const getRelLabel = (v) => RELATIONSHIPS.find(r => r.value === v)?.label || v;

  const filtered = guardians.filter(g =>
    search === "" ||
    `${g.name} ${g.surname}`.toLowerCase().includes(search.toLowerCase()) ||
    (g.dni || "").toLowerCase().includes(search.toLowerCase())
  );

  // Minor players only (guardians manage minors)
  const minorPlayers = players.filter(p => {
    if (!p.birthdate) return true;
    const age = (new Date() - new Date(p.birthdate)) / (1000 * 60 * 60 * 24 * 365.25);
    return age < 18;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Tutores / Familias</h2>
          <p className="text-sm text-[#475569]">{filtered.length} tutores registrados</p>
        </div>
        <Button onClick={openCreate} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
          <Plus size={16} className="mr-1" /> Nuevo Tutor
        </Button>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#475569]">
            <Shield size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay tutores registrados</p>
          </div>
        )}
        {filtered.map(guardian => (
          <div key={guardian.id} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F4F7FB]"
              onClick={() => setExpandedId(expandedId === guardian.id ? null : guardian.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Shield size={16} className="text-[#2460FF]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#0F172A] text-sm">
                      {guardian.name} {guardian.surname}
                    </span>
                    <Badge className="text-xs bg-[#F4F7FB] text-[#00296B]">
                      {getRelLabel(guardian.relationship)}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#475569]">
                    {guardian.phone} {guardian.email ? `· ${guardian.email}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {guardian.player_ids?.length > 0 && (
                  <Badge className="text-xs bg-green-50 text-green-700">
                    <Users size={10} className="mr-1" />
                    {guardian.player_ids.length} jugador{guardian.player_ids.length > 1 ? "es" : ""}
                  </Badge>
                )}
                <ChevronDown size={14} className={`text-[#94A3B8] transition-transform ${expandedId === guardian.id ? "rotate-180" : ""}`} />
              </div>
            </div>

            {expandedId === guardian.id && (
              <div className="border-t border-[#E2E8F0] p-4 bg-[#F4F7FB]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                  {guardian.dni && <div><span className="text-[#94A3B8]">DNI:</span> <span className="text-[#0F172A]">{guardian.dni}</span></div>}
                  {guardian.city && <div><span className="text-[#94A3B8]">Ciudad:</span> <span className="text-[#0F172A]">{guardian.city}</span></div>}
                  {guardian.bank_iban && (
                    <div><span className="text-[#94A3B8]">IBAN:</span> <span className="text-[#0F172A] font-mono">{guardian.bank_iban}</span></div>
                  )}
                </div>

                {guardian.player_ids?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-[#94A3B8] mb-1">Jugadores vinculados:</p>
                    <div className="flex flex-wrap gap-1">
                      {guardian.player_ids.map(pid => (
                        <Badge key={pid} className="text-xs bg-blue-50 text-blue-700">{getPlayerName(pid)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {guardian.notes && <p className="text-xs text-[#475569] mb-3">{guardian.notes}</p>}

                <div className="flex gap-2">
                  <Button onClick={() => openEdit(guardian)} variant="outline" size="sm" className="text-xs">
                    <Edit size={12} className="mr-1" /> Editar
                  </Button>
                  <Button onClick={() => handleDelete(guardian.id)} variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700">
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              {editGuardian ? "Editar Tutor" : "Nuevo Tutor Legal"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Apellidos</Label><Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} className="mt-1" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">DNI/NIE</Label><Input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="mt-1" /></div>
              <div>
                <Label className="text-sm">Relación</Label>
                <Select value={form.relationship} onValueChange={v => setForm({ ...form, relationship: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Teléfono *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+34 600 000 000" /></div>
              <div><Label className="text-sm">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="tutor@email.com" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Ciudad</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
            </div>

            <div>
              <Label className="text-sm">IBAN (para domiciliación SEPA)</Label>
              <Input
                value={form.bank_iban}
                onChange={e => setForm({ ...form, bank_iban: e.target.value })}
                className="mt-1 font-mono"
                placeholder="ES00 0000 0000 0000 0000 0000"
              />
            </div>

            <div>
              <Label className="text-sm">ID Familiar</Label>
              <Input value={form.family_id} onChange={e => setForm({ ...form, family_id: e.target.value })} className="mt-1" placeholder="Para vincular miembros de la misma familia" />
            </div>

            <div>
              <Label className="text-sm">Jugadores vinculados</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2 space-y-1">
                {minorPlayers.length === 0 && <p className="text-xs text-[#94A3B8] p-1">No hay jugadores menores registrados</p>}
                {minorPlayers.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-[#F4F7FB] text-sm">
                    <input
                      type="checkbox"
                      checked={form.player_ids.includes(p.id)}
                      onChange={() => togglePlayer(p.id)}
                      className="accent-[#2460FF]"
                    />
                    <span className="text-[#0F172A]">{p.name} {p.surname}</span>
                    <span className="text-[#94A3B8] text-xs ml-auto">{players.find(pl => pl.id === p.id)?.team_id ? "·" : ""}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm">Notas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name || !form.phone || !form.email}
              className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
            >
              {editGuardian ? "Guardar cambios" : "Crear tutor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
