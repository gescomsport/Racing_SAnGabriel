import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { CLUB_ID, API_BASE } from '../utils/clubDetect';

const ClubContext = createContext(null);

const DEFAULTS = {
  club_id: CLUB_ID,
  club_name: 'Panel de Gestión',
  primary_color: '#2460FF',
  secondary_color: '#00296B',
  logo_url: '',
  escudo_url: '',
  sport: '',
  ciudad: '',
};

export function ClubProvider({ children }) {
  const [clubSettings, setClubSettings] = useState(DEFAULTS);
  const [loadingClub, setLoadingClub] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/public/${CLUB_ID}/settings`)
      .then(({ data }) => {
        const merged = { ...DEFAULTS, ...data };
        setClubSettings(merged);
        // Aplicar colores de marca como CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--club-primary', merged.primary_color);
        root.style.setProperty('--club-secondary', merged.secondary_color);
        // Título de la pestaña
        if (merged.club_name) {
          document.title = `${merged.club_name} — Panel`;
        }
      })
      .catch(() => {
        // Sin red o club no encontrado — usar defaults sin romper la app
      })
      .finally(() => setLoadingClub(false));
  }, []);

  return (
    <ClubContext.Provider value={{ clubSettings, clubId: CLUB_ID, loadingClub }}>
      {children}
    </ClubContext.Provider>
  );
}

export const useClub = () => useContext(ClubContext);
