# Guía: Montar la Web de un Nuevo Club
### Tiempo estimado: 2-4 horas

---

## Datos Mínimos Necesarios del Club

Recopilar antes de empezar:

```
DATOS DEL CLUB
──────────────
Nombre completo:         ej. Club Deportivo Villarreal A.D.C.
Nombre corto:            ej. CD Villarreal
Subtítulo/eslogan:       ej. Fútbol Base · Valencia
ID interno (slug):       ej. cd_villarreal  (sin espacios, sin tildes)
Temporada actual:        ej. 2025/26

CONTACTO
────────
Dirección:               ej. Calle Mayor 12, 12540 Vila-real, Castellón
Teléfono principal:      ej. +34 964 000 000
Teléfono secundario:     (opcional)
Email público:           ej. info@cdvillarreal.es
WhatsApp (número):       ej. 34964000000

REDES SOCIALES
──────────────
Instagram URL:           ej. https://www.instagram.com/cdvillarreal/
Instagram handle:        ej. @cdvillarreal
Facebook URL:            ej. https://www.facebook.com/CDVillarreal/
Facebook page:           ej. CDVillarreal

IDENTIDAD VISUAL
────────────────
Logo/escudo:             Archivo SVG o PNG (fondo transparente, alta resolución)
Color principal:         ej. #FFD700 (amarillo)
Color secundario:        ej. #003087 (azul marino)
Color acento:            ej. #FFFFFF (blanco)

SMTP (para emails del club)
───────────────────────────
Host SMTP:               ej. smtp.gmail.com
Puerto:                  ej. 587
Email remitente:         ej. info@cdvillarreal.es
Contraseña SMTP:         ej. xxxxxxxxxx
Nombre remitente:        ej. CD Villarreal

EQUIPOS / CATEGORÍAS (lista)
────────────────────────────
ej. Prebenjamín, Benjamín A, Benjamín B, Alevín A, Alevín B,
    Infantil A, Infantil B, Cadete, Juvenil A, Juvenil B, Senior

INSTALACIONES
─────────────
ej. Campo Municipal de Fútbol, Polideportivo Norte, Sala Multiusos

ESTADÍSTICAS PARA LA WEB (aproximadas)
───────────────────────────────────────
Años de historia:        ej. 45
Nº de jugadores:         ej. 320
Nº de equipos:           ej. 12
Nº de entrenadores:      ej. 18
```

---

## Proceso Paso a Paso

### PASO 1 — Preparar el repositorio (15 min)

```bash
# Clonar el repo base desde Racing San Gabriel
git clone https://github.com/gescomsport/Racing_SAnGabriel.git cd_villarreal
cd cd_villarreal

# Desconectar del repo original y crear uno nuevo
rm -rf .git
git init
git remote add origin https://github.com/gescomsport/CD_Villarreal.git
```

### PASO 2 — Configurar la web pública (30 min)

Editar `website/index.html` — sección `CLUB_CONFIG`:

```javascript
var CLUB_CONFIG = {
  name: 'CD Villarreal',           // Nombre corto
  subtitle: 'A.D.C.',              // Subtítulo
  tagline: 'Fútbol Base · Valencia',
  clubId: 'cd_villarreal',         // ID único, debe coincidir con MongoDB
  season: '2025/26',

  // Contacto
  phone: '+34 964 000 000',
  phone2: '',
  whatsapp: '34964000000',
  email: 'info@cdvillarreal.es',
  address: 'Calle Mayor 12',
  addressCity: '12540 Vila-real, Castellón',
  mapUrl: 'https://maps.google.com/?q=...',

  // Redes sociales
  instagram: 'https://www.instagram.com/cdvillarreal/',
  instagramHandle: '@cdvillarreal',
  facebook: 'https://www.facebook.com/CDVillarreal/',
  facebookHandle: '/CDVillarreal',

  // Escudo
  shieldSvg: '',   // Pegar aquí el SVG inline o URL de imagen

  // Colores
  colorPrimary: '#003087',
  colorGold: '#FFD700',

  // Estadísticas
  statsYears: 45,
  statsPlayers: 320,
  statsTeams: 12,
  statsCoaches: 18,

  // Backend
  apiUrl: 'https://TU-BACKEND-EN-RAILWAY.up.railway.app',
};
```

