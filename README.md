# Racing San Gabriel A.D.C. - Web del Club

> **Plantilla web para clubes deportivos** - Desarrollada como ejemplo para [webs.sudeporte.com](https://webs.sudeporte.com/home)
> Concepto: "Monta la web una vez, publica en redes y la web se actualiza sola"

![Club Badge](https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg)

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO / CLUB                        │
│                                                          │
│   Publica en Instagram ──→ Make.com ──→ Webhook ──┐     │
│   Publica en Facebook  ──→ Make.com ──→ Webhook ──┤     │
│                                                    │     │
│                                                    ▼     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              BACKEND (FastAPI)                     │   │
│  │  Puerto: 8001  │  Prefijo: /api                   │   │
│  │                                                    │   │
│  │  /api/webhook/social-post  ← Recibe posts auto    │   │
│  │  /api/social-posts         → Devuelve últimos 4   │   │
│  │  /api/auth/*               → Login admin JWT      │   │
│  │  /api/teams                → 14 equipos reales    │   │
│  │  /api/matches              → Calendario partidos  │   │
│  │  /api/gallery              → Galería fotos        │   │
│  │  /api/contact              → Formulario contacto  │   │
│  │  /api/settings             → Config del club      │   │
│  │  /api/news                 → Noticias (legacy)    │   │
│  └──────────┬───────────────────────────────────────┘   │
│             │                                            │
│             ▼                                            │
│  ┌──────────────────┐                                   │
│  │  MongoDB          │                                   │
│  │  DB: test_database│                                   │
│  │                   │                                   │
│  │  Colecciones:     │                                   │
│  │  - users          │                                   │
│  │  - social_posts   │  ← Posts de redes (webhook)      │
│  │  - teams          │                                   │
│  │  - matches        │                                   │
│  │  - gallery        │                                   │
│  │  - contacts       │                                   │
│  │  - settings       │                                   │
│  │  - news           │                                   │
│  └──────────────────┘                                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              FRONTEND (React)                      │   │
│  │  Puerto: 3000  │  Tailwind + Shadcn UI            │   │
│  │                                                    │   │
│  │  /           → Página pública (todas las secciones)│  │
│  │  /login      → Login admin                         │   │
│  │  /admin      → Panel de administración             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | FastAPI + Uvicorn | 0.110.1 |
| Base de datos | MongoDB (Motor async) | 3.3.1 |
| Frontend | React | 19.0.0 |
| UI Components | Shadcn/UI + Radix | Latest |
| Estilos | Tailwind CSS | 3.4.17 |
| Auth | JWT (PyJWT) + bcrypt | httpOnly cookies |
| Automatización | Make.com / n8n | Webhook |
| Fonts | Outfit (headings) + Manrope (body) | Google Fonts |
| Icons | Lucide React | 0.507.0 |

---

## Estructura de Archivos

```
/app
├── backend/
│   ├── server.py                    # API completa (520+ líneas)
│   ├── .env                         # Variables de entorno
│   └── requirements.txt             # Dependencias Python
│
├── frontend/
│   ├── .env                         # REACT_APP_BACKEND_URL
│   ├── package.json                 # Dependencias Node
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.js                   # Rutas: /, /login, /admin
│       ├── App.css                  # Estilos custom (glass, bento, etc.)
│       ├── index.css                # Tailwind + CSS variables
│       ├── index.js                 # Entry point
│       │
│       ├── contexts/
│       │   └── AuthContext.js       # JWT auth con cookies
│       │
│       ├── pages/
│       │   ├── HomePage.js          # Página pública
│       │   ├── LoginPage.js         # Login admin
│       │   └── AdminPage.js         # Panel admin completo
│       │
│       ├── components/
│       │   ├── Header.js            # Nav sticky + glassmorphism
│       │   ├── HeroSection.js       # Bento grid + escudo
│       │   ├── SocialPostsSection.js # ★ 4 posts IG + 4 FB automáticos
│       │   ├── SocialFeedSection.js  # Facebook Page Plugin embed
│       │   ├── SocialMediaManager.js # ★ Config Make.com en admin
│       │   ├── TeamSection.js       # 14 equipos reales
│       │   ├── MatchCalendar.js     # Tabla de partidos
│       │   ├── GallerySection.js    # Galería con lightbox
│       │   ├── ContactSection.js    # Formulario + datos reales
│       │   ├── NewsSection.js       # (Legacy, no se usa en HomePage)
│       │   └── Footer.js            # Footer con datos del club
│       │
│       ├── components/ui/           # Shadcn UI (40+ componentes)
│       ├── hooks/
│       └── lib/
│
├── docs/
│   ├── GUIA_MAKE_PASO_A_PASO.md    # ★ Guía completa Make.com
│   └── AUTOMATIZACION_REDES_SOCIALES.md # Doc técnica webhook
│
└── memory/
    ├── PRD.md                       # Product Requirements
    └── test_credentials.md          # Credenciales admin
```

---

## Variables de Entorno

### Backend (`/app/backend/.env`)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
JWT_SECRET="a9f8c7e6d5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8"
ADMIN_EMAIL="admin@racingsangabriel.es"
ADMIN_PASSWORD="Racing2025!"
WEBHOOK_API_KEY="rsg-webhook-2025-secret"
```

### Frontend (`/app/frontend/.env`)
```
REACT_APP_BACKEND_URL=https://TU-DOMINIO
WDS_SOCKET_PORT=443
```

---

## API Endpoints

### Públicos (sin auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/social-posts?source=instagram&limit=4` | Últimos 4 posts de Instagram |
| GET | `/api/social-posts?source=facebook&limit=4` | Últimos 4 posts de Facebook |
| GET | `/api/teams` | 14 equipos del club |
| GET | `/api/matches` | Calendario de partidos |
| GET | `/api/gallery` | Galería de fotos |
| GET | `/api/settings` | Datos del club |
| GET | `/api/news` | Noticias (legacy) |
| POST | `/api/contact` | Enviar formulario contacto |
| POST | `/api/webhook/social-post` | ★ Recibir post desde Make/n8n |

### Protegidos (requieren JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/auth/me` | Verificar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST/PUT/DELETE | `/api/teams/*` | CRUD equipos |
| POST/PUT/DELETE | `/api/matches/*` | CRUD partidos |
| POST/DELETE | `/api/gallery/*` | CRUD galería |
| POST/PUT/DELETE | `/api/news/*` | CRUD noticias |
| GET/DELETE | `/api/contact/*` | Gestionar mensajes |
| PUT | `/api/settings` | Actualizar config club |

### Webhook (seguridad por API key)
```bash
curl -X POST https://TU-DOMINIO/api/webhook/social-post \
  -H "Content-Type: application/json" \
  -d '{
    "source": "instagram",
    "content": "Texto del post",
    "image_url": "https://...",
    "post_url": "https://instagram.com/p/...",
    "author": "@racingsangabrieladc",
    "timestamp": "2025-04-15T12:00:00Z",
    "api_key": "rsg-webhook-2025-secret"
  }'
```

---

## Credenciales

| Servicio | Usuario | Contraseña |
|----------|---------|------------|
| Admin Panel | admin@racingsangabriel.es | Racing2025! |
| Webhook API Key | - | rsg-webhook-2025-secret |

---

## Datos Reales del Club

| Campo | Valor |
|-------|-------|
| Nombre | Racing San Gabriel A.D.C. |
| Dirección | Carrer Racing San Gabriel, 39, 03008 Alacant, Alicante |
| Teléfono | +34 617 50 27 80 |
| Email | racingsangabrieladc@hotmail.com |
| Horario | Lunes a Sábado 9:00-21:00, Domingo cerrado |
| Instagram | @racingsangabrieladc |
| Facebook | RacingSanGabrielADC |
| Valoración Google | 4.2/5 (46 reseñas) |

### 14 Categorías de Fútbol
| Categoría | Equipos |
|-----------|---------|
| Alevín | A, B |
| Benjamín | A, B |
| Cadete | 1 |
| Escuela Iniciación | 1 |
| Fútbol Femenino | 4 |
| Fútbol Sala Senior | 1 |
| Infantil | A, B |
| Juvenil | A, B |
| Prebenjamín | 1 |
| Senior | 1 |

### 4 Instalaciones
- La Cigüeña Campo Fútbol
- Sala Multiactividad (Zumba, Fitness, Pilates)
- Sede Club Socios
- Campo Fútbol Sala

---

## Flujo de Automatización (Make.com)

```
Instagram Post → Make.com (Watch Media, cada 15 min)
                      ↓
               HTTP POST → /api/webhook/social-post
                      ↓
               MongoDB (social_posts collection)
                      ↓
               Web muestra últimos 4 posts automáticamente

Facebook Post → Make.com (Watch Posts, cada 15 min)
                      ↓
               HTTP POST → /api/webhook/social-post
                      ↓
               (mismo flujo)
```

**Coste: 0€** (Make.com free tier = 1.000 ops/mes)

---

## Cómo Replicar para Otro Club (30 minutos)

1. **Clonar el repo**
2. **Cambiar en `.env`**: ADMIN_EMAIL, ADMIN_PASSWORD, WEBHOOK_API_KEY
3. **Cambiar en Admin > Ajustes**: nombre, logo, colores, dirección, teléfono, email, redes sociales
4. **En Make.com**: crear 2 nuevos escenarios conectando las cuentas del nuevo club
5. **Desplegar** en nuevo dominio

---

## Colores del Diseño

```css
--primary: #00296B       /* Azul oscuro (principal) */
--primary-hover: #001D4A /* Azul más oscuro (hover) */
--secondary: #2460FF     /* Azul brillante (acentos) */
--background: #FFFFFF    /* Fondo blanco */
--background-alt: #F4F7FB /* Fondo gris suave */
--text-main: #0F172A     /* Texto principal */
--text-muted: #475569    /* Texto secundario */
--border: #E2E8F0        /* Bordes */
```

---

## Testing

- Backend: **100% (72/72 tests)**
- Frontend: **95%**
- Integración: **100%**

---

## Licencia

Desarrollado por [sudeporte.com](https://webs.sudeporte.com/home) como plantilla para webs de clubes deportivos.
