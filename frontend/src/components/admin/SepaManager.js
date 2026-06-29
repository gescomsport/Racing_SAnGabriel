import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Download, FileText, CheckCircle2, AlertTriangle, Info, Zap, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import ax from "../../api";

const SEQ_META = {
  FRST: { label: "FRST",  desc: "Primera presentación", color: "bg-blue-100 text-blue-700",   dot: "#2460FF" },
  RCUR: { label: "RCUR",  desc: "Recurrente",            color: "bg-green-100 text-green-700",  dot: "#16a34a" },
  FNAL: { label: "FNAL",  desc: "Última presentación",   color: "bg-orange-100 text-orange-700",dot: "#ea580c" },
  OOFF: { label: "OOFF",  desc: "Adeudo único",          color: "bg-gray-100 text-gray-600",    dot: "#64748b" },
};

const EMPTY_FORM = {
  person_id: "", person_type: "player", person_name: "",
  debtor_iban: "", debtor_bic: "", mandate_ref: "",
  signature_date: new Date().toISOString().slice(0, 10),
  sequence_type: "FRST", amount: "", notes: "",
};

const EMPTY_XML = {
  collection_date: "", concept: "PAGO CUOTA CLUB DEPORTIVO",
  remesa_number: "", default_amount: "",
};

function ibanMask(iban) {
  const clean = iban?.replace(/\s/g, "") || "";
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
}

