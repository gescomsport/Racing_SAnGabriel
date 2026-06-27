import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Download, Plus, Search, Filter, TrendingUp, Clock, AlertTriangle, CheckCircle, CreditCard, X, Euro, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const STATUS_STYLE = {
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-slate-100 text-slate-500",
  refunded: "bg-blue-50 text-blue-700",
};
const STATUS_LABEL = { paid: "Cobrado", pending: "Pendiente", cancelled: "Cancelado", refunded: "Devuelto" };
const METHOD_LABEL = { cash: "Efectivo", bank_transfer: "Transferencia", stripe: "Tarjeta/Stripe", sepa: "SEPA/Domicil.", redsys: "TPV Redsys", pending: "Sin definir" };

// ── Dashboard strip ─────────────────────────────────────────────────────────
function DashboardStrip({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Ingresos período", val: `${stats.revenue?.toFixed(2)}€`, sub: `${stats.revenue_count} cobros`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Pendiente de cobro", val: `${stats.pending_total?.toFixed(2)}€`, sub: `${stats.pending_count} ventas`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Vencido sin cobrar", val: `${stats.overdue_total?.toFixed(2)}€`, sub: `${stats.overdue_count} ventas`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
        { label: "Total ventas", val: (stats.revenue_count || 0) + (stats.pending_count || 0) + (stats.cancelled_count || 0), sub: "en el período", icon: Euro, color: "text-[#2460FF]", bg: "bg-blue-50" },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
            <s.icon size={18} className={s.color} />
          </div>
          <div>
            <p className={`font-heading font-bold text-xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#94A3B8]">{s.label}</p>
            <p className="text-xs text-[#CBD5E1]">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Nueva Venta modal ───────────────────────────────────────────────────────
function NuevaVentaDialog({ players, members, products, fees, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ person_id: "", person_type: "player", product_id: "", fee_id: "", concept: "", amount: "", payment_method: "pending", due_date: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const personList = form.person_type === "player" ? players : members;

  const handleCreate = async () => {
    await ax.post("/sales", { ...form, amount: parseFloat(form.amount) || 0 });
    setOpen(false);
    setForm({ person_id: "", person_type: "player", product_id: "", fee_id: "", concept: "", amount: "", payment_method: "pending", due_date: "" });
    onCreated();
  };

  const applyProduct = (pid) => {
    const p = products.find(x => x.id === pid);
    if (p) { set("product_id", pid); set("concept", p.name); set("amount", String(p.price)); }
    else set("product_id", pid);
  };

  const applyFee = (fid) => {
    const f = fees.find(x => x.id === fid);
    if (f) { set("fee_id", fid); set("concept", f.name); set("amount", String(f.amount)); }
    else set("fee_id", fid);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white"><Plus size={14} className="mr-1" />Nueva venta</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva venta / cobro</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Tipo persona</Label>
              <Select value={form.person_type} onValueChange={v => { set("person_type", v); set("person_id", ""); }}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="player">Deportista</SelectItem><SelectItem value="member">Socio</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Persona</Label>
              <Select value={form.person_id} onValueChange={v => set("person_id", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{personList.map(p => <SelectItem key={p.id} value={p.id}>{p.name} {p.surname}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Producto (opcional)</Label>
              <Select value={form.product_id} onValueChange={applyProduct}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Producto..." /></SelectTrigger>
                <SelectContent><SelectItem value="_none">—</SelectItem>{products.filter(p => p.active).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.price}€)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Tarifa (opcional)</Label>
              <Select value={form.fee_id} onValueChange={applyFee}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Tarifa..." /></SelectTrigger>
                <SelectContent><SelectItem value="_none">—</SelectItem>{fees.filter(f => f.active).map(f => <SelectItem key={f.id} value={f.id}>{f.name} ({f.amount}€)</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-sm">Concepto</Label><Input value={form.concept} onChange={e => set("concept", e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-sm">Importe (€)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-sm">Método de pago</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(METHOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-sm">Fecha de vencimiento</Label><Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="mt-1" /></div>
          <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Crear venta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Venta masiva ────────────────────────────────────────────────────────────
function VentaMasivaDialog({ players, members, products, fees, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ target: "all_players", team_id: "", product_id: "", fee_id: "", concept: "", amount: "", payment_method: "sepa", due_date: "" });
  const [teams, setTeams] = useState([]);
  const [preview, setPreview] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { ax.get("/teams").then(r => setTeams(r.data)); }, []);

  const getTargetIds = () => {
    if (form.target === "all_players") return { player_ids: players.filter(p => p.status === "active").map(p => p.id), member_ids: [] };
    if (form.target === "all_members") return { player_ids: [], member_ids: members.filter(m => m.status === "active").map(m => m.id) };
    if (form.target === "team") return { player_ids: players.filter(p => p.team_id === form.team_id && p.status === "active").map(p => p.id), member_ids: [] };
    return { player_ids: [], member_ids: [] };
  };

  const handlePreview = () => {
    const ids = getTargetIds();
    setPreview(ids.player_ids.length + ids.member_ids.length);
  };

  const handleCreate = async () => {
    const ids = getTargetIds();
    const r = await ax.post("/sales/bulk", { ...ids, ...form, amount: parseFloat(form.amount) || 0 });
    setOpen(false);
    setPreview(null);
    onCreated();
  };

  const applyProduct = (pid) => {
    const p = products.find(x => x.id === pid);
    if (p) { set("product_id", pid); set("concept", p.name); set("amount", String(p.price)); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-[#2460FF] border-[#2460FF]"><Users size={14} className="mr-1" />Venta masiva</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Venta / cobro masivo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Destinatarios</Label>
            <Select value={form.target} onValueChange={v => set("target", v)}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_players">Todos los deportistas activos</SelectItem>
                <SelectItem value="all_members">Todos los socios activos</SelectItem>
                <SelectItem value="team">Por equipo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.target === "team" && (
            <div>
              <Label className="text-sm">Equipo</Label>
              <Select value={form.team_id} onValueChange={v => set("team_id", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar equipo..." /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-sm">Producto / Tarifa</Label>
            <Select value={form.product_id} onValueChange={applyProduct}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Personalizado —</SelectItem>
                {products.filter(p => p.active).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.price}€)</SelectItem>)}
                {fees.filter(f => f.active).map(f => <SelectItem key={f.id} value={f.id}>{f.name} ({f.amount}€)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-sm">Concepto</Label><Input value={form.concept} onChange={e => set("concept", e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-sm">Importe (€)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-sm">Método de pago</Label>
              <Select value={form.payment_method} onValueChange={v => set("payment_method", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(METHOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-sm">Vencimiento</Label><Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="mt-1" /></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} className="flex-1 text-sm">Vista previa</Button>
            {preview != null && <span className="self-center text-sm font-bold text-[#2460FF]">{preview} destinatarios</span>}
          </div>
          <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Generar ventas masivas</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function VentasManager() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [fees, setFees] = useState([]);
  const [filters, setFilters] = useState({ status: "", payment_method: "", date_from: "", date_to: "" });
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sepaMode, setSepaMode] = useState(false);
  const [sepaList, setSepaList] = useState([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.payment_method) params.set("payment_method", filters.payment_method);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    const [sr, dr, pr, mr, prodR, feeR] = await Promise.all([
      ax.get(`/sales?${params}`),
      ax.get(`/dashboard/stats?date_from=${filters.date_from || ""}&date_to=${filters.date_to || ""}`),
      ax.get("/players"),
      ax.get("/members"),
      ax.get("/products"),
      ax.get("/fees"),
    ]);
    setSales(sr.data); setStats(dr.data);
    setPlayers(pr.data); setMembers(mr.data);
    setProducts(prodR.data); setFees(feeR.data);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const playersMap = Object.fromEntries(players.map(p => [p.id, `${p.name} ${p.surname}`.trim()]));
  const membersMap = Object.fromEntries(members.map(m => [m.id, `${m.name} ${m.surname}`.trim()]));
  const getName = (s) => playersMap[s.person_id] || membersMap[s.person_id] || "—";

  const filtered = sales.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      if (!(getName(s) + s.concept).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const markPaid = async (id) => {
    await ax.put(`/sales/${id}`, { status: "paid" });
    load();
  };

  const deleteSale = async (id) => {
    if (!window.confirm("¿Eliminar venta?")) return;
    await ax.delete(`/sales/${id}`);
    load();
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (filters.payment_method) params.set("payment_method", filters.payment_method);
    const res = await ax.get(`/export/sales?${params}`, { responseType: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(res.data); a.download = "ventas.xlsx"; a.click();
  };

  const loadSepa = async () => {
    const r = await ax.get("/sales/export-sepa");
    setSepaList(r.data);
    setSepaMode(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div data-testid="admin-ventas">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-bold text-[#00296B] text-xl">Ventas y Cobros</h2>
        <div className="flex gap-2">
          <NuevaVentaDialog players={players} members={members} products={products} fees={fees} onCreated={load} />
          <VentaMasivaDialog players={players} members={members} products={products} fees={fees} onCreated={load} />
        </div>
      </div>

      <DashboardStrip stats={stats} />

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input placeholder="Buscar persona/concepto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 text-sm" />
          </div>
          <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent><SelectItem value="_all">Todos</SelectItem>{Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.payment_method} onValueChange={v => setFilters(f => ({ ...f, payment_method: v === "_all" ? "" : v }))}>
            <SelectTrigger className="text-sm"><SelectValue placeholder="Método pago" /></SelectTrigger>
            <SelectContent><SelectItem value="_all">Todos</SelectItem>{Object.entries(METHOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="text-sm" />
          <Input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="text-sm" />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#475569]">{filtered.length} ventas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilters({ status: "", payment_method: "", date_from: "", date_to: "" })} className="text-xs"><X size={12} className="mr-1" />Limpiar</Button>
            <Button size="sm" onClick={loadSepa} variant="outline" className="text-xs text-purple-700 border-purple-300">SEPA pendiente</Button>
            <Button size="sm" onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white text-xs"><Download size={12} className="mr-1" />Excel</Button>
          </div>
        </div>
      </div>

      {/* SEPA panel */}
      {sepaMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-purple-800 text-sm">Ventas SEPA pendientes — {sepaList.length} registros</p>
            <Button size="sm" variant="ghost" onClick={() => setSepaMode(false)} className="text-purple-600 text-xs">Cerrar</Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {sepaList.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-white rounded-lg p-2 text-sm">
                <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
                <span className="flex-1">{s.person_name}</span>
                <span className="font-bold">{s.amount}€</span>
                <span className={`text-xs px-1 rounded ${s.has_mandate ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {s.has_mandate ? "✓ Mandato" : "Sin mandato"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-purple-600 mb-2">Selecciona ventas con mandato activo y ve a SEPA/Domiciliaciones para generar el XML pain.008</p>
          <Button size="sm" className="bg-purple-700 hover:bg-purple-900 text-white text-xs" onClick={() => { setSepaMode(false); }}>
            Ir a SEPA → ({selectedIds.size} seleccionados)
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Persona</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden md:table-cell">Concepto</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Importe</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden lg:table-cell">Método</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden lg:table-cell">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#0F172A] text-sm">{getName(s)}</p>
                  <p className="text-xs text-[#94A3B8]">{s.person_type === "player" ? "Deportista" : "Socio"}</p>
                </td>
                <td className="px-4 py-3 text-[#475569] hidden md:table-cell">{s.concept}</td>
                <td className="px-4 py-3 font-bold text-[#00296B]">{s.amount?.toFixed(2)}€</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_STYLE[s.status] || ""}`}>{STATUS_LABEL[s.status] || s.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#475569] hidden lg:table-cell">{METHOD_LABEL[s.payment_method] || s.payment_method}</td>
                <td className="px-4 py-3 text-xs text-[#94A3B8] hidden lg:table-cell">{s.created_at?.slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {s.status === "pending" && (
                      <Button size="sm" variant="ghost" className="text-green-600 text-xs h-7" onClick={() => markPaid(s.id)}>
                        <CheckCircle size={12} className="mr-1" />Cobrar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => deleteSale(s.id)}>
                      <X size={12} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-[#94A3B8]">Sin ventas con los filtros aplicados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
