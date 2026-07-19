# SUDEPORTE — Plataforma de Gestión para Clubes Deportivos
### Piloto: Racing San Gabriel A.D.C.

> Desarrollado por [SUDEPORTE](https://webs.sudeporte.com) · SaaS white-label para clubes deportivos

---

## URLs de Producción

| Sitio | URL |
|-------|-----|
| Web pública del club | https://racing-sangabriel.netlify.app |
| Panel de administración | https://admin-racing-sangabriel.netlify.app/admin |
| Backend API | https://api.sudeporte.com |

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                          INTERNET                            │
│                                                              │
│  Padres / Socios / Visitantes       Staff del club           │
│         │                                  │                 │
│         ▼                                  ▼                 │
│  ┌─────────────────────┐     ┌─────────────────────────┐    │
│  │  WEB PÚBLICA        │     │  PANEL ADMIN            │    │
│  │  Netlify (React)    │     │  Netlify (React SPA)    │    │
│  │  racing-sangabriel  │     │  admin-racing-sangabriel│    │
│  └──────────┬──────────┘     └──────────┬──────────────┘    │
│             │                           │                    │
│             └─────────────┬─────────────┘                    │
│                           │  /api/* → proxy Netlify          │
│                           ▼                                  │
│            ┌──────────────────────────┐                      │
│            │  BACKEND — VPS propio    │                      │
│            │  api.sudeporte.com       │                      │
│            │  FastAPI + Uvicorn       │                      │
│            │  Docker en /srv/sudeporte│                      │
│            └──────────────┬───────────┘                      │
│                           ▼                                  │
│            ┌──────────────────────────┐                      │
│            │  MongoDB 4.4 (Docker)    │                      │
│            │  VPS compartido multi-   │                      │
│            │  tenant — 1 BD por club  │                      │
│            └──────────────────────────┘                      │
└──────────────────────────────────────────────────────────────┘
```

**Deploy:** `git push origin main` → Netlify redespliegue automático ambas webs (~2 min).  
**Backend:** `docker cp server.py sudeporte_api:/app/server.py && docker restart sudeporte_api`

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python · FastAPI · Motor (async MongoDB) · PyJWT · bcrypt |
| Base de datos | MongoDB 4.4 Community (Docker, VPS propio) |
| Frontend | React 19 · Tailwind CSS · shadcn/ui · Radix UI · Axios |
| Hosting frontend | Netlify — 2 sites (public + admin), auto-deploy en git push |
| Hosting backend | VPS Ecommalia — Docker — api.sudeporte.com |
| Repositorio | GitHub: gescomsport/Racing_SAnGabriel |

---

## Estructura del Repositorio

```
Racing_SAnGabriel/
├── backend/
│   ├── server.py              # API completa (FastAPI, multi-tenant por club_id)
│   └── requirements.txt
├── frontend/                  # App React única (admin + web pública + formularios)
│   ├── public/
│   │   ├── _redirects         # SPA routing para Netlify
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Rutas: / /login /admin /portal /registro/:slug
│   │   ├── contexts/AuthContext.js
│   │   ├── api.js             # Axios config — /api → proxy → api.sudeporte.com
│   │   ├── pages/
│   │   │   ├── AdminPage.js       # Panel completo con role gating
│   │   │   ├── LoginPage.js
│   │   │   ├── HomePage.js        # Web pública
│   │   │   └── PublicFormPage.js  # Formularios de inscripción públicos
│   │   └── components/admin/      # Módulos del panel
│   └── netlify.toml               # Proxy /api/* → api.sudeporte.com
├── netlify.toml               # Config raíz para site admin-racing-sangabriel
├── docs/
│   ├── PLATAFORMAS_COSTES.md  # ⚠️ OBSOLETO — ver SUDEPORTE-ARQUITECTURA.md
│   ├── NUEVO_CLUB_GUIA.md     # ⚠️ OBSOLETO — ver SUDEPORTE-DEPLOY-CLUB.md
│   ├── SUDEPORTE_NEGOCIO.md   # Qué es SUDEPORTE, funcionalidades, roles
│   └── ESCALA_Y_PRECIOS.md    # Análisis de costes y proyección financiera
└── README.md                  # Este archivo — fuente de verdad del repo
```

---

## Módulos del Panel de Administración

| Módulo | Funcionalidad |
|--------|--------------|
| Deportistas | Alta/baja/edición · foto · DNI · equipo · tutores enlazados · vista lista/tarjetas |
| Formularios Online | Formularios configurables con alta automática sin revisión manual |
| Socios | Gestión de socios · cuotas · estado de pago |
| Ventas y Pagos | Asignar productos/cuotas · generar ventas · historial de cobros |
| Calendario | Eventos por equipo · colores · vista mes/semana |
| Comunicaciones | Email masivo por equipo/categoría via SMTP propio del club |
| Contabilidad | Ingresos/gastos · caja/cuenta bancaria · exportar Excel |
| Tarifas y Productos | Configurar precios · activar/desactivar · asignar a deportistas |
| Personal | Staff del club · roles · fichas |
| Galería | Fotos con secciones · hero · galería general |
| Patrocinadores | Logos · links · visibilidad |
| Informes | Exportar Excel multi-hoja · importar deportistas/socios desde Excel |
| Ajustes | Datos del club · SMTP · Stripe · Redsys · cuentas bancarias · RRSS |

---

## Acceso

| Rol | URL | Permisos |
|-----|-----|---------|
| Admin | https://admin-racing-sangabriel.netlify.app/admin | Todo |
| Entrenador | https://admin-racing-sangabriel.netlify.app/admin | Solo su equipo + comunicaciones |

---

## Variables de Entorno (VPS)

El fichero `/srv/sudeporte/.env` en el VPS contiene las credenciales reales. **Nunca subir a repos públicos.**

```
MONGO_URL=mongodb://sudeporte_user:...@sudeporte_mongo:27017/
DB_NAME=racing_sangabriel
JWT_SECRET=...
CORS_ORIGINS=https://racing-sangabriel.netlify.app,https://admin-racing-sangabriel.netlify.app
```

---

## Multi-tenant: Cómo añadir un nuevo club

Cada documento en MongoDB lleva `club_id`. El backend filtra siempre por `club_id` del JWT.

**Runbook completo:** ver `SUDEPORTE-DEPLOY-CLUB.md` en el directorio raíz del proyecto WEBS_SUDEPORTE.

---

## Decisiones de Diseño Permanentes

- **Email**: SIEMPRE SMTP propio del club. Nunca SendGrid, Resend ni terceros.
- **Stripe / Redsys keys**: almacenadas en DB settings del club, nunca en .env.
- **MongoDB**: versión 4.4 obligatoria (CPU sin soporte AVX — NO usar 5.0+).
- **Apache en VPS**: gestionado por cPanel — NO instalar Nginx, NO tocar httpd.conf.
- **Componentes React**: siempre a nivel de módulo (nunca dentro del render) para evitar bug de cursor/focus.
- **Urgencia en marketing**: nunca ficticia — solo fundada en capacidad real de onboarding.
