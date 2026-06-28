import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, MapPin, Clock, Trophy, Dumbbell, Star, Music, Users } from "lucide-react";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const matchStatusLabels = {
  upcoming:  { text: "Próximo",    color: "bg-blue-50 text-[#2460FF]" },
  played:    { text: "Jugado",     color: "bg-green-50 text-green-700" },
  cancelled: { text: "Cancelado",  color: "bg-red-50 text-red-700" },
};

const EVENT_META = {
  entrenamiento: { label: "Entrenamiento", icon: Dumbbell,    dot: "#2460FF",  bg: "bg-blue-50 text-blue-700" },
  partido:       { label: "Partido",       icon: Trophy,      dot: "#16a34a",  bg: "bg-green-50 text-green-700" },
  convocatoria:  { label: "Convocatoria",  icon: Star,        dot: "#d97706",  bg: "bg-amber-50 text-amber-700" },
  clase:         { label: "Clase",         icon: Music,       dot: "#9333ea",  bg: "bg-purple-50 text-purple-700" },
  evento:        { label: "Evento",        icon: CalendarDays, dot: "#e11d48", bg: "bg-rose-50 text-rose-700" },
};

function formatDateEs(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", weekday: "short" });
}

export default function MatchCalendar() {
  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState("todos");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in60d = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      axios.get(`${API}/matches`).catch(() => ({ data: [] })),
      axios.get(`${API}/schedule/events/public?date_from=${today}&date_to=${in60d}`).catch(() => ({ data: [] })),
      axios.get(`${API}/teams`).catch(() => ({ data: [] })),
    ]).then(([m, e, t]) => {
      setMatches(m.data);
      setEvents(e.data);
      setTeams(t.data);
    });
  }, []);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  const upcomingMatches = matches.filter(m => m.status === "upcoming" || !m.status);
  const recentMatches   = matches.filter(m => m.status === "played").slice(0, 5);

  const filtered = activeTab === "partidos"
    ? events.filter(e => e.type === "partido")
    : activeTab === "entrenamientos"
    ? events.filter(e => e.type === "entrenamiento")
    : events;

  if (matches.length === 0 && events.length === 0) return null;

  return (
    <section id="calendario" className="py-16 lg:py-24 bg-[#F4F7FB]" data-testid="calendar-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Calendario</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-2">
          Agenda del Club
        </h2>
        <p className="text-[#475569] mb-8 text-sm">Próximos 60 días — entrenamientos, partidos y eventos</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: "todos",          label: "Todo" },
            { id: "partidos",       label: "Partidos" },
            { id: "entrenamientos", label: "Entrenamientos" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeTab === tab.id ? "bg-[#00296B] text-white border-[#00296B]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Events list */}
          <div className="lg:col-span-2">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[#94A3B8]">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin eventos programados para los próximos 60 días</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(ev => {
                  const meta = EVENT_META[ev.type] || EVENT_META.evento;
                  const Icon = meta.icon;
                  const team = teamMap[ev.team_id];
                  return (
                    <div key={ev.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.dot + "18" }}>
                        <Icon size={18} style={{ color: meta.dot }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#0F172A] text-sm">{ev.title || meta.label}</p>
                          <Badge className={`text-xs ${meta.bg}`}>{meta.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#475569] flex-wrap">
                          <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDateEs(ev.date)}</span>
                          {ev.time && <span className="flex items-center gap-1"><Clock size={11} />{ev.time.slice(0,5)}</span>}
                          {team && <span className="flex items-center gap-1"><Users size={11} />{team.name}</span>}
                          {ev.notes && <span className="text-[#94A3B8] truncate max-w-40">{ev.notes}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-xs font-bold text-[#00296B]">{new Date(ev.date + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</p>
                        {ev.time && <p className="text-xs text-[#94A3B8]">{ev.time.slice(0,5)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar: upcoming matches + results */}
          <div className="space-y-4">
            {upcomingMatches.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="bg-[#00296B] px-4 py-3">
                  <p className="font-heading font-bold text-white text-sm flex items-center gap-2"><Trophy size={14} />Próximos partidos</p>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {upcomingMatches.slice(0, 5).map(m => (
                    <div key={m.id} className="px-4 py-3">
                      <p className="text-xs text-[#94A3B8] mb-1">{formatDateEs(m.date)}{m.time ? ` · ${m.time}` : ""}</p>
                      <p className="font-medium text-[#0F172A] text-sm">{m.home_team} <span className="text-[#94A3B8] font-normal">vs</span> {m.away_team}</p>
                      {m.location && <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-0.5"><MapPin size={10} />{m.location}</p>}
                      {m.category && <p className="text-xs text-[#2460FF] mt-0.5">{m.category}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentMatches.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="bg-[#F4F7FB] border-b border-[#E2E8F0] px-4 py-3">
                  <p className="font-heading font-bold text-[#00296B] text-sm">Últimos resultados</p>
                </div>
                <div className="divide-y divide-[#F1F5F9]">
                  {recentMatches.map(m => (
                    <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-[#94A3B8]">{formatDateEs(m.date)}</p>
                        <p className="text-sm text-[#0F172A] truncate">{m.home_team} vs {m.away_team}</p>
                      </div>
                      {m.result && (
                        <span className="font-heading font-bold text-[#00296B] text-sm flex-shrink-0">{m.result}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
