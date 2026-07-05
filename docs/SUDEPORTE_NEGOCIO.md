# SUDEPORTE — Documento para el Equipo
### Qué es, cómo funciona, qué vendemos y cómo lo montamos

---

## ¿Qué es SUDEPORTE?

SUDEPORTE es una **plataforma SaaS white-label** para clubes deportivos. Vendemos webs completas de gestión y presencia digital a clubes de fútbol, baloncesto, natación y cualquier deporte organizado.

**El cliente no contrata un diseñador web. Contrata una solución completa que incluye:**
- Web pública del club (lo que ven padres, socios y rivales)
- Panel de gestión interno (lo que usa la secretaria y los entrenadores cada día)
- Todo conectado en tiempo real a una base de datos

---

## El Piloto: Racing San Gabriel A.D.C.

Racing San Gabriel (Alicante) es nuestro primer cliente, utilizado como **piloto interno** para:
1. Validar que la plataforma funciona en producción real
2. Calcular costes reales de infraestructura
3. Identificar qué funcionalidades valora más un club

**Estado actual:** Plataforma completa desplegada y funcionando.

---

## Lo que ve el cliente (web pública)

URL: `https://racing-sangabriel.netlify.app`

La web pública es lo que comparten en Instagram, WhatsApp de padres y Google. Incluye:

- **Hero** con imagen dinámica del club y partícula animada
- **Partidos próximos** cargados en tiempo real desde la base de datos
- **Eventos del calendario** (entrenamientos, convocatorias, actos del club)
- **Equipos** — todos los equipos con foto, categoría y descripción
- **Galería de fotos** — actualizable desde el panel admin
- **Patrocinadores** — logos con enlace, gestionables desde admin
- **Redes sociales** — Instagram y Facebook enlazados automáticamente
- **Formulario de inscripción** — envía la pre-inscripción directamente al club
- **Formulario de alta como socio** — ídem
- **Formulario de contacto** — llega al email del club via SMTP propio
- **Footer** con datos del club, redes y enlace discreto al área privada

**Todo el contenido se actualiza desde el panel admin — el club no toca el HTML.**

---

## Lo que usa el club internamente (panel admin)

URL: `https://admin-racing-sangabriel.netlify.app/admin`

El panel es el software de gestión del club. Lo usa la secretaria, el director deportivo y los entrenadores.

### Módulos disponibles:

**DEPORTIVO**
- **Jugadores** — Ficha completa, foto, equipo, estado médico, documento de identidad, exportar Excel
- **Equipos** — Crear categorías, asignar entrenadores, color en calendario
- **Calendario** — Vista mensual y semanal por equipos, crear entrenamientos/partidos/eventos, compartir imagen a redes
- **Partidos** — Resultados, rival, sede, categoría

**ADMINISTRATIVO**
- **Socios** — Alta de socios, cuota, estado de pago
- **Tarifas** — Precios por categoría y temporada
- **Contabilidad** — Ingresos y gastos, indica si es efectivo o cuenta bancaria, vinculación a jugador o socio, exportar Excel
- **Informes** — Exportar informe completo del club en Excel (jugadores, socios, ventas, personal, contabilidad, tarifas)

**COMUNICACIÓN**
- **Comunicaciones** — Envío de emails masivos a equipos, categorías o a todos los socios, usando el SMTP propio del club (sale desde el email del club, no de terceros)

**GALERÍA Y CONTENIDO**
- **Galería** — Subir y organizar fotos por sección (hero, general, equipo)
- **Patrocinadores** — Logos y enlaces de patrocinadores

**PERSONAL**
- **Personal** — Fichas de entrenadores, auxiliares, administrativos

**CONFIGURACIÓN**
- **Ajustes** — Nombre del club, logo, dirección, teléfono, email, redes sociales, configuración SMTP, cuentas bancarias, Stripe (pagos online futuros)

### Roles de acceso:
| Rol | Acceso |
|-----|--------|
| Admin | Todo el panel sin restricciones |
| Entrenador | Solo su equipo: calendario, comunicaciones, plantilla (lectura) |
| Auxiliar | Igual que entrenador |

