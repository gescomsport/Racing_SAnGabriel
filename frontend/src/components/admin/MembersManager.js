import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Edit, Star, Search, ChevronDown } from "lucide-react";
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
  name: "", surname: "", dni: "", birthdate: "",
  phone: "", email: "", address: "", city: "", postal_code: "",
  member_type: "socio_adulto", bank_iban: "", photo_url: "",
  status: "active", season: "2025/2026", notes: ""
};

const MEMBER_TYPES = [
  { value: "socio_adulto", label: "Socio Adulto" },
  { value: "socio_juvenil", label: "Socio Juvenil" },
  { value: "socio_familiar", label: "Socio Familiar" },
  { value: "socio_honor", label: "Socio de Honor" },
  { value: "abonado", label: "Abonado" },
];

export default function MembersManager() {
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await ax.get("/members");
    setMembers(res.data);
  };

  const openCreate = () => {
    setEditMember(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (m) => {
    setEditMember(m);
    setForm({ ...EMPTY_FORM, ...m });
    setOpen(true);
  };

  const handleSave = async () => {
    if (editMember) {
      await ax.put(`/members/${editMember.id}`, form);
    } else {
      await ax.post("/members", form);
    }
    setOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar socio?")) return;
    await ax.delete(`/members/${id}`);
    load();
  };

  const filtered = members.filter(m => {
    const matchSearch = search === "" ||
      `${m.name} ${m.surname}`.toLowerCase().includes(search.toLowerCase()) ||
      (m.dni || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.member_number || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || m.member_type === filterType;
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const typeLabel = (v) => MEMBER_TYPES.find(t => t.value === v)?.label || v;

  const statusColor = (s) => s === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700";
  const statusLabel = (s) => s === "active" ? "Activo" : "Inactivo";

  const activeCount = members.filter(m => m.status === "active").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Socios</h2>
          <p className="text-sm text-[#475569]">{activeCount} socios activos · {members.length} total</p>
        </div>
        <Button onClick={openCreate} className="bg-[#2460FF] hover:bg-[#00296B] text-white">
          <Plus size={16} className="mr-1" /> Nuevo Socio
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            placeholder="Buscar por nombre, DNI o nº socio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {MEMBER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#475569]">
            <Star size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay socios que coincidan</p>
          </div>
        )}
        {filtered.map(member => (
          <div key={member.id} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#F4F7FB]"
              onClick={() => setExpandedId(expandedId === member.id ? null : member.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                  {member.photo_url
                    ? <img src={member.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : <Star size={16} className="text-amber-500" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#0F172A] text-sm">{member.name} {member.surname}</span>
                    {member.member_number && (
                      <span className="text-xs font-mono text-[#94A3B8]">{member.member_number}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569]">
                    {typeLabel(member.member_type)} {member.phone ? `· ${member.phone}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${statusColor(member.status)}`}>{statusLabel(member.status)}</Badge>
                <ChevronDown size={14} className={`text-[#94A3B8] transition-transform ${expandedId === member.id ? "rotate-180" : ""}`} />
              </div>
            </div>

            {expandedId === member.id && (
              <div className="border-t border-[#E2E8F0] p-4 bg-[#F4F7FB]">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                  {member.birthdate && <div><span className="text-[#94A3B8]">Nacimiento:</span> <span className="text-[#0F172A]">{member.birthdate}</span></div>}
                  {member.dni && <div><span className="text-[#94A3B8]">DNI:</span> <span className="text-[#0F172A]">{member.dni}</span></div>}
                  {member.email && <div><span className="text-[#94A3B8]">Email:</span> <span className="text-[#0F172A]">{member.email}</span></div>}
                  {member.city && <div><span className="text-[#94A3B8]">Ciudad:</span> <span className="text-[#0F172A]">{member.city}</span></div>}
                  {member.season && <div><span className="text-[#94A3B8]">Temporada:</span> <span className="text-[#0F172A]">{member.season}</span></div>}
                  {member.bank_iban && <div><span className="text-[#94A3B8]">IBAN:</span> <span className="text-[#0F172A] font-mono">{member.bank_iban}</span></div>}
                </div>
                {member.notes && <p className="text-xs text-[#475569] mb-3">{member.notes}</p>}
                <div className="flex gap-2">
                  <Button onClick={() => openEdit(member)} variant="outline" size="sm" className="text-xs">
                    <Edit size={12} className="mr-1" /> Editar
                  </Button>
                  <Button onClick={() => handleDelete(member.id)} variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700">
                    <Trash2 size={12} className="mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">
              {editMember ? "Editar Socio" : "Nuevo Socio"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Apellidos</Label><Input value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} className="mt-1" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">DNI/NIE</Label><Input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Fecha nacimiento</Label><Input type="date" value={form.birthdate} onChange={e => setForm({ ...form, birthdate: e.target.value })} className="mt-1" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Teléfono *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" placeholder="+34 600 000 000" /></div>
              <div><Label className="text-sm">Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" placeholder="socio@email.com" /></div>
            </div>

            <div>
              <Label className="text-sm">Dirección</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Ciudad</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-sm">Código postal</Label><Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className="mt-1" /></div>
            </div>

            <hr className="border-[#E2E8F0]" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo de socio</Label>
                <Select value={form.member_type} onValueChange={v => setForm({ ...form, member_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MEMBER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Estado</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Temporada</Label><Input value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} className="mt-1" /></div>
            </div>

            <div>
              <Label className="text-sm">IBAN (para domiciliación SEPA)</Label>
              <Input
                value={form.bank_iban}
                onChange={e => setForm({ ...form, bank_iban: e.target.value })}
                className="mt-1 font-mono"
                placeholder="ES00 0000 0000 0000 0000 0000"
              />
            </div>

            <div>
              <Label className="text-sm">Notas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" />
            </div>

            <Button
              onClick={handleSave}
              disabled={!form.name || !form.phone || !form.email}
              className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white"
            >
              {editMember ? "Guardar cambios" : "Crear socio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
