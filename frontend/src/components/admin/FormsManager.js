import { useState, useEffect } from "react";
import axios from "axios";
import { CLUB_ID, API_BASE } from "../../utils/clubDetect";

const FIELD_TYPES = [
  { value: "texto_corto", label: "Texto corto" },
  { value: "texto_largo", label: "Texto largo" },
  { value: "seleccion", label: "Selección" },
  { value: "archivo", label: "Archivo / Documento" },
  { value: "checkbox", label: "Casilla de verificación" },
  { value: "foto_perfil", label: "Foto de perfil" },
  { value: "dni_anverso", label: "DNI — Cara delantera" },
  { value: "dni_reverso", label: "DNI — Cara trasera" },
];

const FORM_TYPES = [
  { value: "inscripcion", label: "Alta de jugador / deportista" },
  { value: "alta_socio", label: "Alta de socio" },
  { value: "evento", label: "Evento / Campus / Actividad" },
];

const ESTADO_COLORS = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  pago_pendiente: "bg-blue-100 text-blue-800",
};

const PAYMENT_LABELS = {
  sepa: "SEPA / Domiciliación",
  tarjeta: "Tarjeta",
  presencial: "Presencial",
};

// ── SUBMISSIONS LIST ────────────────────────────────────────────────────
function SubmissionsView({ form, onBack }) {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterEstado, setFilterEstado] = useState("");

  useEffect(() => {
    loadSubs();
  }, [filterEstado]);

  async function loadSubs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (filterEstado) params.set("estado", filterEstado);
      const res = await axios.get(`${API_BASE}/forms/${form.id}/submissions?${params}`, { withCredentials: true });
      setSubs(res.data.submissions || []);
      setTotal(res.data.total || 0);
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(subId, estado, notas = "") {
    try {
      await axios.put(`${API_BASE}/forms/submissions/${subId}/status`, { estado, notas }, { withCredentials: true });
      await loadSubs();
      if (selected?.id === subId) setSelected(null);
    } catch {
      alert("Error al actualizar el estado.");
    }
  }

  if (selected) {
    const s = selected;
    const j = s.jugador || {};
    return (
      <div>
        <button className="text-sm text-[#2460FF] mb-4 flex items-center gap-1" onClick={() => setSelected(null)}>
          ← Volver a la lista
        </button>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-lg font-bold text-[#00296B]">{j.nombre} {j.apellidos}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORS[s.estado] || ""}`}>
                {s.estado}
              </span>
            </div>
            <div className="flex gap-2">
              {s.estado === "pendiente" && (
                <>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    onClick={() => updateStatus(s.id, "aprobada")}
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    onClick={() => updateStatus(s.id, "rechazada")}
                  >
                    ✗ Rechazar
                  </button>
                </>
              )}
              {s.estado === "aprobada" && s.player_id && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                  Ficha creada automáticamente
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ["Nombre", `${j.nombre || ""} ${j.apellidos || ""}`],
              ["Fecha de nacimiento", j.fecha_nacimiento],
              ["DNI / NIE", j.dni],
              ["Teléfono", j.telefono],
              ["Email", j.email],
              ["Dirección", j.direccion],
              ["Ciudad / CP", `${j.ciudad || ""} ${j.cp || ""}`],
            ].map(([k, v]) => v ? (
              <div key={k}>
                <span className="text-[#64748B] text-xs uppercase tracking-wide">{k}</span>
                <div className="font-medium text-[#0F172A]">{v}</div>
              </div>
            ) : null)}
          </div>

          {/* Extra fields */}
          {Object.entries(j).filter(([k]) => !["nombre","apellidos","fecha_nacimiento","dni","telefono","email","direccion","cp","ciudad","provincia","sexo","photo_url","dni_front_url","dni_back_url","_player_id"].includes(k)).length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-xs font-semibold text-[#64748B] uppercase mb-2">Campos adicionales</h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {Object.entries(j).filter(([k]) => !["nombre","apellidos","fecha_nacimiento","dni","telefono","email","direccion","cp","ciudad","provincia","sexo","photo_url","dni_front_url","dni_back_url","_player_id"].includes(k)).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[#64748B] text-xs capitalize">{k.replace(/_/g, " ")}</span>
                    <div className="font-medium">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {(j.photo_url || j.dni_front_url || j.dni_back_url) && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-xs font-semibold text-[#64748B] uppercase mb-3">Documentos</h4>
              <div className="flex gap-4 flex-wrap">
                {j.photo_url && (
                  <div className="text-center">
                    <img src={j.photo_url} alt="Foto" className="w-20 h-20 object-cover rounded-lg border" />
                    <div className="text-xs text-[#64748B] mt-1">Foto perfil</div>
                  </div>
                )}
                {j.dni_front_url && (
                  <div className="text-center">
                    <a href={j.dni_front_url} target="_blank" rel="noreferrer">
                      <img src={j.dni_front_url} alt="DNI ant." className="w-32 h-20 object-cover rounded-lg border" />
                    </a>
                    <div className="text-xs text-[#64748B] mt-1">DNI anverso</div>
                  </div>
                )}
                {j.dni_back_url && (
                  <div className="text-center">
                    <a href={j.dni_back_url} target="_blank" rel="noreferrer">
                      <img src={j.dni_back_url} alt="DNI rev." className="w-32 h-20 object-cover rounded-lg border" />
                    </a>
                    <div className="text-xs text-[#64748B] mt-1">DNI reverso</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tutors */}
          {(s.tutores || []).length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-xs font-semibold text-[#64748B] uppercase mb-3">Tutores / Representantes</h4>
              {s.tutores.map((t, i) => (
                <div key={i} className="bg-[#F8FAFC] rounded-lg p-3 mb-2 text-sm">
                  <div className="font-semibold">{t.nombre} {t.apellidos} <span className="text-xs text-[#64748B]">({t.relacion})</span></div>
                  <div className="text-[#64748B]">{t.dni} · {t.telefono} · {t.email}</div>
                </div>
              ))}
            </div>
          )}

          {/* Payment */}
          <div className="mt-4 border-t pt-4">
            <h4 className="text-xs font-semibold text-[#64748B] uppercase mb-2">Pago</h4>
            <div className="text-sm grid grid-cols-2 gap-x-8 gap-y-2">
              {s.equipo_nombre && <div><span className="text-[#64748B] text-xs">Equipo</span><div className="font-medium">{s.equipo_nombre}</div></div>}
              {s.cuota_nombre && <div><span className="text-[#64748B] text-xs">Cuota</span><div className="font-medium">{s.cuota_nombre} — {s.cuota_importe != null ? `${Number(s.cuota_importe).toFixed(2)} €` : ""}</div></div>}
              {s.metodo_pago && <div><span className="text-[#64748B] text-xs">Método</span><div className="font-medium">{PAYMENT_LABELS[s.metodo_pago] || s.metodo_pago}</div></div>}
              {s.iban && <div><span className="text-[#64748B] text-xs">IBAN</span><div className="font-mono font-medium text-xs">{s.iban}</div></div>}
            </div>
          </div>

          {/* RGPD */}
          <div className="mt-4 border-t pt-4 text-xs text-[#64748B]">
            RGPD aceptado: <strong>{s.rgpd_aceptado ? "Sí" : "No"}</strong>
            {s.rgpd_timestamp && ` — ${new Date(s.rgpd_timestamp).toLocaleString("es-ES")}`}
            {s.rgpd_imagen_aceptado && " · Autorización imagen: Sí"}
          </div>

          {/* Meta */}
          <div className="mt-2 text-xs text-[#94A3B8]">
            Recibido: {new Date(s.created_at).toLocaleString("es-ES")}
            {s.player_id && ` · ID ficha: ${s.player_id.slice(0, 8)}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button className="text-sm text-[#2460FF] flex items-center gap-1" onClick={onBack}>← Volver a formularios</button>
        <div className="flex items-center gap-2">
          <select
            className="text-sm border border-[#E2E8F0] rounded-lg px-2 py-1.5"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
            <option value="pago_pendiente">Pago pendiente</option>
          </select>
          <span className="text-sm text-[#64748B]">{total} inscripción{total !== 1 ? "es" : ""}</span>
        </div>
      </div>

      <h3 className="text-base font-bold text-[#00296B] mb-4">Inscripciones — {form.nombre}</h3>

      {loading ? (
        <div className="text-center py-8 text-[#94A3B8]">Cargando…</div>
      ) : subs.length === 0 ? (
        <div className="text-center py-12 text-[#94A3B8]">
          <div className="text-3xl mb-2">📋</div>
          No hay inscripciones{filterEstado ? ` con estado "${filterEstado}"` : " todavía"}.
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => {
            const j = s.jugador || {};
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4 hover:border-[#2460FF]/40 cursor-pointer transition-colors"
                onClick={() => setSelected(s)}
              >
                {j.photo_url ? (
                  <img src={j.photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-[#E2E8F0] flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#EEF3FF] flex items-center justify-center text-[#2460FF] font-bold text-sm flex-shrink-0">
                    {(j.nombre || "?")[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0F172A] text-sm">{j.nombre} {j.apellidos}</div>
                  <div className="text-xs text-[#64748B] truncate">
                    {s.equipo_nombre && `${s.equipo_nombre} · `}
                    {j.email}
                    {j.fecha_nacimiento && ` · ${j.fecha_nacimiento}`}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORS[s.estado] || "bg-gray-100 text-gray-600"}`}>
                    {s.estado}
                  </span>
                  <span className="text-xs text-[#94A3B8]">
                    {new Date(s.created_at).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── FORM BUILDER ───────────────────────────────────────────────────────
function FormBuilder({ editingForm, fees, teams, onSave, onCancel }) {
  const isNew = !editingForm;
  const [draft, setDraft] = useState(editingForm || {
    slug: "",
    tipo: "inscripcion",
    nombre: "",
    descripcion: "",
    activo: true,
    max_plazas: null,
    lista_espera: false,
    campos_base: {
      nombre: true, apellidos: true, fecha_nacimiento: true, sexo: true, dni: false,
      telefono: true, email: true, direccion: false, cp: false, ciudad: false, provincia: false,
      nombre_obligatorio: true, apellidos_obligatorio: true, fecha_nacimiento_obligatorio: true,
      sexo_obligatorio: false, dni_obligatorio: false, telefono_obligatorio: false, email_obligatorio: true,
    },
    campos_extra: [],
    incluir_tutor: true,
    tutor_edad_minima: 18,
    max_tutores: 2,
    seleccion_equipo_activo: true,
    seleccion_equipo_obligatorio: true,
    equipos_ids: [],
    cuotas_ids: [],
    metodos_pago: ["presencial"],
    rgpd_texto: "Al completar este formulario, sus datos personales serán tratados por el club de acuerdo con el Reglamento General de Protección de Datos (RGPD) 2016/679.",
    rgpd_imagen: false,
    rgpd_imagen_texto: "Autorizo al club a publicar fotografías y vídeos en los que pueda aparecer el deportista, en redes sociales y comunicaciones del club.",
    permitir_busqueda_existente: true,
    auto_aprobar: true,
  });
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({ tipo: "texto_corto", nombre: "", obligatorio: false, opciones: [] });
  const [newOpcion, setNewOpcion] = useState("");

  function upd(k, v) { setDraft(d => ({ ...d, [k]: v })); }
  function updBase(k, v) { setDraft(d => ({ ...d, campos_base: { ...(d.campos_base || {}), [k]: v } })); }

  const FILE_MAPEO = { foto_perfil: "photo_url", dni_anverso: "dni_front_url", dni_reverso: "dni_back_url" };
  function addField() {
    if (!newField.nombre) return;
    const campo = {
      ...newField,
      id: `c_${Date.now()}`,
      orden: (draft.campos_extra || []).length,
      mapea_a: FILE_MAPEO[newField.tipo] || newField.mapea_a || "",
    };
    upd("campos_extra", [...(draft.campos_extra || []), campo]);
    setNewField({ tipo: "texto_corto", nombre: "", obligatorio: false, opciones: [] });
    setNewOpcion("");
  }

  function removeField(id) {
    upd("campos_extra", (draft.campos_extra || []).filter(c => c.id !== id));
  }

  function autoSlug(name) {
    return name.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSave() {
    if (!draft.nombre || !draft.slug) { alert("El nombre y el slug son obligatorios."); return; }
    setSaving(true);
    try {
      if (isNew) {
        await axios.post(`${API_BASE}/forms`, draft, { withCredentials: true });
      } else {
        await axios.put(`${API_BASE}/forms/${draft.id}`, draft, { withCredentials: true });
      }
      onSave();
    } catch (e) {
      alert(e.response?.data?.detail || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const BASE_FIELDS = [
    ["nombre", "Nombre"], ["apellidos", "Apellidos"], ["fecha_nacimiento", "Fecha de nacimiento"],
    ["sexo", "Sexo"], ["dni", "DNI / NIE"], ["telefono", "Teléfono"], ["email", "Email"],
    ["direccion", "Dirección"], ["cp", "Código postal"], ["ciudad", "Ciudad"], ["provincia", "Provincia"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-[#00296B]">{isNew ? "Nuevo formulario" : `Editar — ${draft.nombre}`}</h3>
        <button className="text-sm text-[#2460FF]" onClick={onCancel}>← Volver</button>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        <h4 className="font-semibold text-[#00296B] text-sm">Información básica</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">Nombre del formulario *</label>
            <input className="admin-input" value={draft.nombre} onChange={(e) => {
              upd("nombre", e.target.value);
              if (isNew) upd("slug", autoSlug(e.target.value));
            }} placeholder="Ej: Alta de Jugador 2026-27" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">Slug (URL) *</label>
            <input className="admin-input font-mono text-sm" value={draft.slug} onChange={(e) => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="alta-jugador-2026" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">Tipo de formulario</label>
            <select className="admin-input" value={draft.tipo} onChange={(e) => upd("tipo", e.target.value)}>
              {FORM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2 pt-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={draft.activo} onChange={(e) => upd("activo", e.target.checked)} className="w-4 h-4 accent-[#2460FF]" />
              Formulario activo (visible públicamente)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!draft.auto_aprobar} onChange={(e) => upd("auto_aprobar", e.target.checked)} className="w-4 h-4 accent-green-600" />
              <span>
                <span className="font-medium text-green-700">Alta automática</span>
                <span className="text-[#64748B]"> — el jugador se crea al instante, sin revisión manual</span>
              </span>
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">Plazas máximas <span className="font-normal text-[#94A3B8]">(vacío = sin límite)</span></label>
            <input
              type="number"
              className="admin-input"
              value={draft.max_plazas || ""}
              onChange={(e) => upd("max_plazas", e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Ej: 30"
              min={1}
            />
          </div>
          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!draft.lista_espera} onChange={(e) => upd("lista_espera", e.target.checked)} className="w-4 h-4 accent-[#2460FF]" disabled={!draft.max_plazas} />
              <span className={!draft.max_plazas ? "text-[#94A3B8]" : ""}>
                Lista de espera cuando se llene
              </span>
            </label>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#64748B] block mb-1">Descripción (opcional)</label>
          <textarea className="admin-input" rows={2} value={draft.descripcion} onChange={(e) => upd("descripcion", e.target.value)} placeholder="Información adicional para los usuarios del formulario" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={draft.permitir_busqueda_existente} onChange={(e) => upd("permitir_busqueda_existente", e.target.checked)} className="w-4 h-4 accent-[#2460FF]" />
            Permitir buscar jugador/socio existente (evita re-introducir datos)
          </label>
        </div>
      </div>

      {/* Base fields */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h4 className="font-semibold text-[#00296B] text-sm mb-3">Campos base</h4>
        <div className="space-y-2">
          {BASE_FIELDS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-4 text-sm py-1 border-b border-[#F1F5F9] last:border-0">
              <label className="flex items-center gap-2 w-40 cursor-pointer">
                <input type="checkbox" checked={!!(draft.campos_base?.[key] !== false)} onChange={(e) => updBase(key, e.target.checked)} className="w-4 h-4 accent-[#2460FF]" />
                <span>{label}</span>
              </label>
              {draft.campos_base?.[key] !== false && (
                <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
                  <input type="checkbox" checked={!!draft.campos_base?.[`${key}_obligatorio`]} onChange={(e) => updBase(`${key}_obligatorio`, e.target.checked)} className="w-3.5 h-3.5 accent-[#2460FF]" />
                  Obligatorio
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Extra fields */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h4 className="font-semibold text-[#00296B] text-sm mb-3">Campos adicionales</h4>
        {(draft.campos_extra || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {(draft.campos_extra || []).sort((a, b) => a.orden - b.orden).map((campo) => (
              <div key={campo.id} className="flex items-center gap-3 bg-[#F8FAFC] rounded-lg px-3 py-2 text-sm">
                <span className="text-[#64748B] text-xs bg-[#E2E8F0] px-2 py-0.5 rounded">{FIELD_TYPES.find(t => t.value === campo.tipo)?.label || campo.tipo}</span>
                <span className="flex-1 font-medium">{campo.nombre}</span>
                {campo.obligatorio && <span className="text-xs text-red-500">Obligatorio</span>}
                {campo.opciones?.length > 0 && <span className="text-xs text-[#64748B]">{campo.opciones.length} opciones</span>}
                <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => removeField(campo.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="border border-dashed border-[#CBD5E1] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#64748B] block mb-1">Tipo de campo</label>
              <select className="admin-input text-sm" value={newField.tipo} onChange={(e) => setNewField(f => ({ ...f, tipo: e.target.value, opciones: [] }))}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] block mb-1">Nombre del campo</label>
              <input className="admin-input text-sm" value={newField.nombre} onChange={(e) => setNewField(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Talla camiseta" />
            </div>
          </div>
          {newField.tipo === "seleccion" && (
            <div>
              <label className="text-xs font-semibold text-[#64748B] block mb-1">Opciones</label>
              <div className="flex gap-2 mb-2">
                <input className="admin-input text-sm flex-1" value={newOpcion} onChange={(e) => setNewOpcion(e.target.value)} placeholder="Nueva opción" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newOpcion.trim()) { setNewField(f => ({ ...f, opciones: [...f.opciones, newOpcion.trim()] })); setNewOpcion(""); } } }} />
                <button className="px-3 py-1.5 bg-[#EEF3FF] text-[#2460FF] rounded-lg text-sm font-medium" onClick={() => { if (newOpcion.trim()) { setNewField(f => ({ ...f, opciones: [...f.opciones, newOpcion.trim()] })); setNewOpcion(""); } }}>+ Añadir</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(newField.opciones || []).map((o, i) => (
                  <span key={i} className="text-xs bg-[#EEF3FF] text-[#2460FF] px-2 py-0.5 rounded-full flex items-center gap-1">
                    {o}
                    <button onClick={() => setNewField(f => ({ ...f, opciones: f.opciones.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">✕</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newField.obligatorio} onChange={(e) => setNewField(f => ({ ...f, obligatorio: e.target.checked }))} className="w-4 h-4 accent-[#2460FF]" />
              Campo obligatorio
            </label>
            <button className="bg-[#2460FF] hover:bg-[#1a4fd8] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40" onClick={addField} disabled={!newField.nombre}>
              + Añadir campo
            </button>
          </div>
        </div>
      </div>

      {/* Tutor */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3">
        <h4 className="font-semibold text-[#00296B] text-sm">Tutor / Representante legal</h4>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={draft.incluir_tutor} onChange={(e) => upd("incluir_tutor", e.target.checked)} className="w-4 h-4 accent-[#2460FF]" />
          Solicitar datos de tutor para menores
        </label>
        {draft.incluir_tutor && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-[#64748B] block mb-1">Edad mínima sin tutor</label>
              <input type="number" className="admin-input" value={draft.tutor_edad_minima} onChange={(e) => upd("tutor_edad_minima", parseInt(e.target.value))} min={1} max={21} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] block mb-1">Máximo de tutores</label>
              <select className="admin-input" value={draft.max_tutores} onChange={(e) => upd("max_tutores", parseInt(e.target.value))}>
                <option value={1}>1 tutor</option>
                <option value={2}>2 tutores</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Team & Fees */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        <h4 className="font-semibold text-[#00296B] text-sm">Equipo y cuota</h4>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={draft.seleccion_equipo_activo} onChange={(e) => upd("seleccion_equipo_activo", e.target.checked)} className="w-4 h-4 accent-[#2460FF]" />
          Mostrar selector de categoría / equipo
        </label>
        {draft.seleccion_equipo_activo && (
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">Equipos disponibles (vacío = todos)</label>
            <div className="flex flex-wrap gap-2">
              {teams.map(t => (
                <label key={t.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${(draft.equipos_ids || []).includes(t.id) ? "border-[#2460FF] bg-[#EEF3FF] text-[#2460FF]" : "border-[#E2E8F0] text-[#475569]"}`}>
                  <input type="checkbox" className="hidden" checked={(draft.equipos_ids || []).includes(t.id)} onChange={(e) => {
                    const ids = draft.equipos_ids || [];
                    upd("equipos_ids", e.target.checked ? [...ids, t.id] : ids.filter(id => id !== t.id));
                  }} />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-[#64748B] block mb-1">Cuotas disponibles</label>
          <div className="space-y-1">
            {fees.length === 0 && <div className="text-xs text-[#94A3B8]">No hay tarifas creadas. Crea tarifas en la sección "Tarifas".</div>}
            {fees.map(f => (
              <label key={f.id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors ${(draft.cuotas_ids || []).includes(f.id) ? "border-[#2460FF] bg-[#EEF3FF]" : "border-[#E2E8F0]"}`}>
                <input type="checkbox" className="w-4 h-4 accent-[#2460FF]" checked={(draft.cuotas_ids || []).includes(f.id)} onChange={(e) => {
                  const ids = draft.cuotas_ids || [];
                  upd("cuotas_ids", e.target.checked ? [...ids, f.id] : ids.filter(id => id !== f.id));
                }} />
                <span>{f.name}</span>
                {f.amount != null && <span className="text-[#64748B] text-xs ml-auto">{Number(f.amount).toFixed(2)} €</span>}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#64748B] block mb-1">Métodos de pago</label>
          <div className="flex gap-2 flex-wrap">
            {[["presencial", "Presencial"], ["sepa", "SEPA / Domiciliación"], ["tarjeta", "Tarjeta"]].map(([k, l]) => (
              <label key={k} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${(draft.metodos_pago || []).includes(k) ? "border-[#2460FF] bg-[#EEF3FF] text-[#2460FF]" : "border-[#E2E8F0] text-[#475569]"}`}>
                <input type="checkbox" className="hidden" checked={(draft.metodos_pago || []).includes(k)} onChange={(e) => {
                  const m = draft.metodos_pago || [];
                  upd("metodos_pago", e.target.checked ? [...m, k] : m.filter(x => x !== k));
                }} />
                {l}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RGPD */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        <h4 className="font-semibold text-[#00296B] text-sm">RGPD y autorizaciones</h4>
        <div>
          <label className="text-xs font-semibold text-[#64748B] block mb-1">Texto de política de privacidad</label>
          <textarea className="admin-input" rows={4} value={draft.rgpd_texto} onChange={(e) => upd("rgpd_texto", e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={draft.rgpd_imagen} onChange={(e) => upd("rgpd_imagen", e.target.checked)} className="w-4 h-4 accent-[#2460FF]" />
          Incluir autorización de imagen
        </label>
        {draft.rgpd_imagen && (
          <div>
            <label className="text-xs font-semibold text-[#64748B] block mb-1">Texto de autorización de imagen</label>
            <textarea className="admin-input" rows={3} value={draft.rgpd_imagen_texto} onChange={(e) => upd("rgpd_imagen_texto", e.target.value)} />
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex gap-3 justify-end">
        <button className="px-4 py-2 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B]" onClick={onCancel}>Cancelar</button>
        <button className="bg-[#2460FF] hover:bg-[#1a4fd8] text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-50" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : isNew ? "Crear formulario" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

// ── MAIN MANAGER ───────────────────────────────────────────────────────
export default function FormsManager() {
  const [forms, setForms] = useState([]);
  const [fees, setFees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | new | edit | submissions
  const [editingForm, setEditingForm] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [fr, fe, te] = await Promise.all([
        axios.get(`${API_BASE}/forms`, { withCredentials: true }),
        axios.get(`${API_BASE}/fees`, { withCredentials: true }),
        axios.get(`${API_BASE}/teams`, { withCredentials: true }),
      ]);
      setForms(fr.data || []);
      setFees(fe.data || []);
      setTeams(te.data || []);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteForm(id) {
    if (!window.confirm("¿Eliminar este formulario? Las inscripciones recibidas no se eliminarán.")) return;
    try {
      await axios.delete(`${API_BASE}/forms/${id}`, { withCredentials: true });
      setForms(forms.filter(f => f.id !== id));
    } catch {
      alert("Error al eliminar.");
    }
  }

  async function toggleActive(form) {
    try {
      await axios.put(`${API_BASE}/forms/${form.id}`, { activo: !form.activo }, { withCredentials: true });
      setForms(forms.map(f => f.id === form.id ? { ...f, activo: !f.activo } : f));
    } catch {
      alert("Error al actualizar.");
    }
  }

  async function duplicateForm(id) {
    try {
      await axios.post(`${API_BASE}/forms/${id}/duplicate`, {}, { withCredentials: true });
      await loadAll();
    } catch {
      alert("Error al duplicar.");
    }
  }

  function exportSubmissions(id, slug) {
    const url = `${API_BASE}/forms/${id}/export-submissions`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inscripciones-${slug}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (view === "submissions" && selectedForm) {
    return <SubmissionsView form={selectedForm} onBack={() => { setView("list"); setSelectedForm(null); }} />;
  }

  if (view === "new" || view === "edit") {
    return (
      <FormBuilder
        editingForm={view === "edit" ? editingForm : null}
        fees={fees}
        teams={teams}
        onSave={() => { loadAll(); setView("list"); setEditingForm(null); }}
        onCancel={() => { setView("list"); setEditingForm(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#00296B]">Formularios de inscripción</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Crea formularios públicos para inscribir jugadores, socios o eventos</p>
        </div>
        <button
          className="bg-[#2460FF] hover:bg-[#1a4fd8] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          onClick={() => setView("new")}
        >
          + Nuevo formulario
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#94A3B8]">Cargando…</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-16 text-[#94A3B8]">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-semibold text-[#475569] mb-1">Aún no tienes formularios</div>
          <div className="text-sm mb-4">Crea el primero para que los jugadores puedan inscribirse online</div>
          <button className="bg-[#2460FF] text-white font-semibold px-4 py-2 rounded-xl text-sm" onClick={() => setView("new")}>
            Crear formulario
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(f => {
            const publicUrl = `${window.location.origin}/registro/${f.slug}`;
            const plazasUsadas = f.total_inscripciones || 0;
            const plazasPct = f.max_plazas ? Math.min(100, Math.round((plazasUsadas / f.max_plazas) * 100)) : null;
            return (
              <div key={f.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-[#0F172A] text-base">{f.nombre}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {f.activo ? "Activo" : "Inactivo"}
                      </span>
                      <span className="text-xs text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                        {FORM_TYPES.find(t => t.value === f.tipo)?.label || f.tipo}
                      </span>
                      {f.pendientes > 0 && (
                        <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {f.pendientes} pendiente{f.pendientes !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {f.descripcion && <p className="text-sm text-[#64748B] mb-2">{f.descripcion}</p>}

                    {/* Plazas indicator */}
                    {f.max_plazas && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-[#64748B] mb-1">
                          <span>{plazasUsadas} / {f.max_plazas} plazas</span>
                          {plazasPct >= 100 ? (
                            <span className="text-red-600 font-semibold">COMPLETO{f.lista_espera ? " — lista de espera" : ""}</span>
                          ) : plazasPct >= 80 ? (
                            <span className="text-orange-600 font-semibold">Quedan pocas plazas</span>
                          ) : null}
                        </div>
                        <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${plazasPct >= 100 ? "bg-red-500" : plazasPct >= 80 ? "bg-orange-400" : "bg-[#2460FF]"}`}
                            style={{ width: `${plazasPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 mb-2 text-xs text-[#64748B]">
                      <span>📋 {f.total_inscripciones || 0} inscripción{(f.total_inscripciones || 0) !== 1 ? "es" : ""}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded">
                        /registro/{f.slug}
                      </span>
                      <button
                        className="text-xs text-[#2460FF] hover:underline"
                        onClick={() => { navigator.clipboard.writeText(publicUrl); alert("¡Enlace copiado!"); }}
                      >
                        Copiar enlace
                      </button>
                      <a href={`/registro/${f.slug}`} target="_blank" rel="noreferrer" className="text-xs text-[#2460FF] hover:underline">
                        Ver ↗
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      className="text-sm font-semibold text-white bg-[#2460FF] hover:bg-[#1a4fd8] px-3 py-1.5 rounded-lg"
                      onClick={() => { setSelectedForm(f); setView("submissions"); }}
                    >
                      Ver inscripciones {f.pendientes > 0 && <span className="ml-1 bg-white/30 px-1.5 rounded-full">{f.pendientes}</span>}
                    </button>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        className="text-xs border border-[#E2E8F0] hover:border-[#2460FF]/40 text-[#475569] px-2 py-1.5 rounded-lg"
                        onClick={() => { setEditingForm(f); setView("edit"); }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-xs border border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]/40 px-2 py-1.5 rounded-lg"
                        title="Duplicar formulario"
                        onClick={() => duplicateForm(f.id)}
                      >
                        Duplicar
                      </button>
                      <button
                        className="text-xs border border-[#E2E8F0] text-[#475569] hover:border-green-400 px-2 py-1.5 rounded-lg"
                        title="Exportar a Excel"
                        onClick={() => exportSubmissions(f.id, f.slug)}
                      >
                        Excel
                      </button>
                      <button
                        className="text-xs border border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]/40 px-2 py-1.5 rounded-lg"
                        onClick={() => toggleActive(f)}
                      >
                        {f.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="text-xs border border-red-200 text-red-400 hover:text-red-600 hover:border-red-400 px-2 py-1.5 rounded-lg"
                        onClick={() => deleteForm(f.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
