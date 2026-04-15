import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarDays, MapPin, Clock, Trophy } from "lucide-react";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusLabels = {
  upcoming: { text: "Proximo", color: "bg-blue-50 text-[#2460FF]" },
  played: { text: "Jugado", color: "bg-green-50 text-green-700" },
  cancelled: { text: "Cancelado", color: "bg-red-50 text-red-700" },
};

export default function MatchCalendar() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    axios.get(`${API}/matches`).then(r => setMatches(r.data)).catch(() => {});
  }, []);

  if (matches.length === 0) return null;

  return (
    <section id="calendario" className="py-16 lg:py-24 bg-[#F4F7FB]" data-testid="calendar-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Calendario</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-8">
          Proximos partidos y resultados
        </h2>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-[#00296B] text-white text-xs font-heading font-bold uppercase tracking-wider">
            <div className="col-span-2">Fecha</div>
            <div className="col-span-4">Partido</div>
            <div className="col-span-2">Ubicacion</div>
            <div className="col-span-1">Categoria</div>
            <div className="col-span-2">Resultado</div>
            <div className="col-span-1">Estado</div>
          </div>

          {matches.map((match, i) => {
            const status = statusLabels[match.status] || statusLabels.upcoming;
            const dateStr = match.date ? new Date(match.date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "";
            return (
              <div
                key={match.id}
                className={`match-row grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-[#E2E8F0] last:border-0 ${i % 2 === 0 ? "" : "bg-[#FAFBFD]"}`}
                data-testid={`match-row-${i}`}
              >
                <div className="md:col-span-2 flex items-center gap-2 text-sm">
                  <CalendarDays size={14} className="text-[#475569] shrink-0 md:hidden" />
                  <span className="font-medium text-[#00296B]">{dateStr}</span>
                  <span className="text-[#475569]">{match.time}</span>
                </div>
                <div className="md:col-span-4 flex items-center gap-2 text-sm">
                  <Trophy size={14} className="text-[#2460FF] shrink-0 md:hidden" />
                  <span className="font-medium text-[#0F172A]">{match.home_team}</span>
                  <span className="text-[#475569]">vs</span>
                  <span className="font-medium text-[#0F172A]">{match.away_team}</span>
                </div>
                <div className="md:col-span-2 flex items-center gap-1 text-sm text-[#475569]">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{match.location}</span>
                </div>
                <div className="md:col-span-1 text-sm text-[#475569]">{match.category}</div>
                <div className="md:col-span-2 text-sm font-heading font-bold text-[#00296B]">
                  {match.result || "-"}
                </div>
                <div className="md:col-span-1">
                  <Badge className={`text-xs ${status.color}`}>{status.text}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
