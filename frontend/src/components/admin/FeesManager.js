import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Trash2, Edit, Euro, ToggleLeft, ToggleRight, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const EMPTY_FORM = {
  name: "", description: "", amount: "", currency: "eur",
  fee_type: "inscripcion", team_id: "", member_type: "", active: true
};

const FEE_TYPES = [
  { value: "inscripcion", label: "Inscripción (pago único)" },
  { value: "cuota_mensual", label: "Cuota mensual" },
  { value: "cuota_temporada", label: "Cuota de temporada" },
  { value: "socio", label: "Cuota de socio" },
  { value: "otro", label: "Otro" },
];

const TYPE_COLORS = {
  inscripcion: "bg-blue-50 text-blue-700",
  cuota_mensual: "bg-purple-50 text-purple-700",
  cuota_temporada: "bg-green-50 text-green-700",
  socio: "bg-amber-50 text-amber-700",
  otro: "bg-gray-50 text-gray-700",
};

export default function FeesManager() {
  const [fees, setFees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [open, setOpen] = useState(false);
  const [editFee, setEditFee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importMsg, setImportMsg] = useState(null);
  const importRef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [f, t] = await Promise.all([ax.get("/fees"), ax.get("/teams")]);
    setFees(f.data);
    setTeams(t.data);
  };

  const openCreate = () => { setEditFee(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (f) => { setEditFee(f); setForm({ ...EMPTY_FORM, ...f, amount: f.amount?.toString() }); setOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editFee) {
      await ax.put(`/fees/${editFee.id}`, payload);
    } else {
      await ax.post("/fees", payload);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar tarifa?")) return;
    await ax.delete(`/fees/${id}`);
    load();
  };

  const toggleActive = async (fee) => {
    await ax.put(`/fees/${fee.id}`, { active: !fee.active });
    load();
  };

  const getTeamName = (id) => teams.find(t => t.id === id)?.name || "";
  const getTypeLabel = (v) => FEE_TYPES.find(t => t.value === v)?.label || v;

  const activeFees = fees.filter(f => f.active);
  const inactiveFees = fees.filter(f => !f.active);

  const handleExport = async () => {
    try {
      const res = await ax.get("/export/fees", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = "tarifas.xlsx"; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("Error al exportar tarifas."); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await ax.post("/fees/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setImportMsg({ ok: true, msg: res.data.message });
      load();
    } catch (err) {
      setImportMsg({ ok: false, msg: err.response?.data?.detail || "Error al importar" });
    }
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Tarifas</h2>
          <p className="text-sm text-[#475569]">{activeFees.length} tarifas activas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport} className="text-green-700 border-green-300 hover:bg-green-50 text-sm">
            <Download size={14} className="mr-1" />Exportar Excel
          </Button>
          <Button variant="outline" onClick={() => importRef.current?.click()} className="text-[#2460FF] border-[#2460FF] hover:bg-blue-50 text-sm">
            <Upload size={14} className="mr-1" />Importar Excel
          </Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button onClick={openCreate} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
            <Plus size={16} className="mr-1" /> Nueva Tarifa
          </Button>
        </div>
      </div>
      {importMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${importMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {importMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {importMsg.msg}
          <button onClick={() => setImportMsg(null)} className="ml-auto text-[#94A3B8] hover:text-[#475569] text-xs">✕</button>
        </div>
      )}

      {fees.length === 0 ? (
        <div className="text-center py-16 text-[#475569]">
          <Euro size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay tarifas configuradas</p>
          <p className="text-xs mt-1">Crea tarifas para habilitar la inscripción online con pago</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeFees.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Activas</p>
              <div className="space-y-2">
                {activeFees.map(fee => <FeeCard key={fee.id} fee={fee} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} getTeamName={getTeamName} getTypeLabel={getTypeLabel} />)}
              </div>
            </div>
          )}
          {inactiveFees.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Inactivas</p>
              <div className="space-y-2 opacity-60">
                {inactiveFees.map(fee => <FeeCard key={fee.id} fee={fee} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} getTeamName={getTeamName} getTypeLabel={getTypeLabel} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              {editFee ? "Editar Tarifa" : "Nueva Tarifa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Inscripción Benjamín A" /></div>
            <div><Label className="text-sm">Descripción</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Importe (€) *</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" placeholder="150.00" />
              </div>
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select value={form.fee_type} onValueChange={v => setForm({ ...form, fee_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{FEE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Equipo (opcional — si es solo para un equipo)</Label>
              <Select value={form.team_id || "all"} onValueChange={v => setForm({ ...form, team_id: v === "all" ? "" : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Todos los equipos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los equipos</SelectItem>
                  {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={!form.name || !form.amount} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
              {editFee ? "Guardar cambios" : "Crear tarifa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeCard({ fee, onEdit, onDelete, onToggle, getTeamName, getTypeLabel }) {
  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="text-center min-w-16">
          <p className="font-heading font-bold text-[#00296B] text-lg">{fee.amount?.toFixed(2)}€</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-[#0F172A] text-sm">{fee.name}</span>
            <Badge className={`text-xs ${TYPE_COLORS[fee.fee_type] || "bg-gray-50 text-gray-700"}`}>
              {getTypeLabel(fee.fee_type)}
            </Badge>
          </div>
          {fee.description && <p className="text-xs text-[#475569]">{fee.description}</p>}
          {fee.team_id && <p className="text-xs text-[#94A3B8]">Equipo: {getTeamName(fee.team_id)}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onToggle(fee)} className="p-1 text-[#94A3B8] hover:text-[#00296B]" title={fee.active ? "Desactivar" : "Activar"}>
          {fee.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
        </button>
        <Button onClick={() => onEdit(fee)} variant="ghost" size="sm" className="text-[#475569] hover:text-[#00296B]"><Edit size={14} /></Button>
        <Button onClick={() => onDelete(fee.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-600"><Trash2 size={14} /></Button>
      </div>
    </div>
  );
}