function businessDaysFromNow(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  let count = 0, d = new Date(today);
  while (d < target) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export default function SepaManager() {
  const [mandates, setMandates]   = useState([]);
  const [players, setPlayers]     = useState([]);
  const [members, setMembers]     = useState([]);
  const [selected, setSelected]   = useState([]);
  const [filter, setFilter]       = useState("all");
  const [newOpen, setNewOpen]     = useState(false);
  const [xmlOpen, setXmlOpen]     = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [xmlForm, setXmlForm]     = useState(EMPTY_XML);
  const [xmlError, setXmlError]   = useState("");
  const setF  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setXF = (k, v) => setXmlForm(f => ({ ...f, [k]: v }));

  // ── Desde ventas ──
  const [salesOpen, setSalesOpen]         = useState(false);
  const [salesData, setSalesData]         = useState([]);
  const [salesLoading, setSalesLoading]   = useState(false);
  const [selSales, setSelSales]           = useState([]);
  const [bulkResult, setBulkResult]       = useState(null);
  const [bulkCreating, setBulkCreating]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [m, p, mb] = await Promise.all([ax.get("/sepa/mandates"), ax.get("/players"), ax.get("/members")]);
      setMandates(m.data); setPlayers(p.data); setMembers(mb.data);
    } catch {}
  };

  const loadSalesData = async () => {
    setSalesLoading(true);
    setBulkResult(null);
    setSelSales([]);
    try {
      const [salesRes, playersRes, membersRes, mandatesRes] = await Promise.all([
        ax.get("/sales"), ax.get("/players"), ax.get("/members"), ax.get("/sepa/mandates"),
      ]);
      const activeMandatePersonIds = new Set(
        mandatesRes.data.filter(m => m.status === "active").map(m => m.person_id)
      );
      const playerMap = Object.fromEntries(playersRes.data.map(p => [p.id, p]));
      const memberMap = Object.fromEntries(membersRes.data.map(m => [m.id, m]));

      const rows = salesRes.data
        .filter(s => s.status === "pending")
        .map(s => {
          const person = s.person_type === "player" ? playerMap[s.person_id] : memberMap[s.person_id];
          const iban = person?.bank_iban || "";
          const hasMandateAlready = activeMandatePersonIds.has(s.person_id);
          return {
            sale_id: s.id,
            person_id: s.person_id,
            person_type: s.person_type,
            person_name: person ? `${person.name} ${person.surname || ""}`.trim() : "Desconocido",
            concept: s.concept,
            amount: s.amount,
            due_date: s.due_date,
            iban,
            has_mandate: hasMandateAlready,
            can_create: !!iban && !hasMandateAlready,
          };
        })
        .sort((a, b) => b.can_create - a.can_create);

      setSalesData(rows);
    } catch {
      setSalesData([]);
    }
    setSalesLoading(false);
  };

  const handleOpenSales = () => {
    setSalesOpen(true);
    loadSalesData();
  };

  const handleBulkCreate = async () => {
    const toCreate = salesData.filter(r => selSales.includes(r.sale_id) && r.can_create);
    if (toCreate.length === 0) return;
    setBulkCreating(true);
    let ok = 0, errors = [];
    for (const row of toCreate) {
      try {
        await ax.post("/sepa/mandates", {
          person_id: row.person_id,
          person_type: row.person_type,
          person_name: row.person_name,
          debtor_iban: row.iban,
          debtor_bic: "",
          mandate_ref: "",
          signature_date: new Date().toISOString().slice(0, 10),
          sequence_type: "FRST",
          amount: row.amount || 0,
          notes: `Desde venta: ${row.concept}`,
        });
        ok++;
      } catch (e) {
        errors.push(`${row.person_name}: ${e.response?.data?.detail || "error"}`);
      }
    }
    setBulkResult({ ok, errors });
    setBulkCreating(false);
    if (ok > 0) { loadAll(); loadSalesData(); }
  };

  const handlePersonChange = (personId) => {
    const list = form.person_type === "player" ? players : members;
    const person = list.find(p => p.id === personId);
    const name = person ? `${person.name || ""} ${person.surname || ""}`.trim() : "";
    setF("person_id", personId); setF("person_name", name);
  };

  const handleCreate = async () => {
    if (!form.person_id || !form.debtor_iban || !form.signature_date) {
      alert("Rellena los campos obligatorios: persona, IBAN y fecha de firma.");
      return;
    }
    try {
      const payload = { ...form };
      if (payload.amount) payload.amount = parseFloat(payload.amount);
      await ax.post("/sepa/mandates", payload);
      setNewOpen(false); setForm(EMPTY_FORM); loadAll();
    } catch (e) {
      alert(e.response?.data?.detail || "Error al crear el mandato");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("¿Cancelar este mandato SEPA? Esta acción no se puede deshacer.")) return;
    await ax.delete(`/sepa/mandates/${id}`);
    setSelected(s => s.filter(x => x !== id));
    loadAll();
  };

  const toggleSelect = (id) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const selectAll = () => setSelected(filteredActive.map(m => m.id));
  const clearAll  = () => setSelected([]);

  const handleGenerateXml = async () => {
    setXmlError("");
    if (selected.length === 0)    { setXmlError("Selecciona al menos un mandato."); return; }
    if (!xmlForm.collection_date) { setXmlError("Indica la fecha de cobro."); return; }
    if (!xmlForm.concept.trim())  { setXmlError("Indica el concepto."); return; }
    setGenerating(true);
    try {
      const payload = {
        mandate_ids: selected,
        collection_date: xmlForm.collection_date,
        concept: xmlForm.concept,
        ...(xmlForm.remesa_number  ? { remesa_number:  parseInt(xmlForm.remesa_number) }  : {}),
        ...(xmlForm.default_amount ? { default_amount: parseFloat(xmlForm.default_amount) } : {}),
      };
      const res = await ax.post("/sepa/generate-xml", payload, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `SepaCore_${xmlForm.remesa_number || "remesa"}_${xmlForm.collection_date}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      setXmlOpen(false); setSelected([]); loadAll();
    } catch (e) {
      const text = await e.response?.data?.text?.();
      let msg = "Error al generar el XML. Verifica los datos en Ajustes → SEPA.";
      try { msg = JSON.parse(text)?.detail || msg; } catch {}
      setXmlError(msg);
    }
    setGenerating(false);
  };

  const activeMandates    = useMemo(() => mandates.filter(m => m.status === "active"),    [mandates]);
  const cancelledMandates = useMemo(() => mandates.filter(m => m.status !== "active"),    [mandates]);
  const filteredActive    = useMemo(() =>
    filter === "all" ? activeMandates : activeMandates.filter(m => m.sequence_type === filter),
    [activeMandates, filter]
  );

  const selectedMandates  = useMemo(() => activeMandates.filter(m => selected.includes(m.id)), [activeMandates, selected]);
  const selectedTotal     = useMemo(() => selectedMandates.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0), [selectedMandates]);
  const frst_count        = activeMandates.filter(m => m.sequence_type === "FRST").length;
  const rcur_count        = activeMandates.filter(m => m.sequence_type === "RCUR").length;
  const totalValue        = activeMandates.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);

  // Aviso de plazo mínimo según tipo de mandato seleccionado
  const selectedHasFrst  = selectedMandates.some(m => ["FRST", "OOFF"].includes(m.sequence_type));
  const selectedHasRcur  = selectedMandates.some(m => ["RCUR", "FNAL"].includes(m.sequence_type));
  const minDays          = selectedHasFrst ? 5 : 2;
  const daysToCollection = xmlForm.collection_date ? businessDaysFromNow(xmlForm.collection_date) : null;
  const dateWarning      = daysToCollection !== null && daysToCollection < minDays;

  return (
    <div>
      {/* ── Cabecera ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">SEPA — Domiciliaciones</h2>
          <p className="text-xs text-[#475569] mt-0.5">Mandatos pain.008.001.02 · Estándar EPC SEPA Core · Banco de España</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selected.length > 0 && (
            <Button onClick={() => { setXmlOpen(true); setXmlError(""); }} className="bg-green-600 hover:bg-green-700 text-white">
              <Download size={14} className="mr-1.5" /> Generar XML ({selected.length})
            </Button>
          )}
          <Button variant="outline" className="text-[#2460FF] border-[#2460FF] text-sm" onClick={handleOpenSales}>
            <Zap size={14} className="mr-1.5" />Desde ventas
          </Button>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white">
                <Plus size={14} className="mr-1" /> Nuevo mandato
              </Button>
            </DialogTrigger>

            {/* ── Nuevo mandato dialog ──────────────────────────────── */}
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo mandato SEPA</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Tipo *</Label>
                    <Select value={form.person_type} onValueChange={v => { setF("person_type", v); setF("person_id", ""); setF("person_name", ""); }}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Jugador/a</SelectItem>
                        <SelectItem value="member">Socio/a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Persona *</Label>
                    <Select value={form.person_id} onValueChange={handlePersonChange}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>
                        {(form.person_type === "player" ? players : members).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} {p.surname || ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Nombre titular (como aparece en la cuenta bancaria) *</Label>
                  <Input value={form.person_name} onChange={e => setF("person_name", e.target.value)} className="mt-1" placeholder="JUAN GARCIA LOPEZ" />
                </div>
                <div>
                  <Label className="text-sm">IBAN del deudor *</Label>
                  <Input value={form.debtor_iban} onChange={e => setF("debtor_iban", e.target.value.toUpperCase())} className="mt-1 font-mono text-sm" placeholder="ES76 2100 0813 6101 0123 4567" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm">BIC del banco</Label>
                    <Input value={form.debtor_bic} onChange={e => setF("debtor_bic", e.target.value.toUpperCase())} className="mt-1 font-mono text-xs" placeholder="CAIXESBBXXX" />
                  </div>
                  <div>
                    <Label className="text-sm">Ref. mandato</Label>
                    <Input value={form.mandate_ref} onChange={e => setF("mandate_ref", e.target.value)} className="mt-1 font-mono text-xs" placeholder="Auto si vacío" />
                  </div>
                  <div>
                    <Label className="text-sm">Cuota (€)</Label>
                    <Input type="number" step="0.01" value={form.amount} onChange={e => setF("amount", e.target.value)} className="mt-1" placeholder="32.50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Fecha de firma *</Label>
                    <Input type="date" value={form.signature_date} onChange={e => setF("signature_date", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Secuencia</Label>
                    <Select value={form.sequence_type} onValueChange={v => setF("sequence_type", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FRST">FRST — Primera vez</SelectItem>
                        <SelectItem value="RCUR">RCUR — Recurrente</SelectItem>
                        <SelectItem value="FNAL">FNAL — Última</SelectItem>
                        <SelectItem value="OOFF">OOFF — Única</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Notas internas</Label>
                  <Textarea value={form.notes} onChange={e => setF("notes", e.target.value)} rows={2} className="mt-1 text-sm" />
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  <b>FRST</b> = primer cobro (pasa a RCUR automáticamente tras generar XML) ·
                  <b> RCUR</b> = cobros periódicos · <b>OOFF</b> = cobro único · <b>FNAL</b> = último cobro
                </div>
                <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Guardar mandato</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Mandatos activos", value: activeMandates.length, color: "text-[#00296B]" },
          { label: "FRST (primera vez)", value: frst_count, color: "text-blue-600" },
          { label: "RCUR (recurrentes)", value: rcur_count, color: "text-green-600" },
          { label: "Valor total mensual", value: totalValue > 0 ? `${totalValue.toFixed(2)} €` : "—", color: "text-[#00296B]" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <p className="text-xs text-[#475569]">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Barra de selección y filtros ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1">
          {["all", "FRST", "RCUR", "FNAL", "OOFF"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${filter === f ? "bg-[#00296B] text-white border-[#00296B]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B]"}`}>
              {f === "all" ? "Todos" : f}
              {f !== "all" && <span className="ml-1 opacity-70">({activeMandates.filter(m => m.sequence_type === f).length})</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto items-center">
          {selected.length > 0 && (
            <span className="text-xs font-bold text-[#2460FF] bg-blue-50 px-3 py-1 rounded-full">
              {selected.length} sel. · {selectedTotal > 0 ? `${selectedTotal.toFixed(2)} €` : "importe pendiente"}
            </span>
          )}
          <button onClick={selectAll} className="text-xs text-[#2460FF] hover:underline font-medium">Seleccionar todos</button>
          {selected.length > 0 && <button onClick={clearAll} className="text-xs text-[#475569] hover:underline">Limpiar</button>}
        </div>
      </div>

      {/* ── Lista de mandatos activos ──────────────────────────────────── */}
      {filteredActive.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#94A3B8]">
          <FileText size={36} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No hay mandatos{filter !== "all" ? ` con secuencia ${filter}` : " activos"}</p>
          <p className="text-sm mt-1">Añade uno con el botón "Nuevo mandato"</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {filteredActive.map(m => {
            const meta = SEQ_META[m.sequence_type] || SEQ_META.RCUR;
            const isSel = selected.includes(m.id);
            return (
              <div key={m.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-all ${isSel ? "border-[#2460FF] ring-1 ring-[#2460FF] shadow-sm" : "border-[#E2E8F0] hover:border-[#CBD5E1]"}`}
                onClick={() => toggleSelect(m.id)}>
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSel ? "bg-[#2460FF] border-[#2460FF]" : "border-gray-300"}`}>
                  {isSel && <CheckCircle2 size={12} className="text-white" />}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#0F172A] text-sm">{m.person_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${meta.color}`}>{meta.label}</span>
                    <span className="text-xs bg-[#F4F7FB] text-[#475569] px-2 py-0.5 rounded-full">
                      {m.person_type === "player" ? "Jugador/a" : "Socio/a"}
                    </span>
                    {m.amount && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        {parseFloat(m.amount).toFixed(2)} €
                      </span>
                    )}
                    {m.last_remesa && (
                      <span className="text-xs text-[#94A3B8]">Últ. remesa #{m.last_remesa} ({m.last_collection_date})</span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569] font-mono mt-1">{ibanMask(m.debtor_iban)} · Ref: {m.mandate_ref}</p>
                  <p className="text-xs text-[#94A3B8]">Firmado: {m.signature_date}{m.notes ? ` · ${m.notes}` : ""}</p>
                </div>
                {/* Cancelar */}
                <Button onClick={e => { e.stopPropagation(); handleCancel(m.id); }} variant="ghost" size="sm" className="text-red-400 hover:text-red-600 h-8 w-8 p-0 flex-shrink-0">
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mandatos cancelados (colapsado) ───────────────────────────── */}
      {cancelledMandates.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-[#94A3B8] cursor-pointer select-none hover:text-[#475569]">
            Mandatos cancelados ({cancelledMandates.length})
          </summary>
          <div className="space-y-1 mt-2">
            {cancelledMandates.map(m => (
              <div key={m.id} className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] px-4 py-2.5 flex items-center gap-3 opacity-60">
                <span className="text-sm text-[#475569]">{m.person_name}</span>
                <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">Cancelado</span>
                <span className="text-xs text-[#94A3B8] font-mono ml-auto">{ibanMask(m.debtor_iban)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Diálogo: Desde ventas ─────────────────────────────────────── */}
      <Dialog open={salesOpen} onOpenChange={v => { setSalesOpen(v); if (!v) setBulkResult(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B] flex items-center gap-2">
              <Zap size={16} className="text-[#2460FF]" />Generar mandatos desde ventas pendientes
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[#475569] -mt-1">
            Muestra ventas en estado <b>Pendiente</b>. Solo se pueden crear mandatos para personas que tienen IBAN registrado y no tienen ya un mandato activo.
          </p>

          {salesLoading && (
            <div className="flex-1 flex items-center justify-center py-10 text-[#94A3B8] text-sm">Cargando ventas...</div>
          )}

          {!salesLoading && salesData.length === 0 && !bulkResult && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-[#94A3B8]">
              <FileText size={36} className="opacity-40 mb-3" />
              <p className="font-medium">No hay ventas pendientes</p>
              <p className="text-sm mt-1">Crea ventas desde el módulo Ventas y Cobros.</p>
            </div>
          )}

          {bulkResult && (
            <div className={`rounded-xl p-4 ${bulkResult.errors.length === 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
              <p className={`font-bold text-sm ${bulkResult.errors.length === 0 ? "text-green-700" : "text-amber-700"}`}>
                {bulkResult.ok} mandato{bulkResult.ok !== 1 ? "s" : ""} creado{bulkResult.ok !== 1 ? "s" : ""} correctamente.
              </p>
              {bulkResult.errors.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {bulkResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                </div>
              )}
              <Button size="sm" className="mt-3 bg-[#2460FF] hover:bg-[#00296B] text-white" onClick={() => { setBulkResult(null); loadSalesData(); }}>
                Ver ventas restantes
              </Button>
            </div>
          )}

          {!salesLoading && salesData.length > 0 && !bulkResult && (
            <>
              <div className="flex items-center gap-3 py-2">
                <span className="text-xs text-[#475569]">{salesData.filter(r => r.can_create).length} listas para mandato · {salesData.filter(r => !r.can_create).length} bloqueadas</span>
                <button className="text-xs text-[#2460FF] hover:underline ml-auto font-medium"
                  onClick={() => setSelSales(salesData.filter(r => r.can_create).map(r => r.sale_id))}>
                  Seleccionar aptas
                </button>
                {selSales.length > 0 && (
                  <button className="text-xs text-[#475569] hover:underline" onClick={() => setSelSales([])}>Limpiar</button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                {salesData.map(row => {
                  const isSel = selSales.includes(row.sale_id);
                  return (
                    <div key={row.sale_id}
                      onClick={() => row.can_create && setSelSales(s => s.includes(row.sale_id) ? s.filter(x => x !== row.sale_id) : [...s, row.sale_id])}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                        !row.can_create ? "opacity-50 cursor-not-allowed bg-[#F8FAFC] border-[#E2E8F0]" :
                        isSel ? "border-[#2460FF] ring-1 ring-[#2460FF] bg-[#F0F4FF] cursor-pointer" :
                        "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white cursor-pointer"
                      }`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSel ? "bg-[#2460FF] border-[#2460FF]" : "border-gray-300"}`}>
                        {isSel && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#0F172A]">{row.person_name}
                          <span className="ml-2 text-xs font-normal text-[#94A3B8]">{row.person_type === "player" ? "Deportista" : "Socio"}</span>
                        </p>
                        <p className="text-xs text-[#475569]">{row.concept} · {row.amount?.toFixed?.(2) ?? "—"} €
                          {row.due_date ? ` · Vence: ${row.due_date}` : ""}
                        </p>
                        {row.iban && <p className="text-xs text-[#94A3B8] font-mono">{row.iban.slice(0, 4)} •••• •••• {row.iban.slice(-4)}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {row.has_mandate && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Ya tiene mandato</span>}
                        {!row.iban && !row.has_mandate && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Sin IBAN</span>}
                        {row.can_create && <span className="text-xs bg-blue-50 text-[#2460FF] px-2 py-0.5 rounded-full font-medium">Apto</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#E2E8F0] pt-3 mt-2 flex items-center gap-3">
                <span className="text-sm font-medium text-[#475569]">{selSales.length} seleccionado{selSales.length !== 1 ? "s" : ""}</span>
                <Button onClick={handleBulkCreate} disabled={selSales.length === 0 || bulkCreating}
                  className="ml-auto bg-[#2460FF] hover:bg-[#00296B] text-white">
                  <Zap size={14} className="mr-1.5" />
                  {bulkCreating ? "Creando mandatos..." : `Crear ${selSales.length} mandato${selSales.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Diálogo: Generar XML ───────────────────────────────────────── */}
      <Dialog open={xmlOpen} onOpenChange={setXmlOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">Generar remesa SEPA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            {/* Resumen mandatos seleccionados */}
            <div className="bg-[#F4F7FB] rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-[#475569]">Mandatos seleccionados</span>
                <span className="font-bold text-[#00296B]">{selected.length}</span>
              </div>
              {selectedHasFrst && (
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600">· FRST / OOFF (bloque 1)</span>
                  <span className="font-medium">{first_count_sel(selectedMandates)} mandatos</span>
                </div>
              )}
              {selectedHasRcur && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">· RCUR / FNAL (bloque 2)</span>
                  <span className="font-medium">{rcur_count_sel(selectedMandates)} mandatos</span>
                </div>
              )}
              {selectedTotal > 0 && (
                <div className="flex justify-between text-sm border-t border-[#E2E8F0] pt-1.5 mt-1.5">
                  <span className="font-medium text-[#475569]">Total a cobrar</span>
                  <span className="font-bold text-green-700">{selectedTotal.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Nº remesa *</Label>
                <Input type="number" value={xmlForm.remesa_number} onChange={e => setXF("remesa_number", e.target.value)} className="mt-1" placeholder="500" />
              </div>
              <div>
                <Label className="text-sm">Fecha de cobro *</Label>
                <Input type="date" value={xmlForm.collection_date} onChange={e => setXF("collection_date", e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Aviso de plazo mínimo */}
            {dateWarning && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>
                  La fecha de cobro está a solo <b>{daysToCollection} día{daysToCollection !== 1 ? "s" : ""} hábil{daysToCollection !== 1 ? "es" : ""}</b>.
                  {selectedHasFrst ? " Los mandatos FRST requieren ≥5 días hábiles." : " Los mandatos RCUR requieren ≥2 días hábiles."}
                  {" "}El banco puede rechazarlo.
                </span>
              </div>
            )}
            {xmlForm.collection_date && !dateWarning && daysToCollection !== null && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                <CheckCircle2 size={13} />
                <span>Plazo correcto — {daysToCollection} días hábiles hasta el cobro.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Importe por defecto (€)</Label>
                <Input type="number" step="0.01" value={xmlForm.default_amount} onChange={e => setXF("default_amount", e.target.value)} className="mt-1" placeholder="32.50" />
                <p className="text-xs text-[#94A3B8] mt-1">Solo si el mandato no tiene cuota propia</p>
              </div>
              <div>
                <Label className="text-sm">Concepto *</Label>
                <Input value={xmlForm.concept} onChange={e => setXF("concept", e.target.value)} className="mt-1" maxLength={140} placeholder="PAGO CUOTA CLUB" />
                <p className="text-xs text-[#94A3B8] mt-1">Máx. 140 caracteres. Solo letras y números.</p>
              </div>
            </div>

            {xmlError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                {xmlError}
              </div>
            )}

            <Button onClick={handleGenerateXml} disabled={generating || !xmlForm.collection_date}
              className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Download size={14} className="mr-1.5" />
              {generating ? "Generando XML..." : "Descargar XML pain.008.001.02"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
              <Info size={12} />
              Formato oficial EPC SEPA Core — compatible con todos los bancos españoles.
              Los mandatos FRST pasarán a RCUR automáticamente.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// helpers para el diálogo
function first_count_sel(mands) { return mands.filter(m => ["FRST","OOFF"].includes(m.sequence_type)).length; }
function rcur_count_sel(mands)  { return mands.filter(m => ["RCUR","FNAL"].includes(m.sequence_type)).length; }
