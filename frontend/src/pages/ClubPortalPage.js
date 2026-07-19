import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CLUB_ID, API_BASE } from "../utils/clubDetect";

const TIPO_LABELS = {
  inscripcion: "Inscripción",
  alta_socio: "Alta de Socio",
  evento: "Actividad / Evento",
};

const TIPO_ICONS = {
  inscripcion: "⚽",
  alta_socio: "🏅",
  evento: "🏕️",
};

export default function ClubPortalPage() {
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/public/${CLUB_ID}/portal`)
      .then(r => {
        setPortal(r.data);
        const root = document.documentElement;
        root.style.setProperty("--cp-primary", r.data.primary_color || "#2460FF");
        root.style.setProperty("--cp-secondary", r.data.secondary_color || "#00296B");
        document.title = r.data.club_name || "Club Deportivo";
      })
      .catch(() => setPortal(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cp-loading">
        <div className="cp-spinner" />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="cp-empty">
        <p>Portal no disponible.</p>
      </div>
    );
  }

  const activeForms = (portal.formularios || []).filter(f => f.activo !== false);

  return (
    <div className="cp-page">
      {/* Hero */}
      <div className="cp-hero">
        <div className="cp-hero-inner">
          {portal.escudo_url || portal.logo_url ? (
            <img src={portal.escudo_url || portal.logo_url} alt={portal.club_name} className="cp-escudo" />
          ) : (
            <div className="cp-escudo-placeholder">⚽</div>
          )}
          <h1 className="cp-club-name">{portal.club_name}</h1>
          {portal.descripcion && <p className="cp-club-desc">{portal.descripcion}</p>}
        </div>
      </div>

      {/* Forms */}
      <div className="cp-content">
        {activeForms.length === 0 ? (
          <div className="cp-no-forms">
            <p>No hay formularios activos en este momento.</p>
          </div>
        ) : (
          <>
            <h2 className="cp-section-title">Inscripciones y actividades</h2>
            <div className="cp-forms-grid">
              {activeForms.map(f => {
                const isFull = f.completo && !f.lista_espera;
                const isWaiting = f.completo && f.lista_espera;
                return (
                  <Link
                    key={f.id}
                    to={isFull ? "#" : `/registro/${f.slug}`}
                    className={`cp-form-card${isFull ? " cp-full" : ""}`}
                    onClick={isFull ? (e) => e.preventDefault() : undefined}
                  >
                    <div className="cp-form-icon">{TIPO_ICONS[f.tipo] || "📋"}</div>
                    <div className="cp-form-body">
                      <div className="cp-form-tipo">{TIPO_LABELS[f.tipo] || f.tipo}</div>
                      <div className="cp-form-nombre">{f.nombre}</div>
                      {f.descripcion && <div className="cp-form-desc">{f.descripcion}</div>}

                      {f.max_plazas && (
                        <div className="cp-plazas">
                          {isFull ? (
                            <span className="cp-badge-full">Sin plazas</span>
                          ) : isWaiting ? (
                            <span className="cp-badge-wait">Lista de espera</span>
                          ) : (
                            <span className="cp-badge-free">{f.plazas_libres} plaza{f.plazas_libres !== 1 ? "s" : ""} disponible{f.plazas_libres !== 1 ? "s" : ""}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="cp-form-arrow">
                      {isFull ? "🔒" : "→"}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="cp-footer">
        Powered by <strong>SUDEPORTE</strong>
      </div>

      <style>{`
        :root { --cp-primary: #2460FF; --cp-secondary: #00296B; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4F6FB; }
        .cp-page { min-height: 100vh; display: flex; flex-direction: column; }
        .cp-hero { background: var(--cp-secondary); color: #fff; padding: 48px 16px 40px; text-align: center; }
        .cp-hero-inner { max-width: 480px; margin: 0 auto; }
        .cp-escudo { width: 96px; height: 96px; object-fit: contain; border-radius: 12px; margin-bottom: 16px; }
        .cp-escudo-placeholder { font-size: 64px; margin-bottom: 8px; }
        .cp-club-name { font-size: 28px; font-weight: 800; margin: 0 0 8px; }
        .cp-club-desc { font-size: 15px; opacity: 0.8; margin: 0; }
        .cp-content { max-width: 640px; width: 100%; margin: 0 auto; padding: 32px 16px; flex: 1; }
        .cp-section-title { font-size: 14px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px; }
        .cp-forms-grid { display: flex; flex-direction: column; gap: 12px; }
        .cp-form-card { display: flex; align-items: center; gap: 16px; background: #fff; border-radius: 14px; padding: 18px 20px; border: 2px solid #E2E8F0; text-decoration: none; color: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
        .cp-form-card:hover:not(.cp-full) { border-color: var(--cp-primary); box-shadow: 0 4px 16px rgba(36,96,255,0.1); }
        .cp-form-card.cp-full { opacity: 0.6; cursor: default; }
        .cp-form-icon { font-size: 28px; flex-shrink: 0; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #F4F6FB; border-radius: 10px; }
        .cp-form-body { flex: 1; min-width: 0; }
        .cp-form-tipo { font-size: 11px; font-weight: 700; color: var(--cp-primary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .cp-form-nombre { font-size: 16px; font-weight: 700; color: #0F172A; }
        .cp-form-desc { font-size: 13px; color: #64748B; margin-top: 3px; }
        .cp-plazas { margin-top: 6px; }
        .cp-badge-full { font-size: 11px; font-weight: 700; background: #FEE2E2; color: #B91C1C; padding: 2px 8px; border-radius: 20px; }
        .cp-badge-wait { font-size: 11px; font-weight: 700; background: #FEF9C3; color: #854D0E; padding: 2px 8px; border-radius: 20px; }
        .cp-badge-free { font-size: 11px; font-weight: 700; background: #DCFCE7; color: #166534; padding: 2px 8px; border-radius: 20px; }
        .cp-form-arrow { font-size: 18px; color: var(--cp-primary); flex-shrink: 0; font-weight: 700; }
        .cp-no-forms { text-align: center; color: #94A3B8; padding: 40px 0; font-size: 15px; }
        .cp-footer { text-align: center; font-size: 12px; color: #AAB; padding: 16px; }
        .cp-loading { display: flex; align-items: center; justify-content: center; height: 100vh; }
        .cp-spinner { width: 32px; height: 32px; border: 3px solid #DDE3F0; border-top-color: var(--cp-primary, #2460FF); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .cp-empty { display: flex; align-items: center; justify-content: center; height: 100vh; color: #64748B; }
      `}</style>
    </div>
  );
}
