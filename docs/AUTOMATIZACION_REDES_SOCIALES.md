# Guia de Automatizacion - Redes Sociales → Web

## Concepto
Cada vez que el club publica algo en Instagram o Facebook, esa publicacion aparece automaticamente en la web. **Cero mantenimiento**.

---

## OPCION 1: Make.com (Recomendado para empezar)

### Requisitos
- Cuenta gratuita en [make.com](https://make.com) (1.000 operaciones/mes gratis)
- Cuenta de Instagram Business vinculada a Facebook
- La URL del webhook de tu web

### Flujo Instagram → Web

**Paso 1: Crear escenario en Make.com**
1. Entra en make.com → "Create a new scenario"
2. Busca el modulo "Instagram for Business" → "Watch Media"
3. Conecta tu cuenta de Instagram (se hace via Facebook)
4. Configura: "Limit" = 1 (solo nuevas publicaciones)

**Paso 2: Conectar con la web**
1. Anade un modulo "HTTP" → "Make a request"
2. Configura:
   - URL: `https://TU-DOMINIO/api/webhook/social-post`
   - Method: POST
   - Body type: JSON
   - Body:
   ```json
   {
     "source": "instagram",
     "content": "{{caption}}",
     "image_url": "{{media_url}}",
     "post_url": "{{permalink}}",
     "author": "@racingsangabrieladc",
     "timestamp": "{{timestamp}}",
     "api_key": "TU-API-KEY"
   }
   ```

**Paso 3: Activar**
1. Activa el escenario
2. Pon la frecuencia en "Every 15 minutes"
3. ¡Listo! Cada nueva publicacion de Instagram aparecera en la web.

### Flujo Facebook → Web

**Paso 1: Modulo Facebook Pages**
1. Nuevo escenario → "Facebook Pages" → "Watch Posts"
2. Conecta tu pagina de Facebook
3. Configura: "Limit" = 1

**Paso 2: HTTP a la web**
1. Anade "HTTP" → "Make a request"
2. Body:
   ```json
   {
     "source": "facebook",
     "content": "{{message}}",
     "image_url": "{{full_picture}}",
     "post_url": "{{permalink_url}}",
     "author": "Racing San Gabriel ADC",
     "timestamp": "{{created_time}}",
     "api_key": "TU-API-KEY"
   }
   ```

---

## OPCION 2: n8n (Gratis, auto-hospedado)

### Requisitos
- Servidor con n8n instalado (Docker recomendado)
- Cuenta de Instagram Business
- Acceso a la API de Meta (Facebook Graph API)

### Instalacion n8n (Docker)
```bash
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

### Flujo Instagram → Web (via RSS)
1. Trigger: "Schedule" → Cada 30 minutos
2. Nodo: "HTTP Request" → GET `https://rss.app/feeds/TU-FEED-INSTAGRAM`
   (Crea feed RSS gratis en rss.app conectando tu Instagram)
3. Nodo: "Item Lists" → Split por cada post
4. Nodo: "IF" → Solo posts nuevos (comparar fecha)
5. Nodo: "HTTP Request" → POST al webhook:
   ```
   URL: https://TU-DOMINIO/api/webhook/social-post
   Body: {
     "source": "instagram",
     "content": "{{$json.title}}",
     "image_url": "{{$json.enclosure.url}}",
     "post_url": "{{$json.link}}",
     "author": "@racingsangabrieladc",
     "api_key": "TU-API-KEY"
   }
   ```

### Flujo Facebook → Web
1. Trigger: "Schedule" → Cada 30 minutos
2. Nodo: "Facebook Graph API" → GET `/PAGE-ID/posts`
   (Token de pagina con permisos `pages_read_engagement`)
3. Nodo: "HTTP Request" → POST al webhook

---

## WEBHOOK - Referencia Tecnica

### Endpoint
```
POST /api/webhook/social-post
```

### Body (JSON)
| Campo      | Tipo   | Requerido | Descripcion |
|------------|--------|-----------|-------------|
| source     | string | Si        | "instagram" o "facebook" |
| content    | string | No        | Texto de la publicacion |
| image_url  | string | No        | URL de la imagen |
| post_url   | string | No        | Link a la publicacion original |
| author     | string | No        | Nombre o @usuario |
| timestamp  | string | No        | Fecha ISO de la publicacion |
| api_key    | string | No        | Clave de seguridad (configurada en .env) |

### Ejemplo curl
```bash
curl -X POST https://TU-DOMINIO/api/webhook/social-post \
  -H "Content-Type: application/json" \
  -d '{
    "source": "instagram",
    "content": "Nueva publicacion del club!",
    "image_url": "https://ejemplo.com/foto.jpg",
    "post_url": "https://instagram.com/p/ABC123",
    "author": "@racingsangabrieladc",
    "api_key": "TU-API-KEY"
  }'
```

---

## REPLICAR PARA OTRO CLUB

Para usar este sistema con otro club, solo hay que cambiar:

1. **En la web**: Datos del club (nombre, logo, colores, contacto) desde el panel admin
2. **En Make/n8n**: Cambiar la cuenta de Instagram/Facebook por la del nuevo club
3. **En .env**: Cambiar WEBHOOK_API_KEY por una nueva clave unica

**Tiempo estimado para replicar: 30 minutos**

---

## OPCION 3: Solo embeds (Sin automatizacion)

Si no se quiere usar Make/n8n:
1. Facebook: El Page Plugin ya muestra el timeline automaticamente (gratis, oficial)
2. Instagram: Usar Elfsight.com (plan gratis limitado) o Curator.io (gratis, sin marca)
3. Pegar el codigo embed en Admin → Redes Sociales

Esta opcion es la mas facil pero depende de servicios de terceros.
