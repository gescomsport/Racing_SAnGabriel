# SUDEPORTE — Plataforma Web para Clubes Deportivos
### Piloto: Racing San Gabriel A.D.C.

> Desarrollado por [SUDEPORTE](https://webs.sudeporte.com) · SaaS white-label para clubes deportivos

---

## URLs de Producción

| Sitio | URL | Descripción |
|-------|-----|-------------|
| Web pública del club | https://racing-sangabriel.netlify.app | Lo que ven socios, padres y visitantes |
| Panel de administración | https://admin-racing-sangabriel.netlify.app/admin | Gestión interna del club |
| Backend API | https://graceful-magic-production-c9ee.up.railway.app | Railway (FastAPI) |

---

## Arquitectura General

```
┌──────────────────────────────────────────────────────────────┐
│                        INTERNET                               │
│                                                               │
│  Padres / Socios / Visitantes                                 │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────────┐    ┌──────────────────────────┐     │
│  │  WEB PÚBLICA        │    │  PANEL ADMIN             │     │
│  │  Netlify (estática) │    │  Netlify (React SPA)     │     │
│  │  website/index.html │    │  frontend/build/         │     │
│  │                     │    │  /admin → gestión        │     │
│  └──────────┬──────────┘    └────────────┬─────────────┘     │
│             │                            │                    │
│             └──────────┬─────────────────┘                    │
│                        ▼                                      │
│            ┌───────────────────────┐                          │
│            │  BACKEND (Railway)    │                          │
│            │  FastAPI + Uvicorn    │                          │
│            │  /api/*               │                          │
│            └───────────┬───────────┘                          │
│                        ▼                                      │
│            ┌───────────────────────┐                          │
│            │  MongoDB Atlas (M0)   │                          │
│            │  Frankfurt / Free     │                          │
│            └───────────────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python · FastAPI · Motor (async MongoDB) · PyJWT · bcrypt |
| Base de datos | MongoDB Atlas M0 (Frankfurt) |
| Frontend admin | React 19 · Tailwind CSS · shadcn/ui · Radix UI · Axios |
| Web pública | HTML5 · CSS3 · JS vanilla (sin dependencias) |
| Hosting web | Netlify (2 sites: public + admin) |
| Hosting backend | Railway |
| Repositorio | GitHub: gescomsport/Racing_SAnGabriel |

---

## Estructura del Repositorio

```
Racing_SAnGabriel/
├── backend/
│   ├── server.py              # API completa (FastAPI, 4000+ líneas)
│   └── requirements.txt
├── frontend/                  # Panel admin (React)
│   ├── public/
│   │   ├── _redirects         # SPA routing para Netlify
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Rutas: / /login /admin
│   │   ├── contexts/AuthContext.js
│   │   ├── pages/
│   │   │   ├── AdminPage.js   # Panel completo con role gating
│   │   │   ├── LoginPage.js
│   │   │   └── HomePage.js
│   │   └── components/admin/  # Todos los módulos del panel
│   │       ├── CalendarManager.js
│   │       ├── ContabilidadManager.js
│   │       ├── CoachPortal.js
│   │       ├── ComunicacionesManager.js
│   │       ├── JugadoresManager.js
│   │       ├── SociosManager.js
│   │       ├── PersonalManager.js
│   │       ├── TarifasManager.js
│   │       ├── ReportsManager.js
│   │       └── SettingsManager.js
│   └── netlify.toml
├── website/                   # Web pública del club (HTML estático)
│   └── index.html             # CLUB_CONFIG + carga datos del backend
├── docs/
│   ├── PLATAFORMAS_COSTES.md  # Plataformas, límites y costes
│   ├── SUDEPORTE_NEGOCIO.md   # Documento para empleados / ventas
│   └── NUEVO_CLUB_GUIA.md     # Guía para montar un nuevo club
├── netlify.toml               # Config Netlify raíz (redirects + Node 20)
└── README.md                  # Este archivo
```

---

## Módulos del Panel de Administración

| Módulo | Funcionalidad |
|--------|--------------|
| Jugadores | Alta, baja, edición · foto · equipo · estado médico · exportar Excel |
| Socios | Gestión de socios · cuotas · estado de pago |
| Calendario | Eventos por equipo · colores · vista mes/semana · compartir imagen |
| Partidos | Resultados · próximos encuentros · categorías |
| Comunicaciones | Email masivo por equipo/categoría via SMTP propio del club |
| Contabilidad | Ingresos/gastos · caja o cuenta bancaria · vinculación a persona · exportar Excel |
| Tarifas | Configurar precios por categoría/temporada |
| Personal | Staff del club · roles · fichas |
| Galería | Fotos con secciones · hero · galería general |
| Patrocinadores | Logos · links · visibilidad |
| Informes | Exportar informe completo multi-hoja Excel |
| Ajustes | Datos del club · SMTP · Stripe · cuentas bancarias · redes sociales |
| Portal Entrenador | Vista reducida para entrenadores/auxiliares (role gating) |

---

## Acceso al Sistema

| Rol | URL de acceso | Permisos |
|-----|--------------|----------|
| Admin | https://admin-racing-sangabriel.netlify.app/admin | Todo |
| Entrenador | https://admin-racing-sangabriel.netlify.app/admin | Solo su equipo + comunicaciones |

Credenciales piloto (cambiar antes de entregar al club):
- Email: `admin@racingsangabriel.es`
- Contraseña: `Racing2025!`

---

## Variables de Entorno

### Railway (backend)
```
MONGO_URL=mongodb+srv://...@cluster.mongodb.net/
DB_NAME=racing_sangabriel
JWT_SECRET=...
CORS_ORIGINS=https://racing-sangabriel.netlify.app,https://admin-racing-sangabriel.netlify.app
```

### Netlify admin site
```
REACT_APP_BACKEND_URL=https://graceful-magic-production-c9ee.up.railway.app
```

---

## Multi-tenant: Cómo añadir un nuevo club

Cada documento en MongoDB lleva `club_id`. El backend filtra siempre por `club_id` extraído del JWT o del query param público.

Para añadir un nuevo club: ver `docs/NUEVO_CLUB_GUIA.md`

---

## Decisiones de Diseño Permanentes

- **Email**: SIEMPRE SMTP propio del club. Nunca SendGrid, Resend ni terceros.
- **Stripe keys**: almacenadas en DB settings, nunca en .env.
- **Dominio + hosting**: facturado aparte, no incluido en el precio del plan.
- **Componentes React**: siempre a nivel de módulo (nunca dentro del render) para evitar el bug de cursor/focus.
