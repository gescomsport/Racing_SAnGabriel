# GUIA COMPLETA: Conectar Instagram y Facebook con la Web
## Racing San Gabriel A.D.C. - Make.com

---

## DATOS QUE VAS A NECESITAR (apuntalos)

```
Webhook URL:  https://sg-racing-portal.preview.emergentagent.com/api/webhook/social-post
API Key:      rsg-webhook-2025-secret
```

---

## PARTE 1: PREPARAR INSTAGRAM (5 minutos)

### 1.1 Verificar que Instagram es cuenta Business

1. Abre Instagram en el movil
2. Ve a tu perfil (@racingsangabrieladc)
3. Toca el menu (tres rayas arriba a la derecha)
4. Ve a **Configuracion y privacidad**
5. Baja hasta **Tipo de cuenta y herramientas**
6. Si ves "Cambiar a cuenta profesional" → TOCALO y selecciona "Empresa" o "Creador"
7. Si ya dice "Cuenta profesional" → Perfecto, ya esta

### 1.2 Vincular Instagram con Facebook

1. En Instagram > Configuracion > **Centro de cuentas**
2. Toca **Cuentas vinculadas** o **Perfiles**
3. Anade tu pagina de Facebook "RacingSanGabrielADC"
4. Si ya esta vinculada → Perfecto

**IMPORTANTE**: Sin este paso, Make.com no puede leer los posts de Instagram.

---

## PARTE 2: CREAR CUENTA EN MAKE.COM (2 minutos)

1. Ve a **https://www.make.com**
2. Clic en **"Get started free"**
3. Registrate con email o Google
4. El plan gratuito incluye **1.000 operaciones/mes** (mas que suficiente)
5. No hace falta meter tarjeta de credito

---

## PARTE 3: CREAR ESCENARIO DE INSTAGRAM (10 minutos)

### 3.1 Crear nuevo escenario

1. En Make.com, clic en **"Scenarios"** en el menu izquierdo
2. Clic en **"+ Create a new scenario"** (boton azul arriba a la derecha)

### 3.2 Anadir el trigger de Instagram

1. Clic en el **circulo grande con el +** en el centro
2. Busca **"Instagram for Business"**
3. Selecciona **"Watch Media"** (Vigilar nuevas publicaciones)
4. Te pedira conectar tu cuenta:
   - Clic en **"Add"** o **"Create a connection"**
   - Nombre: `Racing San Gabriel Instagram`
   - Clic en **"Save"**
   - Se abre ventana de Facebook → Inicia sesion con la cuenta que gestiona la pagina
   - Dale permisos a Make.com para leer Instagram
   - Selecciona la pagina "RacingSanGabrielADC" y la cuenta de Instagram vinculada
5. En **"Limit"**: pon **4** (las ultimas 4 publicaciones)
6. Clic **"OK"**

### 3.3 Anadir el envio al Webhook de la web

1. Clic en el **pequeno circulo** que sale a la derecha del modulo Instagram
2. Busca **"HTTP"**
3. Selecciona **"Make a request"**
4. Configura asi:

   **URL:**
   ```
   https://sg-racing-portal.preview.emergentagent.com/api/webhook/social-post
   ```

   **Method:** `POST`

   **Body type:** `Raw`

   **Content type:** `JSON (application/json)`

   **Request content** (copia y pega EXACTAMENTE esto):
   ```json
   {
     "source": "instagram",
     "content": "{{1.caption}}",
     "image_url": "{{1.mediaUrl}}",
     "post_url": "{{1.permalink}}",
     "author": "@racingsangabrieladc",
     "timestamp": "{{1.timestamp}}",
     "api_key": "rsg-webhook-2025-secret"
   }
   ```

   **NOTA**: Los `{{1.caption}}` son variables de Make. Cuando escribas `{{` te saldra un menu para seleccionarlas. Selecciona:
   - `{{1.caption}}` → Es el texto del post
   - `{{1.mediaUrl}}` → Es la URL de la imagen/video
   - `{{1.permalink}}` → Es el link al post
   - `{{1.timestamp}}` → Es la fecha

5. Clic **"OK"**

### 3.4 Probar el escenario

1. Clic en **"Run once"** (boton abajo a la izquierda)
2. Si todo va bien, veras un tick verde en ambos modulos
3. Ve a la web del club y comprueba que aparecen las publicaciones

### 3.5 Activar el escenario

