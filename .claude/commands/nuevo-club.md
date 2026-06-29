# Skill: Montar web de nuevo club deportivo

Cuando se invoca `/nuevo-club`, pedir al usuario los datos mínimos del club y generar automáticamente todos los cambios necesarios para desplegar la plataforma SUDEPORTE para ese club.

## Datos a pedir al usuario

Antes de hacer ningún cambio, preguntar (o pedir que peguen el formulario de datos):

1. **Nombre completo del club** (ej: Club Deportivo Villarreal A.D.C.)
2. **Nombre corto** (ej: CD Villarreal)
3. **Subtítulo** (ej: Fútbol Base · Valencia)
4. **ID interno** (slug sin espacios, ej: cd_villarreal)
5. **Temporada** (ej: 2025/26)
6. **Dirección completa**
7. **Teléfono principal** (con prefijo internacional)
8. **Email del club**
9. **URL Instagram** + handle
10. **URL Facebook** + handle
11. **Escudo**: pedir URL o SVG inline
12. **Color principal** (hex)
13. **Color acento/dorado** (hex)
14. **URL del backend Railway** (si ya está desplegado) o indicar que se usará placeholder
15. **Estadísticas aproximadas**: años, jugadores, equipos, entrenadores
16. **Lista de equipos/categorías**

## Cambios a realizar

### 1. `website/index.html` — CLUB_CONFIG

Reemplazar el bloque `var CLUB_CONFIG = { ... }` con los datos del nuevo club. Mantener exactamente la misma estructura, solo cambiar valores.

Campos a actualizar:
- name, subtitle, tagline, clubId, season
- phone, phone2, whatsapp, email, address, addressCity
- instagram, instagramHandle, facebook, facebookHandle
- shieldSvg (URL o inline SVG)
- statsYears, statsPlayers, statsTeams, statsCoaches
- apiUrl (URL del backend Railway del nuevo club)

### 2. `website/index.html` — Facebook embed

Buscar `data-href="https://www.facebook.com/RacingSanGabrielADC/"` y reemplazar con la URL de Facebook del nuevo club.

Buscar `cite="https://www.facebook.com/RacingSanGabrielADC/"` y reemplazar igualmente.

### 3. `backend/server.py` — Datos seed

Buscar `_SEED_CLUB = "racing_sangabriel"` y reemplazar con el nuevo clubId.

Buscar el bloque de settings por defecto (~línea 1598) y actualizar con los datos del club:
- club_name, address, phone, email
- instagram_url, facebook_url, instagram_username, facebook_page
- facebook_page_url

### 4. `netlify.toml` — Sin cambios necesarios

El netlify.toml raíz es genérico y no necesita cambios.

### 5. Verificación

Tras los cambios:
- Verificar brace balance del HTML: `grep -c '{' website/index.html` vs `grep -c '}' website/index.html`
- Verificar compilación Python: `python3 -m py_compile backend/server.py && echo OK`
- Commit con mensaje descriptivo del nuevo club

## Instrucciones para el deploy (dar al usuario)

Tras los cambios de código, indicar al usuario los pasos en Railway y Netlify según `docs/NUEVO_CLUB_GUIA.md` pasos 4 y 5.

## Notas

- Nunca tocar la lógica de autenticación, contabilidad ni estructura multi-tenant
- El clubId debe ser único en toda la plataforma
- Si el usuario no tiene escudo todavía, usar un placeholder y dejar un TODO comentario
- Los colores CSS se aplican automáticamente vía CLUB_CONFIG en la función applyConfig()
- El email SMTP se configura después desde el panel admin — no es necesario para el deploy inicial