---

## ¿Qué NO hacemos (y por qué)?

| Lo que pedirán | Nuestra respuesta |
|----------------|------------------|
| "¿El email sale de vuestro servidor?" | No. El email sale siempre desde el email del club. Más profesional y sin dependencias |
| "¿Incluye el dominio?" | No. El dominio se contrata aparte (~10€/año). Lo ayudamos a configurarlo |
| "¿Podemos comparar con Clupik?" | No hacemos comparativas. Mostramos lo que hacemos nosotros |
| "¿Stripe viene configurado?" | Las claves Stripe las pone el club en Ajustes. Nunca las tocamos nosotros |

---

## ¿Cuánto cuesta montar una web para un nuevo club?

**Tiempo:** 2-4 horas (con la herramienta preparada)

**Coste de infraestructura:** prácticamente 0€ marginal por club — todo corre en el VPS propio compartido (ver `SUDEPORTE-ARQUITECTURA.md`), que ya está pagado (182€+IVA/mes) independientemente de cuántos clubs haya, hasta ~400 clubs activos. El único coste variable real es el dominio propio si el club lo quiere (~10€/año).

**Lo que necesitamos del club:**
- Nombre completo del club
- Logo/escudo (SVG o PNG alta resolución)
- Colores corporativos (códigos hex o descripción)
- Dirección postal
- Teléfono(s)
- Email del club (y datos SMTP para envío de emails)
- Redes sociales (Instagram, Facebook)
- Lista de equipos/categorías
- Instalaciones del club
- Fotos (opcional, pueden añadirlas ellos desde el panel)

Ver guía completa: `docs/NUEVO_CLUB_GUIA.md`

---

## Propuesta de precios

> **Obsoleto.** Esta tabla de planes cerrados (Básico/Estándar/Pro/Enterprise) ha sido sustituida por la estructura modular vigente: plan **Inicio** 4,99€/mes o **Presencia** 9,99€/mes + módulos sueltos (12-18€/mes) o packs con descuento. Ver el desglose completo y actualizado en `SUDEPORTE-VENTAS.md` (raíz del repo).

---

## Proceso de venta y onboarding

```
1. Contacto con el club
       │
       ▼
2. Demo con datos del piloto (Racing San Gabriel)
       │
       ▼
3. Propuesta económica + contrato
       │
       ▼
4. Recopilación de datos del club (formulario)
       │
       ▼
5. Montaje de la web (2-4 horas con herramienta)
       │
       ▼
6. Revisión con el cliente
       │
       ▼
7. Go-live + formación básica (1h)
       │
       ▼
8. Soporte mensual + actualizaciones
```

---

## Ventajas competitivas

1. **Todo en uno** — Web + Gestión + Comunicaciones en una plataforma
2. **Email propio del club** — Los emails salen desde su dirección, no de la nuestra
3. **Sin dependencias de terceros** — No dependemos de servicios que pueden cerrar o encarecer
4. **Actualización en tiempo real** — El club actualiza el panel y la web cambia al instante
5. **Roles de acceso** — Entrenadores tienen acceso limitado, secretaria tiene control total
6. **Exportación de datos** — Todo en Excel cuando quieran, el club siempre tiene sus datos
7. **Escalable** — La misma plataforma funciona para un club de 50 niños o uno de 2.000 socios

---

## Tecnología (resumen no técnico)

- La web pública es una página HTML muy rápida que carga en menos de 2 segundos
- El panel admin es una aplicación web moderna (como Gmail o Notion)
- Los datos se guardan en un servidor propio (VPS en España/Europa, proveedor Ecommalia), no en servicios de terceros
- El mismo servidor procesa todos los clubs (arquitectura multi-tenant) — por eso el coste marginal de cada club nuevo es casi cero
- Backups remotos diarios incluidos en la infraestructura
- Todo el código está en GitHub — respaldo garantizado, nunca se pierde nada
