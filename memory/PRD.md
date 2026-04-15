# Racing San Gabriel ADC - Web del Club

## Problema Original
Web para el club deportivo Racing San Gabriel ADC (racingsangabriel.es). Ejemplo para vender webs de clubes a través de webs.sudeporte.com. Integración con redes sociales (Instagram y Facebook).

## Arquitectura
- **Backend**: FastAPI + MongoDB (motor async)
- **Frontend**: React + Shadcn UI + Tailwind
- **Auth**: JWT con cookies httpOnly
- **DB**: MongoDB (colecciones: users, news, teams, players, matches, gallery, contacts, settings)

## Lo Implementado (15 Abril 2026)
- Hero Section con bento grid y escudo del club
- Sección de Noticias con tarjetas de Instagram/Facebook
- Sección de Equipos con plantilla
- Calendario de Partidos con tabla
- Galería de Fotos con lightbox
- Formulario de Contacto
- Footer con info del club y enlaces
- Panel Admin completo (CRUD: Noticias, Equipos, Partidos, Galería, Mensajes, Ajustes)
- Autenticación JWT para admin
- Seed de datos demo al arrancar
- **Integración Redes Sociales (NUEVA)**:
  - Facebook: Page Plugin oficial (gratis, iframe automático, solo pegar URL)
  - Instagram: Soporte Elfsight/Curator.io (copiar-pegar embed code)
  - Feed Completo: Soporte multi-red via Curator/POWR/Juicer
  - Panel admin "Redes Sociales" con guías paso a paso
  - Sección pública con feeds en vivo
- Diseño responsive con colores azul/blanco

## Backlog
### P0
- [DONE] Web pública con todas las secciones
- [DONE] Panel admin CRUD

### P1
- Integración API real de Instagram/Facebook (requiere Meta Developer tokens)
- Upload de imágenes (object storage)
- Edición inline de noticias y partidos

### P2
- Multi-idioma (ES/EN)
- SEO optimización avanzada
- Newsletter/Email marketing
- WhatsApp directo
- Estadísticas de visitas

## User Personas
1. **Admin del club**: Gestiona contenido (noticias, equipos, partidos) desde el panel
2. **Visitante**: Padre/madre, jugador potencial, aficionado que busca info del club
3. **Sudeporte (vendedor)**: Usa esta web como demo para vender a otros clubes
