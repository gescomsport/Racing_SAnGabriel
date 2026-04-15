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
- 14 categorias reales de equipos (Alevin A/B, Benjamin A/B, Cadete, Escuela Iniciacion, Futbol Femenino, Futbol Sala Senior, Infantil A/B, Juvenil A/B, Prebenjamin, Senior)
- Calendario de Partidos con tabla
- Galería de Fotos con lightbox
- Formulario de Contacto con datos reales
- Footer con info del club real y enlaces sociales
- Panel Admin completo (CRUD: Noticias, Equipos, Partidos, Galería, Mensajes, Ajustes, Redes Sociales)
- Autenticación JWT para admin
- **Datos reales del club**:
  - Dirección: Carrer Racing San Gabriel, 39, 03008 Alacant, Alicante
  - Teléfono: +34 617 50 27 80
  - Email: racingsangabrieladc@hotmail.com
  - Horario: Lunes a Sábado 9:00-21:00
  - Valoración Google: 4.2/5 (46 reseñas)
- **Integración Redes Sociales**:
  - Facebook: Page Plugin oficial (iframe automático)
  - Instagram: Soporte Elfsight/Curator.io (copiar-pegar embed)
  - Feed Completo: Multi-red via Curator/POWR/Juicer
  - Guía super simplificada en 3 pasos
- 4 Espacios/Instalaciones: La Cigüeña Campo Fútbol, Sala Multiactividad, Sede Club Socios, Campo Fútbol Sala
- Diseño responsive azul/blanco

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
