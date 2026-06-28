# SUDEPORTE — Arquitectura Multi-Tenant

## Visión general

Una sola infraestructura compartida sirve a todos los clubes. Cada club es un tenant identificado por su `club_id`.

```
                    ┌─────────────────────────────────┐
                    │  MongoDB Atlas (compartido)       │
                    │  club_id: "racing_sangabriel"    │
                    │  club_id: "ud_almoradi"          │
                    │  club_id: "cd_benidorm"   ...    │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  Railway — FastAPI backend        │
                    │  (1 instancia para todos)         │
                    │  github.com/gescomsport/...       │
                    └──────────────┬──────────────────┘
                          ┌────────┴────────┐
               ┌──────────▼──┐         ┌───▼─────────────┐
               │  Netlify A  │         │  Netlify B  ...  │
               │  racing-    │         │  udalmor...      │
               │  sangabriel │         │  adi.netlify.app │
               │  .netlify   │         │                  │
               │  .app       │         │  club_id en      │
               │             │         │  CLUB_CONFIG.js  │
               └─────────────┘         └──────────────────┘
```

---

## Principio de aislamiento

**Todos los documentos en MongoDB llevan `club_id`.**  
El backend filtra siempre por `club_id` extraído del JWT del usuario autenticado.

```json
// Ejemplo — colección "players"
{
  "id": "abc123",
  "club_id": "racing_sangabriel",
  "name": "Marcos",
  "surname": "García",
  ...
}
```

Las APIs públicas (GET /news, GET /sponsors, etc.) reciben `?club_id=racing_sangabriel` como parámetro query.

---

## JWT Token

El token incluye `club_id`:
```json
{
  "sub": "user_object_id",
  "email": "admin@racingsangabriel.es",
  "club_id": "racing_sangabriel",
  "type": "access",
  "exp": ...
}
```

---

## Coste de infraestructura (fijo para N clubes)

| Servicio | Plan | Coste/mes | Límite práctico |
|---|---|---|---|
| MongoDB Atlas | M10 | ~$57 | ~500 clubes, 10GB |
| Railway | Starter | ~$5 | Depende de uso |
| Netlify | Pro | $19 | Ilimitado de sites |
| **Total** | | **~$81/mes** | Sin límite por club |

> Con el plan gratuito de Railway + Atlas M0 aguantas hasta ~5 clubes piloto. Migra a pago cuando factures suficiente para cubrirlo.

---

## Alta de un nuevo club (proceso completo)

### Paso 1 — Crear el club en MongoDB

Insertar en la colección `clubs`:
```json
{
  "club_id": "nombre_unico_sin_espacios",
  "name": "Nombre Oficial del Club",
  "slug": "nombre-url",
  "colors": { "primary": "#001F5B", "secondary": "#E8C040" },
  "logo_url": "https://...",
  "city": "Alicante",
  "sport": "football",
  "domain": "suclub.es",
  "active": true,
  "plan": "basico",
  "created_at": "2026-01-01"
}
```

### Paso 2 — Crear usuario admin del club

```bash
# Desde el panel de superadmin (futuro) o mediante script:
POST /api/admin/clubs/create-user
{
  "club_id": "nombre_unico",
  "email": "admin@suclub.es",
  "password": "PasswordSeguro2026!",
  "name": "Nombre Admin",
  "role": "admin"
}
```

### Paso 3 — Duplicar el HTML público

```bash
# En el repo:
cp racing-sangabriel-v3.html suclub-v1.html
# Editar CLUB_CONFIG al inicio del archivo:
# - name, shortName, city, colors, logo, phone, email
# - clubId: "nombre_unico"
# - apiUrl: 'https://graceful-magic-production-c9ee.up.railway.app'
```

### Paso 4 — Desplegar en Netlify

1. Subir el HTML al repo GitHub (o crear nuevo repo)
2. En Netlify: New site → Import from GitHub → seleccionar el HTML
3. Build: ninguno (static HTML)
4. Publish directory: `.` (raíz)
5. Dominio: conectar `suclub.es` en Netlify DNS settings

### Paso 5 — Verificar

```bash
curl "https://graceful-magic-production-c9ee.up.railway.app/api/news?club_id=nombre_unico"
# → [] (vacío, correcto — aún sin datos)
```

El club ya puede acceder a su admin en:
`https://graceful-magic-production-c9ee.up.railway.app/admin`  
(o con dominio propio: `https://admin.suclub.es`)

---

## Convenciones de club_id

- Solo letras minúsculas, números y guiones bajos
- Sin espacios, tildes, ni caracteres especiales
- Ejemplos: `racing_sangabriel`, `ud_almoradi`, `cd_benidorm`, `cf_elda_2006`

---

## MongoDB: colecciones con campo club_id

Todas las colecciones llevan `club_id` excepto `clubs` (es el directorio maestro).

| Colección | Descripción |
|---|---|
| `clubs` | Directorio maestro de todos los clubs |
| `users` | Usuarios admin (uno o más por club) |
| `players` | Deportistas |
| `guardians` | Tutores / padres |
| `members` | Socios |
| `teams` | Equipos |
| `matches` | Partidos |
| `calendar_events` | Eventos de calendario |
| `calendar_templates` | Plantillas de horario |
| `schedule_events` | Sesiones de entrenamiento generadas |
| `schedule_templates` | Horarios de entrenamiento |
| `news` | Noticias |
| `gallery` | Galería de imágenes |
| `sponsors` | Patrocinadores |
| `products` | Productos (equipaciones, etc.) |
| `fees` | Tarifas |
| `sales` | Ventas y cobros |
| `members` | Socios |
| `contacts` | Mensajes de contacto web |
| `facilities` | Instalaciones / campos |
| `sepa_mandates` | Mandatos SEPA |
| `communications` | Comunicaciones enviadas |
| `gdpr_records` | Registros RGPD |
| `gdpr_config` | Configuración RGPD |
| `settings` | Configuración del club |
| `social_posts` | Posts de redes sociales |

---

## Script de migración inicial

Al desplegar multi-tenant en producción por primera vez, ejecutar:

```bash
cd backend
python3 migrate_add_club_id.py
```

Esto añade `club_id: "racing_sangabriel"` a todos los documentos existentes sin ese campo.

---

## Variables de entorno necesarias (Railway)

```env
MONGO_URL=mongodb+srv://user:pass@cluster0.d9zbt7l.mongodb.net/sudeporte
DB_NAME=sudeporte
JWT_SECRET=tu_secret_muy_largo_y_aleatorio
```

---

## Escalado futuro

Cuando llegues a >500 clubes o >10GB en Atlas:
- Upgrade a Atlas M20 (~$190/mes) → 20GB, mayor IOPS
- O migrar a sharding por `club_id` (arquitectura avanzada, cuando sea necesario)

---

## Checklist al lanzar un nuevo club

- [ ] Documento creado en colección `clubs`
- [ ] Usuario admin creado con `club_id` correcto
- [ ] HTML público personalizado con CLUB_CONFIG
- [ ] HTML desplegado en Netlify
- [ ] Dominio propio conectado en Netlify
- [ ] Test de login en admin
- [ ] Test de API pública: `/api/news?club_id=xxx`
- [ ] Datos iniciales introducidos (logo, colores, equipo principal)
