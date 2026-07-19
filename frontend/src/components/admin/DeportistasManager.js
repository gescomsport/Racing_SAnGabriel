import { useState, useEffect, useCallback } from "react";
import {
  Download, Upload, Search, X, Users, Shield, Star, Plus, Edit2, Trash2,
  Save, ChevronDown, CreditCard, ShoppingCart, FileText, User, Phone, Mail,
  MapPin, Calendar, Droplets, ClipboardList, Euro, ChevronRight
} from "lucide-react";
import DocumentUploader from "./DocumentUploader";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Sheet, SheetContent } from "../ui/sheet";
import { Textarea } from "../ui/textarea";
import ax from "../../api";

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  active:   "bg-green-50 text-green-700 border-green-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  injured:  "bg-orange-50 text-orange-700 border-orange-200",
};
const STATUS_LABELS = {
  active: "Activo", pending: "Pendiente", inactive: "Baja",
  rejected: "Rechazado", injured: "Lesionado",
};
const RELATIONSHIP_LABELS = {
  padre: "Padre", madre: "Madre", tutor_legal: "Tutor legal",
  abuelo: "Abuelo/a", otro: "Otro",
};
const GENDER_LABELS = { masculino: "Masculino", femenino: "Femenino", otro: "Otro" };
const BLANK_GUARDIAN = {
  name: "", surname: "", dni: "", phone: "", email: "",
  address: "", city: "", relationship: "padre", bank_iban: "", notes: "", player_ids: [],
};
const BLANK_MEMBER = {
  name: "", surname: "", dni: "", birthdate: "", phone: "", email: "",
  address: "", city: "", postal_code: "", member_type: "socio_adulto",
  bank_iban: "", status: "active", season: "2025/2026", notes: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(birthdate) {
  if (!birthdate) return null;
  try {
    const bd = new Date(birthdate);
    return Math.floor((Date.now() - bd) / (365.25 * 24 * 3600 * 1000));
  } catch { return null; }
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-[#475569] uppercase tracking-wider mb-3 mt-5 first:mt-0">
      <Icon size={13} className="text-[#94A3B8]" />
      {label}
    </div>
  );
}

function FieldRow({ label, value, edit, editEl }) {
  return (
    <div>
      <p className="text-xs text-[#94A3B8] mb-0.5">{label}</p>
      {edit ? editEl : <p className="text-sm font-medium text-[#0F172A]">{value || <span className="text-[#CBD5E1]">—</span>}</p>}
    </div>
  );
}

// ─── Player Profile Sheet ─────────────────────────────────────────────────────

function PlayerProfileSheet({ player, teams, onClose, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [guardians, setGuardians] = useState([]);
  const [fees, setFees] = useState([]);
  const [products, setProducts] = useState([]);
  const [playerSales, setPlayerSales] = useState([]);
  const [playerPayments, setPlayerPayments] = useState([]);
  const [saving, setSaving] = useState(false);

  // Fee assignment state
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [feeForm, setFeeForm] = useState({ fee_id: "", concept: "", amount: "", due_date: "", notes: "" });

  // Sale creation state
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleForm, setSaleForm] = useState({ product_id: "", fee_id: "", concept: "", amount: "", payment_method: "pending", due_date: "", notes: "" });

  // Guardian edit
  const [editGuardianId, setEditGuardianId] = useState(null);
  const [guardianForms, setGuardianForms] = useState({});

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));

  const load = useCallback(async () => {
    if (!player?.id) return;
    const [gr, fr, pr, sl, pm] = await Promise.all([
      ax.get(`/guardians/by-player/${player.id}`).catch(() => ({ data: [] })),
      ax.get("/fees").catch(() => ({ data: [] })),
      ax.get("/products").catch(() => ({ data: [] })),
      ax.get(`/sales?person_id=${player.id}`).catch(() => ({ data: [] })),
      ax.get(`/payments?person_id=${player.id}`).catch(() => ({ data: [] })),
    ]);
    setGuardians(gr.data);
    setFees(fr.data.filter(f => f.active !== false));
    setProducts(pr.data.filter(p => p.active !== false));
    setPlayerSales(sl.data.slice(0, 10));
    setPlayerPayments(pm.data.slice(0, 10));
    const gForms = {};
    gr.data.forEach(g => { gForms[g.id] = { ...g }; });
    setGuardianForms(gForms);
  }, [player?.id]);

  useEffect(() => {
    if (player) {
      setForm({ ...player });
      setEditing(false);
      load();
    }
  }, [player, load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await ax.put(`/players/${player.id}`, form);
      onSaved(updated.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar a ${player.name} ${player.surname}? Esta acción no se puede deshacer.`)) return;
    await ax.delete(`/players/${player.id}`);
    onDeleted(player.id);
    onClose();
  };

  const handleSaveGuardian = async (gid) => {
    const data = guardianForms[gid];
    await ax.put(`/guardians/${gid}`, data);
    setEditGuardianId(null);
    load();
  };

  const handleDeleteGuardian = async (gid) => {
    if (!window.confirm("¿Eliminar este tutor?")) return;
    await ax.delete(`/guardians/${gid}`);
    load();
  };

  const handleAssignFee = async () => {
    const selected = fees.find(f => f.id === feeForm.fee_id);
    const concept = feeForm.concept || selected?.name || "Cuota";
    const amount = parseFloat(feeForm.amount) || selected?.amount || 0;
    await ax.post("/payments", {
      person_id: player.id,
      person_type: "player",
      fee_id: feeForm.fee_id,
      concept,
      amount,
      due_date: feeForm.due_date || "",
      notes: feeForm.notes || "",
      status: "pending",
    });
    setFeeDialogOpen(false);
    setFeeForm({ fee_id: "", concept: "", amount: "", due_date: "", notes: "" });
    load();
  };

  const handleCreateSale = async () => {
    if (!saleForm.concept.trim() || !saleForm.amount) return;
    await ax.post("/sales", {
      person_id: player.id,
      person_type: "player",
      product_id: saleForm.product_id || "",
      fee_id: saleForm.fee_id || "",
      concept: saleForm.concept,
      amount: parseFloat(saleForm.amount),
      payment_method: saleForm.payment_method,
      due_date: saleForm.due_date || "",
      notes: saleForm.notes || "",
      status: saleForm.payment_method === "cash" ? "paid" : "pending",
    });
    setSaleDialogOpen(false);
    setSaleForm({ product_id: "", fee_id: "", concept: "", amount: "", payment_method: "pending", due_date: "", notes: "" });
    load();
  };

  const age = calcAge(form.birthdate);
  const isMinor = age !== null && age < 18;
  const team = teamMap[form.team_id] || {};

  if (!player) return null;

  return (
    <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#00296B] text-white p-5">
        <div className="flex items-start gap-4">
          {form.photo_url ? (
            <img src={form.photo_url} alt={form.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-white/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
              {(form.name || "?")[0]}{(form.surname || "")[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-tight">{form.name} {form.surname}</h2>
            <p className="text-white/70 text-sm mt-0.5">{team.name || "Sin equipo"}{team.category ? ` · ${team.category}` : ""}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[form.status] || STATUS_COLORS.inactive}`}>
                {STATUS_LABELS[form.status] || form.status}
              </span>
              {isMinor && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Menor {age}a</span>}
              {age != null && !isMinor && <span className="text-xs text-white/60">{age} años</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {editing ? (
            <>
              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs" onClick={handleSave} disabled={saving}>
                <Save size={12} className="mr-1" />{saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10 text-xs" onClick={() => { setForm({ ...player }); setEditing(false); }}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white text-xs" onClick={() => setEditing(true)}>
              <Edit2 size={12} className="mr-1" />Editar ficha
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-100 hover:bg-white/10 text-xs ml-auto" onClick={handleDelete}>
            <Trash2 size={12} className="mr-1" />Eliminar
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-0">

        {/* Estado rápido */}
        {editing && (
          <div>
            <SectionTitle icon={ClipboardList} label="Estado" />
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Datos personales */}
        <SectionTitle icon={User} label="Datos personales" />
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="Nombre" value={form.name} edit={editing}
            editEl={<Input value={form.name || ""} onChange={e => set("name", e.target.value)} className="mt-1 text-sm" />} />
          <FieldRow label="Apellidos" value={form.surname} edit={editing}
            editEl={<Input value={form.surname || ""} onChange={e => set("surname", e.target.value)} className="mt-1 text-sm" />} />
          <FieldRow label="Fecha de nacimiento" value={form.birthdate} edit={editing}
            editEl={<Input type="date" value={form.birthdate || ""} onChange={e => set("birthdate", e.target.value)} className="mt-1 text-sm" />} />
          <FieldRow label="Edad" value={age != null ? `${age} años` : "—"} edit={false} />
          <FieldRow label="DNI / NIE" value={form.dni} edit={editing}
            editEl={<Input value={form.dni || ""} onChange={e => set("dni", e.target.value)} className="mt-1 text-sm" />} />
          <FieldRow label="Género" value={GENDER_LABELS[form.gender] || form.gender} edit={editing}
            editEl={
              <Select value={form.gender || ""} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            } />
          <FieldRow label="Teléfono" value={form.phone} edit={editing}
            editEl={<Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} className="mt-1 text-sm" />} />
          <FieldRow label="Email" value={form.email} edit={editing}
            editEl={<Input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} className="mt-1 text-sm" />} />
        </div>

        {/* Dirección */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FieldRow label="Dirección" value={form.address} edit={editing}
              editEl={<Input value={form.address || ""} onChange={e => set("address", e.target.value)} className="mt-1 text-sm" />} />
          </div>
          <FieldRow label="Ciudad" value={form.city} edit={editing}
            editEl={<Input value={form.city || ""} onChange={e => set("city", e.target.value)} className="mt-1 text-sm" />} />
          <FieldRow label="Código postal" value={form.postal_code} edit={editing}
            editEl={<Input value={form.postal_code || ""} onChange={e => set("postal_code", e.target.value)} className="mt-1 text-sm" />} />
        </div>

        {/* Datos deportivos */}
        <SectionTitle icon={Star} label="Datos deportivos" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldRow label="Equipo" value={team.name} edit={editing}
              editEl={
                <Select value={form.team_id || ""} onValueChange={v => set("team_id", v === "_none" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin equipo</SelectItem>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}{t.category ? ` (${t.category})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              } />
          </div>
          <FieldRow label="Categoría" value={team.category || "—"} edit={false} />
          <FieldRow label="Temporada" value={form.season} edit={editing}
            editEl={<Input value={form.season || ""} onChange={e => set("season", e.target.value)} className="mt-1 text-sm" placeholder="2026/2027" />} />
          <FieldRow label="Talla camiseta" value={form.jersey_size} edit={editing}
            editEl={
              <Select value={form.jersey_size || ""} onValueChange={v => set("jersey_size", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["4", "6", "8", "10", "12", "14", "XS", "S", "M", "L", "XL", "XXL"].map(s =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            } />
          <FieldRow label="Posición" value={form.position} edit={editing}
            editEl={<Input value={form.position || ""} onChange={e => set("position", e.target.value)} className="mt-1 text-sm" placeholder="Ej: Portero" />} />
          <FieldRow label="Dorsal" value={form.number} edit={editing}
            editEl={<Input type="number" value={form.number || ""} onChange={e => set("number", parseInt(e.target.value) || null)} className="mt-1 text-sm" />} />
        </div>

        {/* Datos bancarios */}
        <SectionTitle icon={CreditCard} label="Datos bancarios" />
        <FieldRow label="IBAN" value={form.bank_iban} edit={editing}
          editEl={<Input value={form.bank_iban || ""} onChange={e => set("bank_iban", e.target.value)} className="mt-1 text-sm font-mono" placeholder="ES00 0000 0000 00 0000000000" />} />

        {/* Datos médicos */}
        <SectionTitle icon={Droplets} label="Salud" />
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="Grupo sanguíneo" value={form.blood_type} edit={editing}
            editEl={
              <Select value={form.blood_type || ""} onValueChange={v => set("blood_type", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(s =>
                    <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            } />
          <div className="col-span-2">
            <FieldRow label="Notas médicas / alergias" value={form.medical_notes} edit={editing}
              editEl={<Textarea value={form.medical_notes || ""} onChange={e => set("medical_notes", e.target.value)} className="mt-1 text-sm" rows={2} />} />
          </div>
        </div>

        {/* Notas internas */}
        <SectionTitle icon={ClipboardList} label="Notas internas" />
        <FieldRow label="" value={form.notes} edit={editing}
          editEl={<Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} className="mt-1 text-sm" rows={2} placeholder="Notas solo visibles para administración" />} />

        {/* Documentos */}
        <SectionTitle icon={FileText} label="Documentos e imagen" />
        <DocumentUploader
          personType="players"
          personId={player.id}
          data={form}
          onUpdated={(field, url) => {
            setForm(f => ({ ...f, [field]: url }));
            onSaved({ ...player, ...form, [field]: url });
          }}
        />

        {/* Tutores */}
        {(guardians.length > 0 || isMinor) && (
          <>
            <SectionTitle icon={Shield} label="Tutores / Representantes" />
            {guardians.length === 0 && (
              <p className="text-xs text-[#94A3B8]">No hay tutores registrados para este deportista.</p>
            )}
            <div className="space-y-3">
              {guardians.map(g => {
                const isEditingG = editGuardianId === g.id;
                const gf = guardianForms[g.id] || g;
                const setGF = (k, v) => setGuardianForms(prev => ({ ...prev, [g.id]: { ...prev[g.id], [k]: v } }));
                return (
                  <div key={g.id} className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFF]">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm text-[#0F172A]">{g.name} {g.surname}</p>
                        <p className="text-xs text-[#64748B]">{RELATIONSHIP_LABELS[g.relationship] || g.relationship}</p>
                      </div>
                      <div className="flex gap-1">
                        {isEditingG ? (
                          <>
                            <Button size="sm" className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 h-7" onClick={() => handleSaveGuardian(g.id)}>
                              <Save size={11} />
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-7" onClick={() => setEditGuardianId(null)}>
                              <X size={11} />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-7 text-[#2460FF]" onClick={() => setEditGuardianId(g.id)}>
                              <Edit2 size={11} />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs px-2 py-1 h-7 text-red-400" onClick={() => handleDeleteGuardian(g.id)}>
                              <Trash2 size={11} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditingG ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Nombre</Label><Input value={gf.name || ""} onChange={e => setGF("name", e.target.value)} className="text-sm mt-0.5" /></div>
                          <div><Label className="text-xs">Apellidos</Label><Input value={gf.surname || ""} onChange={e => setGF("surname", e.target.value)} className="text-sm mt-0.5" /></div>
                          <div><Label className="text-xs">Teléfono</Label><Input value={gf.phone || ""} onChange={e => setGF("phone", e.target.value)} className="text-sm mt-0.5" /></div>
                          <div><Label className="text-xs">Email</Label><Input value={gf.email || ""} onChange={e => setGF("email", e.target.value)} className="text-sm mt-0.5" /></div>
                          <div><Label className="text-xs">DNI/NIE</Label><Input value={gf.dni || ""} onChange={e => setGF("dni", e.target.value)} className="text-sm mt-0.5" /></div>
                          <div>
                            <Label className="text-xs">Relación</Label>
                            <Select value={gf.relationship || "padre"} onValueChange={v => setGF("relationship", v)}>
                              <SelectTrigger className="mt-0.5 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2"><Label className="text-xs">IBAN</Label><Input value={gf.bank_iban || ""} onChange={e => setGF("bank_iban", e.target.value)} className="text-sm mt-0.5 font-mono" placeholder="ES00..." /></div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-[#475569]"><Phone size={10} />{g.phone || "—"}</div>
                        <div className="flex items-center gap-1 text-[#475569]"><Mail size={10} />{g.email || "—"}</div>
                        {g.bank_iban && <div className="col-span-2 flex items-center gap-1 text-[#475569]"><CreditCard size={10} /><span className="font-mono">{g.bank_iban}</span></div>}
                        {g.dni && <div className="flex items-center gap-1 text-[#475569]"><FileText size={10} />DNI: {g.dni}</div>}
                      </div>
                    )}
                    {/* Guardian documents */}
                    <div className="mt-2">
                      <DocumentUploader
                        personType="guardians"
                        personId={g.id}
                        data={g}
                        onUpdated={(field, url) => {
                          setGuardians(prev => prev.map(x => x.id === g.id ? { ...x, [field]: url } : x));
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Acciones */}
        <SectionTitle icon={ShoppingCart} label="Acciones" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs border-[#2460FF] text-[#2460FF] hover:bg-blue-50"
            onClick={() => setFeeDialogOpen(true)}>
            <CreditCard size={12} className="mr-1" />Asignar cuota / cobro
          </Button>
          <Button size="sm" variant="outline" className="text-xs border-green-600 text-green-700 hover:bg-green-50"
            onClick={() => setSaleDialogOpen(true)}>
            <Euro size={12} className="mr-1" />Generar venta
          </Button>
        </div>

        {/* Historial */}
        {(playerSales.length > 0 || playerPayments.length > 0) && (
          <>
            <SectionTitle icon={ClipboardList} label="Historial reciente" />
            <div className="space-y-1">
              {[...playerSales, ...playerPayments]
                .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
                .slice(0, 8)
                .map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <p className="text-xs font-medium text-[#0F172A]">{item.concept}</p>
                      <p className="text-xs text-[#94A3B8]">{item.created_at?.slice(0, 10) || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#0F172A]">{item.amount?.toFixed(2)}€</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        item.status === "paid" ? "bg-green-50 text-green-700" :
                        item.status === "pending" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>{item.status === "paid" ? "Pagado" : item.status === "pending" ? "Pendiente" : item.status}</span>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        <div className="h-8" />
      </div>

      {/* Assign fee dialog */}
      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[#00296B]">Asignar cuota periódica</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {fees.length > 0 ? (
              <div>
                <Label className="text-sm">Cuota *</Label>
                <Select value={feeForm.fee_id} onValueChange={v => {
                  const f = fees.find(x => x.id === v);
                  setFeeForm(prev => ({ ...prev, fee_id: v, concept: f?.name || "", amount: f?.amount?.toString() || "" }));
                }}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar cuota..." /></SelectTrigger>
                  <SelectContent>
                    {fees.map(f => <SelectItem key={f.id} value={f.id}>{f.name} — {f.amount}€/{f.fee_type === "cuota_mensual" ? "mes" : "temp."}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                No hay cuotas configuradas. Créalas en <strong>Cobros y Tarifas</strong> primero.
              </div>
            )}
            <div><Label className="text-sm">Concepto</Label><Input value={feeForm.concept} onChange={e => setFeeForm(p => ({ ...p, concept: e.target.value }))} className="mt-1 text-sm" placeholder="Auto-completado al elegir cuota" /></div>
            <div><Label className="text-sm">Importe (€)</Label><Input type="number" step="0.01" value={feeForm.amount} onChange={e => setFeeForm(p => ({ ...p, amount: e.target.value }))} className="mt-1 text-sm" /></div>
            <div><Label className="text-sm">Fecha límite de pago</Label><Input type="date" value={feeForm.due_date} onChange={e => setFeeForm(p => ({ ...p, due_date: e.target.value }))} className="mt-1 text-sm" /></div>
            <div><Label className="text-sm">Notas</Label><Input value={feeForm.notes} onChange={e => setFeeForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 text-sm" /></div>
            <Button onClick={handleAssignFee} disabled={!feeForm.concept || !feeForm.amount} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
              Crear cobro pendiente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create sale dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-[#00296B]">Generar venta / cobro</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {/* Catalog selector */}
            {(products.length > 0 || fees.length > 0) && (
              <div>
                <Label className="text-sm">Elegir del catálogo (opcional)</Label>
                <Select value="" onValueChange={v => {
                  if (v.startsWith("prod_")) {
                    const p = products.find(x => x.id === v.slice(5));
                    if (p) setSaleForm(prev => ({ ...prev, product_id: p.id, fee_id: "", concept: p.name, amount: p.price?.toString() || "" }));
                  } else if (v.startsWith("fee_")) {
                    const f = fees.find(x => x.id === v.slice(4));
                    if (f) setSaleForm(prev => ({ ...prev, fee_id: f.id, product_id: "", concept: f.name, amount: f.amount?.toString() || "" }));
                  }
                }}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar producto o cuota..." /></SelectTrigger>
                  <SelectContent>
                    {fees.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-bold text-[#94A3B8] uppercase tracking-wide">Cuotas</div>
                        {fees.map(f => <SelectItem key={`fee_${f.id}`} value={`fee_${f.id}`}>{f.name} — {f.amount}€</SelectItem>)}
                      </>
                    )}
                    {products.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-bold text-[#94A3B8] uppercase tracking-wide">Productos</div>
                        {products.map(p => <SelectItem key={`prod_${p.id}`} value={`prod_${p.id}`}>{p.name} — {p.price}€</SelectItem>)}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label className="text-sm">Concepto *</Label><Input value={saleForm.concept} onChange={e => setSaleForm(p => ({ ...p, concept: e.target.value }))} className="mt-1 text-sm" placeholder="Descripción del cobro" /></div>
            <div><Label className="text-sm">Importe (€) *</Label><Input type="number" step="0.01" value={saleForm.amount} onChange={e => setSaleForm(p => ({ ...p, amount: e.target.value }))} className="mt-1 text-sm" /></div>
            <div>
              <Label className="text-sm">Método de pago</Label>
              <Select value={saleForm.payment_method} onValueChange={v => setSaleForm(p => ({ ...p, payment_method: v }))}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente de cobro</SelectItem>
                  <SelectItem value="cash">Efectivo (cobrado)</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
                  <SelectItem value="sepa">SEPA / Domiciliación</SelectItem>
                  <SelectItem value="stripe">Tarjeta (Stripe)</SelectItem>
                  <SelectItem value="redsys">TPV Redsys</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-sm">Fecha límite de pago</Label><Input type="date" value={saleForm.due_date} onChange={e => setSaleForm(p => ({ ...p, due_date: e.target.value }))} className="mt-1 text-sm" /></div>
            <div><Label className="text-sm">Notas</Label><Input value={saleForm.notes} onChange={e => setSaleForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 text-sm" /></div>
            <Button onClick={handleCreateSale} disabled={!saleForm.concept || !saleForm.amount} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {saleForm.payment_method === "cash" ? "Registrar cobro (pagado)" : "Crear venta pendiente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SheetContent>
  );
}

// ─── Guardian Form ────────────────────────────────────────────────────────────

function GuardianForm({ form, setForm, players, onSave, saveLabel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePlayer = (id) => setForm(f => {
    const ids = f.player_ids.includes(id) ? f.player_ids.filter(x => x !== id) : [...f.player_ids, id];
    return { ...f, player_ids: ids };
  });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Apellidos</Label><Input value={form.surname} onChange={e => set("surname", e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">DNI/NIE</Label><Input value={form.dni} onChange={e => set("dni", e.target.value)} className="mt-1" /></div>
        <div>
          <Label className="text-sm">Relación</Label>
          <Select value={form.relationship} onValueChange={v => set("relationship", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(RELATIONSHIP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Teléfono</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Dirección</Label><Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Ciudad</Label><Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" /></div>
      </div>
      <div><Label className="text-sm">IBAN bancario</Label><Input value={form.bank_iban} onChange={e => set("bank_iban", e.target.value)} className="mt-1" placeholder="ES00 0000 0000 00 0000000000" /></div>
      <div>
        <Label className="text-sm">Deportistas asociados *</Label>
        <p className="text-xs text-[#94A3B8] mt-0.5 mb-1">Puedes seleccionar más de uno (hermanos).</p>
        {players.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-3 border-2 border-[#E2E8F0] rounded-xl max-h-36 overflow-y-auto bg-[#F8FAFF]">
            {players.map(p => (
              <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                className={`text-xs px-3 py-1.5 rounded-full border-2 font-medium transition-colors ${form.player_ids.includes(p.id) ? "bg-[#00296B] text-white border-[#00296B]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B]"}`}>
                {p.name} {p.surname}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 border border-dashed border-[#E2E8F0] rounded-xl text-xs text-[#94A3B8] text-center">
            No hay deportistas registrados aún.
          </div>
        )}
      </div>
      <div><Label className="text-sm">Notas</Label><Input value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" /></div>
      <Button onClick={onSave} disabled={!form.name.trim()} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

// ─── Deportistas Tab ──────────────────────────────────────────────────────────

function DeportistasTab() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    search: "", team_id: "", category: "", status: "",
    birth_year: "", gender: "", season: "", has_siblings: "",
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [showTutor2, setShowTutor2] = useState(false);
  const BLANK_PLAYER = {
    name: "", surname: "", birthdate: "", dni: "", email: "", phone: "",
    team_id: "", status: "pending", gender: "", address: "", city: "", postal_code: "",
    bank_iban: "", season: "2026/2027", notes: "",
    tutor_name: "", tutor_surname: "", tutor_dni: "", tutor_phone: "", tutor_email: "", tutor_relationship: "padre",
    tutor2_name: "", tutor2_surname: "", tutor2_phone: "", tutor2_email: "", tutor2_relationship: "madre",
  };
  const [newForm, setNewForm] = useState(BLANK_PLAYER);
  const setNF = (k, v) => setNewForm(f => ({ ...f, [k]: v }));

  const isNewMinor = () => {
    if (!newForm.birthdate) return false;
    const age = calcAge(newForm.birthdate);
    return age !== null && age < 18;
  };

  const handleCreate = async () => {
    if (!newForm.name.trim() || !newForm.surname.trim()) return;
    const pRes = await ax.post("/players", {
      name: newForm.name, surname: newForm.surname, birthdate: newForm.birthdate,
      dni: newForm.dni, email: newForm.email, phone: newForm.phone,
      gender: newForm.gender, team_id: newForm.team_id, status: newForm.status,
      address: newForm.address, city: newForm.city, postal_code: newForm.postal_code,
      bank_iban: newForm.bank_iban, season: newForm.season, notes: newForm.notes,
    });
    const playerId = pRes.data?.id;
    if (isNewMinor() && playerId) {
      if (newForm.tutor_name.trim()) {
        await ax.post("/guardians", {
          name: newForm.tutor_name, surname: newForm.tutor_surname, dni: newForm.tutor_dni,
          phone: newForm.tutor_phone, email: newForm.tutor_email, relationship: newForm.tutor_relationship,
          player_ids: [playerId],
        }).catch(() => {});
      }
      if (showTutor2 && newForm.tutor2_name.trim()) {
        await ax.post("/guardians", {
          name: newForm.tutor2_name, surname: newForm.tutor2_surname,
          phone: newForm.tutor2_phone, email: newForm.tutor2_email, relationship: newForm.tutor2_relationship,
          player_ids: [playerId],
        }).catch(() => {});
      }
    }
    setNewOpen(false);
    setShowTutor2(false);
    setNewForm(BLANK_PLAYER);
    load();
  };

  const load = useCallback(async () => {
    const [pr, tr] = await Promise.all([ax.get("/players"), ax.get("/teams")]);
    setPlayers(pr.data);
    setTeams(tr.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]));
  const familyCount = {};
  players.forEach(p => { if (p.family_id) familyCount[p.family_id] = (familyCount[p.family_id] || 0) + 1; });

  const categories = [...new Set(teams.map(t => t.category).filter(Boolean))].sort();
  const birthYears = [...new Set(players.map(p => p.birthdate?.slice(0, 4)).filter(Boolean))].sort().reverse();
  const seasons = [...new Set(players.map(p => p.season).filter(Boolean))].sort().reverse();

  const filtered = players.filter(p => {
    const team = teamMap[p.team_id] || {};
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!(`${p.name} ${p.surname} ${p.dni || ""} ${p.email || ""} ${p.phone || ""}`).toLowerCase().includes(q)) return false;
    }
    if (filters.team_id && p.team_id !== filters.team_id) return false;
    if (filters.category && team.category !== filters.category) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.gender && p.gender !== filters.gender) return false;
    if (filters.season && p.season !== filters.season) return false;
    if (filters.birth_year && (p.birthdate?.slice(0, 4) || "") !== filters.birth_year) return false;
    if (filters.has_siblings === "yes") {
      if (!p.family_id || (familyCount[p.family_id] || 1) < 2) return false;
    }
    if (filters.has_siblings === "no") {
      if (p.family_id && (familyCount[p.family_id] || 1) > 1) return false;
    }
    return true;
  });

  const openProfile = (p) => { setSelectedPlayer(p); setSheetOpen(true); };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.team_id) params.set("team_id", filters.team_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.birth_year) params.set("birth_year", filters.birth_year);
    if (filters.has_siblings === "yes") params.set("has_siblings", "true");
    if (filters.has_siblings === "no") params.set("has_siblings", "false");
    const res = await ax.get(`/export/players?${params}`, { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "deportistas.xlsx";
    a.click();
  };

  const clearFilters = () => setFilters({
    search: "", team_id: "", category: "", status: "",
    birth_year: "", gender: "", season: "", has_siblings: "",
  });

  return (
    <div>
      {/* New player dialog */}
      <div className="flex justify-end mb-4">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" onClick={() => setNewOpen(true)}>
            <Plus size={14} className="mr-1" />Nuevo deportista
          </Button>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Alta manual de deportista</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Nombre *</Label><Input value={newForm.name} onChange={e => setNF("name", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">Apellidos *</Label><Input value={newForm.surname} onChange={e => setNF("surname", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Fecha de nacimiento</Label><Input type="date" value={newForm.birthdate} onChange={e => setNF("birthdate", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">NIF / NIE</Label><Input value={newForm.dni} onChange={e => setNF("dni", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Email</Label><Input type="email" value={newForm.email} onChange={e => setNF("email", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">Móvil</Label><Input value={newForm.phone} onChange={e => setNF("phone", e.target.value)} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Género</Label>
                  <Select value={newForm.gender} onValueChange={v => setNF("gender", v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Equipo</Label>
                  <Select value={newForm.team_id} onValueChange={v => setNF("team_id", v === "_none" ? "" : v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin equipo</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Estado</Label>
                  <Select value={newForm.status} onValueChange={v => setNF("status", v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-sm">Temporada</Label><Input value={newForm.season} onChange={e => setNF("season", e.target.value)} className="mt-1" placeholder="2026/2027" /></div>
              </div>
              <div><Label className="text-sm">Dirección</Label><Input value={newForm.address} onChange={e => setNF("address", e.target.value)} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Ciudad</Label><Input value={newForm.city} onChange={e => setNF("city", e.target.value)} className="mt-1" /></div>
                <div><Label className="text-sm">C.Postal</Label><Input value={newForm.postal_code} onChange={e => setNF("postal_code", e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label className="text-sm">IBAN bancario</Label><Input value={newForm.bank_iban} onChange={e => setNF("bank_iban", e.target.value)} className="mt-1 font-mono" placeholder="ES00 0000 0000 00 0000000000" /></div>
              <div><Label className="text-sm">Notas internas</Label><Input value={newForm.notes} onChange={e => setNF("notes", e.target.value)} className="mt-1" /></div>

              {isNewMinor() && (
                <div className="space-y-3">
                  <div className="border border-amber-200 rounded-xl p-3 bg-amber-50">
                    <p className="text-xs font-bold text-amber-700 uppercase mb-3">Tutor 1 (menor detectado)</p>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Nombre *</Label><Input value={newForm.tutor_name} onChange={e => setNF("tutor_name", e.target.value)} className="mt-0.5" /></div>
                        <div><Label className="text-xs">Apellidos</Label><Input value={newForm.tutor_surname} onChange={e => setNF("tutor_surname", e.target.value)} className="mt-0.5" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Email</Label><Input value={newForm.tutor_email} onChange={e => setNF("tutor_email", e.target.value)} className="mt-0.5" /></div>
                        <div><Label className="text-xs">Móvil</Label><Input value={newForm.tutor_phone} onChange={e => setNF("tutor_phone", e.target.value)} className="mt-0.5" /></div>
                      </div>
                    </div>
                  </div>
                  {!showTutor2 ? (
                    <button type="button" onClick={() => setShowTutor2(true)} className="text-xs text-[#2460FF] hover:text-[#00296B] flex items-center gap-1">
                      <Plus size={12} />Añadir segundo tutor/a
                    </button>
                  ) : (
                    <div className="border border-blue-200 rounded-xl p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-blue-700 uppercase">Tutor 2</p>
                        <button type="button" onClick={() => setShowTutor2(false)}><X size={12} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">Nombre</Label><Input value={newForm.tutor2_name} onChange={e => setNF("tutor2_name", e.target.value)} className="mt-0.5" /></div>
                        <div><Label className="text-xs">Apellidos</Label><Input value={newForm.tutor2_surname} onChange={e => setNF("tutor2_surname", e.target.value)} className="mt-0.5" /></div>
                        <div><Label className="text-xs">Email</Label><Input value={newForm.tutor2_email} onChange={e => setNF("tutor2_email", e.target.value)} className="mt-0.5" /></div>
                        <div><Label className="text-xs">Móvil</Label><Input value={newForm.tutor2_phone} onChange={e => setNF("tutor2_phone", e.target.value)} className="mt-0.5" /></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button onClick={handleCreate} disabled={!newForm.name.trim() || !newForm.surname.trim()} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Guardar deportista</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", val: players.length, color: "text-[#2460FF]" },
          { label: "Activos", val: players.filter(p => p.status === "active").length, color: "text-green-600" },
          { label: "Pendientes", val: players.filter(p => p.status === "pending").length, color: "text-amber-500" },
          { label: "Con hermanos", val: players.filter(p => p.family_id && (familyCount[p.family_id] || 0) > 1).length, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#475569]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input placeholder="Nombre, apellidos, DNI, email, teléfono..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="pl-8 text-sm" />
          </div>
          <Select value={filters.team_id} onValueChange={v => setFilters(f => ({ ...f, team_id: v === "_all" ? "" : v, category: "" }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Todos los equipos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los equipos</SelectItem>
              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v === "_all" ? "" : v, team_id: "" }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas las categorías</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los estados</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.gender} onValueChange={v => setFilters(f => ({ ...f, gender: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Género" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los géneros</SelectItem>
              <SelectItem value="masculino">Masculino</SelectItem>
              <SelectItem value="femenino">Femenino</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.birth_year} onValueChange={v => setFilters(f => ({ ...f, birth_year: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Año nacimiento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los años</SelectItem>
              {birthYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.season} onValueChange={v => setFilters(f => ({ ...f, season: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Temporada" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas las temporadas</SelectItem>
              {seasons.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.has_siblings} onValueChange={v => setFilters(f => ({ ...f, has_siblings: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Hermanos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="yes">Con hermanos en el club</SelectItem>
              <SelectItem value="no">Sin hermanos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#475569]">{filtered.length} de {players.length} deportistas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
              <X size={12} className="mr-1" />Limpiar filtros
            </Button>
            <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs">
              <Download size={12} className="mr-1" />Exportar Excel
            </Button>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" className="text-xs pointer-events-none" asChild>
                <span><Upload size={12} className="mr-1" />Importar</span>
              </Button>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const fd = new FormData(); fd.append("file", file);
                try {
                  const r = await ax.post("/import/players", fd, { headers: { "Content-Type": "multipart/form-data" } });
                  alert(`✅ Importados: ${r.data.imported} deportistas${r.data.errors?.length ? `\n⚠️ ${r.data.errors.join("\n")}` : ""}`);
                  load();
                } catch { alert("Error al importar. Comprueba el formato del archivo."); }
                e.target.value = "";
              }} />
            </label>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide">Deportista</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden lg:table-cell">Edad</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide hidden md:table-cell">Equipo / Cat.</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const age = calcAge(p.birthdate);
              const isMinor = age !== null && age < 18;
              const siblings = p.family_id ? (familyCount[p.family_id] || 0) - 1 : 0;
              const team = teamMap[p.team_id] || {};
              return (
                <tr key={p.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF] cursor-pointer transition-colors"
                  onClick={() => openProfile(p)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#00296B] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(p.name || "?")[0]}{(p.surname || "")[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[#0F172A]">{p.name} {p.surname}</p>
                        <p className="text-xs text-[#94A3B8]">{p.dni || p.email || "—"}</p>
                      </div>
                      {isMinor && <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200">Menor</Badge>}
                      {siblings > 0 && <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200 hidden lg:flex">{siblings}h</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#475569] hidden lg:table-cell">{age != null ? `${age} años` : "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-[#475569]">{team.name || "—"}</p>
                    {team.category && <p className="text-xs text-[#94A3B8]">{team.category}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLORS[p.status] || STATUS_COLORS.inactive}`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={14} className="text-[#94A3B8] inline" />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Sin resultados con los filtros aplicados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Profile Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setSelectedPlayer(null); }}>
        <PlayerProfileSheet
          player={selectedPlayer}
          teams={teams}
          onClose={() => { setSheetOpen(false); setSelectedPlayer(null); }}
          onSaved={(updated) => {
            setPlayers(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
            setSelectedPlayer(prev => prev ? { ...prev, ...updated } : null);
          }}
          onDeleted={(id) => {
            setPlayers(prev => prev.filter(p => p.id !== id));
          }}
        />
      </Sheet>
    </div>
  );
}

// ─── Tutores Tab ──────────────────────────────────────────────────────────────

function TutoresTab() {
  const [guardians, setGuardians] = useState([]);
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ ...BLANK_GUARDIAN });

  const load = useCallback(async () => {
    const [gr, pr] = await Promise.all([ax.get("/guardians"), ax.get("/players")]);
    setGuardians(gr.data);
    setPlayers(pr.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const playerMap = Object.fromEntries(players.map(p => [p.id, `${p.name} ${p.surname}`.trim()]));
  const filtered = guardians.filter(g => {
    if (!search) return true;
    return `${g.name} ${g.surname} ${g.dni} ${g.email}`.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    await ax.post("/guardians", newForm);
    setNewOpen(false);
    setNewForm({ ...BLANK_GUARDIAN });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar tutor?")) return;
    await ax.delete(`/guardians/${id}`);
    load();
  };

  const handleExport = async () => {
    const res = await ax.get("/export/guardians", { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "tutores.xlsx";
    a.click();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" onClick={() => setNewOpen(true)}>
            <Plus size={14} className="mr-1" />Nuevo tutor
          </Button>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Alta de tutor / padre</DialogTitle></DialogHeader>
            <GuardianForm form={newForm} setForm={setNewForm} players={players} onSave={handleCreate} saveLabel="Guardar tutor" />
          </DialogContent>
        </Dialog>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input placeholder="Buscar tutor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 text-sm" />
        </div>
        <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs">
          <Download size={12} className="mr-1" />Exportar Excel
        </Button>
        <span className="text-xs text-[#475569] ml-auto">{filtered.length} tutores</span>
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Tutor / Tutora</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden md:table-cell">Relación</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden lg:table-cell">Contacto</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Deportistas</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <>
                <tr key={g.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF] cursor-pointer"
                  onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0F172A]">{g.name} {g.surname}</p>
                    <p className="text-xs text-[#94A3B8]">{g.dni || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-[#475569] capitalize hidden md:table-cell">{RELATIONSHIP_LABELS[g.relationship] || g.relationship || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-[#475569]">{g.phone || "—"}</p>
                    <p className="text-xs text-[#94A3B8]">{g.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(g.player_ids || []).slice(0, 2).map(pid => (
                        <Badge key={pid} className="text-xs bg-blue-50 text-blue-700 border-blue-200">{playerMap[pid] || "—"}</Badge>
                      ))}
                      {(g.player_ids || []).length > 2 && <Badge className="text-xs">+{g.player_ids.length - 2}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronDown size={14} className={`text-[#94A3B8] inline transition-transform ${expanded === g.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {expanded === g.id && (
                  <tr key={`${g.id}-exp`} className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-xs text-[#94A3B8] mb-1">Teléfono</p><p>{g.phone || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Email</p><p>{g.email || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Dirección</p><p>{[g.address, g.city].filter(Boolean).join(", ") || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">IBAN</p><p className="font-mono text-xs">{g.bank_iban || "—"}</p></div>
                      </div>
                      <div className="mb-3">
                        <DocumentUploader personType="guardians" personId={g.id} data={g}
                          onUpdated={(field, url) => setGuardians(prev => prev.map(x => x.id === g.id ? { ...x, [field]: url } : x))} />
                      </div>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 text-xs" onClick={() => handleDelete(g.id)}>
                        <Trash2 size={12} className="mr-1" />Eliminar
                      </Button>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Sin tutores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Socios Tab ───────────────────────────────────────────────────────────────

function MemberForm({ form, setForm, onSave, saveLabel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const TYPES = { socio_adulto: "Adulto", socio_juvenil: "Juvenil", socio_familiar: "Familiar", socio_honor: "Honor", abonado: "Abonado" };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Apellidos</Label><Input value={form.surname} onChange={e => set("surname", e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">DNI/NIE</Label><Input value={form.dni} onChange={e => set("dni", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Fecha de nacimiento</Label><Input type="date" value={form.birthdate} onChange={e => set("birthdate", e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Teléfono</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Dirección</Label><Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Ciudad</Label><Input value={form.city} onChange={e => set("city", e.target.value)} className="mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Código postal</Label><Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} className="mt-1" /></div>
        <div>
          <Label className="text-sm">Tipo de socio</Label>
          <Select value={form.member_type} onValueChange={v => set("member_type", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">IBAN bancario</Label><Input value={form.bank_iban} onChange={e => set("bank_iban", e.target.value)} className="mt-1 font-mono" /></div>
        <div>
          <Label className="text-sm">Estado</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-sm">Temporada</Label><Input value={form.season} onChange={e => set("season", e.target.value)} className="mt-1" /></div>
      <div><Label className="text-sm">Notas</Label><Input value={form.notes} onChange={e => set("notes", e.target.value)} className="mt-1" /></div>
      <Button onClick={onSave} disabled={!form.name.trim()} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

function SociosTab() {
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({ search: "", member_type: "", status: "" });
  const [expanded, setExpanded] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ ...BLANK_MEMBER });

  const load = useCallback(async () => {
    const r = await ax.get("/members");
    setMembers(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const TYPES = { socio_adulto: "Adulto", socio_juvenil: "Juvenil", socio_familiar: "Familiar", socio_honor: "Honor", abonado: "Abonado" };

  const filtered = members.filter(m => {
    if (filters.search && !`${m.name} ${m.surname} ${m.dni} ${m.member_number}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.member_type && m.member_type !== filters.member_type) return false;
    if (filters.status && m.status !== filters.status) return false;
    return true;
  });

  const handleCreate = async () => {
    await ax.post("/members", newForm);
    setNewOpen(false);
    setNewForm({ ...BLANK_MEMBER });
    load();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.member_type) params.set("member_type", filters.member_type);
    if (filters.status) params.set("status", filters.status);
    const res = await ax.get(`/export/members?${params}`, { responseType: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(res.data);
    a.download = "socios.xlsx";
    a.click();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar socio?")) return;
    await ax.delete(`/members/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" onClick={() => setNewOpen(true)}>
            <Plus size={14} className="mr-1" />Nuevo socio
          </Button>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Alta de socio</DialogTitle></DialogHeader>
            <MemberForm form={newForm} setForm={setNewForm} onSave={handleCreate} saveLabel="Guardar socio" />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total socios", val: members.length, color: "text-amber-500" },
          { label: "Activos", val: members.filter(m => m.status === "active").length, color: "text-green-600" },
          { label: "Adultos", val: members.filter(m => m.member_type === "socio_adulto").length, color: "text-[#2460FF]" },
          { label: "Familiares", val: members.filter(m => m.member_type === "socio_familiar").length, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className={`font-heading font-bold text-2xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#475569]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input placeholder="Nombre, DNI, nº socio..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="pl-8 text-sm" />
          </div>
          <Select value={filters.member_type} onValueChange={v => setFilters(f => ({ ...f, member_type: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Tipo de socio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos los tipos</SelectItem>
              {Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todos</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Baja</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => setFilters({ search: "", member_type: "", status: "" })}>
              <X size={12} className="mr-1" />Limpiar
            </Button>
            <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1">
              <Download size={12} className="mr-1" />Excel
            </Button>
            <label className="cursor-pointer flex-1">
              <Button size="sm" variant="outline" className="text-xs w-full pointer-events-none" asChild>
                <span><Upload size={12} className="mr-1" />Importar</span>
              </Button>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const fd = new FormData(); fd.append("file", file);
                try {
                  const r = await ax.post("/import/members", fd, { headers: { "Content-Type": "multipart/form-data" } });
                  alert(`✅ Importados: ${r.data.imported} socios${r.data.errors?.length ? `\n⚠️ ${r.data.errors.join("\n")}` : ""}`);
                  load();
                } catch { alert("Error al importar."); }
                e.target.value = "";
              }} />
            </label>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Nº Socio</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden md:table-cell">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <>
                <tr key={m.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF] cursor-pointer"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-[#475569]">{m.member_number || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0F172A]">{m.name} {m.surname}</p>
                    <p className="text-xs text-[#94A3B8]">{m.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475569] hidden md:table-cell">{TYPES[m.member_type] || m.member_type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${m.status === "active" ? STATUS_COLORS.active : STATUS_COLORS.inactive}`}>
                      {m.status === "active" ? "Activo" : "Baja"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronDown size={14} className={`text-[#94A3B8] inline transition-transform ${expanded === m.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {expanded === m.id && (
                  <tr key={`${m.id}-exp`} className="bg-[#F8FAFF] border-b border-[#E2E8F0]">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-xs text-[#94A3B8] mb-1">DNI/NIE</p><p>{m.dni || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Teléfono</p><p>{m.phone || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">Dirección</p><p>{[m.address, m.city].filter(Boolean).join(", ") || "—"}</p></div>
                        <div><p className="text-xs text-[#94A3B8] mb-1">IBAN</p><p className="font-mono text-xs">{m.bank_iban || "—"}</p></div>
                      </div>
                      <div className="mb-3">
                        <DocumentUploader personType="members" personId={m.id} data={m}
                          onUpdated={(field, url) => setMembers(prev => prev.map(x => x.id === m.id ? { ...x, [field]: url } : x))} />
                      </div>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 text-xs" onClick={() => handleDelete(m.id)}>
                        <Trash2 size={12} className="mr-1" />Eliminar
                      </Button>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Sin socios con los filtros aplicados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function DeportistasManager() {
  const [tab, setTab] = useState("deportistas");
  const tabs = [
    { id: "deportistas", label: "Deportistas", icon: Users },
    { id: "tutores", label: "Tutores / Padres", icon: Shield },
    { id: "socios", label: "Socios", icon: Star },
  ];
  return (
    <div data-testid="admin-deportistas-manager">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-5">Gestión de Personas</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#00296B] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#00296B]"}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>
      {tab === "deportistas" && <DeportistasTab />}
      {tab === "tutores" && <TutoresTab />}
      {tab === "socios" && <SociosTab />}
    </div>
  );
}
