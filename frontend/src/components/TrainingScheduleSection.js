import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, MapPin } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAYS = [
  { value: "lunes", label: "Lun" },
  { value: "martes", label: "Mar" },
  { value: "miercoles", label: "Mié" },
  { value: "jueves", label: "Jue" },
  { value: "viernes", label: "Vie" },
  { value: "sabado", label: "Sáb" },
  { value: "domingo", label: "Dom" },
];

const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export default function TrainingScheduleSection() {
  const [schedules, setSchedules] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/training-schedules`),
      axios.get(`${API}/teams`)
    ]).then(([s, t]) => {
      setSchedules(s.data);
      setTeams(t.data);
      if (t.data.length > 0) setActiveTeam(t.data[0].id);
    }).catch(() => {});
  }, []);

  if (schedules.length === 0) return null;

  const teamsWithSchedules = teams.filter(t =>
    schedules.some(s => s.team_id === t.id)
  );

  if (teamsWithSchedules.length === 0) return null;

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "";

  const activeSchedules = schedules.filter(s => s.team_id === activeTeam);

  const schedulesByDay = DAY_ORDER.reduce((acc, day) => {
    const items = activeSchedules.filter(s => s.day_of_week === day);
    if (items.length) acc[day] = items;
    return acc;
  }, {});

  const daysWithTraining = DAY_ORDER.filter(d => schedulesByDay[d]);

  return (
    <section id="horarios" className="py-16 lg:py-24 bg-[#00296B]" data-testid="training-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Clock size={20} className="text-blue-300" />
          <p className="text-sm font-medium text-blue-300 uppercase tracking-widest">Entrenamientos</p>
        </div>
        <h2 className="font-heading font-bold text-white text-2xl lg:text-3xl tracking-tight mb-2">
          Horarios de entrenamiento
        </h2>
        <p className="text-blue-200 text-sm mb-8">Consulta los horarios de cada categoría</p>

        {/* Team tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {teamsWithSchedules.map(team => (
            <button
              key={team.id}
              onClick={() => setActiveTeam(team.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                activeTeam === team.id
                  ? "bg-[#2460FF] text-white"
                  : "bg-white/10 text-blue-200 hover:bg-white/20"
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>

        {/* Weekly grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAY_ORDER.map(day => {
            const items = schedulesByDay[day] || [];
            const dayLabel = DAYS.find(d => d.value === day)?.label || day;
            const isToday = new Date().toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase() === day;

            return (
              <div
                key={day}
                className={`rounded-xl border p-4 ${
                  items.length > 0
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/10 opacity-40"
                } ${isToday ? "ring-2 ring-[#2460FF]" : ""}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className={`font-heading font-bold text-sm ${isToday ? "text-[#2460FF]" : "text-white"}`}>
                    {dayLabel}
                  </p>
                  {isToday && (
                    <span className="text-xs bg-[#2460FF] text-white px-1.5 py-0.5 rounded">Hoy</span>
                  )}
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-blue-400">Sin entreno</p>
                ) : (
                  <div className="space-y-2">
                    {items
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map(item => (
                        <div key={item.id} className="bg-white/10 rounded-lg p-2">
                          <p className="text-white text-xs font-medium">
                            {item.start_time} — {item.end_time}
                          </p>
                          {item.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin size={9} className="text-blue-300" />
                              <p className="text-blue-300 text-xs truncate">{item.location}</p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active days summary */}
        {daysWithTraining.length > 0 && (
          <p className="text-blue-300 text-xs mt-4 text-center">
            Días de entrenamiento: {daysWithTraining.map(d => DAYS.find(x => x.value === d)?.label).join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}
