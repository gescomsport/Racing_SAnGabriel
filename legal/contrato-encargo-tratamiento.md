# CONTRATO DE ENCARGO DE TRATAMIENTO DE DATOS
## (Art. 28 Reglamento UE 2016/679 — RGPD)

---

En [CIUDAD], a [FECHA]

**REUNIDOS**

**De una parte, como RESPONSABLE DEL TRATAMIENTO:**

**[NOMBRE DEL CLUB]**, con CIF [CIF], domicilio en [DIRECCIÓN], representado por [NOMBRE REPRESENTANTE] en su calidad de [CARGO] (en adelante, "el Club" o "el Responsable").

**De otra parte, como ENCARGADO DEL TRATAMIENTO:**

**David García Sánchez**, operando bajo la marca comercial **SUDEPORTE**, con NIF [NIF DAVID], domicilio en [DIRECCIÓN DAVID], correo electrónico gescomsport@gmail.com (en adelante, "SUDEPORTE" o "el Encargado").

Ambas partes se reconocen mutuamente capacidad legal suficiente para suscribir el presente contrato, y a tal efecto

**EXPONEN**

**I.** Que el Club ha contratado con SUDEPORTE la prestación de servicios de plataforma tecnológica para la gestión deportiva, que incluye el tratamiento de datos personales de socios, deportistas, familiares y otros interesados relacionados con el Club.

**II.** Que en el desarrollo de dichos servicios, SUDEPORTE accederá y tratará datos personales por cuenta del Club, actuando como Encargado del Tratamiento en los términos del Art. 28 RGPD.

**III.** Que ambas partes desean regular las condiciones de dicho tratamiento mediante el presente contrato.

**ACUERDAN**

---

### CLÁUSULA 1 — OBJETO

El presente contrato tiene por objeto regular el tratamiento de datos personales que SUDEPORTE realizará por cuenta y según las instrucciones del Club, en el marco de la prestación del servicio de gestión deportiva (plataforma web de administración de socios, deportistas, pagos, comunicaciones y domiciliaciones bancarias).

---

### CLÁUSULA 2 — NATURALEZA, FINALIDAD Y DURACIÓN DEL TRATAMIENTO

**2.1 Naturaleza del tratamiento:** Almacenamiento, organización, consulta, modificación, exportación y supresión de datos personales a través de la plataforma digital SUDEPORTE.

**2.2 Finalidades:**
- Gestión de inscripciones y fichas de socios y deportistas
- Gestión de pagos, cuotas y domiciliaciones SEPA
- Envío de comunicaciones del club (avisos, resultados, eventos)
- Generación de documentos administrativos (XML SEPA, exportaciones)

**2.3 Tipo de datos tratados:**
- Datos identificativos: nombre, apellidos, DNI/NIE, fecha de nacimiento
- Datos de contacto: dirección, teléfono, email
- Datos bancarios: IBAN (almacenados cifrados)
- Datos de salud: observaciones médicas voluntarias
- Datos de menores: con consentimiento del tutor legal

**2.4 Categorías de interesados:**
- Socios del club
- Deportistas (incluyendo menores de edad)
- Tutores/familiares de deportistas
- Personal del club con acceso al panel de administración

**2.5 Duración:** La duración del presente contrato coincide con la del contrato de servicios principal. A su vencimiento, SUDEPORTE deberá devolver o destruir los datos según lo indicado en la Cláusula 9.

---

### CLÁUSULA 3 — INSTRUCCIONES DEL RESPONSABLE

SUDEPORTE tratará los datos únicamente siguiendo las instrucciones documentadas del Club. Si SUDEPORTE considera que alguna instrucción infringe el RGPD u otra normativa de protección de datos, lo comunicará al Club de inmediato.

---

### CLÁUSULA 4 — OBLIGACIONES DEL ENCARGADO

SUDEPORTE se obliga a:

**a) Confidencialidad:** Garantizar que las personas autorizadas para tratar los datos se hayan comprometido a guardar secreto o estén sujetas a obligaciones legales de confidencialidad.

**b) Seguridad:** Aplicar las medidas técnicas y organizativas adecuadas (Art. 32 RGPD), incluyendo:
- Cifrado de datos bancarios (IBAN) en reposo
- Transmisión cifrada mediante HTTPS/TLS
- Control de acceso basado en roles
- Contraseñas hasheadas (bcrypt)
- Copias de seguridad periódicas
- Registro de auditoría de accesos

