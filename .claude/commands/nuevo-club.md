# Skill: Dar de alta un nuevo club en SUDEPORTE

> El runbook completo y autoritativo para dar de alta un club está en `SUDEPORTE-DEPLOY-CLUB.md` (directorio raíz de WEBS_SUDEPORTE). Este skill es un asistente interactivo que guía el proceso.

Cuando se invoca `/nuevo-club`, recopilar los datos del club y ejecutar los cambios de código necesarios para añadir el club a la plataforma multi-tenant del VPS.

## Datos a pedir al usuario

1. **Nombre completo del club** (ej: Club Deportivo Villarreal A.D.C.)
2. **Nombre corto** (ej: CD Villarreal)
3. **ID interno** (slug sin espacios, ej: cd_villarreal) — debe ser único
4. **Temporada activa** (ej: 2026/27)
5. **Dirección, teléfono, email del club**
6. **Instagram y Facebook** (URL + handle)
7. **Escudo**: URL de imagen o SVG inline
8. **Color principal** (hex)
9. **Estadísticas**: años fundación, jugadores, equipos, entrenadores
10. **Lista de equipos/categorías**

## Cambios de código a realizar

### 1. Código del frontend (`frontend/src/`)

El frontend es multi-tenant — el `club_id` viene del JWT tras el login, no está hardcodeado. No hay cambios de código necesarios en el frontend para añadir un club nuevo.

### 2. Configuración seed en `backend/server.py`

Si el nuevo club necesita datos iniciales (settings, equipo por defecto), añadir un bloque en la función seed del backend con los datos del club.

### 3. Netlify — nuevo site

Crear un nuevo site en Netlify conectado al mismo repo `gescomsport/Racing_SAnGabriel`, con estos ajustes:
- Base directory: `frontend` (o raíz si se usa el netlify.toml raíz)
- Proxy `/api/*` → `https://api.sudeporte.com/api/:splat` (ya configurado en netlify.toml)
- Dominio: `[clubid].netlify.app` o dominio propio del club

### 4. Backend VPS — crear usuario admin del club

En el VPS, ejecutar:
```bash
docker exec -it sudeporte_api python3 -c "
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio, uuid, bcrypt
# crear user admin para el nuevo club_id
"
```
O usar el script `backend/setup_superadmin.py` si existe para el nuevo club.

### 5. MongoDB — datos iniciales

Conectar al container MongoDB y crear los settings iniciales del club con `club_id` correcto.

## Notas

- El `club_id` debe ser único en toda la plataforma — verificar en MongoDB antes de usar
- Email SMTP se configura desde el panel admin después del alta — no bloquea el deploy
- Ver `SUDEPORTE-DEPLOY-CLUB.md` para los comandos exactos de VPS, Docker y MongoDB
- Nunca hardcodear credenciales ni URLs de Railway (Railway ya no se usa)
