import { useState, useEffect } from "react";
import { CreditCard, AlertTriangle, CheckCircle, Clock, Download, Trash2, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import ax from "../../api";

const STATUS_CONFIG = {
  paid: { label: "Pagado", color: "bg-green-50 text-green-700", icon: CheckCircle },
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700", icon: Clock },
  failed: { label: "Fallido", color: "bg-red-50 text-red-700", icon: AlertTriangle },
  refunded: { label: "Devuelto", color: "bg-gray-50 text-gray-700", icon: RefreshCw },
};

export default function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [members, setMembers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [overdueReport, setOverdueReport] = useState([]);
  const [tab, setTab] = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [pay, pl, mb, od] = await Promise.all([
      ax.get("/payments"),
      ax.get("/players"),
      ax.get("/members"),
      ax.get("/payments/report/overdue"),
    ]);
    setPayments(pay.data);
    setPlayers(pl.data);
    setMembers(mb.data);
    setOverdueReport(od.data);
  };

  const markPaid = async (id) => {
    await ax.put(`/payments/${id}`, {
      status: "paid",
      paid_at: new Date().toISOString(),
    });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar registro de pago?")) return;
    await ax.delete(`/payments/${id}`);
    load();
  };

  const getPersonName = (payment) => {
    if (payment.person_type === "player") {
      const p = players.find(pl => pl.id === payment.person_id);
      return p ? `${p.name} ${p.surname || ""}`.trim() : "Jugador desconocido";
    }
    const m = members.find(mb => mb.id === payment.person_id);
    return m ? `${m.name} ${m.surname || ""}`.trim() : "Socio desconocido";
  };

  const filtered = payments.filter(p => {
    if (tab === "overdue") return overdueReport.some(od => od.id === p.id);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchType = filterType === "all" || p.person_type === filterType;
    return matchStatus && matchType;
  });

  const totalPaid = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);

  const exportCSV = () => {
    const rows = [
      ["Persona", "Tipo", "Concepto", "Importe", "Estado", "Fecha pago", "Fecha vencimiento"],
      ...filtered.map(p => [
        getPersonName(p),
        p.person_type === "player" ? "Jugador" : "Socio",
        p.concept,
        `${p.amount?.toFixed(2)}€`,
        STATUS_CONFIG[p.status]?.label || p.status,
        p.paid_at ? new Date(p.paid_at).toLocaleDateString("es-ES") : "-",
        p.due_date || "-",
      ])
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Pagos</h2>
          <p className="text-sm text-[#475569]">{payments.length} registros · {overdueReport.length} vencidos</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="text-sm">
          <Download size={14} className="mr-1" /> Exportar CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-xs text-green-600 font-medium mb-1">Cobrado</p>
          <p className="font-heading font-bold text-green-700 text-2xl">{totalPaid.toFixed(2)}€</p>
          <p className="text-xs text-green-500">{payments.filter(p => p.status === "paid").length} pagos</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-xs text-amber-600 font-medium mb-1">Pendiente</p>
          <p className="font-heading font-bold text-amber-700 text-2xl">{totalPending.toFixed(2)}€</p>
          <p className="text-xs text-amber-500">{payments.filter(p => p.status === "pending").length} pagos</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-600 font-medium mb-1">Vencidos</p>
          <p className="font-heading font-bold text-red-700 text-2xl">{overdueReport.length}</p>
          <p className="text-xs text-red-500">sin cobrar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "all", label: "Todos" },
          { id: "overdue", label: `Vencidos (${overdueReport.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#2460FF] text-white" : "bg-[#F4F7FB] text-[#475569] hover:bg-[#E2E8F0]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <div className="flex gap-3 mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="failed">Fallido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="player">Jugadores</SelectItem>
              <SelectItem value="member">Socios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#475569]">
            <CreditCard size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay pagos que coincidan</p>
          </div>
        )}
        {filtered.map(payment => {
          const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const isOverdue = overdueReport.some(od => od.id === payment.id);

          return (
            <div key={payment.id} className={`bg-white rounded-lg border p-4 flex items-center justify-between ${isOverdue ? "border-red-200" : "border-[#E2E8F0]"}`}>
              <div className="flex items-center gap-4">
                <div className="text-center min-w-16">
                  <p className="font-heading font-bold text-[#00296B]">{payment.amount?.toFixed(2)}€</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-[#0F172A] text-sm">{getPersonName(payment)}</span>
                    <Badge className="text-xs bg-[#F4F7FB] text-[#475569]">
                      {payment.person_type === "player" ? "Jugador" : "Socio"}
                    </Badge>
                    {isOverdue && <Badge className="text-xs bg-red-50 text-red-600">Vencido</Badge>}
                  </div>
                  <p className="text-xs text-[#475569]">{payment.concept}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {payment.paid_at && (
                      <p className="text-xs text-[#94A3B8]">
                        Pagado: {new Date(payment.paid_at).toLocaleDateString("es-ES")}
                      </p>
                    )}
                    {payment.due_date && payment.status !== "paid" && (
                      <p className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-[#94A3B8]"}`}>
                        Vence: {payment.due_date}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs flex items-center gap-1 ${cfg.color}`}>
                  <StatusIcon size={10} />{cfg.label}
                </Badge>
                {payment.status === "pending" && (
                  <Button onClick={() => markPaid(payment.id)} variant="outline" size="sm" className="text-xs text-green-600 border-green-200 hover:bg-green-50">
                    Marcar pagado
                  </Button>
                )}
                <Button onClick={() => handleDelete(payment.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