**c) Subencargados:** No contratar otros subencargados sin autorización previa y por escrito del Club. En caso de autorización, el subencargado quedará sujeto a las mismas obligaciones de protección de datos que el Encargado.

*Subencargados autorizados actualmente:*
- Proveedor de hosting/VPS (infraestructura técnica): [NOMBRE PROVEEDOR]
- Stripe Inc. (procesamiento de pagos con tarjeta): solo si el Club activa esta función
- MongoDB Atlas (base de datos en la nube): solo si se usa esta modalidad

**d) Asistencia al Responsable:** Ayudar al Club a garantizar el cumplimiento de las obligaciones establecidas en los Arts. 32-36 RGPD (seguridad, notificación de brechas, evaluaciones de impacto).

**e) Derechos de los interesados:** Notificar al Club sin dilación indebida cualquier solicitud de ejercicio de derechos (acceso, rectificación, supresión, portabilidad, oposición) recibida directamente de los interesados. La resolución corresponde al Club.

**f) Notificación de brechas:** Notificar al Club sin dilación indebida (máx. 72 horas) cualquier brecha de seguridad que afecte a datos personales, incluyendo descripción de la brecha, categorías de datos afectados, medidas adoptadas y datos de contacto.

**g) Auditoría:** Proporcionar al Club toda la información necesaria para demostrar el cumplimiento del Art. 28 RGPD, incluyendo la realización de auditorías e inspecciones.

---

### CLÁUSULA 5 — SUBENCARGADOS

SUDEPORTE cuenta con la autorización general del Club para contratar los subencargados indicados en la Cláusula 4.c. Cualquier cambio en la lista de subencargados será comunicado al Club con al menos 30 días de antelación, pudiendo el Club oponerse en dicho plazo.

---

### CLÁUSULA 6 — TRANSFERENCIAS INTERNACIONALES

En caso de que algún subencargado realice transferencias de datos fuera del Espacio Económico Europeo, SUDEPORTE se asegurará de que existen las garantías adecuadas conforme al Capítulo V del RGPD (Decisión de adecuación, Cláusulas Contractuales Tipo, etc.).

---

### CLÁUSULA 7 — RESPONSABILIDAD

El Responsable es responsable de que el tratamiento se realice conforme a la normativa aplicable. El Encargado responderá de los daños causados por el tratamiento cuando no haya cumplido las obligaciones específicamente impuestas a los encargados por el RGPD o cuando haya actuado fuera de las instrucciones del Responsable.

---

### CLÁUSULA 8 — DURACIÓN Y RESOLUCIÓN

El presente contrato tiene vigencia mientras dure el contrato de servicios principal. Cualquiera de las partes podrá resolverlo con 30 días de preaviso. La resolución del contrato de servicios principal implica automáticamente la resolución del presente contrato.

---

### CLÁUSULA 9 — DEVOLUCIÓN O DESTRUCCIÓN DE DATOS

A la finalización del contrato, SUDEPORTE, a elección del Club:

**(a) Devolución:** Exportará todos los datos en formato estándar (JSON/CSV) y los entregará al Club en el plazo de 30 días.

**(b) Destrucción:** Eliminará de forma segura todos los datos personales y las copias existentes, certificando documentalmente dicha eliminación.

En cualquier caso, SUDEPORTE podrá conservar una copia bloqueada de los datos durante el plazo legalmente exigido para atender posibles responsabilidades.

---

### CLÁUSULA 10 — NORMATIVA APLICABLE

El presente contrato se rige por:
- Reglamento (UE) 2016/679 del Parlamento Europeo (RGPD)
- Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)

Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de [CIUDAD].

---

**Firmas**

| RESPONSABLE DEL TRATAMIENTO | ENCARGADO DEL TRATAMIENTO |
|---|---|
| [NOMBRE DEL CLUB] | SUDEPORTE — David García Sánchez |
| [NOMBRE REPRESENTANTE] | David García Sánchez |
| [CARGO] | Titular |
| Fecha: _____________ | Fecha: _____________ |
| Firma: _____________ | Firma: _____________ |

---

*Este documento debe imprimirse en dos ejemplares originales, uno para cada parte.*
*Referencia: DPA-[NOMBRE_CLUB]-[AÑO]*
