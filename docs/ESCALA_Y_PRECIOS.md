# SUDEPORTE — Análisis de Escala, Costes y Precios

---

## Arquitectura Actual vs Arquitectura a Escala

### Ahora (1-50 clubes): Sitios individuales por club
```
Club A → racing-sangabriel.netlify.app     ┐
Club B → cd-villarreal.netlify.app         ├── Backend único multi-tenant (Railway)
Club C → atletico-elda.netlify.app         ┘         │
                                                      ▼
                                              MongoDB Atlas (cluster compartido)
```

### A partir de 100 clubes: Subdominios en plataforma única
```
club-a.sudeporte.com  ┐
club-b.sudeporte.com  ├── Frontend único (React dinámico por subdominio)
club-c.sudeporte.com  ┘         │
                                ▼
                    Backend multi-tenant (Railway Pro / VPS)
                                │
                                ▼
                    MongoDB Atlas M30+ (dedicado)
                                │
                                ▼
                    Cloudflare R2 / AWS S3 (imágenes)
```

---

## Estimación de Volumen de Datos por Club

| Tipo | Registros estimados | Tamaño aprox. |
|------|--------------------|--------------:|
| Jugadores | 200-500 | ~2 MB |
| Socios | 100-400 | ~1 MB |
| Partidos + Eventos | 200-500/año | ~1 MB |
| Contabilidad | 500-2000/año | ~2 MB |
| Comunicaciones enviadas | 200-1000/año | ~1 MB |
| Fotos (metadata) | 100-500 | ~0.5 MB |
| **Total datos estructurados** | | **~7-8 MB/club** |
| Fotos (archivos reales) | 100-500 imágenes | ~500 MB/club |

> Las fotos son el coste principal de almacenamiento. Los datos estructurados son mínimos.

---

## Tabla de Costes por Escala

### Infraestructura mensual

| Escala | Railway (backend) | MongoDB Atlas | Almacen. imágenes | Netlify/CDN | **TOTAL INFRA** |
|--------|:-----------------:|:-------------:|:-----------------:|:-----------:|:---------------:|
| **10 clubes** | $10 | $0 (M0) | $0 | $0 | **~$10/mes** |
| **50 clubes** | $25 | $25 (M5) | $5 (R2) | $19 | **~$75/mes** |
| **100 clubes** | $50 | $60 (M10) | $15 | $19 | **~$145/mes** |
| **300 clubes** | $120 | $140 (M20) | $40 | $19 | **~$320/mes** |
| **500 clubes** | $200 | $250 (M30) | $80 | $50 | **~$580/mes** |
| **1.000 clubes** | $400 | $500 (M40) | $180 | $100 | **~$1.200/mes** |
| **1.500 clubes** | $650 | $800 (M50) | $300 | $150 | **~$1.900/mes** |

> Precios en USD. Los rangos son estimaciones conservadoras. El backend puede optimizarse con caché (Redis) para reducir costes de compute a partir de 200 clubes.

---

## Análisis Financiero a 1.500 Clubes

### Ingresos (plan medio estimado: 55€/mes por club)

| | |
|--|--|
| Clubes activos | 1.500 |
| Precio medio mensual | 55 € |
| **Ingresos brutos/mes** | **82.500 €** |
| Ingresos brutos/año | **990.000 €** |

### Costes mensuales a 1.500 clubes

| Concepto | Coste/mes |
|----------|----------:|
| Infraestructura técnica | ~1.900 $ (~1.750 €) |
| Personal técnico (2 devs) | ~8.000 € |
| Soporte cliente (2 personas) | ~5.000 € |
| Ventas y marketing | ~5.000 € |
| Operaciones + legal + varios | ~3.000 € |
| **Total costes** | **~22.750 €** |

### Margen

| | |
|--|--|
| Ingresos | 82.500 € |
| Costes totales | 22.750 € |
| **Margen neto** | **~59.750 €/mes** |
| **Margen %** | **~72%** |

---

## Hitos de Migración de Arquitectura

| Clubes | Acción necesaria | Coste adicional |
|--------|-----------------|----------------|
| 0-50 | Arquitectura actual (OK) | 0 |
| 50-100 | Migrar a MongoDB M10 pagado | +60$/mes |
| 100-200 | Implementar CDN para imágenes (R2/S3) | +30$/mes |
| 200+ | Migrar a subdominios únicos (sudeporte.com) | 1 semana dev |
| 500+ | Separar backend en microservicios o workers | 2 semanas dev |
| 1000+ | MongoDB dedicado M40+ | +500$/mes |

---

## Planes y Precios de Venta

### Plan BÁSICO — 29 €/mes
*Para clubes pequeños que quieren presencia digital*

- ✅ Web pública del club (diseño profesional)
- ✅ Galería de fotos (hasta 50 imágenes)
- ✅ Patrocinadores
- ✅ Formulario de contacto e inscripción
- ✅ Datos del club actualizables
- ✅ Partidos y resultados
- ✅ Redes sociales vinculadas automáticamente
- ❌ Panel de gestión interna
- ❌ Email a socios/familias

---