### PASO 3 — Configurar el backend (20 min)

En `backend/server.py`, buscar `_SEED_CLUB` y actualizar los datos de seed:

```python
_SEED_CLUB = "cd_villarreal"
```

Actualizar el bloque de settings por defecto (línea ~1598) con los datos del nuevo club.

### PASO 4 — Desplegar el backend en Railway (20 min)

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Seleccionar el nuevo repo
3. Añadir variables de entorno:
   ```
   MONGO_URL=mongodb+srv://...
   DB_NAME=cd_villarreal
   JWT_SECRET=[generar uno nuevo]
   CORS_ORIGINS=https://cd-villarreal.netlify.app,https://admin-cd-villarreal.netlify.app
   ```
4. Anotar la URL del backend que genera Railway

### PASO 5 — Desplegar en Netlify (30 min)

**Site 1 — Web pública:**
- New site → GitHub → repo nuevo
- Base directory: `website`
- Build command: (vacío)
- Publish directory: `.`
- Nombre: `cd-villarreal`

**Site 2 — Panel admin:**
- New site → GitHub → mismo repo
- Base directory: (vacío)
- Build command: `cd frontend && yarn build`
- Publish directory: `frontend/build`
- Nombre: `admin-cd-villarreal`
- Env vars: `REACT_APP_BACKEND_URL=https://TU-BACKEND.up.railway.app`

### PASO 6 — Crear admin inicial en MongoDB (10 min)

```bash
# Llamar al endpoint de seed desde cualquier navegador o curl:
curl https://TU-BACKEND.up.railway.app/api/seed
```

Esto crea el usuario admin y los datos iniciales del club.

### PASO 7 — Personalizar desde el panel (30 min)

Entrar en `https://admin-cd-villarreal.netlify.app/admin` y desde Ajustes:
- Subir el escudo/logo
- Verificar nombre, dirección, teléfonos
- Configurar SMTP
- Añadir equipos
- Añadir instalaciones
- Subir primeras fotos a la galería

### PASO 8 — Verificación final (15 min)

- [ ] Web pública carga correctamente
- [ ] Los datos del club aparecen en el footer
- [ ] El formulario de contacto envía email
- [ ] El login del admin funciona
- [ ] Los módulos principales funcionan (jugadores, calendario, comunicaciones)
- [ ] Las redes sociales enlazan correctamente
- [ ] La web es responsive en móvil

---

## Checklist de Entrega al Cliente

- [ ] Credenciales de admin entregadas de forma segura
- [ ] Contraseña cambiada por el cliente
- [ ] Formación básica de 1 hora realizada
- [ ] Documentación de usuario entregada
- [ ] Datos de contacto SUDEPORTE para soporte
- [ ] Factura del primer mes

---

## Usando la Habilidad `/nuevo-club` en Claude Code

Con la habilidad guardada, el proceso de personalización del código se automatiza.
Ejecutar en el directorio del nuevo repo:

```
/nuevo-club
```

Claude pedirá los datos del club y generará automáticamente todos los cambios necesarios.

---

## Notas Importantes

- El `clubId` debe ser único, en minúsculas, sin espacios ni tildes
- Si el club tiene logo en SVG, es mejor que inline para evitar peticiones extra
- Los colores corporativos mejoran mucho el impacto visual — preguntar siempre el hex exacto
- El SMTP es imprescindible para que el formulario de contacto funcione desde el primer día
- Recomendar al club que cambie la contraseña admin en su primer acceso
