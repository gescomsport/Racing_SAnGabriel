import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import ax from "../../api";

const DAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const EMPTY_FORM = { team_id: "", day_of_week: "lunes", start_time: "", end_time: "", facility_id: "", location: "", notes: "" };

const DAY_COLORS = {
  lunes: "bg-blue-50 text-blue-700",
  martes: "bg-purple-50 text-purple-700",
  miercoles: "bg-green-50 text-green-700",
  jueves: "bg-amber-50 text-amber-700",
  viernes: "bg-red-50 text-red-700",
  sabado: "bg-pink-50 text-pink-700",
  domingo: "bg-gray-50 text-gray-700",
};

export default function TrainingManager() {
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [open, setOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterTeam, setFilterTeam] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [s, t, f] = await Promise.all([
      ax.get("/training-schedules"),
      ax.get("/teams"),
      ax.get("/facilities").catch(() => ({ data: [] })),
    ]);
    setSchedules(s.data);
    setTeams(t.data);
    setFacilities(f.data);
  };

  const openCreate = () => {
    setEditSchedule(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditSchedule(s);
    setForm({ ...EMPTY_FORM, ...s, facility_id: s.facility_id || "" });
    setOpen(true);
  };

  const getFacilityName = (id) => facilities.find(f => f.id === id)?.name || "";

  const handleSave = async () => {
    if (editSchedule) {
      await ax.put(`/training-schedules/${editSchedule.id}`, form);
    } else {
      await ax.post("/training-schedules", form);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar horario?")) return;
    await ax.delete(`/training-schedules/${id}`);
    load();
  };

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "Sin equipo";
  const getDayLabel = (v) => DAYS.find(d => d.value === v)?.label || v;

  const filtered = filterTeam === "all"
    ? schedules
    : schedules.filter(s => s.team_id === filterTeam);

  // Group by day
  const byDay = DAY_ORDER.reduce((acc, day) => {
    const items = filtered.filter(s => s.day_of_week === day);
    if (items.length > 0) acc[day] = items;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Horarios de Entrenamiento</h2>
          <p className="text-sm text-[#475569]">{filtered.length} sesiones programadas</p>
        </div>
        <Button onClick={openCreate} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
          <Plus size={16} className="mr-1" /> Nuevo Horario
        </Button>
      </div>

      <div className="mb-5">
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-52 text-sm"><SelectValue placeholder="Filtrar por equipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los equipos</SelectItem>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(byDay).length === 0 ? (
        <div className="text-center py-16 text-[#475569]">
          <Clock size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay horarios configurados</p>
          <p className="text-xs mt-1">Pulsa "Nuevo Horario" para añadir sesiones de entrenamiento</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byDay).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${DAY_COLORS[day]} font-medium`}>{getDayLabel(day)}</Badge>
                <span className="text-xs text-[#94A3B8]">{items.length} sesión{items.length > 1 ? "es" : ""}</span>
              </div>
              <div className="space-y-2 pl-2">
                {items
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map(item => (
                    <div key={item.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-16">
                          <p className="font-heading font-bold text-[#00296B] text-sm">{item.start_time}</p>
                          <p className="text-xs text-[#94A3B8]">— {item.end_time}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[#0F172A] text-sm">{getTeamName(item.team_id)}</p>
                          {(item.facility_id ? getFacilityName(item.facility_id) : item.location) && (
                            <p className="text-xs text-[#475569]">{item.facility_id ? getFacilityName(item.facility_id) : item.location}</p>
                          )}
                          {item.notes && <p className="text-xs text-[#94A3B8] italic">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button onClick={() => openEdit(item)} variant="ghost" size="sm" className="text-[#475569] hover:text-[#00296B]">
                          <Edit size={14} />
                        </Button>
                        <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              {editSchedule ? "Editar Horario" : "Nuevo Horario"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Equipo *</Label>
              <Select value={form.team_id} onValueChange={v => setForm({ ...form, team_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Día de la semana *</Label>
              <Select value={form.day_of_week} onValueChange={v => setForm({ ...form, day_of_week: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Hora inicio *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Hora fin *</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-sm">Campo / Instalación</Label>
              {facilities.length > 0 ? (
                <>
                  <Select
                    value={form.facility_id || "_manual"}
                    onValueChange={v => {
                      if (v === "_manual") {
                        setForm(f => ({ ...f, facility_id: "", location: "" }));
                      } else {
                        const fac = facilities.find(f => f.id === v);
                        setForm(f => ({ ...f, facility_id: v, location: fac?.name || "" }));
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar instalación..." /></SelectTrigger>
                    <SelectContent>
                      {facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      <SelectItem value="_manual">Otra (escribir manualmente)</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!form.facility_id || form.facility_id === "_manual") && (
                    <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-2" placeholder="Nombre del campo o instalación..." />
                  )}
                </>
              ) : (
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="mt-1" placeholder="Campo Municipal San Gabriel..." />
              )}
            </div>

            <div>
              <Label className="text-sm">Notas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" placeholder="Traer material extra, etc." />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.team_id || !form.start_time || !form.end_time}
              className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
            >
              {editSchedule ? "Guardar cambios" : "Crear horario"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
