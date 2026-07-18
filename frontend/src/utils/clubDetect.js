/**
 * Detecta el club_id desde el subdominio:
 *   admin.[club_id].sudeporte.com  →  club_id
 * Fallback: REACT_APP_CLUB_ID env var, o 'racing_sangabriel' (Racing San Gabriel en Netlify)
 */
export function detectClubId() {
  const host = window.location.hostname;
  const match = host.match(/^admin\.([^.]+)\.sudeporte\.com$/);
  if (match) return match[1];
  return process.env.REACT_APP_CLUB_ID || 'racing_sangabriel';
}

export const CLUB_ID = detectClubId();

// URL base de la API — misma para todos los clubs
export const API_BASE = process.env.REACT_APP_BACKEND_URL
  ? `${process.env.REACT_APP_BACKEND_URL}/api`
  : 'https://api.sudeporte.com/api';
