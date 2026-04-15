import { useEffect, useState } from "react";
import axios from "axios";
import { Users, User } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TeamSection() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    axios.get(`${API}/teams`).then(r => setTeams(r.data)).catch(() => {});
    axios.get(`${API}/players`).then(r => setPlayers(r.data)).catch(() => {});
  }, []);

  if (teams.length === 0) return null;

  return (
    <section id="equipos" className="py-16 lg:py-24 bg-white" data-testid="teams-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Equipos</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-8">
          Nuestras categorias
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((team, i) => {
            const teamPlayers = players.filter(p => p.team_id === team.id);
            return (
              <div
                key={team.id}
                className={`bento-card bg-white rounded-xl overflow-hidden fade-in stagger-${i % 4 + 1}`}
                data-testid={`team-card-${i}`}
              >
                {team.image_url ? (
                  <div className="h-44 overflow-hidden">
                    <img src={team.image_url} alt={team.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-44 bg-[#F4F7FB] flex items-center justify-center">
                    <Users size={48} className="text-[#00296B]/20" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-bold text-[#00296B] text-lg">{team.name}</h3>
                    <span className="text-xs font-medium bg-[#F4F7FB] text-[#00296B] px-2 py-1 rounded">{team.category}</span>
                  </div>
                  {team.coach && (
                    <p className="text-sm text-[#475569] mb-2">
                      <span className="font-medium">Entrenador:</span> {team.coach}
                    </p>
                  )}
                  {team.description && (
                    <p className="text-sm text-[#475569]">{team.description}</p>
                  )}
                  {teamPlayers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                      <p className="text-xs text-[#475569] font-medium mb-2">{teamPlayers.length} jugadores</p>
                      <div className="flex flex-wrap gap-1">
                        {teamPlayers.slice(0, 6).map(p => (
                          <span key={p.id} className="inline-flex items-center gap-1 bg-[#F4F7FB] text-xs text-[#00296B] px-2 py-1 rounded">
                            <User size={10} /> {p.name}
                          </span>
                        ))}
                        {teamPlayers.length > 6 && (
                          <span className="text-xs text-[#475569] px-2 py-1">+{teamPlayers.length - 6} mas</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
