import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, ExternalLink, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

import ax from "../../api";

const TIERS = {
  oro:    { label: "Oro",    color: "bg-amber-50 text-amber-700 border-amber-300",  border: "border-amber-400" },
  plata:  { label: "Plata",  color: "bg-slate-50 text-slate-600 border-slate-300",  border: "border-slate-400" },
  bronce: { label: "Bronce", color: "bg-orange-50 text-orange-700 border-orange-200", border: "border-orange-300" },
};

const EMPTY = { name: "", logo_url: "", website_url: "", description: "", tier: "plata", active: true, order: 0 };

function SponsorForm({ form, setForm, onSave, saveLabel, sponsorId }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));

    if (sponsorId) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await ax.post(`/sponsors/${sponsorId}/upload-logo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        set("logo_url", r.data.logo_url);
      } finally {
        setUploading(false);
      }
    } else {
      // For new sponsors: upload via generic endpoint
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await ax.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        set("logo_url", r.data.url);
      } finally {
        setUploading(false);
      }
    }
  };

  const resolvedLogo = preview
    ? preview
    : form.logo_url?.startsWith("/api/")
      ? form.logo_url
      : form.logo_url;

  return (
    <div className="space-y-4">
      <div><Label className="text-sm">Nombre de la empresa / marca *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" placeholder="Ej: Deportes García" /></div>

      <div>
        <Label className="text-sm">Logo</Label>
        <div className="mt-1 flex gap-2 flex-wrap">
          <label className="flex-1 min-w-0 border-2 border-dashed border-[#E2E8F0] rounded-xl p-3 text-center cursor-pointer hover:border-[#2460FF] transition-colors">
            {resolvedLogo ? (
              <img src={resolvedLogo} alt="logo" className="h-16 mx-auto object-contain mb-1" />
            ) : (
              <div className="py-2 text-[#94A3B8]"><Upload size={20} className="mx-auto mb-1" /><p className="text-xs">Subir logo</p></div>
            )}
            {uploading && <p className="text-xs text-[#2460FF] mt-1">Subiendo...</p>}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">O pega una URL:</p>
        <Input value={form.logo_url} onChange={e => { set("logo_url", e.target.value); setPreview(null); }} className="mt-1" placeholder="https://..." />
      </div>

      <div><Label className="text-sm">Web / URL del patrocinador</Label><Input value={form.website_url} onChange={e => set("website_url", e.target.value)} className="mt-1" placeholder="https://suempresa.com" /></div>
      <div><Label className="text-sm">Descripción (visible en web)</Label><Input value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" placeholder="Patrocinador oficial de las equipaciones" /></div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Nivel / Categoría</Label>
          <Select value={form.tier} onValueChange={v => set("tier", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="oro">⭐ Oro — Patrocinador principal</SelectItem>
              <SelectItem value="plata">🥈 Plata</SelectItem>
              <SelectItem value="bronce">🥉 Bronce</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Orden (menor = primero)</Label>
          <Input type="number" min="0" value={form.order} onChange={e => set("order", parseInt(e.target.value) || 0)} className="mt-1" />
        </div>
      </div>

      <Button onClick={onSave} disabled={!form.name || uploading} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

export default function PatrocinadoresManager() {
  const [sponsors, setSponsors] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editForm, setEditForm] = useState({ ...EMPTY });

  const load = async () => {
    const r = await ax.get("/sponsors");
    setSponsors(r.data);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    await ax.post("/sponsors", form);
    setOpen(false);
    setForm({ ...EMPTY });
    load();
  };

  const openEdit = (s) => {
    setEditSponsor(s);
    setEditForm({ ...EMPTY, ...s });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    await ax.put(`/sponsors/${editSponsor.id}`, editForm);
    setEditOpen(false);
    load();
  };

  const handleToggle = async (s) => {
    await ax.put(`/sponsors/${s.id}`, { active: !s.active });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar patrocinador?")) return;
    await ax.delete(`/sponsors/${id}`);
    load();
  };

  const byTier = (tier) => sponsors.filter(s => s.tier === tier);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Patrocinadores</h2>
          <p className="text-sm text-[#475569] mt-1">Empresas y marcas que apoyan al club. Aparecen en la web pública.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white">
              <Plus size={14} className="mr-1" />Nuevo patrocinador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo patrocinador</DialogTitle></DialogHeader>
            <SponsorForm form={form} setForm={setForm} onSave={handleCreate} saveLabel="Crear patrocinador" sponsorId={null} />
          </DialogContent>
        </Dialog>
      </div>

      {sponsors.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-12 text-center text-[#94A3B8]">
          <p className="font-medium">Sin patrocinadores aún</p>
          <p className="text-sm mt-1">Añade el primero con el botón "Nuevo patrocinador"</p>
        </div>
      )}

      {["oro", "plata", "bronce"].map(tier => {
        const list = byTier(tier);
        if (list.length === 0) return null;
        const t = TIERS[tier];
        return (
          <div key={tier} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Badge className={`${t.color} text-xs font-bold`}>{t.label}</Badge>
              <span className="text-xs text-[#94A3B8]">{list.length} patrocinador{list.length !== 1 ? "es" : ""}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {list.map(s => (
                <div key={s.id} className={`bg-white rounded-xl border-2 p-4 flex gap-3 ${s.active ? t.border : "border-[#E2E8F0] opacity-50"}`}>
                  <div className="w-16 h-16 rounded-lg border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 bg-[#F8FAFF] overflow-hidden">
                    {s.logo_url ? (
                      <img
                        src={s.logo_url}
                        alt={s.name}
                        className="max-w-full max-h-full object-contain p-1"
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-2xl text-[#CBD5E1]">🏢</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-[#0F172A] text-sm">{s.name}</p>
                        {s.description && <p className="text-xs text-[#94A3B8] mt-0.5">{s.description}</p>}
                        {s.website_url && (
                          <a href={s.website_url} target="_blank" rel="noreferrer" className="text-xs text-[#2460FF] flex items-center gap-1 mt-0.5 hover:underline">
                            <ExternalLink size={10} />{s.website_url.replace(/^https?:\/\//, "").split("/")[0]}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Button size="sm" variant="ghost" className="text-[#2460FF] h-7 text-xs" onClick={() => openEdit(s)}>
                        <Edit2 size={11} className="mr-1" />Editar
                      </Button>
                      <Button size="sm" variant="ghost" className={`h-7 text-xs ${s.active ? "text-amber-600" : "text-green-600"}`} onClick={() => handleToggle(s)}>
                        {s.active ? <><ToggleRight size={11} className="mr-1" />Ocultar</> : <><ToggleLeft size={11} className="mr-1" />Mostrar</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 h-7 w-7 p-0 ml-auto" onClick={() => handleDelete(s.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar patrocinador</DialogTitle></DialogHeader>
          <SponsorForm form={editForm} setForm={setEditForm} onSave={handleEdit} saveLabel="Guardar cambios" sponsorId={editSponsor?.id} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
