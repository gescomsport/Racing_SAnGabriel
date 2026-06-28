import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Dumbbell, Trophy, Music, Star, Calendar, LogOut, Search, Trash2, Plus
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const ax = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, withCredentials: true });

const EVENT_TYPES = {
  entrenamiento: { label: "Entrenamiento", icon: Dumbbell, dot: "#2460FF" },
  partido:       { label: "Partido",        icon: Trophy,   dot: "#16a34a" },
  clase:         { label: "Clase dirigida", icon: Music,    dot: "#9333ea" },
  convocatoria:  { label: "Convocatoria",   icon: Star,     dot: "#d97706" },
  evento:        { label: "Evento / Acto",  icon: Calendar, dot: "#e11d48" },
};

const formatDate = (d) => d.toISOString().slice(0, 10);

const BLANK_EVENT = {
  type: "entrenamiento",
  title: "",
  team_id: "",
  date: formatDate(new Date()),
  time: "10:00",
  duration_min: 90,
  facility_id: "",
  notes: "",
};

function EventTypeIcon({ type, size = 14 }) {
  const cfg = EVENT_TYPES[type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return <Icon size={size} style={{ color: cfg.dot }} />;
}

function EventForm({ form, setForm, myTeams, facilities, onSave, onCancel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Tipo *</Label>
        <div className="flex gap-2 flex-wrap mt-1">
          {Object.entries(EVENT_TYPES).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => set("type", key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${form.type === key ? "border-[#2460FF] bg-blue-50 text-[#2460FF]" : "border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]/40"}`}
              >
                <Icon size={12} style={{ color: cfg.dot }} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label className="text-sm">Título (opcional)</Label>
        <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" placeholder="Ej: Entrenamiento de porteros..." />
      </div>
      <div>
        <Label className="text-sm">Equipo *</Label>
        <div className="mt-1 flex flex-col gap-1">
          {myTeams.map(t => (
            <label key={t.id} className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#F4F7FB]">
              <input
                type="radio"
                name="event-team"
                value={t.id}
                checked={form.team_id === t.id}
                onChange={() => set("team_id", t.id)}
              />
              <span className="text-sm">{t.name}</span>
              {t.category && <span className="text-xs text-[#94A3B8]">({t.category})</span>}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <Label className="text-sm">Fecha *</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Hora</Label>
          <Input type="time" value={form.time} onChange={e => set("time", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm">Duración (min)</Label>
          <Input type="number" value={form.duration_min} onChange={e => set("duration_min", Number(e.target.value))} className="mt-1" min={5} step={5} />
        </div>
      </div>
      {facilities.length > 0 && (
        <div>
          <Label className="text-sm">Instalación</Label>
          <div className="mt-1 flex flex-col gap-1 max-h-32 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2">
            <label className="flex items-center gap-2 px-1 py-1 hover:bg-[#F4F7FB] rounded cursor-pointer">
              <input type="radio" name="event-facility" value="" checked={form.facility_id === ""} onChange={() => set("facility_id", "")} />
              <span className="text-sm text-[#94A3B8]">Sin instalación</span>
            </label>
            {facilities.map(f => (
              <label key={f.id} className="flex items-center gap-2 px-1 py-1 hover:bg-[#F4F7FB] rounded cursor-pointer">
                <input type="radio" name="event-facility" value={f.id} checked={form.facility_id === f.id} onChange={() => set("facility_id", f.id)} />
                <span className="text-sm">{f.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label className="text-sm">Notas</Label>
        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" placeholder="Observaciones, convocados especiales..." />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={!form.team_id || !form.date} className="flex-1 bg-[#2460FF] hover:bg-[#00296B] text-white">
          Guardar evento
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function CalendarTab({ user, myTeams, facilities }) {
  const [events, setEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...BLANK_EVENT });

  const myTeamIds = myTeams.map(t => t.id);

  const loadEvents = useCallback(async () => {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 30);
    try {
      const r = await ax.get(`/schedule/events?date_from=${formatDate(now)}&date_to=${formatDate(future)}`);
      const data = Array.isArray(r.data) ? r.data : (r.data.events || []);
      setEvents(data.filter(ev => myTeamIds.includes(ev.team_id)));
    } catch {}
  }, [myTeamIds.join(",")]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const openNew = () => {
    setForm({ ...BLANK_EVENT, team_id: myTeams[0]?.id || "", date: formatDate(new Date()) });
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await ax.post("/schedule/events", form);
      setDialogOpen(false);
      loadEvents();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este evento?")) return;
    try {
      await ax.delete(`/schedule/events/${id}`);
      loadEvents();
    } catch {}
  };

  const grouped = events.reduce((acc, ev) => {
    const d = ev.date || ev.start_date || "";
    if (!acc[d]) acc[d] = [];
    acc[d].push(ev);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  const teamName = (tid) => myTeams.find(t => t.id === tid)?.name || tid;

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-[#00296B] text-lg">Mi Calendario — próximos 30 días</h3>
        <Button onClick={openNew} className="bg-[#2460FF] hover:bg-[#00296B] text-white text-sm">
          <Plus size={14} className="mr-1" /> Nuevo Evento
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#94A3B8] text-sm">
          No hay eventos programados en los próximos 30 días.
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map(date => (
            <div key={date}>
              <p className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2 capitalize">
                {formatDisplayDate(date)}
              </p>
              <div className="space-y-2">
                {grouped[date].map(ev => {
                  const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.evento;
                  const Icon = cfg.icon;
                  return (
                    <div key={ev.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.dot + "20" }}>
                        <Icon size={16} style={{ color: cfg.dot }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#0F172A] text-sm">
                          {ev.title || cfg.label}
                        </p>
                        <p className="text-xs text-[#475569]">
                          {ev.time || ""}
                          {ev.duration_min ? ` · ${ev.duration_min} min` : ""}
                          {" · "}{teamName(ev.team_id)}
                        </p>
                      </div>
                      <Badge className="text-xs" style={{ background: cfg.dot + "18", color: cfg.dot }}>
                        {cfg.label}
                      </Badge>
                      <Button onClick={() => handleDelete(ev.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-8 w-8 p-0 flex-shrink-0">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">Nuevo Evento</DialogTitle>
          </DialogHeader>
          <EventForm
            form={form}
            setForm={setForm}
            myTeams={myTeams}
            facilities={facilities}
            onSave={handleCreate}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComunicarTab({ myTeams }) {
  const [form, setForm] = useState({ team_id: myTeams[0]?.id || "", subject: "", message: "" });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.subject.trim() || !form.message.trim() || !form.team_id) {
      setStatus({ type: "error", msg: "Completa todos los campos." });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      await ax.post("/communications/send", {
        list_id: null,
        recipient_emails: "",
        subject: form.subject,
        message: form.message,
        team_id: form.team_id,
      });
      setStatus({ type: "ok", msg: "Mensaje enviado correctamente." });
      setForm(f => ({ ...f, subject: "", message: "" }));
    } catch (e) {
      setStatus({ type: "error", msg: e.response?.data?.detail || "Error al enviar el mensaje." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h3 className="font-heading font-bold text-[#00296B] text-lg mb-5">Comunicar con el Equipo</h3>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        <div>
          <Label className="text-sm">Equipo destinatario *</Label>
          <div className="mt-1 flex flex-col gap-1">
            {myTeams.map(t => (
              <label key={t.id} className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg cursor-pointer hover:bg-[#F4F7FB]">
                <input
                  type="radio"
                  name="comm-team"
                  value={t.id}
                  checked={form.team_id === t.id}
                  onChange={() => set("team_id", t.id)}
                />
                <span className="text-sm font-medium">{t.name}</span>
                {t.category && <span className="text-xs text-[#94A3B8]">({t.category})</span>}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm">Asunto *</Label>
          <Input value={form.subject} onChange={e => set("subject", e.target.value)} className="mt-1" placeholder="Asunto del mensaje" />
        </div>

        <div>
          <Label className="text-sm">Mensaje *</Label>
          <Textarea value={form.message} onChange={e => set("message", e.target.value)} rows={6} className="mt-1" placeholder="Escribe aquí el mensaje para los jugadores y familias..." />
        </div>

        {status && (
          <div className={`p-3 rounded-lg text-sm ${status.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {status.msg}
          </div>
        )}

        <Button onClick={handleSend} disabled={sending} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
          {sending ? "Enviando..." : "Enviar a jugadores"}
        </Button>
      </div>

      <div className="mt-5 bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-sm font-medium text-[#00296B] mb-2">Mensajes enviados</p>
        <p className="text-sm text-[#94A3B8]">Los mensajes enviados aparecerán aquí.</p>
      </div>
    </div>
  );
}

function PlantillaTab({ myTeams, players }) {
  const [search, setSearch] = useState("");
  const myTeamIds = myTeams.map(t => t.id);

  const myPlayers = players.filter(p =>
    myTeamIds.includes(p.team_id) || (p.team_ids || []).some(tid => myTeamIds.includes(tid))
  );

  const filtered = search.trim()
    ? myPlayers.filter(p =>
        `${p.name} ${p.surname || ""}`.toLowerCase().includes(search.toLowerCase())
      )
    : myPlayers;

  const teamName = (p) => {
    const tid = p.team_id || (p.team_ids || [])[0];
    return myTeams.find(t => t.id === tid)?.name || "";
  };

  const initials = (p) => {
    const n = `${p.name || ""} ${p.surname || ""}`.trim();
    return n.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="font-heading font-bold text-[#00296B] text-lg">Mi Plantilla</h3>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar jugador..."
            className="pl-8 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#94A3B8] text-sm">
          {search ? "No se encontraron jugadores con ese nombre." : "No hay jugadores en tus equipos."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#2460FF] flex-shrink-0">
                {initials(p)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0F172A] text-sm">
                  {p.name} {p.surname || ""}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {p.position && (
                    <span className="text-xs bg-[#F4F7FB] text-[#00296B] px-2 py-0.5 rounded-full">{p.position}</span>
                  )}
                  {teamName(p) && (
                    <span className="text-xs text-[#94A3B8]">{teamName(p)}</span>
                  )}
                </div>
                {(p.phone || p.email) && (
                  <p className="text-xs text-[#475569] mt-1">
                    {p.phone && <span>{p.phone}</span>}
                    {p.phone && p.email && <span className="mx-1">·</span>}
                    {p.email && <span>{p.email}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ROLE_LABEL = {
  entrenador: "Entrenador",
  auxiliar: "Auxiliar",
};

export default function CoachPortal({ user, onLogout }) {
  const [tab, setTab] = useState("calendario");
  const [myTeams, setMyTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [tr, pr, fr] = await Promise.all([
        ax.get("/teams"),
        ax.get("/players"),
        ax.get("/facilities").catch(() => ({ data: [] })),
      ]);
      const allTeams = Array.isArray(tr.data) ? tr.data : [];
      const mine = allTeams.filter(t => t.coach_ids?.includes(user.id));
      setMyTeams(mine);
      setPlayers(Array.isArray(pr.data) ? pr.data : []);
      setFacilities(Array.isArray(fr.data) ? fr.data : []);
    } catch {}
    setLoaded(true);
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <p className="text-[#475569]">Cargando...</p>
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 max-w-md text-center">
          <div className="w-14 h-14 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-[#2460FF]" />
          </div>
          <h2 className="font-heading font-bold text-[#00296B] text-lg mb-2">Sin equipos asignados</h2>
          <p className="text-sm text-[#475569] mb-5">
            No tienes equipos asignados. El administrador del club debe añadirte como entrenador a un equipo.
          </p>
          <Button onClick={onLogout} variant="outline" className="w-full">
            <LogOut size={14} className="mr-2" /> Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "calendario", label: "Mi Calendario" },
    { id: "comunicar", label: "Comunicar Equipo" },
    { id: "plantilla", label: "Mi Plantilla" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading font-bold text-[#00296B] text-lg leading-tight">
              Hola, {user.name || user.email}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className="text-xs bg-[#EEF2FF] text-[#2460FF] border-0">
                {ROLE_LABEL[user.role] || user.role}
              </Badge>
              <span className="text-xs text-[#94A3B8]">
                {myTeams.length} equipo{myTeams.length !== 1 ? "s" : ""} asignado{myTeams.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={onLogout} variant="outline" className="text-sm">
          <LogOut size={14} className="mr-2" /> Cerrar sesión
        </Button>
      </header>

      <div className="px-6 pt-5">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#00296B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#00296B]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pb-10">
          {tab === "calendario" && (
            <CalendarTab user={user} myTeams={myTeams} facilities={facilities} />
          )}
          {tab === "comunicar" && (
            <ComunicarTab myTeams={myTeams} />
          )}
          {tab === "plantilla" && (
            <PlantillaTab myTeams={myTeams} players={players} />
          )}
        </div>
      </div>
    </div>
  );
}
