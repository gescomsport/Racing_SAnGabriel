> ⚠️ **OBSOLETO — julio 2026.** Este documento describe el proceso con Railway. **Runbook actual: `SUDEPORTE-DEPLOY-CLUB.md`** (directorio raíz de WEBS_SUDEPORTE).

# Cómo crear un nuevo club en SUDEPORTE (OBSOLETO)

Tiempo estimado: **15-20 minutos** por club.

---

## Pre-requisitos (solo la primera vez)

- [ ] Cuenta en [MongoDB Atlas](https://cloud.mongodb.com) con cluster M10 activo
- [ ] Proyecto en [Railway](https://railway.app) con backend desplegado
- [ ] Cuenta en [Netlify](https://app.netlify.com)
- [ ] Repo GitHub: `gescomsport/sudeporte-backend` (el backend compartido)
- [ ] Repo GitHub: `gescomsport/sudeporte-webs` (donde van los HTMLs de cada club)

---

## Paso 1 — Decidir el club_id

El `club_id` es el identificador único e inmutable del club. Reglas:
- Solo minúsculas, números y guiones bajos
- Sin espacios, tildes ni puntos
- Ejemplos: `racing_sangabriel`, `ud_almoradi`, `cd_benidorm_2005`

---

## Paso 2 — Crear el club en MongoDB

En MongoDB Atlas → Collections → `sudeporte` → `clubs`, insertar:

```json
{
  "club_id": "CLUB_ID_AQUI",
  "name": "Nombre Oficial del Club",
  "slug": "nombre-url",
  "sport": "football",
  "city": "Ciudad",
  "province": "Provincia",
  "logo_url": "",
  "colors": {
    "primary": "#001F5B",
    "accent": "#E8C040"
  },
  "domain": "sudominio.es",
  "plan": "basico",
  "active": true,
  "created_at": "2026-XX-XX"
}
```

---

## Paso 3 — Crear usuario administrador del club

En MongoDB Atlas → Collections → `sudeporte` → `users`, insertar:

> **Importante:** el `password_hash` debe generarse con bcrypt. Usar el script:

```bash
cd Racing_SAnGabriel/backend
python3 -c "
import bcrypt
pwd = 'PasswordSeguro2026!'
h = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
print(h)
"
```

Luego insertar en `users`:
```json
{
  "id": "generar_uuid_unico",
  "email": "admin@suclub.es",
  "password_hash": "EL_HASH_GENERADO",
  "name": "Nombre Admin",
  "role": "admin",
  "club_id": "CLUB_ID_AQUI",
  "active": true,
  "created_at": "2026-XX-XX"
}
```

O usar el endpoint de superadmin (cuando esté listo):
```
POST /api/superadmin/clubs/create
Authorization: Bearer SUPERADMIN_TOKEN
{
  "club_id": "...",
  "admin_email": "admin@suclub.es",
  "admin_password": "...",
  "admin_name": "..."
}
```

---

## Paso 4 — Crear la web pública del club

### 4a. Copiar la plantilla HTML

```bash
# En el repo sudeporte-webs:
cp plantilla-club.html suclub-v1.html
```

### 4b. Editar CLUB_CONFIG (primeras ~40 líneas del JS)

Buscar `var CLUB_CONFIG = {` y rellenar:

```javascript
var CLUB_CONFIG = {
  name: 'Nombre del Club S.D.',          // Nombre completo
  nameShort: 'Nombre Corto',             // Para espacios pequeños
  subtitle: 'S.D.',                       // Tipo de entidad
  city: 'Ciudad',
  founded: 2010,                          // Año de fundación
  season: '26/27',
  sport: 'fútbol',
  colors: {
    primary: '#001F5B',                   // Azul marino (color principal)
    accent:  '#E8C040',                   // Color secundario
    blue:    '#2460FF',                   // Azul botones
    bg:      '#F4F7FB'                    // Fondo admin
  },
  shield: 'URL_ESCUDO_PNG',
  shieldSvg: 'URL_ESCUDO_SVG',           // Opcional
  heroBg: 'URL_FOTO_HERO',              // Foto de fondo del hero
  phone: '600 000 000',
  phone2: '',                            // Opcional
  email: 'info@suclub.es',
  whatsapp: '34600000000',              // Sin + ni espacios
  whatsappMsg: 'Hola%2C%20me%20interesa%20unirme%20al%20club',
  address: 'Calle Principal, 1',
  addressCity: '03000 Ciudad',
  instagram: 'https://www.instagram.com/suclub/',
  instagramHandle: '@suclub',
  facebook: 'https://www.facebook.com/suclub/',
  facebookHandle: '/suclub',
  heroDesc: 'Descripción corta del club para el hero de la web.',
  stats: [
    { num: 100, suffix: '+', label: 'Jugadores' },
    { num: 6,   suffix: '+', label: 'Equipos' },
    { num: 10,  suffix: '+', label: 'Años' },
    { num: 4.5, suffix: '★', label: 'Google' }
  ],
  apiUrl: 'https://graceful-magic-production-c9ee.up.railway.app',
  clubId: 'CLUB_ID_AQUI'                // ← CRÍTICO
};
```

### 4c. Commit y push al repo

```bash
git add suclub-v1.html
git commit -m "Add: web pública Club Nombre"
git push
```

---

## Paso 5 — Desplegar en Netlify

1. En Netlify → **Add new site** → **Import an existing project**
2. Conectar con GitHub → seleccionar repo `sudeporte-webs`
3. Build settings:
   - Base directory: *(vacío)*
   - Build command: *(vacío)*
   - Publish directory: `.`
4. Deploy → esperar 30 segundos
5. Site URL: `suclub.netlify.app` (cambiar a dominio propio en el siguiente paso)

---

## Paso 6 — Conectar dominio propio

En Netlify → Site settings → Domain management → Add custom domain:
- Añadir `suclub.es` (o `www.suclub.es`)
- Netlify da los nameservers o el CNAME
- El cliente actualiza sus DNS (Godaddy, IONOS, etc.)
- SSL automático (Let's Encrypt) en 5-10 minutos

---

## Paso 7 — Verificar funcionamiento

```bash
# API pública responde con datos del club:
curl "https://graceful-magic-production-c9ee.up.railway.app/api/news?club_id=CLUB_ID_AQUI"

# Admin panel:
# Abrir https://suclub.netlify.app/admin (o URL del backend /admin)
# Login con admin@suclub.es
```

---

## Paso 8 — Datos iniciales

El admin del club puede ya:
1. Subir logo y escudo (Ajustes → Identidad del club)
2. Crear equipos
3. Añadir deportistas
4. Añadir noticias y patrocinadores
5. Configurar el email SMTP del club (Ajustes → Email)

---

## Resumen de lo que el cliente recibe

| Qué | Cómo accede |
|-----|-------------|
| Web pública | `https://suclub.es` |
| Panel de administración | `https://graceful-magic-production-c9ee.up.railway.app` (o subdominio) |
| Email de noticias | Desde su propio SMTP configurado en Ajustes |

---

## Coste para el cliente

> Nota: dominio + hosting (Netlify) se factura aparte del plan SUDEPORTE.

| Concepto | Quién lo paga |
|---|---|
| Dominio (`suclub.es`) | El cliente (~€12/año) |
| Hosting web (Netlify) | SUDEPORTE (incluido en plan) |
| Backend Railway | SUDEPORTE (incluido en plan) |
| Base de datos Atlas | SUDEPORTE (incluido en plan) |
| Emails (SMTP propio) | El cliente (su cuenta Gmail/IONOS/etc.) |

---

## Checklist final

- [ ] `club_id` creado y documentado
- [ ] Documento en colección `clubs`
- [ ] Usuario admin creado con `club_id` correcto
- [ ] HTML público personalizado con todos los datos del club
- [ ] HTML desplegado en Netlify
- [ ] Dominio propio conectado
- [ ] Test de login admin ✓
- [ ] Test de web pública (hero, menú, formulario contacto) ✓
- [ ] Cliente informado de credenciales de acceso