1. Clic en el **interruptor** de abajo a la izquierda (ON/OFF)
2. Ponlo en **ON**
3. En **"Schedule setting"** (el reloj):
   - Pon **"Run scenario"**: `At regular intervals`
   - **"Minutes"**: `15`
   - Esto significa: cada 15 minutos comprueba si hay nuevas publicaciones

4. **¡LISTO!** Cada vez que publiques en Instagram, en maximo 15 minutos aparece en la web.

---

## PARTE 4: CREAR ESCENARIO DE FACEBOOK (10 minutos)

### 4.1 Crear nuevo escenario

1. En Make.com > Scenarios > **"+ Create a new scenario"**

### 4.2 Anadir el trigger de Facebook

1. Clic en el **+** central
2. Busca **"Facebook Pages"**
3. Selecciona **"Watch Posts"** (Vigilar nuevas publicaciones)
4. Conecta tu cuenta:
   - Clic en **"Add"**
   - Nombre: `Racing San Gabriel Facebook`
   - Inicia sesion con Facebook
   - Selecciona la pagina "RacingSanGabrielADC"
5. En **"Limit"**: pon **4**
6. Clic **"OK"**

### 4.3 Anadir el envio al Webhook

1. Clic en el circulo a la derecha → "HTTP" → "Make a request"
2. Configura:

   **URL:**
   ```
   https://sg-racing-portal.preview.emergentagent.com/api/webhook/social-post
   ```

   **Method:** `POST`

   **Body type:** `Raw`

   **Content type:** `JSON (application/json)`

   **Request content:**
   ```json
   {
     "source": "facebook",
     "content": "{{1.message}}",
     "image_url": "{{1.fullPicture}}",
     "post_url": "{{1.permalinkUrl}}",
     "author": "Racing San Gabriel ADC",
     "timestamp": "{{1.createdTime}}",
     "api_key": "rsg-webhook-2025-secret"
   }
   ```

   **NOTA**: Las variables de Facebook son diferentes a Instagram:
   - `{{1.message}}` → Texto del post
   - `{{1.fullPicture}}` → Imagen
   - `{{1.permalinkUrl}}` → Link al post
   - `{{1.createdTime}}` → Fecha

3. Clic **"OK"**

### 4.4 Probar y activar

1. **"Run once"** para probar
2. Activar el **interruptor ON**
3. Schedule: cada **15 minutos**

---

## PARTE 5: VERIFICAR QUE TODO FUNCIONA

1. Publica algo en Instagram (puede ser una story o un post normal)
2. Espera 15 minutos (o ve a Make.com y dale a "Run once")
3. Abre la web del club
4. Deberia aparecer en la seccion "Novedades desde nuestras redes"

**Si no aparece:**
- Revisa en Make.com > Tu escenario > Historial (History) para ver si hubo errores
- Comprueba que la cuenta de Instagram es Business y esta vinculada a Facebook
- Comprueba que el webhook URL esta bien escrito

---

## PARA REPLICAR CON OTRO CLUB (30 minutos)

Solo hay que cambiar 3 cosas:

1. **En la web del nuevo club** (Admin > Ajustes):
   - Nombre, logo, colores, contacto del nuevo club

2. **En Make.com**:
   - Crear 2 escenarios nuevos (Instagram + Facebook)
   - Conectar las cuentas del nuevo club
   - Cambiar el Webhook URL por el del nuevo club
   - Cambiar el `author` por el nombre del nuevo club

3. **En el servidor (.env)**:
   - Cambiar WEBHOOK_API_KEY por una clave unica para cada club

**Tiempo total: ~30 minutos por club nuevo**

---

## RESUMEN DE COSTES

| Servicio | Coste | Limite |
|----------|-------|--------|
| Make.com | GRATIS | 1.000 ops/mes (~66 posts/dia) |
| Facebook Page Plugin | GRATIS | Sin limite |
| Webhook (nuestra web) | GRATIS | Sin limite |
| Instagram Business | GRATIS | Solo necesita cuenta Business |

**Coste total: 0 euros**

---

## SOPORTE

Si algo falla:
1. Revisa el historial de Make.com (Scenarios > Tu escenario > History)
2. Comprueba que Instagram es Business y esta vinculada a Facebook
3. Prueba el webhook manualmente:

```bash
curl -X POST https://sg-racing-portal.preview.emergentagent.com/api/webhook/social-post \
  -H "Content-Type: application/json" \
  -d '{"source":"instagram","content":"Prueba manual","api_key":"rsg-webhook-2025-secret"}'
```

Si devuelve `{"status":"ok","id":"..."}` → El webhook funciona, el problema esta en Make.com
