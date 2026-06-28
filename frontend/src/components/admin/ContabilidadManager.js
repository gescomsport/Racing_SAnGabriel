import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  TrendingUp, TrendingDown, Plus, Trash2, Edit2, Download, Search,
  X, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";

const ax = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});

// ── Category maps ────────────────────────────────────────────────────────────
const CATEGORIAS_INGRESO = {
  cuotas: "Cuotas de socios/jugadores",
  inscripciones: "Inscripciones y matrículas",
  patrocinios: "Patrocinios y publicidad",
  subvenciones: "Subvenciones y ayudas",
  torneos: "Ingresos por torneos",
  merchandising: "Merchandising y venta",
  donaciones: "Donaciones",
  otros_ingreso: "Otros ingresos",
};
const CATEGORIAS_GASTO = {
  personal: "Personal y nóminas",
  instalaciones: "Instalaciones y alquiler",
  equipamiento: "Equipamiento deportivo",
  viajes: "Desplazamientos y viajes",
  arbitrajes: "Arbitrajes y tasas federativas",
  seguros: "Seguros",
  comunicacion: "Comunicación y marketing",
  suministros: "Suministros y oficina",
  mantenimiento: "Mantenimiento",
  otros_gasto: "Otros gastos",
};
const ALL_CATEGORIAS = { ...CATEGORIAS_INGRESO, ...CATEGORIAS_GASTO };
const METHOD_LABEL = {
  cash: "Efectivo",
  bank_transfer: "Transferencia",
  card: "Tarjeta",
  sepa: "SEPA",
};
const PERIOD_LABEL = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  annual: "Anual",
};
const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// ── Entry Form (module-level component) ─────────────────────────────────────
function EntryForm({ initial, onSave, onCancel, saving }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(
    initial || {
      type: "ingreso",
      category: "",
      concept: "",
      amount: "",
      date: today,
      supplier_or_client: "",
      payment_method: "bank_transfer",
      reference: "",
      is_recurring: false,
      recurring_period: "",
      notes: "",
    }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cats = form.type === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;

  // Reset category when type changes if it doesn't belong to new type
  const handleTypeChange = (t) => {
    const newCats = t === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO;
    setForm((f) => ({
      ...f,
      type: t,
      category: newCats[f.category] ? f.category : "",
    }));
  };

  const handleSubmit = () => {
    if (!form.type || !form.category || !form.concept || !form.amount || !form.date) return;
    onSave({ ...form, amount: parseFloat(form.amount) || 0 });
  };

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div>
        <Label className="text-xs text-[#64748B] mb-1.5 block">Tipo de apunte</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("ingreso")}
            className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
              form.type === "ingreso"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-[#E2E8F0] text-[#94A3B8] hover:border-green-200"
            }`}
          >
            <ArrowUpRight size={14} className="inline mr-1" />
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("gasto")}
            className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
              form.type === "gasto"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-[#E2E8F0] text-[#94A3B8] hover:border-red-200"
            }`}
          >
            <ArrowDownRight size={14} className="inline mr-1" />
            Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-[#64748B] mb-1.5 block">Categoría *</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(cats).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-[#64748B] mb-1.5 block">Importe (€) *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Concept */}
        <div className="col-span-2">
          <Label className="text-xs text-[#64748B] mb-1.5 block">Concepto *</Label>
          <Input
            placeholder="Descripción del apunte..."
            value={form.concept}
            onChange={(e) => set("concept", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Date */}
        <div>
          <Label className="text-xs text-[#64748B] mb-1.5 block">Fecha *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Supplier/Client */}
        <div>
          <Label className="text-xs text-[#64748B] mb-1.5 block">
            {form.type === "ingreso" ? "Cliente / Origen" : "Proveedor"}
          </Label>
          <Input
            placeholder={form.type === "ingreso" ? "Nombre o entidad" : "Nombre proveedor"}
            value={form.supplier_or_client}
            onChange={(e) => set("supplier_or_client", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Payment method */}
        <div>
          <Label className="text-xs text-[#64748B] mb-1.5 block">Método de pago</Label>
          <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="bank_transfer">Transferencia bancaria</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="sepa">SEPA / Domiciliación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reference */}
        <div>
          <Label className="text-xs text-[#64748B] mb-1.5 block">Referencia / Factura</Label>
          <Input
            placeholder="Nº factura, recibo..."
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* Recurring */}
        <div className="col-span-2 flex items-center gap-3 pt-1">
          <Checkbox
            id="is_recurring"
            checked={form.is_recurring}
            onCheckedChange={(v) => set("is_recurring", v)}
          />
          <Label htmlFor="is_recurring" className="text-sm text-[#475569] cursor-pointer">
            Apunte recurrente
          </Label>
        </div>

        {form.is_recurring && (
          <div className="col-span-2">
            <Label className="text-xs text-[#64748B] mb-1.5 block">Periodicidad</Label>
            <Select value={form.recurring_period} onValueChange={(v) => set("recurring_period", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccionar período..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Notes */}
        <div className="col-span-2">
          <Label className="text-xs text-[#64748B] mb-1.5 block">Notas</Label>
          <Textarea
            placeholder="Observaciones adicionales..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={saving || !form.type || !form.category || !form.concept || !form.amount || !form.date}
          className="flex-1 bg-[#2460FF] hover:bg-[#00296B] text-white"
        >
          {saving ? "Guardando..." : initial ? "Guardar cambios" : "Crear apunte"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="px-4">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ── KPI strip ────────────────────────────────────────────────────────────────
function KpiStrip({ summary }) {
  if (!summary) return null;
  const kpis = [
    {
      label: "Total ingresos año",
      val: `${summary.total_ingresos?.toFixed(2)}€`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total gastos año",
      val: `${summary.total_gastos?.toFixed(2)}€`,
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Balance año",
      val: `${summary.balance?.toFixed(2)}€`,
      icon: summary.balance >= 0 ? ArrowUpRight : ArrowDownRight,
      color: summary.balance >= 0 ? "text-[#2460FF]" : "text-red-600",
      bg: summary.balance >= 0 ? "bg-blue-50" : "bg-red-50",
    },
    {
      label: "Nº apuntes",
      val: summary.total_entries ?? 0,
      icon: TrendingUp,
      color: "text-[#64748B]",
      bg: "bg-slate-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
            <k.icon size={18} className={k.color} />
          </div>
          <div>
            <p className={`font-heading font-bold text-xl ${k.color}`}>{k.val}</p>
            <p className="text-xs text-[#94A3B8]">{k.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Monthly bar chart (pure CSS/div) ────────────────────────────────────────
function MonthlyBarChart({ monthly }) {
  if (!monthly || monthly.length === 0) return null;
  const maxVal = Math.max(
    ...monthly.map((m) => Math.max(m.ingresos, m.gastos)),
    1
  );

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-6">
      <h3 className="font-heading font-semibold text-[#00296B] text-sm mb-4">
        Evolución mensual {new Date().getFullYear()}
      </h3>
      <div className="flex items-end gap-1 h-36">
        {monthly.map((m) => {
          const inH = Math.round((m.ingresos / maxVal) * 128);
          const gaH = Math.round((m.gastos / maxVal) * 128);
          return (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-0.5 group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-[#00296B] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                  <div className="text-green-300">↑ {m.ingresos.toFixed(0)}€</div>
                  <div className="text-red-300">↓ {m.gastos.toFixed(0)}€</div>
                  <div className="text-white font-semibold border-t border-white/20 mt-1 pt-1">
                    = {m.balance.toFixed(0)}€
                  </div>
                </div>
              </div>

              {/* Bars side by side */}
              <div className="w-full flex items-end gap-px" style={{ height: "128px" }}>
                <div
                  className="flex-1 bg-green-400 rounded-t-sm transition-all"
                  style={{ height: `${inH}px`, minHeight: m.ingresos > 0 ? 2 : 0 }}
                />
                <div
                  className="flex-1 bg-red-400 rounded-t-sm transition-all"
                  style={{ height: `${gaH}px`, minHeight: m.gastos > 0 ? 2 : 0 }}
                />
              </div>
              <span className="text-[9px] text-[#94A3B8] mt-1">{MONTH_NAMES[m.month - 1]}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" /> Gastos
        </span>
      </div>
    </div>
  );
}

// ── Category breakdown ───────────────────────────────────────────────────────
function CategoryBreakdown({ summary }) {
  if (!summary) return null;

  const renderBars = (catMap, allCats, color) => {
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    return sorted.slice(0, 6).map(([key, val]) => {
      const pct = Math.round((val / total) * 100);
      return (
        <div key={key} className="mb-2">
          <div className="flex justify-between text-xs text-[#475569] mb-1">
            <span>{allCats[key] || key}</span>
            <span className="font-medium">{val.toFixed(0)}€ ({pct}%)</span>
          </div>
          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="font-heading font-semibold text-[#00296B] text-sm mb-4 flex items-center gap-2">
          <ArrowUpRight size={14} className="text-green-600" />
          Ingresos por categoría
        </h3>
        {Object.keys(summary.category_ingresos || {}).length === 0 ? (
          <p className="text-xs text-[#94A3B8]">Sin datos</p>
        ) : (
          renderBars(summary.category_ingresos, ALL_CATEGORIAS, "bg-green-400")
        )}
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="font-heading font-semibold text-[#00296B] text-sm mb-4 flex items-center gap-2">
          <ArrowDownRight size={14} className="text-red-500" />
          Gastos por categoría
        </h3>
        {Object.keys(summary.category_gastos || {}).length === 0 ? (
          <p className="text-xs text-[#94A3B8]">Sin datos</p>
        ) : (
          renderBars(summary.category_gastos, ALL_CATEGORIAS, "bg-red-400")
        )}
      </div>
    </div>
  );
}

// ── Entry row ────────────────────────────────────────────────────────────────
function EntryRow({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isIngreso = entry.type === "ingreso";

  return (
    <>
      <tr
        className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-sm text-[#475569] whitespace-nowrap">
          {entry.date}
        </td>
        <td className="px-4 py-3">
          <Badge
            className={`text-xs font-medium ${
              isIngreso
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {isIngreso ? (
              <ArrowUpRight size={11} className="inline mr-0.5" />
            ) : (
              <ArrowDownRight size={11} className="inline mr-0.5" />
            )}
            {isIngreso ? "Ingreso" : "Gasto"}
          </Badge>
        </td>
        <td className="px-4 py-3 text-xs text-[#64748B]">
          {ALL_CATEGORIAS[entry.category] || entry.category}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-[#1E293B]">{entry.concept}</td>
        <td className="px-4 py-3 text-xs text-[#64748B]">{entry.supplier_or_client || "-"}</td>
        <td className="px-4 py-3 text-right">
          <span
            className={`font-heading font-bold text-sm ${
              isIngreso ? "text-green-600" : "text-red-600"
            }`}
          >
            {isIngreso ? "+" : "-"}{Number(entry.amount).toFixed(2)}€
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-[#94A3B8]">{entry.reference || "-"}</td>
        <td className="px-4 py-3 text-center">
          {expanded ? (
            <ChevronUp size={14} className="text-[#94A3B8] inline" />
          ) : (
            <ChevronDown size={14} className="text-[#94A3B8] inline" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <td colSpan={8} className="px-6 pb-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-[#64748B]">
              <div>
                <p className="font-medium text-[#94A3B8] mb-0.5">Método de pago</p>
                <p>{METHOD_LABEL[entry.payment_method] || entry.payment_method || "-"}</p>
              </div>
              <div>
                <p className="font-medium text-[#94A3B8] mb-0.5">Recurrente</p>
                <p>
                  {entry.is_recurring
                    ? `Sí — ${PERIOD_LABEL[entry.recurring_period] || entry.recurring_period}`
                    : "No"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-[#94A3B8] mb-0.5">Notas</p>
                <p>{entry.notes || "-"}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
              >
                <Edit2 size={11} className="mr-1" /> Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={(e) => { e.stopPropagation(); onDelete(entry); }}
              >
                <Trash2 size={11} className="mr-1" /> Eliminar
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ContabilidadManager() {
  const currentYear = new Date().getFullYear();

  const [tab, setTab] = useState("resumen");
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterCategory, setFilterCategory] = useState("todos");
  const [filterYear, setFilterYear] = useState(String(currentYear));
  const [filterMonth, setFilterMonth] = useState("todos");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const params = {};
      if (filterType !== "todos") params.type = filterType;
      if (filterCategory !== "todos") params.category = filterCategory;
      if (filterYear !== "todos") params.year = parseInt(filterYear);
      if (filterMonth !== "todos") params.month = parseInt(filterMonth);
      const res = await ax.get("/accounting", { params });
      setEntries(res.data);
    } catch (_) {
      setEntries([]);
    }
  }, [filterType, filterCategory, filterYear, filterMonth]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await ax.get("/accounting/summary");
      setSummary(res.data);
    } catch (_) {
      setSummary(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEntries(), fetchSummary()]).finally(() => setLoading(false));
  }, [fetchEntries, fetchSummary]);

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.concept?.toLowerCase().includes(q) ||
        e.supplier_or_client?.toLowerCase().includes(q) ||
        e.reference?.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editEntry) {
        await ax.put(`/accounting/${editEntry.id}`, formData);
      } else {
        await ax.post("/accounting", formData);
      }
      setDialogOpen(false);
      setEditEntry(null);
      await Promise.all([fetchEntries(), fetchSummary()]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await ax.delete(`/accounting/${deleteTarget.id}`);
    setDeleteTarget(null);
    await Promise.all([fetchEntries(), fetchSummary()]);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterYear !== "todos") params.set("year", filterYear);
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/export/accounting?${params}`;
    window.open(url, "_blank");
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[#00296B]">Contabilidad</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Libro de ingresos y gastos del club</p>
        </div>
        {tab === "apuntes" && (
          <Button
            onClick={() => { setEditEntry(null); setDialogOpen(true); }}
            className="bg-[#2460FF] hover:bg-[#00296B] text-white"
          >
            <Plus size={14} className="mr-1" /> Nuevo apunte
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-6 w-fit">
        {["resumen", "apuntes", "presupuesto"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-white text-[#00296B] shadow-sm font-semibold"
                : "text-[#64748B] hover:text-[#00296B]"
            }`}
          >
            {t === "resumen" ? "Resumen" : t === "apuntes" ? "Apuntes" : "Presupuesto"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
          Cargando...
        </div>
      )}

      {/* ── RESUMEN TAB ─────────────────────────────────────────────────── */}
      {!loading && tab === "resumen" && (
        <>
          <KpiStrip summary={summary} />
          <MonthlyBarChart monthly={summary?.monthly} />
          <CategoryBreakdown summary={summary} />
        </>
      )}

      {/* ── APUNTES TAB ─────────────────────────────────────────────────── */}
      {!loading && tab === "apuntes" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  placeholder="Buscar concepto, proveedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Type filter */}
              <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1">
                {[
                  { val: "todos", label: "Todos" },
                  { val: "ingreso", label: "Ingresos" },
                  { val: "gasto", label: "Gastos" },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setFilterType(opt.val)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filterType === opt.val
                        ? "bg-white text-[#00296B] shadow-sm"
                        : "text-[#64748B] hover:text-[#00296B]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Category */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 text-sm w-44">
                  <SelectValue placeholder="Categoría..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las categorías</SelectItem>
                  <SelectItem value="__ingreso" disabled className="text-xs text-[#94A3B8] font-semibold">
                    — Ingresos —
                  </SelectItem>
                  {Object.entries(CATEGORIAS_INGRESO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                  <SelectItem value="__gasto" disabled className="text-xs text-[#94A3B8] font-semibold">
                    — Gastos —
                  </SelectItem>
                  {Object.entries(CATEGORIAS_GASTO).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year */}
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-9 text-sm w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los años</SelectItem>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month */}
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="h-9 text-sm w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los meses</SelectItem>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 text-sm border-[#E2E8F0] text-[#475569] hover:text-[#00296B]"
              >
                <Download size={13} className="mr-1.5" /> Excel
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs text-[#94A3B8]">
              {filteredEntries.length} apunte{filteredEntries.length !== 1 ? "s" : ""}
            </p>
            {filteredEntries.length > 0 && (
              <div className="flex gap-4 text-xs">
                <span className="text-green-600 font-medium">
                  Ingresos: {filteredEntries.filter((e) => e.type === "ingreso").reduce((s, e) => s + e.amount, 0).toFixed(2)}€
                </span>
                <span className="text-red-600 font-medium">
                  Gastos: {filteredEntries.filter((e) => e.type === "gasto").reduce((s, e) => s + e.amount, 0).toFixed(2)}€
                </span>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
                <TrendingUp size={32} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No hay apuntes contables</p>
                <p className="text-xs mt-1">Crea tu primer apunte con el botón de arriba</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">Categoría</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">Proveedor/Cliente</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748B]">Importe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B]">Referencia</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        onEdit={(e) => { setEditEntry(e); setDialogOpen(true); }}
                        onDelete={(e) => setDeleteTarget(e)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── PRESUPUESTO TAB ─────────────────────────────────────────────── */}
      {!loading && tab === "presupuesto" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={26} className="text-[#2460FF]" />
            </div>
            <h3 className="font-heading font-semibold text-[#00296B] text-lg mb-2">
              Presupuesto anual
            </h3>
            <p className="text-sm text-[#64748B]">
              Próximamente: define el presupuesto anual por categorías y compara con los gastos e ingresos reales del club.
            </p>
          </div>
        </div>
      )}

      {/* ── ENTRY DIALOG ────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditEntry(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              {editEntry ? "Editar apunte" : "Nuevo apunte contable"}
            </DialogTitle>
          </DialogHeader>
          <EntryForm
            key={editEntry?.id || "new"}
            initial={editEntry}
            onSave={handleSave}
            onCancel={() => { setDialogOpen(false); setEditEntry(null); }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM DIALOG ────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">Eliminar apunte</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#475569] mb-4">
            ¿Seguro que quieres eliminar{" "}
            <strong>"{deleteTarget?.concept}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
