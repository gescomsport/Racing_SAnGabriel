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
- **Publicaciones automaticas de redes sociales** (4 ultimas de Instagram + 4 de Facebook)
- **Webhook endpoint** para recibir posts desde n8n/Make/Zapier
- Facebook Page Plugin (iframe oficial, gratis)
- 14 categorias de futbol reales
- Calendario de Partidos
- Galeria de Fotos con lightbox
- Formulario de Contacto con datos reales
- Panel Admin (Equipos, Partidos, Galeria, Mensajes, Redes Sociales, Ajustes)
- Autenticacion JWT
- **Documentacion completa n8n/Make** para replicar (/app/docs/AUTOMATIZACION_REDES_SOCIALES.md)
- Datos reales del club (direccion, telefono, email, horario)
- Diseño responsive azul/blanco
- **Filosofia "monta una vez, olvidate"**: el club solo publica en redes y la web se actualiza sola

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
