# Resumen Visual - Racing San Gabriel A.D.C.

## Páginas de la Web

### 1. PÁGINA PÚBLICA (/)
```
┌─────────────────────────────────────────────┐
│ [Logo] Racing San Gabriel A.D.C.  Nav  [IG][FB] │  ← Header sticky
├─────────────────────────────────────────────┤
│                                             │
│  CLUB DEPORTIVO         ┌──────────────┐   │
│  Racing                 │  [Estadio]   │   │
│  San Gabriel            ├──────┬───────┤   │  ← Hero Bento Grid
│  A.D.C.                 │[Team]│[Social]│   │
│  [Contactar] [Noticias] │      │ IG FB │   │
│                         └──────┴───────┘   │
├─────────────────────────────────────────────┤
│  ÚLTIMAS PUBLICACIONES                      │
│  ┌─ Instagram ─────────────────────────┐   │
│  │ [Post1] [Post2] [Post3] [Post4]     │   │  ← 4 últimos posts IG
│  └─────────────────────────────────────┘   │
│  ┌─ Facebook ──────────────────────────┐   │
│  │ [Post1] [Post2] [Post3] [Post4]     │   │  ← 4 últimos posts FB
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  REDES SOCIALES                             │
│  ┌──────────────────────────────────┐      │
│  │ Facebook Page Plugin (iframe)     │      │  ← Feed Facebook live
│  │ Timeline automático               │      │
│  └──────────────────────────────────┘      │
├─────────────────────────────────────────────┤
│  EQUIPOS (14 categorías)                    │
│  [Alevin A] [Alevin B] [Benjamin A]        │
│  [Benjamin B] [Cadete] [Escuela]           │  ← Grid de equipos
│  [Femenino] [F.Sala] [Infantil A]          │
│  [Infantil B] [Juvenil A] [Juvenil B]      │
│  [Prebenjamin] [Senior]                    │
├─────────────────────────────────────────────┤
│  CALENDARIO                                 │
│  ┌─────┬──────────┬───────┬─────┬──────┐  │
│  │Fecha│ Partido  │Lugar  │Cat. │Result│  │  ← Tabla de partidos
│  ├─────┼──────────┼───────┼─────┼──────┤  │
│  │15feb│RSG vs CD │Campo  │Juv  │ 2-1  │  │
│  └─────┴──────────┴───────┴─────┴──────┘  │
├─────────────────────────────────────────────┤
│  GALERÍA                                    │
│  [Foto 1] [Foto 2] [Foto 3]               │  ← Con lightbox
├─────────────────────────────────────────────┤
│  CONTACTO                                   │
│  Dirección: Carrer Racing...  │ [Nombre]   │
│  Tel: 617 50 27 80            │ [Email]    │
│  Email: racingsangabrieladc   │ [Mensaje]  │  ← Formulario
│  Horario: L-S 9:00-21:00     │ [ENVIAR]   │
├─────────────────────────────────────────────┤
│  ██████ FOOTER (fondo azul oscuro) ████████ │
│  [Logo] Racing San Gabriel  Enlaces  Contacto│
│  sudeporte.com              IG  FB          │
└─────────────────────────────────────────────┘
```

### 2. PANEL ADMIN (/admin)
```
┌──────────┬──────────────────────────────────┐
│ Admin    │                                   │
│ Panel    │  Dashboard / Redes / Equipos...   │
│──────────│                                   │
│ Dashboard│  ┌────────────────────────────┐   │
│ ★Redes   │  │ Redes Sociales             │   │
│ Noticias │  │                            │   │
│ Equipos  │  │ Como funciona:             │   │
│ Partidos │  │ 1→Make.com  2→Publica      │   │
│ Galería  │  │ 3→Aparece en web           │   │
│ Mensajes │  │                            │   │
│ Ajustes  │  │ [Make.com] [FB] [IG] [Feed]│   │
│          │  │                            │   │
│──────────│  │ Webhook URL: https://...   │   │
│ [Logout] │  │ API Key: rsg-webhook-...   │   │
│ [Ver web]│  │                            │   │
│          │  │ Pasos 1-5 con guía         │   │
│          │  │ Plantillas JSON para copiar│   │
│          │  └────────────────────────────┘   │
└──────────┴──────────────────────────────────┘
```

### 3. FLUJO AUTOMATIZACIÓN
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  INSTAGRAM   │    │   MAKE.COM   │    │    WEB       │
│              │    │              │    │              │
│ Publicas     │───→│ Watch Media  │───→│ POST webhook │
│ desde móvil  │    │ cada 15 min  │    │              │
│              │    │              │    │ Guarda en    │
└──────────────┘    │ HTTP POST    │    │ MongoDB      │
                    │ con JSON     │    │              │
┌──────────────┐    │              │    │ Muestra      │
│  FACEBOOK    │    │              │    │ últimos 4    │
│              │───→│ Watch Posts  │───→│ posts        │
│ Publicas     │    │ cada 15 min  │    │              │
│ desde móvil  │    │              │    │ AUTOMÁTICO   │
└──────────────┘    └──────────────┘    └──────────────┘

Coste total: 0€
Mantenimiento: 0 horas/mes
```

### 4. PARA REPLICAR (otro club)
```
TIEMPO: 30 minutos

Paso 1: Clonar repo
Paso 2: .env → nuevo admin, nueva API key
Paso 3: Admin > Ajustes → nombre, logo, datos del nuevo club
Paso 4: Make.com → 2 escenarios nuevos (IG + FB del nuevo club)
Paso 5: Deploy → nuevo dominio

ESCALABLE: ∞ clubes con el mismo sistema
```

## Colecciones MongoDB

```
test_database
├── users              → Admin del club (JWT auth)
├── social_posts       → ★ Posts de redes (via webhook)
│   ├── source         → "instagram" | "facebook"
│   ├── content        → Texto del post
│   ├── image_url      → Foto del post
│   ├── post_url       → Link al post original
│   ├── author         → @usuario o nombre
│   ├── posted_at      → Fecha publicación
│   └── received_at    → Fecha recepción webhook
├── teams              → 14 equipos del club
├── matches            → Calendario partidos
├── gallery            → Galería fotos
├── contacts           → Mensajes del formulario
├── settings           → Config del club + redes sociales
└── news               → Noticias (legacy, no se usa)
```

## Tests Ejecutados

```
Backend:  72/72 PASSED ✓ (100%)
Frontend: 95% ✓
Integración: 100% ✓

Webhook probado: ✓
Auth JWT: ✓
CRUD completo: ✓
Formulario contacto: ✓
Social posts: ✓
```
