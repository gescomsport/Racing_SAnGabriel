import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, Package, Tag, CheckCircle, ToggleLeft, ToggleRight, Download, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const CATEGORIES = {
  equipacion: { label: "Equipación", color: "bg-blue-50 text-blue-700 border-blue-200" },
  material: { label: "Material", color: "bg-amber-50 text-amber-700 border-amber-200" },
  cuota: { label: "Cuota / Inscripción", color: "bg-green-50 text-green-700 border-green-200" },
  evento: { label: "Evento", color: "bg-purple-50 text-purple-700 border-purple-200" },
  otro: { label: "Otro", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

const PERIOD_LABEL = { mensual: "Mensual", trimestral: "Trimestral", anual: "Anual", semanal: "Semanal" };

const EMPTY_FORM = {
  name: "", description: "", category: "equipacion", price: "", currency: "eur",
  sku: "", stock: "", active: true, image_url: "",
  is_recurring: false, recurring_period: "mensual", recurring_amount: "",
};

export default function ProductosManager() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [filterCat, setFilterCat] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const r = await ax.get("/products");
    setProducts(r.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setF = (setter) => (k, v) => setter(f => ({ ...f, [k]: v }));

  const buildPayload = (f) => ({
    ...f,
    price: parseFloat(f.price) || 0,
    stock: f.stock !== "" ? parseInt(f.stock) : null,
    recurring_amount: f.is_recurring ? (parseFloat(f.recurring_amount) || parseFloat(f.price) || 0) : null,
    recurring_period: f.is_recurring ? f.recurring_period : null,
  });

  const handleCreate = async () => {
    const payload = buildPayload(form);
    await ax.post("/products", payload);
    setOpen(false);
    setForm(EMPTY_FORM);
    load();
  };

  const handleEdit = async () => {
    const payload = buildPayload(editForm);
    await ax.put(`/products/${editProduct.id}`, payload);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditOpen(false); }, 1200);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    await ax.delete(`/products/${id}`);
    load();
  };

  const handleToggleActive = async (p) => {
    await ax.put(`/products/${p.id}`, { active: !p.active });
    load();
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setEditForm({
      ...EMPTY_FORM, ...p,
      stock: p.stock ?? "",
      price: String(p.price ?? ""),
      recurring_amount: String(p.recurring_amount ?? ""),
      is_recurring: !!p.is_recurring,
    });
    setEditOpen(true);
  };

  const filtered = products.filter(p => !filterCat || p.category === filterCat);
  const active = filtered.filter(p => p.active);
  const inactive = filtered.filter(p => !p.active);

  const ProductForm = ({ f, setter, onSubmit, submitLabel, isSaved }) => {
    const sf = setF(setter);
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-sm">Nombre del producto</Label><Input value={f.name} onChange={e => sf("name", e.target.value)} className="mt-1" /></div>
          <div>
            <Label className="text-sm">Categoría</Label>
            <Select value={f.category} onValueChange={v => sf("category", v)}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Precio (€)</Label>
            <Input type="number" step="0.01" min="0" value={f.price} onChange={e => sf("price", e.target.value)} className="mt-1" placeholder="0.00" />
          </div>
          <div><Label className="text-sm">SKU / Referencia</Label><Input value={f.sku} onChange={e => sf("sku", e.target.value)} className="mt-1" placeholder="RSG-CAM-001" /></div>
          <div><Label className="text-sm">Stock (vacío = ilimitado)</Label><Input type="number" min="0" value={f.stock} onChange={e => sf("stock", e.target.value)} className="mt-1" placeholder="—" /></div>
          <div className="col-span-2"><Label className="text-sm">Descripción</Label><Input value={f.description} onChange={e => sf("description", e.target.value)} className="mt-1" /></div>
          <div className="col-span-2"><Label className="text-sm">URL imagen</Label><Input value={f.image_url} onChange={e => sf("image_url", e.target.value)} className="mt-1" /></div>
        </div>

        {/* Recurring fee toggle */}
        <div className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFF]">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => sf("is_recurring", !f.is_recurring)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${f.is_recurring ? "bg-[#2460FF]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${f.is_recurring ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Cuota periódica / recurrente</p>
              <p className="text-xs text-[#94A3B8]">Actívalo si este producto se cobra de forma repetida</p>
            </div>
          </label>
          {f.is_recurring && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#E2E8F0]">
              <div>
                <Label className="text-sm">Periodicidad</Label>
                <Select value={f.recurring_period} onValueChange={v => sf("recurring_period", v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERIOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Importe por período (€)</Label>
                <Input type="number" step="0.01" min="0" value={f.recurring_amount} onChange={e => sf("recurring_amount", e.target.value)} className="mt-1" placeholder={f.price || "0.00"} />
              </div>
            </div>
          )}
        </div>

        <Button onClick={onSubmit} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">
          {isSaved ? <><CheckCircle size={14} className="mr-1" />Guardado</> : submitLabel}
        </Button>
      </div>
    );
  };

  return (
    <div data-testid="admin-productos-manager">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Productos y Artículos</h2>
          <p className="text-sm text-[#475569] mt-1">Equipaciones, material, cuotas y otros artículos del club.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white">
              <Plus size={14} className="mr-1" />Nuevo producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo producto</DialogTitle></DialogHeader>
            <ProductForm f={form} setter={setForm} onSubmit={handleCreate} submitLabel="Crear producto" isSaved={false} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Total", val: products.length, color: "text-[#00296B]" },
          ...Object.entries(CATEGORIES).map(([k, v]) => ({
            label: v.label,
            val: products.filter(p => p.category === k).length,
            color: "text-[#475569]",
          })),
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center">
            <p className={`font-heading font-bold text-xl ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[#94A3B8]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Select value={filterCat} onValueChange={v => setFilterCat(v === "_all" ? "" : v)}>
          <SelectTrigger className="w-48 text-sm"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas las categorías</SelectItem>
            {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-[#475569] ml-auto">{filtered.length} productos</span>
      </div>

      {/* Active products */}
      {active.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#475569] uppercase tracking-wide mb-3">Activos ({active.length})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {active.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex gap-3">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-[#F4F7FB] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-[#CBD5E1]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#0F172A] text-sm">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`text-xs ${CATEGORIES[p.category]?.color || ""}`}>{CATEGORIES[p.category]?.label || p.category}</Badge>
                        {p.is_recurring && <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"><RefreshCw size={9} />{PERIOD_LABEL[p.recurring_period] || p.recurring_period}</Badge>}
                        {p.sku && <span className="text-xs text-[#94A3B8] font-mono">{p.sku}</span>}
                      </div>
                    </div>
                    <p className="font-heading font-bold text-[#00296B] text-lg whitespace-nowrap">{p.price?.toFixed(2)}€</p>
                  </div>
                  {p.description && <p className="text-xs text-[#94A3B8] mt-1 truncate">{p.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    {p.stock != null && <span className="text-xs text-[#475569]">Stock: {p.stock}</span>}
                    <div className="flex gap-1 ml-auto">
                      <Button size="sm" variant="ghost" className="text-[#2460FF] text-xs h-7" onClick={() => openEdit(p)}>
                        <Edit2 size={12} className="mr-1" />Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 text-xs h-7" onClick={() => handleToggleActive(p)}>
                        <ToggleRight size={12} className="mr-1" />Desactivar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive products */}
      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#CBD5E1] uppercase tracking-wide mb-3">Inactivos ({inactive.length})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-60">
            {inactive.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex gap-3">
                <div className="w-14 h-14 bg-[#F4F7FB] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-[#CBD5E1]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#475569] text-sm">{p.name}</p>
                  <p className="text-xs text-[#94A3B8]">{p.price?.toFixed(2)}€ · {CATEGORIES[p.category]?.label}</p>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="ghost" className="text-green-600 text-xs h-7" onClick={() => handleToggleActive(p)}>
                      <ToggleLeft size={12} className="mr-1" />Activar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 text-xs h-7" onClick={() => handleDelete(p.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center text-[#94A3B8] text-sm">
          Sin productos. Crea el primero con el botón "Nuevo producto".
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar producto</DialogTitle></DialogHeader>
          <ProductForm f={editForm} setter={setEditForm} onSubmit={handleEdit} submitLabel="Guardar cambios" isSaved={saved} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
