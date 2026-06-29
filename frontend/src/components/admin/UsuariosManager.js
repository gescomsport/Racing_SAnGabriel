import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit2, Shield, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

import ax from "../../api";

const ROLES = {
  admin:         { label: "Administrador/a",  color: "bg-red-50 text-red-700 border-red-200",       desc: "Acceso total, gestión de usuarios" },
  presidente:    { label: "Presidente/a",     color: "bg-violet-50 text-violet-700 border-violet-200", desc: "Acceso total excepto configuración técnica" },
  vicepresidente:{ label: "Vicepresidente/a", color: "bg-purple-50 text-purple-700 border-purple-200", desc: "Igual que presidente" },
  director:      { label: "Director/a",       color: "bg-indigo-50 text-indigo-700 border-indigo-200", desc: "Acceso total excepto usuarios" },
  secretario:    { label: "Secretario/a",     color: "bg-blue-50 text-blue-700 border-blue-200",    desc: "Deportistas, socios, pagos, comunicaciones" },
  tesorero:      { label: "Tesorero/a",       color: "bg-amber-50 text-amber-700 border-amber-200", desc: "Ventas, cobros, SEPA, informes financieros" },
  vocal:         { label: "Vocal",            color: "bg-slate-50 text-slate-600 border-slate-200", desc: "Acceso de solo lectura a deportistas y resultados" },
  delegado:      { label: "Delegado/a",       color: "bg-teal-50 text-teal-700 border-teal-200",    desc: "Gestión de un equipo concreto" },
  entrenador:    { label: "Entrenador/a",     color: "bg-green-50 text-green-700 border-green-200", desc: "Solo su equipo: jugadores, horarios, partidos" },
  auxiliar:      { label: "Auxiliar técnico/a",color: "bg-lime-50 text-lime-700 border-lime-200",   desc: "Acceso a calendarios y convocatorias" },
};

export default function UsuariosManager() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "secretario" });
  const [editForm, setEditForm] = useState({ name: "", role: "", password: "" });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await ax.get("/admin/users");
      setUsers(r.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await ax.post("/admin/users", form);
    setOpen(false);
    setForm({ email: "", name: "", password: "", role: "secretario" });
    load();
  };

  const handleEdit = async () => {
    const payload = { name: editForm.name, role: editForm.role };
    if (editForm.password.trim()) payload.password = editForm.password;
    await ax.put(`/admin/users/${editUser.id}`, payload);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditOpen(false); }, 1200);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar usuario? Esta acción no se puede deshacer.")) return;
    await ax.delete(`/admin/users/${id}`);
    load();
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, password: "" });
    setEditOpen(true);
  };

  return (
    <div data-testid="admin-usuarios-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Usuarios y Acceso</h2>
          <p className="text-sm text-[#475569] mt-1">Gestiona quién puede acceder al panel de administración y con qué permisos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white">
              <Plus size={14} className="mr-1" />Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Crear usuario</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm">Nombre</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-sm">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label className="text-sm">Contraseña</Label>
                <div className="relative mt-1">
                  <Input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-sm">Rol</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <span className="font-medium">{v.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.role && <p className="text-xs text-[#94A3B8] mt-1">{ROLES[form.role]?.desc}</p>}
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Crear usuario</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Roles explanation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(ROLES).map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <Badge className={`text-xs mb-2 ${v.color}`}>{v.label}</Badge>
            <p className="text-xs text-[#475569]">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Users list */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4F7FB] border-b border-[#E2E8F0]">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-[#475569] uppercase hidden lg:table-cell">Creado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id || u._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFF]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00296B] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(u.name || u.email || "?")[0].toUpperCase()}
                    </div>
                    <p className="font-medium text-[#0F172A]">{u.name || "—"}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#475569] hidden md:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs ${ROLES[u.role]?.color || "bg-slate-100 text-slate-600"}`}>
                    {ROLES[u.role]?.label || u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-[#94A3B8] hidden lg:table-cell">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("es-ES") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" className="text-[#2460FF] text-xs" onClick={() => openEdit(u)}>
                      <Edit2 size={12} className="mr-1" />Editar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 text-xs" onClick={() => handleDelete(u.id || u._id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-[#94A3B8]">Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar usuario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-sm">Nombre</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
            <div>
              <Label className="text-sm">Rol</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Nueva contraseña (dejar vacío para no cambiar)</Label>
              <Input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} className="mt-1" placeholder="••••••••" />
            </div>
            <Button onClick={handleEdit} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
              {saved ? <><CheckCircle size={14} className="mr-1" />Guardado</> : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
