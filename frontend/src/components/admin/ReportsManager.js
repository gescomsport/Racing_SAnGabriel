import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Download, TrendingUp, Users, Star, Euro, AlertTriangle,
  Filter, RefreshCw, FileSpreadsheet, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

// --- CSV EXPORT UTILITY ---
function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- KPI CARD ---
function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-[#475569]">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="font-heading font-bold text-2xl text-[#00296B]">{value}</p>
      {sub && <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>}
    </div>
  );
}

// --- SORTABLE TABLE ---
function SortableTable({ columns, data, exportFilename, exportLabel }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const sorted = [...(data || [])].sort((a, b) => {
    if (!sortCol) return 0;
    const av = a[sortCol] ?? "";
    const bv = b[sortCol] ?? "";
    if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv), "es")
      : String(bv).localeCompare(String(av), "es");
  });

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const handleExport = () => {
    const exportData = sorted.map(row => {
      const obj = {};
      columns.forEach(c => { obj[c.label] = row[c.key] ?? ""; });
      return obj;
    });
    exportCSV(exportData, exportFilename || "export.csv");
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={handleExport} variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-50">
          <FileSpreadsheet size={14} className="mr-1" />
          {exportLabel || "Exportar Excel/CSV"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB]">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-4 py-3 font-semibold text-[#475569] cursor-pointer select-none hover:text-[#00296B] whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key
                      ? sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      : <span className="opacity-0"><ChevronUp size={12} /></span>
                    }
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={columns.length} className="text-center py-10 text-[#94A3B8]">Sin datos</td></tr>
            ) : sorted.map((row, i) => (
              <tr key={i} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-[#0F172A]">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#94A3B8] mt-2 text-right">{sorted.length} registros</p>
    </div>
  );
}

// --- STATUS BADGE ---
const STATUS_COLOR = {
  paid: "bg-green-50 text-green-700",
  pagado: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  pendiente: "bg-amber-50 text-amber-700",
  active: "bg-blue-50 text-blue-700",
  activo: "bg-blue-50 text-blue-700",
  overdue: "bg-red-50 text-red-700",
  vencido: "bg-red-50 text-red-700",
  inactive: "bg-gray-100 text-gray-600",
  pending_payment: "bg-amber-50 text-amber-700",
  sin_pago: "bg-gray-100 text-gray-600",
};
function StatusBadge({ val }) {
  return <Badge className={`text-xs ${STATUS_COLOR[val] || "bg-gray-100 text-gray-600"}`}>{val}</Badge>;
}

// --- MAIN COMPONENT ---
export default function ReportsManager() {
  const [summary, setSummary] = useState(null);
  const [teams, setTeams] = useState([]);
  const [fees, setFees] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  // Filters
  const [playersFilter, setPlayersFilter] = useState({ team_id: "", status: "", fee_id: "", date_from: "", date_to: "" });
  const [paymentsFilter, setPaymentsFilter] = useState({ person_type: "", status: "", fee_id: "", date_from: "", date_to: "", team_id: "" });

  const [playersData, setPlayersData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

  useEffect(() => {
    loadSummary();
    ax.get("/teams").then(r => setTeams(r.data)).catch(() => {});
    ax.get("/fees").then(r => setFees(r.data)).catch(() => {});
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const r = await ax.get("/reports/summary");
      setSummary(r.data);
    } catch {}
    setLoading(false);
  };

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(playersFilter).filter(([, v]) => v));
      const r = await ax.get("/reports/players-detail", { params });
      setPlayersData(r.data);
      setPlayersLoaded(true);
    } catch {}
    setLoading(false);
  }, [playersFilter]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(paymentsFilter).filter(([, v]) => v));
      const r = await ax.get("/reports/payments-detail", { params });
      setPaymentsData(r.data);
      setPaymentsLoaded(true);
    } catch {}
    setLoading(false);
  }, [paymentsFilter]);

  useEffect(() => { if (tab === "players") loadPlayers(); }, [tab]);
  useEffect(() => { if (tab === "payments") loadPayments(); }, [tab]);

  const kpis = summary?.kpis || {};

  const tabs = [
    { id: "overview", label: "Resumen" },
    { id: "sales", label: "Ventas por tarifa" },
    { id: "teams_report", label: "Por equipo" },
    { id: "players", label: "Jugadores detalle" },
    { id: "payments", label: "Pagos detalle" },
    { id: "overdue", label: "Morosos" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Informes y Exportaciones</h2>
          <p className="text-sm text-[#475569] mt-0.5">Analítica completa del club · Exporta cualquier tabla a Excel/CSV</p>
        </div>
        <Button onClick={loadSummary} variant="outline" size="sm" disabled={loading} className="text-[#475569]">
          <RefreshCw size={14} className={`mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Jugadores activos" value={`${kpis.active_players} / ${kpis.total_players}`} sub="activos / total" color="bg-[#2460FF]" icon={Users} />
          <KpiCard label="Socios activos" value={`${kpis.active_members} / ${kpis.total_members}`} sub="activos / total" color="bg-amber-500" icon={Star} />
          <KpiCard label="Cobrado total" value={`${kpis.total_collected?.toFixed(2)} €`} color="bg-green-600" icon={Euro} />
          <KpiCard label="Pendiente de cobro" value={`${kpis.total_pending?.toFixed(2)} €`} sub={kpis.overdue_count > 0 ? `⚠ ${kpis.overdue_count} vencidos` : undefined} color={kpis.overdue_count > 0 ? "bg-red-500" : "bg-amber-500"} icon={AlertTriangle} />
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#2460FF] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]"}`}
          >{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by fee mini-table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="font-heading font-bold text-[#00296B] text-sm mb-4">Ventas por tarifa</h3>
            {summary.sales_by_fee.length === 0 ? <p className="text-sm text-[#94A3B8]">Sin datos de ventas</p> :
              <div className="space-y-3">
                {summary.sales_by_fee.sort((a, b) => b.total_paid - a.total_paid).slice(0, 8).map(s => (
                  <div key={s.fee_id} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{s.fee_name}</p>
                      <p className="text-xs text-[#94A3B8]">{s.count} ventas</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-green-700">{s.total_paid.toFixed(2)} €</p>
                      {s.total_pending > 0 && <p className="text-xs text-amber-600">{s.total_pending.toFixed(2)} € pdte.</p>}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
          {/* Players by team */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="font-heading font-bold text-[#00296B] text-sm mb-4">Jugadores por equipo</h3>
            {summary.players_by_team.length === 0 ? <p className="text-sm text-[#94A3B8]">Sin equipos</p> :
              <div className="space-y-3">
                {summary.players_by_team.sort((a, b) => b.total - a.total).map(t => (
                  <div key={t.team} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-[#0F172A]">{t.team}</p>
                        <p className="text-sm font-bold text-[#00296B]">{t.total}</p>
                      </div>
                      <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#2460FF] rounded-full" style={{ width: `${Math.min(100, (t.active / (t.total || 1)) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{t.active} activos · {t.pending} pendientes</p>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {/* SALES BY FEE */}
      {tab === "sales" && summary && (
        <SortableTable
          exportFilename={`ventas_por_tarifa_${new Date().toISOString().slice(0,10)}.csv`}
          exportLabel="Exportar ventas"
          columns={[
            { key: "fee_name", label: "Tarifa" },
            { key: "fee_type", label: "Tipo" },
            { key: "unit_price", label: "Precio unitario", render: v => `${Number(v).toFixed(2)} €` },
            { key: "count", label: "Uds. vendidas" },
            { key: "total_paid", label: "Total cobrado", render: v => <span className="font-bold text-green-700">{Number(v).toFixed(2)} €</span> },
            { key: "total_pending", label: "Total pendiente", render: v => Number(v) > 0 ? <span className="text-amber-600">{Number(v).toFixed(2)} €</span> : "—" },
          ]}
          data={summary.sales_by_fee}
        />
      )}

      {/* PLAYERS BY TEAM */}
      {tab === "teams_report" && summary && (
        <SortableTable
          exportFilename={`jugadores_por_equipo_${new Date().toISOString().slice(0,10)}.csv`}
          exportLabel="Exportar equipos"
          columns={[
            { key: "team", label: "Equipo" },
            { key: "total", label: "Total jugadores" },
            { key: "active", label: "Activos", render: v => <span className="text-green-700 font-medium">{v}</span> },
            { key: "pending", label: "Pago pendiente", render: v => Number(v) > 0 ? <span className="text-amber-600 font-medium">{v}</span> : v },
            { key: "inactive", label: "Inactivos", render: v => Number(v) > 0 ? <span className="text-gray-500">{v}</span> : v },
          ]}
          data={summary.players_by_team}
        />
      )}

      {/* PLAYERS DETAIL */}
      {tab === "players" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-[#2460FF]" />
              <p className="text-sm font-medium text-[#00296B]">Filtros</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Equipo</Label>
                <Select value={playersFilter.team_id} onValueChange={v => setPlayersFilter(f => ({ ...f, team_id: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los equipos</SelectItem>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estado</Label>
                <Select value={playersFilter.status} onValueChange={v => setPlayersFilter(f => ({ ...f, status: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="pending_payment">Pago pendiente</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tarifa contratada</Label>
                <Select value={playersFilter.fee_id} onValueChange={v => setPlayersFilter(f => ({ ...f, fee_id: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tarifas</SelectItem>
                    {fees.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Alta desde</Label>
                <Input type="date" value={playersFilter.date_from} onChange={e => setPlayersFilter(f => ({ ...f, date_from: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Alta hasta</Label>
                <Input type="date" value={playersFilter.date_to} onChange={e => setPlayersFilter(f => ({ ...f, date_to: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div className="flex items-end">
                <Button onClick={loadPlayers} className="w-full h-9 bg-[#2460FF] hover:bg-[#00296B] text-white text-sm" disabled={loading}>
                  <Filter size={13} className="mr-1" /> Aplicar filtros
                </Button>
              </div>
            </div>
          </div>

          {playersLoaded && (
            <SortableTable
              exportFilename={`jugadores_${new Date().toISOString().slice(0,10)}.csv`}
              exportLabel="Exportar jugadores"
              columns={[
                { key: "name", label: "Nombre" },
                { key: "dni", label: "DNI" },
                { key: "team", label: "Equipo" },
                { key: "category", label: "Categoría" },
                { key: "position", label: "Posición" },
                { key: "phone", label: "Teléfono" },
                { key: "email", label: "Email" },
                { key: "created_at", label: "Alta" },
                { key: "status", label: "Estado", render: v => <StatusBadge val={v} /> },
                { key: "total_paid", label: "Cobrado", render: v => <span className="font-medium text-green-700">{Number(v).toFixed(2)} €</span> },
                { key: "total_pending", label: "Pendiente", render: v => Number(v) > 0 ? <span className="text-amber-600">{Number(v).toFixed(2)} €</span> : "—" },
                { key: "payment_status", label: "Estado pago", render: v => <StatusBadge val={v} /> },
              ]}
              data={playersData}
            />
          )}
          {!playersLoaded && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-[#94A3B8] text-sm">
              Aplica los filtros para cargar los datos
            </div>
          )}
        </div>
      )}

      {/* PAYMENTS DETAIL */}
      {tab === "payments" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-[#2460FF]" />
              <p className="text-sm font-medium text-[#00296B]">Filtros de pagos</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo de persona</Label>
                <Select value={paymentsFilter.person_type} onValueChange={v => setPaymentsFilter(f => ({ ...f, person_type: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="player">Jugadores</SelectItem>
                    <SelectItem value="member">Socios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estado del pago</Label>
                <Select value={paymentsFilter.status} onValueChange={v => setPaymentsFilter(f => ({ ...f, status: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Cobrados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tarifa</Label>
                <Select value={paymentsFilter.fee_id} onValueChange={v => setPaymentsFilter(f => ({ ...f, fee_id: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {fees.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Equipo</Label>
                <Select value={paymentsFilter.team_id} onValueChange={v => setPaymentsFilter(f => ({ ...f, team_id: v === "all" ? "" : v }))}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fecha desde</Label>
                <Input type="date" value={paymentsFilter.date_from} onChange={e => setPaymentsFilter(f => ({ ...f, date_from: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Fecha hasta</Label>
                <Input type="date" value={paymentsFilter.date_to} onChange={e => setPaymentsFilter(f => ({ ...f, date_to: e.target.value }))} className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <Button onClick={loadPayments} className="mt-3 bg-[#2460FF] hover:bg-[#00296B] text-white text-sm h-9" disabled={loading}>
              <Filter size={13} className="mr-1" /> Aplicar filtros
            </Button>
          </div>

          {paymentsLoaded && (
            <SortableTable
              exportFilename={`pagos_${new Date().toISOString().slice(0,10)}.csv`}
              exportLabel="Exportar pagos"
              columns={[
                { key: "fecha", label: "Fecha" },
                { key: "persona", label: "Persona" },
                { key: "tipo_persona", label: "Tipo", render: v => v === "player" ? "Jugador" : "Socio" },
                { key: "equipo", label: "Equipo" },
                { key: "tarifa", label: "Tarifa" },
                { key: "concepto", label: "Concepto" },
                { key: "importe", label: "Importe", render: v => <span className="font-medium">{Number(v).toFixed(2)} €</span> },
                { key: "metodo", label: "Método" },
                { key: "estado", label: "Estado", render: v => <StatusBadge val={v} /> },
                { key: "vencimiento", label: "Vencimiento" },
                { key: "pagado_el", label: "Cobrado el" },
              ]}
              data={paymentsData}
            />
          )}
          {!paymentsLoaded && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-[#94A3B8] text-sm">
              Aplica los filtros para cargar los datos
            </div>
          )}
        </div>
      )}

      {/* OVERDUE */}
      {tab === "overdue" && (
        <OverdueReport teams={teams} />
      )}
    </div>
  );
}

function OverdueReport({ teams }) {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [teamFilter, setTeamFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { status: "pending" };
      if (teamFilter) params.team_id = teamFilter;
      const r = await ax.get("/reports/payments-detail", { params });
      const today = new Date().toISOString().slice(0, 10);
      const overdue = r.data.filter(p => p.vencimiento && p.vencimiento < today);
      setData(overdue);
      setLoaded(true);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-700">Informe de morosos</p>
          <p className="text-xs text-red-600">Pagos con fecha de vencimiento superada y estado pendiente</p>
        </div>
      </div>
      <div className="flex gap-3 items-end">
        <div className="w-48">
          <Label className="text-xs">Equipo</Label>
          <Select value={teamFilter} onValueChange={v => setTeamFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} className="h-9 bg-red-600 hover:bg-red-700 text-white text-sm" disabled={loading}>
          <Filter size={13} className="mr-1" /> Filtrar
        </Button>
      </div>
      {loaded && (
        <>
          {data.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 font-medium">
              Total vencido: <span className="font-bold">{data.reduce((s, p) => s + Number(p.importe), 0).toFixed(2)} €</span> en {data.length} recibos
            </div>
          )}
          <SortableTable
            exportFilename={`morosos_${new Date().toISOString().slice(0,10)}.csv`}
            exportLabel="Exportar morosos"
            columns={[
              { key: "persona", label: "Persona" },
              { key: "tipo_persona", label: "Tipo", render: v => v === "player" ? "Jugador" : "Socio" },
              { key: "equipo", label: "Equipo" },
              { key: "concepto", label: "Concepto" },
              { key: "importe", label: "Importe", render: v => <span className="font-bold text-red-700">{Number(v).toFixed(2)} €</span> },
              { key: "vencimiento", label: "Venció el", render: v => <span className="text-red-600 font-medium">{v}</span> },
              { key: "fecha", label: "Fecha emisión" },
            ]}
            data={data}
          />
        </>
      )}
    </div>
  );
}
