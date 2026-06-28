import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Calendar, Clock,
  Repeat, Users, MapPin, Dumbbell, Trophy, Music, Star, X, Save, Copy, Edit2
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const EVENT_TYPES = {
  entrenamiento: { label: "Entrenamiento", icon: Dumbbell, color: "bg-blue-100 text-blue-700 border-blue-200", dot: "#2460FF" },
  partido: { label: "Partido", icon: Trophy, color: "bg-green-100 text-green-700 border-green-200", dot: "#16a34a" },
  clase: { label: "Clase dirigida", icon: Music, color: "bg-purple-100 text-purple-700 border-purple-200", dot: "#9333ea" },
  convocatoria: { label: "Convocatoria", icon: Star, color: "bg-amber-100 text-amber-700 border-amber-200", dot: "#d97706" },
  evento: { label: "Evento / Acto", icon: Calendar, color: "bg-rose-100 text-rose-700 border-rose-200", dot: "#e11d48" },
};

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── Event Form (module-level to avoid cursor bug) ─────────────────────────────
function EventForm({ form, setForm, teams, facilities, onSave, saveLabel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Tipo de evento</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {Object.entries(EVENT_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => set("type", k)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 text-xs font-bold transition-all ${form.type === k ? "border-[#2460FF] bg-blue-50 text-[#2460FF]" : "border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]/40"}`}>
              <v.icon size={16} />
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div><Label className="text-sm">Título (opcional)</Label><Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" placeholder={EVENT_TYPES[form.type]?.label} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Equipo</Label>
          <Select value={form.team_id || "_none"} onValueChange={v => set("team_id", v === "_none" ? "" : v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent><SelectItem value="_none">Sin equipo</SelectItem>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Instalación</Label>
          <Select value={form.facility_id || "_none"} onValueChange={v => set("facility_id", v === "_none" ? "" : v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
            <SelectContent><SelectItem value="_none">Sin instalación</SelectItem>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1"><Label className="text-sm">Fecha</Label><Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Hora</Label><Input type="time" value={form.time} onChange={e => set("time", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Duración (min)</Label><Input type="number" value={form.duration_min} onChange={e => set("duration_min", e.target.value)} className="mt-1" min="15" step="15" /></div>
      </div>
      <div><Label className="text-sm">Notas</Label><Input value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" placeholder="Información adicional..." /></div>
      <Button onClick={onSave} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

// ── Event Create Dialog ───────────────────────────────────────────────────────
function EventDialog({ teams, facilities, onCreated, initialDate }) {
  const [open, setOpen] = useState(false);
  const BLANK = {
    type: "entrenamiento", title: "", team_id: "", facility_id: "",
    date: initialDate || formatDate(new Date()), time: "09:00",
    duration_min: 90, notes: "",
  };
  const [form, setForm] = useState(BLANK);

  const handleCreate = async () => {
    if (!form.title.trim() && !form.type) return;
    const payload = { ...form, title: form.title || EVENT_TYPES[form.type]?.label, duration_min: parseInt(form.duration_min) || 90 };
    await ax.post("/schedule/events", payload);
    setOpen(false);
    setForm(BLANK);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white text-sm">
          <Plus size={14} className="mr-1" />Nuevo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo evento en el calendario</DialogTitle></DialogHeader>
        <EventForm form={form} setForm={setForm} teams={teams} facilities={facilities} onSave={handleCreate} saveLabel="Guardar evento" />
      </DialogContent>
    </Dialog>
  );
}

// ── Template Dialog ────────────────────────────────────────────────────────────
function TemplateDialog({ teams, facilities, onCreated, editTarget, onClose }) {
  const [open, setOpen] = useState(!!editTarget);
  const [name, setName] = useState(editTarget?.name || "");
  const [rows, setRows] = useState(
    editTarget?.events?.length
      ? editTarget.events
      : [{ type: "entrenamiento", title: "", team_id: "", facility_id: "", day_of_week: 1, time: "18:00", duration_min: 90 }]
  );

  useEffect(() => {
    if (editTarget) {
      setOpen(true);
      setName(editTarget.name || "");
      setRows(editTarget.events?.length
        ? editTarget.events
        : [{ type: "entrenamiento", title: "", team_id: "", facility_id: "", day_of_week: 1, time: "18:00", duration_min: 90 }]);
    }
  }, [editTarget]);

  const addRow = () => setRows(r => [...r, { type: "entrenamiento", title: "", team_id: "", facility_id: "", day_of_week: 1, time: "18:00", duration_min: 90 }]);
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i));
  const setRow = (i, k, v) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editTarget) {
      await ax.put(`/schedule/templates/${editTarget.id}`, { name, events: rows });
    } else {
      await ax.post("/schedule/templates", { name, events: rows });
    }
    setOpen(false);
    setName("");
    setRows([{ type: "entrenamiento", title: "", team_id: "", facility_id: "", day_of_week: 1, time: "18:00", duration_min: 90 }]);
    onCreated();
    if (onClose) onClose();
  };

  const handleOpenChange = (v) => {
    setOpen(v);
    if (!v && onClose) onClose();
  };

  if (editTarget) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar plantilla semanal</DialogTitle></DialogHeader>
          <TemplateFormBody name={name} setName={setName} rows={rows} addRow={addRow} removeRow={removeRow} setRow={setRow} teams={teams} facilities={facilities} onSave={handleSave} saveLabel="Guardar cambios" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-[#2460FF] border-[#2460FF] text-sm">
          <Repeat size={14} className="mr-1" />Plantilla semanal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva plantilla semanal</DialogTitle></DialogHeader>
        <p className="text-sm text-[#475569] mb-3">Define los eventos que se repiten cada semana. Aplícala a cualquier semana con un clic.</p>
        <TemplateFormBody name={name} setName={setName} rows={rows} addRow={addRow} removeRow={removeRow} setRow={setRow} teams={teams} facilities={facilities} onSave={handleSave} saveLabel="Guardar plantilla" />
      </DialogContent>
    </Dialog>
  );
}

function TemplateFormBody({ name, setName, rows, addRow, removeRow, setRow, teams, facilities, onSave, saveLabel }) {
  return (
    <>
      <div className="mb-4">
        <Label className="text-sm">Nombre de la plantilla</Label>
        <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Ej: Horario habitual temporada 26/27" />
      </div>
      <div className="space-y-3 mb-4">
        {rows.map((row, i) => (
          <div key={i} className="bg-[#F4F7FB] rounded-xl p-3 relative">
            <button onClick={() => removeRow(i)} className="absolute top-2 right-2 text-[#94A3B8] hover:text-red-500"><X size={14} /></button>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={row.type} onValueChange={v => setRow(i, "type", v)}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(EVENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Día de la semana</Label>
                <Select value={String(row.day_of_week)} onValueChange={v => setRow(i, "day_of_week", parseInt(v))}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS_FULL.map((d, idx) => <SelectItem key={idx} value={String(idx)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Hora</Label>
                <Input type="time" value={row.time} onChange={e => setRow(i, "time", e.target.value)} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Duración (min)</Label>
                <Input type="number" value={row.duration_min} onChange={e => setRow(i, "duration_min", parseInt(e.target.value) || 90)} className="mt-1 h-8 text-xs" min="15" step="15" />
              </div>
              <div>
                <Label className="text-xs">Equipo</Label>
                <Select value={row.team_id || "_none"} onValueChange={v => setRow(i, "team_id", v === "_none" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent><SelectItem value="_none">Sin equipo</SelectItem>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Instalación</Label>
                <Select value={row.facility_id || "_none"} onValueChange={v => setRow(i, "facility_id", v === "_none" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-xs h-8"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent><SelectItem value="_none">Sin instalación</SelectItem>{facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Título (opcional)</Label>
                <Input value={row.title} onChange={e => setRow(i, "title", e.target.value)} className="mt-1 h-8 text-xs" placeholder={EVENT_TYPES[row.type]?.label} />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addRow} className="w-full text-xs text-[#2460FF] border-dashed border-[#2460FF]">
          <Plus size={12} className="mr-1" />Añadir evento a la plantilla
        </Button>
      </div>
      <Button onClick={onSave} disabled={!name.trim()} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
        <Save size={14} className="mr-1" />{saveLabel}
      </Button>
    </>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ weekStart, events, teams, facilities, onDelete, onEdit }) {
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsForDay = (d) => {
    const ds = formatDate(d);
    return events.filter(e => e.date === ds).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  };

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
        {days.map((d, i) => {
          const isToday = formatDate(d) === formatDate(new Date());
          return (
            <div key={i} className={`p-2 text-center border-r border-[#F1F5F9] last:border-0 ${isToday ? "bg-[#EEF2FF]" : ""}`}>
              <p className="text-xs font-bold text-[#475569] uppercase">{DAYS_ES[i]}</p>
              <p className={`text-sm font-bold mt-0.5 ${isToday ? "text-[#2460FF]" : "text-[#0F172A]"}`}>{d.getDate()}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-48">
        {days.map((d, i) => {
          const dayEvts = eventsForDay(d);
          return (
            <div key={i} className="border-r border-[#F1F5F9] last:border-0 p-1.5 space-y-1 min-h-32">
              {dayEvts.map(ev => {
                const et = EVENT_TYPES[ev.type] || EVENT_TYPES.evento;
                return (
                  <div key={ev.id} className="group relative rounded-lg px-2 py-1.5 cursor-pointer" style={{ background: et.dot + "18", borderLeft: `3px solid ${et.dot}` }} onClick={() => onEdit(ev)}>
                    <p className="text-xs font-bold leading-tight truncate" style={{ color: et.dot }}>{ev.title || et.label}</p>
                    {ev.time && <p className="text-xs text-[#94A3B8] flex items-center gap-0.5"><Clock size={9} />{ev.time}</p>}
                    {ev.team_id && <p className="text-xs text-[#94A3B8] truncate">{teamMap[ev.team_id] || ""}</p>}
                    <button onClick={e => { e.stopPropagation(); onDelete(ev.id); }} className="absolute top-0.5 right-0.5 text-[#CBD5E1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CalendarManager() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [tab, setTab] = useState("week");
  const [genTemplateId, setGenTemplateId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState(null);
  const [filterTeam, setFilterTeam] = useState("");
  const [filterType, setFilterType] = useState("");

  // Edit event state
  const [editEvent, setEditEvent] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Edit template state
  const [editTemplate, setEditTemplate] = useState(null);

  const load = useCallback(async () => {
    const from = formatDate(weekStart);
    const to = formatDate(addDays(weekStart, 6));
    const [er, tr, fr, tmr] = await Promise.all([
      ax.get(`/schedule/events?date_from=${from}&date_to=${to}`),
      ax.get("/teams"),
      ax.get("/facilities"),
      ax.get("/schedule/templates"),
    ]);
    setEvents(er.data);
    setTeams(tr.data);
    setFacilities(fr.data);
    setTemplates(tmr.data);
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));
  const goToday = () => setWeekStart(getWeekStart(new Date()));

  const handleDeleteEvent = async (id) => {
    await ax.delete(`/schedule/events/${id}`);
    load();
  };

  const openEditEvent = (ev) => {
    setEditEvent(ev);
    setEditForm({
      type: ev.type || "entrenamiento",
      title: ev.title || "",
      team_id: ev.team_id || "",
      facility_id: ev.facility_id || "",
      date: ev.date || formatDate(new Date()),
      time: ev.time || "09:00",
      duration_min: ev.duration_min || 90,
      notes: ev.notes || "",
    });
    setEditOpen(true);
  };

  const handleEditEvent = async () => {
    const payload = { ...editForm, title: editForm.title || EVENT_TYPES[editForm.type]?.label, duration_min: parseInt(editForm.duration_min) || 90 };
    await ax.put(`/schedule/events/${editEvent.id}`, payload);
    setEditOpen(false);
    load();
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("¿Eliminar plantilla?")) return;
    await ax.delete(`/schedule/templates/${id}`);
    load();
  };

  const handleGenerateWeek = async () => {
    if (!genTemplateId) return;
    setGenLoading(true);
    setGenMsg(null);
    try {
      const r = await ax.post(`/schedule/templates/${genTemplateId}/generate-week`, { week_start: formatDate(weekStart) });
      setGenMsg({ type: "ok", msg: `${r.data.created} eventos creados para la semana del ${formatDate(weekStart)}` });
      load();
    } catch (e) {
      setGenMsg({ type: "err", msg: e.response?.data?.detail || "Error al generar" });
    } finally {
      setGenLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterTeam && e.team_id !== filterTeam) return false;
    if (filterType && e.type !== filterType) return false;
    return true;
  });

  const weekLabel = `${weekStart.getDate()} ${weekStart.toLocaleDateString("es-ES", { month: "short" })} — ${addDays(weekStart, 6).getDate()} ${addDays(weekStart, 6).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}`;

  return (
    <div data-testid="admin-calendar">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Calendario y Horarios</h2>
          <p className="text-sm text-[#475569]">Entrenamientos, partidos, clases y eventos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TemplateDialog teams={teams} facilities={facilities} onCreated={load} />
          <EventDialog teams={teams} facilities={facilities} onCreated={load} initialDate={formatDate(weekStart)} />
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-5">
        {[{ id: "week", label: "Vista Semana" }, { id: "list", label: "Lista" }, { id: "templates", label: "Plantillas" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#00296B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#00296B]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Week navigation */}
      {(tab === "week" || tab === "list") && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 mb-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevWeek} className="h-8 w-8 p-0"><ChevronLeft size={14} /></Button>
            <span className="font-bold text-[#00296B] text-sm min-w-48 text-center">{weekLabel}</span>
            <Button variant="ghost" size="sm" onClick={nextWeek} className="h-8 w-8 p-0"><ChevronRight size={14} /></Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">Hoy</Button>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <Select value={genTemplateId} onValueChange={setGenTemplateId}>
              <SelectTrigger className="text-xs h-8 w-48"><SelectValue placeholder="Aplicar plantilla..." /></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={handleGenerateWeek} disabled={!genTemplateId || genLoading} className="bg-[#2460FF] hover:bg-[#00296B] text-white text-xs h-8">
              <Copy size={12} className="mr-1" />{genLoading ? "Generando..." : "Generar semana"}
            </Button>
          </div>
          {genMsg && (
            <div className={`w-full text-xs px-3 py-2 rounded-lg ${genMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {genMsg.msg}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {(tab === "week" || tab === "list") && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Select value={filterTeam} onValueChange={v => setFilterTeam(v === "_all" ? "" : v)}>
            <SelectTrigger className="text-sm w-44 h-8"><SelectValue placeholder="Todos los equipos" /></SelectTrigger>
            <SelectContent><SelectItem value="_all">Todos los equipos</SelectItem>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filterType} onValueChange={v => setFilterType(v === "_all" ? "" : v)}>
            <SelectTrigger className="text-sm w-44 h-8"><SelectValue placeholder="Tipo de evento" /></SelectTrigger>
            <SelectContent><SelectItem value="_all">Todos los tipos</SelectItem>{Object.entries(EVENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
          </Select>
          <span className="text-xs text-[#94A3B8] self-center">{filteredEvents.length} eventos esta semana</span>
        </div>
      )}

      {/* WEEK VIEW */}
      {tab === "week" && (
        <WeekView weekStart={weekStart} events={filteredEvents} teams={teams} facilities={facilities} onDelete={handleDeleteEvent} onEdit={openEditEvent} />
      )}

      {/* LIST VIEW */}
      {tab === "list" && (
        <div className="space-y-2">
          {filteredEvents.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center text-[#94A3B8]">
              <Calendar size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
              <p>Sin eventos para esta semana. Crea uno o aplica una plantilla.</p>
            </div>
          )}
          {filteredEvents.sort((a, b) => (`${a.date} ${a.time}`).localeCompare(`${b.date} ${b.time}`)).map(ev => {
            const et = EVENT_TYPES[ev.type] || EVENT_TYPES.evento;
            const teamName = teams.find(t => t.id === ev.team_id)?.name || "";
            const facName = facilities.find(f => f.id === ev.facility_id)?.name || "";
            return (
              <div key={ev.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: et.dot + "20" }}>
                  <et.icon size={18} style={{ color: et.dot }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[#0F172A] text-sm">{ev.title || et.label}</p>
                    <Badge className={`text-xs ${et.color}`}>{et.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[#94A3B8] flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={10} />{DAYS_FULL[new Date(ev.date + "T12:00:00").getDay() === 0 ? 6 : new Date(ev.date + "T12:00:00").getDay() - 1]} {ev.date}</span>
                    {ev.time && <span className="flex items-center gap-1"><Clock size={10} />{ev.time}{ev.duration_min ? ` (${ev.duration_min} min)` : ""}</span>}
                    {teamName && <span className="flex items-center gap-1"><Users size={10} />{teamName}</span>}
                    {facName && <span className="flex items-center gap-1"><MapPin size={10} />{facName}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="text-[#2460FF] h-8 w-8 p-0" onClick={() => openEditEvent(ev)}>
                    <Edit2 size={13} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={() => handleDeleteEvent(ev.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TEMPLATES */}
      {tab === "templates" && (
        <div>
          <p className="text-sm text-[#475569] mb-4">Las plantillas definen un horario tipo semanal. Aplícalas a cualquier semana para crear todos los eventos de golpe.</p>
          {templates.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center text-[#94A3B8]">
              <Repeat size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
              <p>Sin plantillas. Crea una con el botón "Plantilla semanal".</p>
            </div>
          )}
          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#00296B]">{t.name}</p>
                    <p className="text-xs text-[#94A3B8]">{t.events?.length || 0} eventos por semana</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="text-[#2460FF] h-8 w-8 p-0" onClick={() => setEditTemplate(t)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 h-8 w-8 p-0" onClick={() => handleDeleteTemplate(t.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(t.events || []).map((ev, i) => {
                    const et = EVENT_TYPES[ev.type] || EVENT_TYPES.evento;
                    return (
                      <span key={i} className={`text-xs px-2 py-1 rounded-full border font-medium ${et.color}`}>
                        {DAYS_ES[ev.day_of_week]} {ev.time} · {ev.title || et.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Event Dialog */}
      {editForm && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar evento</DialogTitle></DialogHeader>
            <EventForm form={editForm} setForm={setEditForm} teams={teams} facilities={facilities} onSave={handleEditEvent} saveLabel="Guardar cambios" />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Template Dialog */}
      {editTemplate && (
        <TemplateDialog
          teams={teams}
          facilities={facilities}
          onCreated={load}
          editTarget={editTemplate}
          onClose={() => setEditTemplate(null)}
        />
      )}
    </div>
  );
}
