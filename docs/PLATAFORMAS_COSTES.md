# Plataformas, Costes y Límites — SUDEPORTE

## Resumen Visual

```
GitHub ──── código fuente ──────────────────────── GRATIS siempre
   │
   ├──▶ Netlify (web pública)  ─── racing-sangabriel.netlify.app
   │
   ├──▶ Netlify (panel admin)  ─── admin-racing-sangabriel.netlify.app
   │
   └──▶ Railway (backend API)  ─── graceful-magic-production-c9ee.up.railway.app
               │
               └──▶ MongoDB Atlas ─── cluster Frankfurt M0
```

---

## Plataformas Utilizadas

### 1. GitHub
| | |
|--|--|
| **Qué hace** | Almacena todo el código fuente |
| **Plan actual** | Free |
| **Límite** | Repos privados ilimitados, 500MB LFS |
| **Si se supera** | Solo si se usa Git LFS con archivos muy grandes |
| **¿Se bloquea?** | No — el código es texto, no ocupa casi nada |
| **Coste al crecer** | 0€ siempre para este uso |

---

### 2. Netlify — Web Pública (`racing-sangabriel.netlify.app`)
| | |
|--|--|
| **Qué hace** | Sirve la web HTML del club a visitantes |
| **Plan actual** | Free (Starter) |
| **Límites** | 100 GB de ancho de banda/mes · 300 min de build/mes · Sitios ilimitados |
| **Si se supera el ancho de banda** | La web se queda offline hasta el siguiente mes |
| **Si se superan los builds** | No se pueden hacer más deploys ese mes (la web sigue online) |
| **¿Se bloquea sin avisar?** | Sí, si se supera el ancho de banda |
| **Cuándo se superará** | Con ~50.000 visitas/mes de páginas pesadas (improbable para un club pequeño) |
| **Coste al crecer** | Pro: 19$/mes · Incluye 1 TB ancho de banda |

---

### 3. Netlify — Panel Admin (`admin-racing-sangabriel.netlify.app`)
| | |
|--|--|
| **Qué hace** | Sirve el panel de gestión del club |
| **Plan actual** | Free (mismo equipo que la web pública) |
| **Límites** | Compartido con el site anterior (100 GB total entre todos los sites) |
| **Usuarios** | Solo el staff del club — tráfico mínimo |
| **¿Se bloquea?** | Muy improbable — uso interno con pocas peticiones |
| **Coste al crecer** | 0€ — el admin no consume casi ancho de banda |

---

### 4. Railway — Backend API
| | |
|--|--|
| **Qué hace** | Ejecuta el servidor FastAPI (Python) · procesa toda la lógica |
| **Plan actual** | Hobby ($5/mes incluidos en crédito inicial) |
| **Crédito inicial** | $5 gratis al registrarse |
| **Consumo estimado** | ~$3-4/mes (backend ligero, sin workers pesados) |
| **Si se acaba el crédito** | El backend se apaga · la web pública deja de cargar datos dinámicos |
| **¿Se bloquea sin avisar?** | Sí, si se agota el crédito |
| **Cuándo ocurrirá** | Al mes 1-2 si no se añade método de pago |
| **Recomendación** | Añadir tarjeta en Railway — el gasto real es ~3-5$/mes |
| **Coste al crecer** | Hobby: $5/mes fijo · Pro: pay-as-you-go desde $20/mes |

---

### 5. MongoDB Atlas — Base de Datos
| | |
|--|--|
| **Qué hace** | Almacena todos los datos del club (jugadores, socios, partidos, etc.) |
| **Plan actual** | M0 Free Cluster (Frankfurt) |
| **Límites** | 512 MB de almacenamiento · Shared cluster · Sin expiración |
| **Si se supera el almacenamiento** | Las escrituras se bloquean (no se pueden añadir más datos) |
| **¿Se bloquea sin avisar?** | Sí, pero el 512MB da para años de datos de un club pequeño |
| **Estimación de uso** | 1.000 jugadores + 5 años de datos ≈ ~50 MB |
| **Cuándo se superará** | Prácticamente nunca para un club pequeño/mediano |
| **Coste al crecer** | M2: $9/mes · M5: $25/mes · Incluye más RAM y almacenamiento |

---

## Resumen de Costes Totales

### Estado Actual (piloto Racing San Gabriel)

| Plataforma | Coste mensual |
|-----------|--------------|
| GitHub | 0€ |
| Netlify (2 sites) | 0€ |
| Railway | ~3-5$ |
| MongoDB Atlas | 0€ |
| **TOTAL** | **~3-5$/mes** |

### Escenario con un club de pago (precio sugerido plan básico: 49€/mes)

| Plataforma | Coste mensual |
|-----------|--------------|
| GitHub | 0€ |
| Netlify (2 sites) | 0€ |
| Railway | ~5$ |
| MongoDB Atlas | 0€ |
| Dominio (prorrateado) | ~1€ |
| **TOTAL INFRAESTRUCTURA** | **~6-7€/mes** |
| **Margen bruto por club** | **~42-43€/mes** |

### A 50 clubes

| | |
|--|--|
| Ingresos | 50 × 49€ = 2.450€/mes |
| Railway (50 instancias o 1 multi-tenant) | ~50-100$/mes |
| MongoDB Atlas (1 cluster por tier o multi-tenant) | 0-25$/mes |
| Netlify (100 sites en mismo equipo) | 0-19$/mes |
| **Margen bruto estimado** | **~2.300€/mes** |

> A escala, el backend puede ser **un solo proceso multi-tenant** (ya está preparado con `club_id` en cada documento). No hace falta un Railway por club.

Ver análisis completo para 100-1.500 clubes en `docs/ESCALA_Y_PRECIOS.md`

---

## Plan de Acción por Alertas

| Situación | Acción |
|-----------|--------|
| Railway se queda sin crédito | Añadir tarjeta en railway.app → coste ~5$/mes |
| Netlify supera 100GB bandwidth | Upgrade a Pro ($19/mes) o activar CDN |
| MongoDB supera 512MB | Upgrade a M2 ($9/mes) |
| El club quiere dominio propio | Comprar en GoDaddy/Namecheap (~10€/año) y configurar en Netlify |