### Plan ESTÁNDAR — 49 €/mes ⭐ Más popular
*Para clubes que quieren gestionar todo en un sitio*

- ✅ Todo lo del plan Básico
- ✅ Panel de administración completo
- ✅ Deportistas y fichas completas
- ✅ Socios y gestión de cuotas
- ✅ Personal del club y entrenadores
- ✅ Equipos y categorías
- ✅ Calendario de entrenamientos y partidos
- ✅ Portal del entrenador (acceso limitado)
- ✅ Comunicaciones por email (SMTP propio del club)
- ✅ Importar/exportar Excel
- ✅ Galería ilimitada
- ❌ Contabilidad avanzada
- ❌ SEPA y domiciliaciones
- ❌ Ventas y cobros online

---

### Plan PRO — 79 €/mes
*Para clubs con gestión económica activa*

- ✅ Todo lo del plan Estándar
- ✅ Contabilidad (ingresos, gastos, caja, bancos)
- ✅ Ventas y cobros (tarifas, inscripciones, cuotas)
- ✅ SEPA — domiciliaciones bancarias en norma SEPA XML
- ✅ Informes completos exportables en Excel
- ✅ RGPD — gestión de consentimientos y derechos ARCO
- ✅ Múltiples cuentas bancarias
- ✅ Módulo de inscripciones con formularios personalizados

---

### Plan ENTERPRISE — Desde 149 €/mes
*Para federaciones, clubes grandes o multisede*

- ✅ Todo lo del plan Pro
- ✅ Múltiples instalaciones y sedes
- ✅ Soporte prioritario (respuesta en 4h)
- ✅ Formación presencial (1 sesión incluida)
- ✅ Integración con TPV / Redsys
- ✅ Personalización de diseño avanzada
- ✅ SLA de disponibilidad 99.5%
- ✅ Gestor de cuenta dedicado

---

### Módulos adicionales (add-ons)

| Módulo | Precio/mes |
|--------|----------:|
| Dominio personalizado (configuración y gestión) | +9 €/mes |
| Almacenamiento extra de fotos (+5 GB) | +10 €/mes |
| Pagos online con tarjeta (Stripe integrado) | +15 €/mes |
| TPV físico (Redsys) | +15 €/mes |
| App móvil básica (PWA con acceso al panel) | +20 €/mes |
| Automatización redes sociales (Make.com gestionado) | +15 €/mes |

---

### Resumen comparativo de planes

| Funcionalidad | Básico | Estándar | Pro | Enterprise |
|--------------|:------:|:--------:|:---:|:----------:|
| Web pública | ✅ | ✅ | ✅ | ✅ |
| Noticias y galería | ✅ | ✅ | ✅ | ✅ |
| Panel admin | ❌ | ✅ | ✅ | ✅ |
| Deportistas y socios | ❌ | ✅ | ✅ | ✅ |
| Calendario y partidos | ❌ | ✅ | ✅ | ✅ |
| Comunicaciones email | ❌ | ✅ | ✅ | ✅ |
| Contabilidad | ❌ | ❌ | ✅ | ✅ |
| Ventas y SEPA | ❌ | ❌ | ✅ | ✅ |
| Informes Excel | ❌ | Básico | ✅ | ✅ |
| RGPD | ❌ | ❌ | ✅ | ✅ |
| Multisede | ❌ | ❌ | ❌ | ✅ |
| SLA garantizado | ❌ | ❌ | ❌ | ✅ |
| **Precio/mes** | **29€** | **49€** | **79€** | **149€+** |

---

## Proyección de Ingresos por Distribución de Planes

Asumiendo 1.500 clubes con esta distribución estimada:

| Plan | % Clubes | Clubes | Precio | Ingresos |
|------|:--------:|:------:|:------:|:--------:|
| Básico | 20% | 300 | 29€ | 8.700€ |
| Estándar | 50% | 750 | 49€ | 36.750€ |
| Pro | 25% | 375 | 79€ | 29.625€ |
| Enterprise | 5% | 75 | 149€ | 11.175€ |
| Add-ons (media) | — | 800 clubes | 12€ | 9.600€ |
| **TOTAL** | | **1.500** | | **~95.850€/mes** |

---

## ¿Merece la pena integrar GoHighLevel (GHL)?

| Criterio | Claude+GitHub+MongoDB | GHL |
|----------|:--------------------:|:---:|
| Coste infra/mes (1500 clubes) | ~1.750€ | ~2.000-4.000€ |
| Personalización total | ✅ | ❌ (limitado) |
| Datos 100% tuyos | ✅ | ❌ (en GHL) |
| CRM de ventas integrado | ❌ (añadir) | ✅ |
| Automatizaciones (email mktg) | ❌ (añadir) | ✅ |
| Curva aprendizaje equipo | Media | Alta |
| Dependencia de tercero | Baja | Muy alta |
| **Recomendación** | **Principal** | **Solo CRM/ventas** |

**Conclusión:** Seguir con la arquitectura actual para el producto. Usar GHL SOLO como CRM de ventas y marketing (gestionar leads de clubes interesados), no como plataforma del producto en sí.
