# CLÁUSULAS INFORMATIVAS PARA FORMULARIOS WEB
## (Art. 13 RGPD — Información al interesado en recogida directa)

Estas cláusulas deben integrarse en los formularios públicos de inscripción.

---

## TEXTO CORTO (para pie de formulario — obligatorio)

```
Responsable: [NOMBRE CLUB], [CIF], [EMAIL].
Finalidad: gestión de tu inscripción y cuotas.
Legitimación: ejecución del contrato (Art. 6.1.b RGPD).
Destinatarios: federaciones deportivas y entidades bancarias cuando sea necesario.
Conservación: durante tu vinculación con el club y 5 años adicionales por obligación fiscal.
Derechos: acceso, rectificación, supresión, portabilidad y oposición enviando email a [EMAIL CLUB].
Más información: consulta nuestra [POLÍTICA DE PRIVACIDAD completa].
```

---

## TEXTO PARA MENORES (formulario de inscripción jugador)

```
Si el deportista es menor de 14 años, el tutor legal debe:
1. Marcar la casilla "Autorización parental" dando su consentimiento expreso.
2. El tratamiento de datos del menor se basa en dicho consentimiento (Art. 8 RGPD / Art. 7 LOPDGDD).
3. El tutor puede revocar este consentimiento en cualquier momento contactando con el club.
```

---

## CHECKBOXES OBLIGATORIOS (código HTML)

```html
<!-- RGPD — Consentimiento principal (OBLIGATORIO) -->
<div class="form-check">
  <input type="checkbox" id="consent_gdpr" name="consent_gdpr" required>
  <label for="consent_gdpr">
    He leído y acepto la 
    <a href="/politica-privacidad" target="_blank">Política de Privacidad</a>
    y autorizo el tratamiento de mis datos para la gestión de mi inscripción.
    <span style="color:red">*</span>
  </label>
</div>

<!-- Comunicaciones (OPCIONAL) -->
<div class="form-check">
  <input type="checkbox" id="consent_communications" name="consent_communications">
  <label for="consent_communications">
    Acepto recibir comunicaciones del club sobre actividades, resultados y eventos 
    (puedes darte de baja en cualquier momento).
  </label>
</div>

<!-- SOLO PARA MENORES -->
<div id="guardian-consent" style="display:none">
  <div class="form-check">
    <input type="checkbox" id="consent_guardian_gdpr" name="consent_guardian_gdpr">
    <label for="consent_guardian_gdpr">
      Como tutor/a legal del menor, doy mi consentimiento expreso para el tratamiento 
      de los datos del deportista menor de 14 años conforme al Art. 8 RGPD.
      <span style="color:red">*</span>
    </label>
  </div>
</div>
```

---

## REGISTRO DE CONSENTIMIENTO (lo que debe guardarse en BD)

```json
{
  "consent_gdpr": true,
  "consent_communications": false,
  "consent_guardian_gdpr": null,
  "consent_date": "2026-06-12T10:30:00Z",
  "consent_ip": "79.148.xxx.xxx",
  "consent_version": "v1.0-2026"
}
```

---

## CLÁUSULA PARA DOMICILIACIÓN BANCARIA (formulario SEPA)

```
Al proporcionar su número de cuenta (IBAN), autoriza al [NOMBRE CLUB] a
ordenar adeudos directos SEPA en su cuenta para el cobro de las cuotas
acordadas. El presente mandato SEPA se rige por el Reglamento UE 260/2012.
Su banco tiene derecho a reembolsarle en el plazo de 8 semanas desde la
fecha del adeudo en caso de disconformidad.

El IBAN facilitado se almacenará cifrado y solo será accesible para la
generación de los ficheros de remesas bancarias.
```

---

## NOTAS LEGALES IMPORTANTES

1. **No es necesario DPD obligatorio** si el club tiene < 250 empleados y no trata categorías especiales a gran escala (Art. 37 RGPD). No obstante, se recomienda designar un punto de contacto de privacidad.

2. **Registro de Actividades de Tratamiento (RAT)**: El club está obligado a mantener un RAT interno (Art. 30 RGPD) aunque tenga < 250 empleados, por tratar datos de manera habitual o que puedan entrañar riesgo.

3. **Datos de salud**: Las "observaciones médicas" se consideran datos de categoría especial (Art. 9 RGPD). Requieren consentimiento explícito por separado y medidas de seguridad adicionales.

4. **Fotografías**: Las imágenes de personas son datos personales. Necesitas consentimiento para publicarlas, especialmente en el caso de menores.

5. **Edad digital en España**: 14 años (Art. 7 LOPDGDD). Entre 14-18 años el menor puede consentir por sí mismo; menores de 14 requieren consentimiento del tutor.
