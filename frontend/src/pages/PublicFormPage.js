import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { CLUB_ID, API_BASE } from "../utils/clubDetect";

const STEPS = ["datos", "tutor", "equipo_cuota", "rgpd", "confirmacion"];

function calcAge(birthdate) {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function FileUpload({ label, value, onChange, required }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API_BASE}/public/${CLUB_ID}/upload-form-file`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = `https://api.sudeporte.com${res.data.url}`;
      setPreview(url);
      onChange(url);
    } catch {
      alert("Error al subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pf-field">
      <label className="pf-label">
        {label} {required && <span className="pf-req">*</span>}
      </label>
      {preview && (
        <div className="pf-preview">
          {preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img src={preview} alt={label} style={{ maxHeight: 120, borderRadius: 6 }} />
          ) : (
            <a href={preview} target="_blank" rel="noreferrer" className="pf-file-link">
              Ver archivo subido
            </a>
          )}
        </div>
      )}
      <button type="button" className="pf-upload-btn" onClick={() => inputRef.current.click()} disabled={uploading}>
        {uploading ? "Subiendo…" : preview ? "Cambiar archivo" : "Seleccionar archivo"}
      </button>
      <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

function BaseFields({ form, jugador, setJugador }) {
  const cb = form.campos_base || {};

  function field(key, label, type = "text", options = null) {
    const active = cb[key] !== false;
    const req = cb[`${key}_obligatorio`] !== false && cb[key] !== false;
    if (!active) return null;
    if (type === "select" && options) {
      return (
        <div key={key} className="pf-field">
          <label className="pf-label">
            {label} {req && <span className="pf-req">*</span>}
          </label>
          <select
            className="pf-input"
            value={jugador[key] || ""}
            onChange={(e) => setJugador({ ...jugador, [key]: e.target.value })}
            required={req}
          >
            <option value="">— Selecciona —</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return (
      <div key={key} className="pf-field">
        <label className="pf-label">
          {label} {req && <span className="pf-req">*</span>}
        </label>
        <input
          className="pf-input"
          type={type}
          value={jugador[key] || ""}
          onChange={(e) => setJugador({ ...jugador, [key]: e.target.value })}
          required={req}
        />
      </div>
    );
  }

  return (
    <>
      {field("nombre", "Nombre")}
      {field("apellidos", "Apellidos")}
      {field("fecha_nacimiento", "Fecha de nacimiento", "date")}
      {field("sexo", "Sexo", "select", [
        { value: "masculino", label: "Masculino" },
        { value: "femenino", label: "Femenino" },
        { value: "otro", label: "Prefiero no indicarlo" },
      ])}
      {field("dni", "DNI / NIE")}
      {field("telefono", "Teléfono", "tel")}
      {field("email", "Email", "email")}
      {field("direccion", "Dirección")}
      {field("cp", "Código postal")}
      {field("ciudad", "Ciudad")}
      {field("provincia", "Provincia")}
    </>
  );
}

function ExtraFields({ campos, jugador, setJugador }) {
  if (!campos || campos.length === 0) return null;

  return (
    <>
      {[...campos].sort((a, b) => a.orden - b.orden).map((campo) => {
        const key = campo.mapea_a || campo.id;
        if (campo.tipo === "foto_perfil" || campo.tipo === "dni_anverso" || campo.tipo === "dni_reverso" || campo.tipo === "archivo") {
          return (
            <FileUpload
              key={campo.id}
              label={campo.nombre}
              value={jugador[key] || ""}
              onChange={(url) => setJugador({ ...jugador, [key]: url })}
              required={campo.obligatorio}
            />
          );
        }
        if (campo.tipo === "seleccion") {
          return (
            <div key={campo.id} className="pf-field">
              <label className="pf-label">
                {campo.nombre} {campo.obligatorio && <span className="pf-req">*</span>}
              </label>
              <select
                className="pf-input"
                value={jugador[key] || ""}
                onChange={(e) => setJugador({ ...jugador, [key]: e.target.value })}
                required={campo.obligatorio}
              >
                <option value="">— Selecciona —</option>
                {(campo.opciones || []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (campo.tipo === "checkbox") {
          return (
            <div key={campo.id} className="pf-field pf-check-field">
              <label className="pf-check-label">
                <input
                  type="checkbox"
                  checked={!!jugador[key]}
                  onChange={(e) => setJugador({ ...jugador, [key]: e.target.checked })}
                  required={campo.obligatorio}
                />
                {campo.nombre} {campo.obligatorio && <span className="pf-req">*</span>}
              </label>
            </div>
          );
        }
        if (campo.tipo === "texto_largo") {
          return (
            <div key={campo.id} className="pf-field">
              <label className="pf-label">
                {campo.nombre} {campo.obligatorio && <span className="pf-req">*</span>}
              </label>
              <textarea
                className="pf-input pf-textarea"
                value={jugador[key] || ""}
                onChange={(e) => setJugador({ ...jugador, [key]: e.target.value })}
                required={campo.obligatorio}
                rows={3}
              />
            </div>
          );
        }
        // texto_corto default
        return (
          <div key={campo.id} className="pf-field">
            <label className="pf-label">
              {campo.nombre} {campo.obligatorio && <span className="pf-req">*</span>}
            </label>
            <input
              className="pf-input"
              type="text"
              value={jugador[key] || ""}
              onChange={(e) => setJugador({ ...jugador, [key]: e.target.value })}
              required={campo.obligatorio}
            />
          </div>
        );
      })}
    </>
  );
}

function TutorForm({ idx, tutor, onChange }) {
  function upd(k, v) {
    onChange({ ...tutor, [k]: v });
  }
  return (
    <div className="pf-tutor-block">
      <h4 className="pf-tutor-title">Tutor / Representante {idx + 1}</h4>
      <div className="pf-two-col">
        <div className="pf-field">
          <label className="pf-label">Nombre <span className="pf-req">*</span></label>
          <input className="pf-input" value={tutor.nombre || ""} onChange={(e) => upd("nombre", e.target.value)} required />
        </div>
        <div className="pf-field">
          <label className="pf-label">Apellidos</label>
          <input className="pf-input" value={tutor.apellidos || ""} onChange={(e) => upd("apellidos", e.target.value)} />
        </div>
      </div>
      <div className="pf-two-col">
        <div className="pf-field">
          <label className="pf-label">DNI / NIE</label>
          <input className="pf-input" value={tutor.dni || ""} onChange={(e) => upd("dni", e.target.value)} />
        </div>
        <div className="pf-field">
          <label className="pf-label">Relación</label>
          <select className="pf-input" value={tutor.relacion || "padre"} onChange={(e) => upd("relacion", e.target.value)}>
            <option value="padre">Padre</option>
            <option value="madre">Madre</option>
            <option value="tutor_legal">Tutor legal</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>
      <div className="pf-two-col">
        <div className="pf-field">
          <label className="pf-label">Teléfono</label>
          <input className="pf-input" type="tel" value={tutor.telefono || ""} onChange={(e) => upd("telefono", e.target.value)} />
        </div>
        <div className="pf-field">
          <label className="pf-label">Email</label>
          <input className="pf-input" type="email" value={tutor.email || ""} onChange={(e) => upd("email", e.target.value)} />
        </div>
      </div>
      <div className="pf-two-col">
        <FileUpload label="DNI anverso" value={tutor.dni_front_url || ""} onChange={(v) => upd("dni_front_url", v)} />
        <FileUpload label="DNI reverso" value={tutor.dni_back_url || ""} onChange={(v) => upd("dni_back_url", v)} />
      </div>
    </div>
  );
}

export default function PublicFormPage() {
  const { formSlug } = useParams();
  const [clubSettings, setClubSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState(0);
  const [jugador, setJugador] = useState({});
  const [tutores, setTutores] = useState([{ nombre: "", apellidos: "", dni: "", telefono: "", email: "", relacion: "padre", dni_front_url: "", dni_back_url: "" }]);
  const [equipoId, setEquipoId] = useState("");
  const [cuotaId, setCuotaId] = useState("");
  const [metodoPago, setMetodoPago] = useState("presencial");
  const [iban, setIban] = useState("");
  const [rgpd, setRgpd] = useState(false);
  const [rgpdImagen, setRgpdImagen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);

  // Search existing player
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchDone, setSearchDone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, formRes] = await Promise.all([
          axios.get(`${API_BASE}/public/${CLUB_ID}/settings`),
          axios.get(`${API_BASE}/public/${CLUB_ID}/forms/${formSlug}`),
        ]);
        setClubSettings(settingsRes.data);
        setForm(formRes.data);
        // Apply club colors
        const root = document.documentElement;
        root.style.setProperty("--pf-primary", settingsRes.data.primary_color || "#2460FF");
        root.style.setProperty("--pf-secondary", settingsRes.data.secondary_color || "#00296B");
        document.title = `Inscripción — ${settingsRes.data.club_name || ""}`;
      } catch {
        setError("No se pudo cargar el formulario. Puede que el enlace sea incorrecto o el formulario no esté disponible.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [formSlug]);

  const age = calcAge(jugador.fecha_nacimiento);
  const needsTutor = form?.incluir_tutor && age !== null && age < (form.tutor_edad_minima || 18);

  // Build active steps
  const activeSteps = ["datos"];
  if (needsTutor) activeSteps.push("tutor");
  if (form?.seleccion_equipo_activo || (form?.cuotas_ids || []).length > 0) activeSteps.push("equipo_cuota");
  activeSteps.push("rgpd");
  activeSteps.push("confirmacion");

  const currentStepKey = activeSteps[step] || "confirmacion";

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/public/${CLUB_ID}/forms/${formSlug}/search-player`, {
        query: searchQuery,
      });
      setSearchResult(res.data);
      setSearchDone(true);
      if (res.data.found) {
        const d = res.data.data;
        setJugador({
          nombre: d.name || "",
          apellidos: d.surname || "",
          fecha_nacimiento: d.birthdate || "",
          sexo: d.gender || d.sexo || "",
          dni: d.dni || "",
          telefono: d.phone || d.telefono || "",
          email: d.email || "",
          direccion: d.address || d.direccion || "",
          cp: d.postal_code || d.cp || "",
          ciudad: d.city || d.ciudad || "",
          provincia: d.provincia || "",
          photo_url: d.photo_url || "",
          dni_front_url: d.dni_front_url || "",
          dni_back_url: d.dni_back_url || "",
          _player_id: d.id || "",
        });
      }
    } catch {
      setSearchDone(true);
      setSearchResult({ found: false });
    }
  }

  async function handleSubmit() {
    if (!rgpd) {
      alert("Debes aceptar la política de privacidad para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        jugador,
        tutores: needsTutor ? tutores : [],
        equipo_id: equipoId,
        cuota_id: cuotaId,
        metodo_pago: metodoPago,
        iban: metodoPago === "sepa" ? iban : "",
        rgpd_aceptado: rgpd,
        rgpd_imagen_aceptado: rgpdImagen,
        player_id_existente: jugador._player_id || null,
      };
      const res = await axios.post(`${API_BASE}/public/${CLUB_ID}/forms/${formSlug}/submit`, payload);
      setSubmissionId(res.data.id);
      setStep(activeSteps.length - 1);
    } catch {
      alert("Error al enviar el formulario. Por favor, inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    if (step < activeSteps.length - 1) setStep(step + 1);
  }
  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  if (loading) {
    return (
      <div className="pf-loading">
        <div className="pf-spinner" />
        Cargando formulario…
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-error-page">
        <div className="pf-error-box">
          <span className="pf-error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const progressPct = Math.round(((step + 1) / activeSteps.length) * 100);

  return (
    <div className="pf-page">
      {/* Header */}
      <div className="pf-header">
        {clubSettings?.escudo_url || clubSettings?.logo_url ? (
          <img
            src={clubSettings.escudo_url || clubSettings.logo_url}
            alt={clubSettings.club_name}
            className="pf-club-logo"
          />
        ) : null}
        <div>
          <div className="pf-club-name">{clubSettings?.club_name}</div>
          <div className="pf-form-title">{form?.nombre}</div>
          {form?.descripcion && <div className="pf-form-desc">{form.descripcion}</div>}
        </div>
      </div>

      {/* Progress bar */}
      {currentStepKey !== "confirmacion" && (
        <div className="pf-progress-wrap">
          <div className="pf-progress-bar" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* Card */}
      <div className="pf-card">
        {/* STEP: datos */}
        {currentStepKey === "datos" && (
          <div>
            <h2 className="pf-step-title">Datos personales</h2>

            {/* Search existing player */}
            {form?.permitir_busqueda_existente && (
              <div className="pf-search-box">
                <p className="pf-search-hint">
                  ¿Ya estás registrado? Busca tus datos para no tener que rellenarlos de nuevo:
                </p>
                <form onSubmit={handleSearch} className="pf-search-form">
                  <input
                    className="pf-input"
                    placeholder="Nombre, DNI o email…"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchDone(false); setSearchResult(null); }}
                  />
                  <button type="submit" className="pf-btn-secondary">Buscar</button>
                </form>
                {searchDone && searchResult?.found && (
                  <div className="pf-search-found">
                    ✓ Datos encontrados y cargados. Revisa que todo sea correcto.
                  </div>
                )}
                {searchDone && !searchResult?.found && (
                  <div className="pf-search-notfound">No encontrado. Rellena los datos manualmente.</div>
                )}
              </div>
            )}

            <BaseFields form={form} jugador={jugador} setJugador={setJugador} />
            <ExtraFields campos={form?.campos_extra} jugador={jugador} setJugador={setJugador} />

            <div className="pf-actions">
              <button className="pf-btn-primary" onClick={nextStep}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* STEP: tutor */}
        {currentStepKey === "tutor" && (
          <div>
            <h2 className="pf-step-title">Datos del tutor / representante legal</h2>
            <p className="pf-step-subtitle">
              Al tratarse de un menor de {form?.tutor_edad_minima || 18} años, es obligatorio indicar los datos de al menos un tutor legal.
            </p>
            {tutores.map((t, i) => (
              <TutorForm key={i} idx={i} tutor={t} onChange={(updated) => {
                const next = [...tutores];
                next[i] = updated;
                setTutores(next);
              }} />
            ))}
            {(form?.max_tutores || 2) > 1 && tutores.length < (form?.max_tutores || 2) && (
              <button
                type="button"
                className="pf-btn-secondary"
                onClick={() => setTutores([...tutores, { nombre: "", apellidos: "", dni: "", telefono: "", email: "", relacion: "madre", dni_front_url: "", dni_back_url: "" }])}
              >
                + Añadir segundo tutor
              </button>
            )}
            <div className="pf-actions">
              <button className="pf-btn-ghost" onClick={prevStep}>← Anterior</button>
              <button className="pf-btn-primary" onClick={nextStep}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* STEP: equipo + cuota */}
        {currentStepKey === "equipo_cuota" && (
          <div>
            <h2 className="pf-step-title">Categoría y cuota</h2>

            {form?.seleccion_equipo_activo && (form?.equipos_disponibles || []).length > 0 && (
              <div className="pf-field">
                <label className="pf-label">
                  Categoría / Equipo {form?.seleccion_equipo_obligatorio && <span className="pf-req">*</span>}
                </label>
                <div className="pf-team-grid">
                  {(form.equipos_disponibles || []).map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      className={`pf-team-card${equipoId === eq.id ? " selected" : ""}`}
                      onClick={() => setEquipoId(eq.id)}
                    >
                      <span className="pf-team-name">{eq.name}</span>
                      <span className="pf-team-cat">{eq.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(form?.cuotas_disponibles || []).length > 0 && (
              <div className="pf-field" style={{ marginTop: 24 }}>
                <label className="pf-label">Cuota <span className="pf-req">*</span></label>
                <div className="pf-cuota-list">
                  {(form.cuotas_disponibles || []).map((fee) => (
                    <label key={fee.id} className={`pf-cuota-option${cuotaId === fee.id ? " selected" : ""}`}>
                      <input
                        type="radio"
                        name="cuota"
                        value={fee.id}
                        checked={cuotaId === fee.id}
                        onChange={() => setCuotaId(fee.id)}
                        style={{ display: "none" }}
                      />
                      <div className="pf-cuota-name">{fee.name}</div>
                      {fee.description && <div className="pf-cuota-desc">{fee.description}</div>}
                      <div className="pf-cuota-price">
                        {fee.amount != null ? `${Number(fee.amount).toFixed(2)} €` : "Consultar"}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(form?.metodos_pago || []).length > 0 && (
              <div className="pf-field" style={{ marginTop: 24 }}>
                <label className="pf-label">Método de pago <span className="pf-req">*</span></label>
                <div className="pf-pago-list">
                  {(form.metodos_pago || []).map((m) => {
                    const labels = { sepa: "Domiciliación bancaria (SEPA)", tarjeta: "Tarjeta de crédito/débito", presencial: "Pago presencial en el club" };
                    const icons = { sepa: "🏦", tarjeta: "💳", presencial: "🏟️" };
                    return (
                      <label key={m} className={`pf-pago-option${metodoPago === m ? " selected" : ""}`}>
                        <input type="radio" name="metodo_pago" value={m} checked={metodoPago === m} onChange={() => setMetodoPago(m)} style={{ display: "none" }} />
                        <span>{icons[m] || "💶"}</span>
                        <span>{labels[m] || m}</span>
                      </label>
                    );
                  })}
                </div>
                {metodoPago === "sepa" && (
                  <div className="pf-field" style={{ marginTop: 12 }}>
                    <label className="pf-label">IBAN <span className="pf-req">*</span></label>
                    <input
                      className="pf-input"
                      placeholder="ES12 0000 0000 0000 0000 0000"
                      value={iban}
                      onChange={(e) => setIban(e.target.value.toUpperCase())}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pf-actions">
              <button className="pf-btn-ghost" onClick={prevStep}>← Anterior</button>
              <button className="pf-btn-primary" onClick={nextStep}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* STEP: RGPD */}
        {currentStepKey === "rgpd" && (
          <div>
            <h2 className="pf-step-title">Política de privacidad y autorizaciones</h2>

            {form?.rgpd_texto && (
              <div className="pf-rgpd-box">
                <p>{form.rgpd_texto}</p>
              </div>
            )}

            <label className="pf-check-label pf-rgpd-check">
              <input type="checkbox" checked={rgpd} onChange={(e) => setRgpd(e.target.checked)} required />
              He leído y acepto la política de privacidad <span className="pf-req">*</span>
            </label>

            {form?.rgpd_imagen && (
              <>
                {form?.rgpd_imagen_texto && (
                  <div className="pf-rgpd-box" style={{ marginTop: 16 }}>
                    <p>{form.rgpd_imagen_texto}</p>
                  </div>
                )}
                <label className="pf-check-label pf-rgpd-check" style={{ marginTop: 8 }}>
                  <input type="checkbox" checked={rgpdImagen} onChange={(e) => setRgpdImagen(e.target.checked)} />
                  Autorizo el uso de imágenes y vídeos (opcional)
                </label>
              </>
            )}

            <div className="pf-actions" style={{ marginTop: 32 }}>
              <button className="pf-btn-ghost" onClick={prevStep}>← Anterior</button>
              <button
                className="pf-btn-primary"
                onClick={handleSubmit}
                disabled={!rgpd || submitting}
              >
                {submitting ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        )}

        {/* STEP: confirmacion */}
        {currentStepKey === "confirmacion" && (
          <div className="pf-confirm">
            <div className="pf-confirm-icon">✓</div>
            <h2 className="pf-confirm-title">¡Solicitud enviada!</h2>
            <p className="pf-confirm-text">
              Tu solicitud de inscripción ha sido recibida correctamente. El club la revisará y te contactará en breve para confirmarla.
            </p>
            {submissionId && (
              <p className="pf-confirm-ref">Referencia: <strong>{submissionId.slice(0, 8).toUpperCase()}</strong></p>
            )}
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="/portal" className="pf-btn-primary">Ver más inscripciones</a>
              <a href="https://racing-sangabriel.netlify.app" className="pf-btn-secondary" style={{ textAlign: "center" }}>Ir a la web del club</a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pf-footer">
        <span>Powered by </span>
        <strong>SUDEPORTE</strong>
      </div>

      <style>{`
        :root {
          --pf-primary: #2460FF;
          --pf-secondary: #00296B;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F4F6FB; }
        .pf-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; background: #F4F6FB; }
        .pf-header { width: 100%; max-width: 640px; display: flex; align-items: center; gap: 16px; padding: 24px 16px 12px; }
        .pf-club-logo { width: 64px; height: 64px; object-fit: contain; border-radius: 8px; }
        .pf-club-name { font-size: 13px; font-weight: 600; color: var(--pf-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
        .pf-form-title { font-size: 20px; font-weight: 700; color: #111; margin-top: 2px; }
        .pf-form-desc { font-size: 13px; color: #555; margin-top: 4px; }
        .pf-progress-wrap { width: 100%; max-width: 640px; height: 4px; background: #DDE3F0; margin: 0 auto 0; border-radius: 2px; overflow: hidden; }
        .pf-progress-bar { height: 100%; background: var(--pf-primary); transition: width 0.3s ease; border-radius: 2px; }
        .pf-card { width: 100%; max-width: 640px; background: #fff; border-radius: 12px; padding: 28px 24px; margin: 16px auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .pf-step-title { font-size: 18px; font-weight: 700; color: var(--pf-secondary); margin: 0 0 20px; }
        .pf-step-subtitle { font-size: 14px; color: #555; margin: -12px 0 20px; }
        .pf-field { margin-bottom: 16px; }
        .pf-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .pf-req { color: #E53E3E; margin-left: 2px; }
        .pf-input { width: 100%; border: 1.5px solid #DDE3F0; border-radius: 8px; padding: 10px 12px; font-size: 15px; outline: none; color: #111; transition: border-color 0.2s; background: #fff; }
        .pf-input:focus { border-color: var(--pf-primary); }
        .pf-textarea { resize: vertical; min-height: 80px; }
        .pf-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .pf-two-col { grid-template-columns: 1fr; } }
        .pf-check-field { display: flex; align-items: center; }
        .pf-check-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #333; cursor: pointer; }
        .pf-check-label input { width: 18px; height: 18px; accent-color: var(--pf-primary); flex-shrink: 0; }
        .pf-preview { margin-bottom: 8px; }
        .pf-file-link { color: var(--pf-primary); font-size: 14px; }
        .pf-upload-btn { background: #F4F6FB; border: 1.5px dashed #BCC8E0; border-radius: 8px; padding: 10px 16px; font-size: 14px; color: #444; cursor: pointer; width: 100%; text-align: center; }
        .pf-upload-btn:hover { background: #E8EDFA; }
        .pf-search-box { background: #F0F5FF; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
        .pf-search-hint { font-size: 13px; color: #555; margin: 0 0 10px; }
        .pf-search-form { display: flex; gap: 8px; }
        .pf-search-form .pf-input { flex: 1; }
        .pf-search-found { font-size: 13px; color: #166534; background: #DCFCE7; border-radius: 6px; padding: 8px 12px; margin-top: 8px; }
        .pf-search-notfound { font-size: 13px; color: #555; margin-top: 8px; }
        .pf-tutor-block { background: #F9FAFB; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
        .pf-tutor-title { font-size: 15px; font-weight: 600; color: var(--pf-secondary); margin: 0 0 14px; }
        .pf-team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .pf-team-card { background: #F4F6FB; border: 2px solid #DDE3F0; border-radius: 10px; padding: 14px 10px; cursor: pointer; text-align: center; transition: all 0.15s; display: flex; flex-direction: column; gap: 4px; }
        .pf-team-card:hover { border-color: var(--pf-primary); background: #EEF3FF; }
        .pf-team-card.selected { border-color: var(--pf-primary); background: var(--pf-primary); color: #fff; }
        .pf-team-name { font-size: 14px; font-weight: 700; }
        .pf-team-cat { font-size: 12px; opacity: 0.75; }
        .pf-cuota-list { display: flex; flex-direction: column; gap: 10px; }
        .pf-cuota-option { border: 2px solid #DDE3F0; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; }
        .pf-cuota-option:hover { border-color: var(--pf-primary); }
        .pf-cuota-option.selected { border-color: var(--pf-primary); background: #EEF3FF; }
        .pf-cuota-name { font-size: 15px; font-weight: 600; color: #111; }
        .pf-cuota-desc { font-size: 13px; color: #666; margin-top: 2px; }
        .pf-cuota-price { font-size: 18px; font-weight: 700; color: var(--pf-primary); margin-top: 6px; }
        .pf-pago-list { display: flex; flex-direction: column; gap: 8px; }
        .pf-pago-option { border: 2px solid #DDE3F0; border-radius: 10px; padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 14px; transition: all 0.15s; }
        .pf-pago-option:hover { border-color: var(--pf-primary); }
        .pf-pago-option.selected { border-color: var(--pf-primary); background: #EEF3FF; font-weight: 600; }
        .pf-rgpd-box { background: #F9FAFB; border: 1px solid #DDE3F0; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #444; line-height: 1.6; max-height: 200px; overflow-y: auto; margin-bottom: 16px; }
        .pf-rgpd-check { margin-bottom: 8px; }
        .pf-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; gap: 12px; }
        .pf-btn-primary { background: var(--pf-primary); color: #fff; border: none; border-radius: 8px; padding: 12px 28px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
        .pf-btn-primary:hover { opacity: 0.88; }
        .pf-btn-primary:disabled { opacity: 0.5; cursor: default; }
        .pf-btn-secondary { background: #F4F6FB; color: var(--pf-primary); border: 1.5px solid var(--pf-primary); border-radius: 8px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .pf-btn-ghost { background: transparent; color: #666; border: 1.5px solid #DDE3F0; border-radius: 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; }
        .pf-confirm { text-align: center; padding: 32px 0; }
        .pf-confirm-icon { width: 72px; height: 72px; background: #DCFCE7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
        .pf-confirm-title { font-size: 22px; font-weight: 700; color: #111; margin: 0 0 12px; }
        .pf-confirm-text { font-size: 15px; color: #555; max-width: 400px; margin: 0 auto; line-height: 1.6; }
        .pf-confirm-ref { font-size: 13px; color: #888; margin-top: 12px; }
        .pf-confirm-ref strong { color: #111; font-family: monospace; }
        .pf-footer { font-size: 12px; color: #AAB; padding: 16px; margin-top: auto; }
        .pf-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; color: #555; font-size: 15px; }
        .pf-spinner { width: 32px; height: 32px; border: 3px solid #DDE3F0; border-top-color: var(--pf-primary, #2460FF); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pf-error-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
        .pf-error-box { background: #fff; border-radius: 12px; padding: 32px 24px; text-align: center; max-width: 400px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
        .pf-error-icon { font-size: 32px; display: block; margin-bottom: 12px; }
        .pf-error-box p { color: #555; font-size: 15px; line-height: 1.5; }
        a.pf-btn-primary { text-decoration: none; display: inline-block; }
      `}</style>
    </div>
  );
}
