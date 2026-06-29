import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, MapPin, Clock, Users, ChevronDown, ChevronUp, X, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import ax from "../../api";

const BLANK = { name: "", address: "", type: "campo", capacity: "", notes: "" };
const TYPE_LABEL = { campo: "Campo de fútbol", pabellon: "Pabellón", sala: "Sala / vestuarios", gimnasio: "Gimnasio", piscina: "Piscina", otro: "Otro" };
const TYPE_COLORS = { campo: "bg-green-100 text-green-700", pabellon: "bg-blue-100 text-blue-700", sala: "bg-slate-100 text-slate-600", gimnasio: "bg-orange-100 text-orange-700", piscina: "bg-cyan-100 text-cyan-700", otro: "bg-gray-100 text-gray-600" };

function FacilityForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...BLANK, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const payload = { ...form, capacity: parseInt(form.capacity) || null };
    if (initial?.id) await ax.put(`/facilities/${initial.id}`, payload);
    else await ax.post("/facilities", payload);
    onSave();
  };

  return (
    <div className="space-y-4">
      <div><Label>Nombre de la instalación *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" placeholder="Ej: Campo Municipal La Paz" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.type} onValueChange={v => set("type", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Aforo (personas)</Label><Input type="number" value={form.capacity} onChange={e => set("capacity", e.target.value)} className="mt-1" placeholder="0 = sin límite" /></div>
      </div>
      <div><Label>Dirección / Ubicación</Label><Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1" placeholder="Calle, número, localidad..." /></div>
      <div><Label>Notas internas</Label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="mt-1 w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2460FF]/30" placeholder="Información adicional, horario de disponibilidad, persona de contacto..." /></div>
      <div className="flex gap-2 justify-end">
        {onClose && <Button variant="outline" onClick={onClose}>Cancelar</Button>}
        <Button onClick={handleSave} className="bg-[#2460FF] hover:bg-[#00296B] text-white"><Save size={14} className="mr-1" />Guardar</Button>
      </div>
    </div>
  );
}

function FacilityCard({ facility, teams, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const linkedTeams = teams.filter(t => t.facility_id === facility.id);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F7FB] flex items-center justify-center">
              <MapPin size={18} className="text-[#2460FF]" />
            </div>
            <div>
              <p className="font-bold text-[#0F172A] text-base">{facility.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[facility.type] || "bg-gray-100"}`}>{TYPE_LABEL[facility.type] || facility.type}</span>
                {facility.capacity && <span className="text-xs text-[#94A3B8] flex items-center gap-1"><Users size={10} />Aforo: {facility.capacity}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(facility)} className="text-[#2460FF] h-8 w-8 p-0"><Edit2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(facility.id)} className="text-red-400 h-8 w-8 p-0"><Trash2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="text-[#94A3B8] h-8 w-8 p-0">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        </div>
        {facility.address && (
          <p className="mt-2 text-xs text-[#475569] flex items-center gap-1 ml-13"><MapPin size={11} className="text-[#CBD5E1]" />{facility.address}</p>
        )}
      </div>

      {expanded && (
        <div className="border-t border-[#F1F5F9] bg-[#F8FAFF] p-4">
          {facility.notes && <p className="text-sm text-[#475569] mb-3">{facility.notes}</p>}
          <div>
            <p className="text-xs font-bold text-[#94A3B8] uppercase mb-2">Equipos asignados</p>
            {linkedTeams.length === 0
              ? <p className="text-sm text-[#CBD5E1]">Ningún equipo asignado a esta instalación</p>
              : <div className="flex flex-wrap gap-2">{linkedTeams.map(t => <span key={t.id} className="text-xs bg-[#2460FF]/10 text-[#2460FF] px-2 py-1 rounded-full">{t.name}</span>)}</div>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacilitiesManager() {
  const [facilities, setFacilities] = useState([]);
  const [teams, setTeams] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    const [fr, tr] = await Promise.all([ax.get("/facilities"), ax.get("/teams")]);
    setFacilities(fr.data); setTeams(tr.data);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar instalación? Los equipos asignados quedarán sin instalación.")) return;
    await ax.delete(`/facilities/${id}`);
    load();
  };

  return (
    <div data-testid="admin-facilities">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Instalaciones</h2>
          <p className="text-sm text-[#475569]">Campos, pabellones y espacios del club</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white"><Plus size={14} className="mr-1" />Nueva instalación</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva instalación</DialogTitle></DialogHeader>
            <FacilityForm onSave={() => { load(); setNewOpen(false); }} onClose={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit inline dialog */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-[#00296B]">Editar instalación</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditTarget(null)} className="h-8 w-8 p-0"><X size={16} /></Button>
            </div>
            <FacilityForm initial={editTarget} onSave={() => { load(); setEditTarget(null); }} onClose={() => setEditTarget(null)} />
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total instalaciones", val: facilities.length, color: "text-[#2460FF]" },
          { label: "Campos / Pabellones", val: facilities.filter(f => ["campo", "pabellon"].includes(f.type)).length, color: "text-green-600" },
          { label: "Equipos con instalación", val: teams.filter(t => t.facility_id).length, color: "text-[#00296B]" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {facilities.length === 0
        ? (
          <div className="text-center py-16 text-[#94A3B8]">
            <MapPin size={40} className="mx-auto mb-3 text-[#CBD5E1]" />
            <p className="font-medium">Sin instalaciones registradas</p>
            <p className="text-sm mt-1">Añade campos, pabellones y otros espacios del club</p>
          </div>
        )
        : (
          <div className="grid gap-3 lg:grid-cols-2">
            {facilities.map(f => (
              <FacilityCard key={f.id} facility={f} teams={teams} onEdit={setEditTarget} onDelete={handleDelete} />
            ))}
          </div>
        )
      }
    </div>
  );
}
