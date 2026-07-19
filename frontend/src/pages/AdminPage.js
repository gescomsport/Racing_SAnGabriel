import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClub } from "../contexts/ClubContext";
import axios from "axios";
import {
  LayoutDashboard, Newspaper, Users, CalendarDays, Images,
  Mail, Settings, LogOut, Plus, Trash2, Edit, ChevronRight, Menu, X,
  Rss, CheckCircle, UserCheck, Star, Clock, Shield, Euro, CreditCard, FileText, Send, Building2, Landmark,
  BarChart3, Package, MessageSquare, UsersRound, KeyRound, ShoppingCart, MapPin,
  TrendingUp, AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "../components/ui/select";
import SocialMediaManager from "../components/SocialMediaManager";
import TrainingManager from "../components/admin/TrainingManager";
import FeesManager from "../components/admin/FeesManager";
import SepaManager from "../components/admin/SepaManager";
import ReportsManager from "../components/admin/ReportsManager";
import DeportistasManager from "../components/admin/DeportistasManager";
import ComunicacionesManager from "../components/admin/ComunicacionesManager";
import UsuariosManager from "../components/admin/UsuariosManager";
import ProductosManager from "../components/admin/ProductosManager";
import VentasManager from "../components/admin/VentasManager";
import FacilitiesManager from "../components/admin/FacilitiesManager";
import CalendarManager from "../components/admin/CalendarManager";
import GdprManager from "../components/admin/GdprManager";
import PatrocinadoresManager from "../components/admin/PatrocinadoresManager";
import StaffManager from "../components/admin/StaffManager";
import ContabilidadManager from "../components/admin/ContabilidadManager";
import InscripcionesManager from "../components/admin/InscripcionesManager";
import CoachPortal from "../components/admin/CoachPortal";
import FormsManager from "../components/admin/FormsManager";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "formularios", label: "Formularios Online", icon: FileText, highlight: true },
  { id: "inscripciones", label: "Inscripciones", icon: CheckCircle, highlight: true },
  { id: "deportistas", label: "Deportistas", icon: UsersRound, highlight: true },
  { id: "staff", label: "Personal del Club", icon: UserCheck, highlight: true },
  { id: "equipos", label: "Equipos", icon: Users, highlight: true },
  { id: "ventas", label: "Ventas y Cobros", icon: ShoppingCart, highlight: true },
  { id: "comunicaciones", label: "Comunicaciones", icon: MessageSquare, highlight: true },
  { id: "productos", label: "Productos", icon: Package, highlight: true },
  { id: "tarifas", label: "Tarifas", icon: Euro, highlight: true },
  { id: "instalaciones", label: "Instalaciones", icon: MapPin, highlight: true },
  { id: "calendario", label: "Calendario", icon: CalendarDays, highlight: true },
  { id: "training", label: "Horarios Entreno.", icon: Clock },
  { id: "matches", label: "Partidos", icon: CalendarDays },
  { id: "gallery", label: "Galería", icon: Images },
  { id: "news", label: "Noticias", icon: Newspaper },
  { id: "patrocinadores", label: "Patrocinadores", icon: Star, highlight: true },
  { id: "contacts", label: "Mensajes", icon: Mail },
  { id: "sepa", label: "SEPA / Domicil.", icon: Landmark },
  { id: "contabilidad", label: "Contabilidad", icon: TrendingUp, highlight: true },
  { id: "reports", label: "Informes", icon: BarChart3 },
  { id: "usuarios", label: "Usuarios / Acceso", icon: KeyRound, highlight: true },
  { id: "social", label: "Redes Sociales", icon: Rss },
  { id: "gdpr", label: "RGPD / Privacidad", icon: Shield, highlight: true },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const { clubSettings } = useClub();
  const navigate = useNavigate();
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [news, setNews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [settings, setSettings] = useState({});
  const [playerCount, setPlayerCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [formsPending, setFormsPending] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    loadData();
    // Poll pending forms count every 60s
    const interval = setInterval(() => {
      ax.get("/forms/pending-count").then(r => setFormsPending(r.data.pending || 0)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [n, t, m, g, c, s, p, mb, fp] = await Promise.all([
        ax.get("/news"), ax.get("/teams"), ax.get("/matches"),
        ax.get("/gallery"), ax.get("/contact"), ax.get("/settings"),
        ax.get("/players"), ax.get("/members"),
        ax.get("/forms/pending-count").catch(() => ({ data: { pending: 0 } })),
      ]);
      setNews(n.data); setTeams(t.data); setMatches(m.data);
      setGallery(g.data); setContacts(c.data); setSettings(s.data);
      setPlayerCount(p.data.length); setMemberCount(mb.data.length);
      setFormsPending(fp.data.pending || 0);
    } catch {}
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  if (!user) return null;

  const isCoach = ["entrenador", "auxiliar"].includes(user.role);
  if (isCoach) {
    return <CoachPortal user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex" data-testid="admin-page">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white border border-[#E2E8F0] p-2 rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="admin-sidebar-toggle"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} data-testid="admin-sidebar">
        <div className="p-5 border-b border-[#E2E8F0]">
          <h1 className="font-heading font-bold text-[#00296B] text-lg" title={clubSettings?.club_name}>
            {clubSettings?.club_name || 'Admin Panel'}
          </h1>
          <p className="text-xs text-[#475569]">{user?.email}</p>
        </div>
        <nav className="flex-1 py-3">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`admin-sidebar-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${section === item.id ? "active text-[#2460FF] font-medium bg-blue-50" : item.highlight ? "text-[#00296B] font-medium" : "text-[#475569]"}`}
              data-testid={`admin-nav-${item.id}`}
            >
              <item.icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "formularios" && formsPending > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-4">
                  {formsPending}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E2E8F0]">
          <Button onClick={handleLogout} variant="outline" className="w-full text-sm" data-testid="admin-logout-btn">
            <LogOut size={14} className="mr-2" /> Cerrar Sesion
          </Button>
          <a href="/" className="block text-center text-xs text-[#475569] mt-2 hover:text-[#2460FF]" data-testid="admin-back-to-site">Ver web</a>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto" data-testid="admin-content">
        {section === "dashboard" && <DashboardSection news={news} teams={teams} matches={matches} contacts={contacts} playerCount={playerCount} memberCount={memberCount} />}
        {section === "formularios" && <FormsManager />}
        {section === "inscripciones" && <InscripcionesManager />}
        {section === "deportistas" && <DeportistasManager />}
        {section === "staff" && <StaffManager />}
        {section === "equipos" && <TeamsManager teams={teams} onRefresh={loadData} />}
        {section === "ventas" && <VentasManager />}
        {section === "comunicaciones" && <ComunicacionesManager />}
        {section === "productos" && <ProductosManager />}
        {section === "tarifas" && <FeesManager />}
        {section === "instalaciones" && <FacilitiesManager />}
        {section === "calendario" && <CalendarManager />}
        {section === "training" && <TrainingManager />}
        {section === "matches" && <MatchesManager matches={matches} onRefresh={loadData} />}
        {section === "gallery" && <GalleryManager onRefresh={loadData} />}
        {section === "news" && <NewsManager news={news} onRefresh={loadData} />}
        {section === "patrocinadores" && <PatrocinadoresManager />}
        {section === "contacts" && <ContactsManager onRefresh={loadData} />}
        {section === "sepa" && <SepaManager />}
        {section === "contabilidad" && <ContabilidadManager />}
        {section === "reports" && <ReportsManager />}
        {section === "usuarios" && <UsuariosManager />}
        {section === "social" && <SocialMediaManager />}
        {section === "gdpr" && <GdprManager />}
        {section === "settings" && <SettingsManager settings={settings} onRefresh={loadData} />}
      </main>
    </div>
  );
}

function DashboardSection({ news, teams, matches, contacts, playerCount, memberCount }) {
  const [finStats, setFinStats] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const loadFin = async () => {
    try {
      const r = await ax.get(`/dashboard/stats?date_from=${dateFrom}&date_to=${dateTo}`);
      setFinStats(r.data);
    } catch {}
  };

  useEffect(() => { loadFin(); }, [dateFrom, dateTo]);

  const clubStats = [
    { label: "Deportistas", count: playerCount, icon: UserCheck, color: "text-[#2460FF]", bg: "bg-blue-50" },
    { label: "Socios", count: memberCount, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Equipos", count: teams.length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Partidos", count: matches.length, icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Noticias", count: news.length, icon: Newspaper, color: "text-red-500", bg: "bg-red-50" },
    { label: "Mensajes", count: contacts.length, icon: Mail, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-5">Dashboard</h2>

      {/* Financial strip */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="font-heading font-bold text-[#00296B] text-sm">Finanzas del período</p>
          <div className="flex gap-2 items-center">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs h-8 w-36" />
            <span className="text-xs text-[#94A3B8]">–</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs h-8 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Ingresos cobrados", val: finStats ? `${finStats.revenue?.toFixed(2)}€` : "—", sub: finStats ? `${finStats.revenue_count} cobros` : "", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pendiente de cobro", val: finStats ? `${finStats.pending_total?.toFixed(2)}€` : "—", sub: finStats ? `${finStats.pending_count} ventas` : "", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Vencido sin cobrar", val: finStats ? `${finStats.overdue_total?.toFixed(2)}€` : "—", sub: finStats ? `${finStats.overdue_count} ventas` : "", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Total ventas", val: finStats ? (finStats.revenue_count + finStats.pending_count + (finStats.cancelled_count || 0)) : "—", sub: "en el período", icon: ShoppingCart, color: "text-[#2460FF]", bg: "bg-blue-50" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFF]">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className={`font-heading font-bold text-lg leading-none ${s.color}`}>{s.val}</p>
                <p className="text-xs text-[#94A3B8]">{s.label}</p>
                {s.sub && <p className="text-xs text-[#CBD5E1]">{s.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Club stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {clubStats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex items-center gap-4" data-testid={`dashboard-stat-${s.label.toLowerCase()}`}>
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="font-heading font-bold text-2xl text-[#00296B]">{s.count}</p>
              <p className="text-sm text-[#475569]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest messages */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="font-heading font-bold text-[#00296B] mb-3 text-sm">Últimos mensajes de contacto</h3>
        {contacts.length === 0 ? <p className="text-sm text-[#475569]">Sin mensajes</p> :
          contacts.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                <p className="text-xs text-[#475569] line-clamp-1">{c.message}</p>
              </div>
              <ChevronRight size={14} className="text-[#475569]" />
            </div>
          ))
        }
      </div>
    </div>
  );
}

const BLANK_NEWS = { title: "", content: "", image_url: "", source: "web", category: "general" };

function NewsForm({ form, setForm, onSave, saveLabel }) {
  const [uploadMode, setUploadMode] = useState("file");
  const [preview, setPreview] = useState(form.image_url || null);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await ax.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("image_url", r.data.url);
    } finally {
      setUploading(false);
    }
  };

  const resolvedPreview = preview
    ? (preview.startsWith("blob:") ? preview : `${process.env.REACT_APP_BACKEND_URL}${preview}`)
    : (form.image_url?.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${form.image_url}` : form.image_url);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Título *</Label>
        <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label className="text-sm">Contenido</Label>
        <Textarea value={form.content} onChange={e => set("content", e.target.value)} rows={4} className="mt-1" />
      </div>
      <div>
        <Label className="text-sm">Imagen</Label>
        <div className="flex gap-2 mt-1 mb-2">
          <button onClick={() => setUploadMode("file")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${uploadMode === "file" ? "border-[#2460FF] bg-blue-50 text-[#2460FF]" : "border-[#E2E8F0] text-[#475569]"}`}>📂 Subir archivo</button>
          <button onClick={() => setUploadMode("url")} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${uploadMode === "url" ? "border-[#2460FF] bg-blue-50 text-[#2460FF]" : "border-[#E2E8F0] text-[#475569]"}`}>🔗 URL externa</button>
        </div>
        {uploadMode === "file" ? (
          <label className="block w-full border-2 border-dashed border-[#E2E8F0] rounded-xl p-3 text-center cursor-pointer hover:border-[#2460FF] transition-colors">
            {resolvedPreview ? (
              <img src={resolvedPreview} alt="preview" className="h-28 mx-auto object-cover rounded-lg mb-1" />
            ) : (
              <div className="py-3 text-[#94A3B8]">
                <div className="text-2xl mb-1">🖼️</div>
                <p className="text-xs">Haz clic para seleccionar imagen</p>
              </div>
            )}
            {uploading && <p className="text-xs text-[#2460FF] mt-1">Subiendo...</p>}
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        ) : (
          <Input value={form.image_url} onChange={e => { set("image_url", e.target.value); setPreview(null); }} placeholder="https://..." className="mt-1" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Fuente</Label>
          <Select value={form.source} onValueChange={v => set("source", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Categoría</Label>
          <Select value={form.category} onValueChange={v => set("category", v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="resultados">Resultados</SelectItem>
              <SelectItem value="eventos">Eventos</SelectItem>
              <SelectItem value="fichajes">Fichajes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={onSave} disabled={!form.title || uploading} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

function NewsManager({ news, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...BLANK_NEWS });
  const [editForm, setEditForm] = useState({ ...BLANK_NEWS });

  const handleCreate = async () => {
    await ax.post("/news", form);
    setOpen(false);
    setForm({ ...BLANK_NEWS });
    onRefresh();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({ title: item.title, content: item.content, image_url: item.image_url || "", source: item.source || "web", category: item.category || "general" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    await ax.put(`/news/${editItem.id}`, editForm);
    setEditOpen(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar noticia?")) return;
    await ax.delete(`/news/${id}`);
    onRefresh();
  };

  return (
    <div data-testid="admin-news-manager">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-[#00296B] text-xl">Noticias</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-news-btn">
              <Plus size={16} className="mr-1" /> Nueva Noticia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva Noticia</DialogTitle></DialogHeader>
            <NewsForm form={form} setForm={setForm} onSave={handleCreate} saveLabel="Crear noticia" />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {news.map(item => (
          <div key={item.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-start gap-3" data-testid={`news-item-${item.id}`}>
            {item.image_url && (
              <img
                src={item.image_url.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${item.image_url}` : item.image_url}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                onError={e => { e.target.style.display = "none"; }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-medium text-[#0F172A] text-sm">{item.title}</h3>
                <Badge className="text-xs bg-[#F4F7FB] text-[#00296B]">{item.category}</Badge>
              </div>
              <p className="text-xs text-[#475569] line-clamp-2">{item.content}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button onClick={() => openEdit(item)} variant="ghost" size="sm" className="text-[#2460FF] hover:text-[#00296B]">
                <Edit size={14} />
              </Button>
              <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-news-${item.id}`}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {news.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#94A3B8] text-sm">
            Sin noticias. Crea la primera con el botón "Nueva Noticia".
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar Noticia</DialogTitle></DialogHeader>
          <NewsForm form={editForm} setForm={setEditForm} onSave={handleEdit} saveLabel="Guardar cambios" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const BLANK_TEAM = { name: "", category: "", coach: "", coach_ids: [], image_url: "", description: "", facility_id: "", color: "#2460FF" };

const TEAM_COLORS = [
  "#2460FF","#00296B","#16a34a","#9333ea","#e11d48","#d97706",
  "#0891b2","#dc2626","#7c3aed","#059669","#ea580c","#64748b",
];

function TeamForm({ form, setForm, coaches, facilities, onSave, saveLabel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCoach = (id) => setForm(f => {
    const ids = (f.coach_ids || []).includes(id) ? (f.coach_ids || []).filter(x => x !== id) : [...(f.coach_ids || []), id];
    return { ...f, coach_ids: ids };
  });
  const [uploadingImg, setUploadingImg] = useState(false);

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await ax.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("image_url", `https://api.sudeporte.com${res.data.url}`);
    } catch {
      alert("Error al subir la imagen.");
    } finally {
      setUploadingImg(false);
    }
  }

  const ROLE_LABELS = { entrenador: "Entrenador/a", auxiliar: "Auxiliar", delegado: "Delegado/a", fisioterapeuta: "Fisioterapeuta", medico: "Médico" };

  return (
    <div className="space-y-3">
      <div><Label className="text-sm">Nombre *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Categoría</Label><Input value={form.category} onChange={e => set("category", e.target.value)} className="mt-1" placeholder="Juvenil, Cadete..." /></div>
        <div>
          <Label className="text-sm">Instalación donde entrena</Label>
          <Select value={form.facility_id || "_none"} onValueChange={v => set("facility_id", v === "_none" ? "" : v)}>
            <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="— Sin instalación —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Sin instalación —</SelectItem>
              {facilities.length === 0
                ? <SelectItem value="_empty" disabled>No hay instalaciones creadas</SelectItem>
                : facilities.map(fa => <SelectItem key={fa.id} value={fa.id}>{fa.name}</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-sm">Personal técnico asignado</Label>
        <div className="mt-1 border border-[#E2E8F0] rounded-lg p-2 max-h-40 overflow-y-auto">
          {coaches.length === 0
            ? <p className="text-xs text-[#94A3B8] p-1">No hay personal técnico. Créalos en "Personal del Club".</p>
            : coaches.map(c => (
              <label key={c.id} className="flex items-center gap-2 px-1 py-1.5 hover:bg-[#F4F7FB] rounded cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#2460FF]" checked={(form.coach_ids || []).includes(c.id)} onChange={() => toggleCoach(c.id)} />
                <div className="flex-1">
                  <span className="text-sm font-medium">{`${c.name || ""} ${c.surname || ""}`.trim()}</span>
                  <span className="text-xs text-[#94A3B8] ml-2">{ROLE_LABELS[c.role] || c.role}</span>
                </div>
              </label>
            ))
          }
        </div>
      </div>
      <div>
        <Label className="text-sm">Foto del equipo</Label>
        <div className="mt-1 flex items-center gap-3">
          {form.image_url && (
            <img src={form.image_url} alt="Equipo" className="w-14 h-14 rounded-lg object-cover border border-[#E2E8F0]" />
          )}
          <label className="cursor-pointer flex-1">
            <div className="border border-dashed border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-center text-[#64748B] hover:bg-[#F8FAFC]">
              {uploadingImg ? "Subiendo…" : form.image_url ? "Cambiar foto" : "Subir foto del equipo"}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
          </label>
          {form.image_url && (
            <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => set("image_url", "")}>✕</button>
          )}
        </div>
      </div>
      <div>
        <Label className="text-sm">Color del equipo (en el calendario)</Label>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {TEAM_COLORS.map(c => (
            <button key={c} onClick={() => set("color", c)} title={c}
              className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white ring-2 ring-offset-1 ring-gray-400 scale-110" : "border-white hover:scale-105"}`}
              style={{ background: c }} />
          ))}
          <input type="color" value={form.color || "#2460FF"} onChange={e => set("color", e.target.value)}
            className="w-7 h-7 rounded-full border border-[#E2E8F0] cursor-pointer" title="Color personalizado" />
          <span className="text-xs text-[#94A3B8] font-mono">{form.color || "#2460FF"}</span>
        </div>
      </div>
      <div><Label className="text-sm">Descripción</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="mt-1" /></div>
      <Button onClick={onSave} disabled={!form.name} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

function TeamsManager({ teams, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ ...BLANK_TEAM });
  const [editForm, setEditForm] = useState({ ...BLANK_TEAM });

  useEffect(() => {
    Promise.all([
      ax.get("/staff").catch(() => ({ data: [] })),
      ax.get("/facilities").catch(() => ({ data: [] })),
      ax.get("/players").catch(() => ({ data: [] })),
    ]).then(([s, f, p]) => {
      // Coaches = todo el staff técnico (entrenador, auxiliar, delegado)
      setCoaches(s.data.filter(x => ["entrenador","auxiliar","delegado","fisioterapeuta","medico"].includes(x.role)));
      setFacilities(f.data);
      setPlayers(p.data);
    });
  }, []);

  const buildPayload = (f) => {
    const coachNames = (f.coach_ids || []).map(id => {
      const c = coaches.find(c => c.id === id);
      return c ? `${c.name || ""} ${c.surname || ""}`.trim() : "";
    }).filter(Boolean);
    return { ...f, coach: coachNames.join(", ") || f.coach };
  };

  const handleCreate = async () => {
    await ax.post("/teams", buildPayload(form));
    setOpen(false);
    setForm({ ...BLANK_TEAM });
    onRefresh();
  };

  const openEdit = (team) => {
    setEditTeam(team);
    setEditForm({ ...BLANK_TEAM, ...team, coach_ids: team.coach_ids || [] });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    await ax.put(`/teams/${editTeam.id}`, buildPayload(editForm));
    setEditOpen(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar equipo?")) return;
    await ax.delete(`/teams/${id}`);
    onRefresh();
  };

  const getCoachNames = (team) => {
    if (team.coach_ids?.length) {
      return team.coach_ids.map(id => {
        const c = coaches.find(c => c.id === id);
        return c ? `${c.name || ""} ${c.surname || ""}`.trim() : "";
      }).filter(Boolean).join(", ");
    }
    return team.coach || "";
  };

  const getPlayerCount = (teamId) => players.filter(p => p.team_id === teamId || (p.team_ids || []).includes(teamId)).length;
  const getFacilityName = (fid) => facilities.find(f => f.id === fid)?.name || "";

  return (
    <div data-testid="admin-teams-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Equipos</h2>
          <p className="text-sm text-[#475569]">{teams.length} equipos registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-team-btn">
              <Plus size={16} className="mr-1" /> Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo Equipo</DialogTitle></DialogHeader>
            <TeamForm form={form} setForm={setForm} coaches={coaches} facilities={facilities} onSave={handleCreate} saveLabel="Guardar equipo" />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {teams.map(team => (
          <div key={team.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4" data-testid={`team-item-${team.id}`}>
            {team.image_url ? (
              <img src={team.image_url} alt={team.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" onError={e => { e.target.style.display = "none"; }} />
            ) : (
              <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: (team.color || "#2460FF") + "25" }}>
                <div className="w-5 h-5 rounded-full" style={{ background: team.color || "#2460FF" }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-[#0F172A] text-sm">{team.name}</h3>
                {team.category && <span className="text-xs bg-[#F4F7FB] text-[#00296B] px-2 py-0.5 rounded-full">{team.category}</span>}
                {getPlayerCount(team.id) > 0 && <span className="text-xs text-[#94A3B8]">{getPlayerCount(team.id)} jugadores</span>}
              </div>
              {getCoachNames(team) && <p className="text-xs text-[#475569] mt-0.5">Entrenador: {getCoachNames(team)}</p>}
              {team.facility_id && <p className="text-xs text-[#94A3B8] mt-0.5">{getFacilityName(team.facility_id)}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button onClick={() => openEdit(team)} variant="ghost" size="sm" className="text-[#2460FF] hover:text-[#00296B]" data-testid={`edit-team-${team.id}`}>
                <Edit size={14} />
              </Button>
              <Button onClick={() => handleDelete(team.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-team-${team.id}`}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {teams.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#94A3B8] text-sm">
            Sin equipos. Crea el primero con el botón "Nuevo Equipo".
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar Equipo</DialogTitle></DialogHeader>
          <TeamForm form={editForm} setForm={setEditForm} coaches={coaches} facilities={facilities} onSave={handleEdit} saveLabel="Guardar cambios" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const BLANK_MATCH = { home_team_id: "", home_team: "Racing San Gabriel", away_team: "", date: "", time: "", location: "", category: "", result: "", status: "upcoming" };

function MatchForm({ form, setForm, dbTeams, onSave, saveLabel }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const categories = [...new Set(dbTeams.map(t => t.category).filter(Boolean))].sort();

  const applyHomeTeam = (teamId) => {
    const t = dbTeams.find(x => x.id === teamId);
    if (t) setForm(f => ({ ...f, home_team_id: teamId, home_team: t.name, category: t.category || f.category }));
    else set("home_team_id", "");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm">Equipo local</Label>
        <Select value={form.home_team_id || "_custom"} onValueChange={applyHomeTeam}>
          <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar equipo del club..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_custom">Otro (manual)</SelectItem>
            {dbTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name} {t.category ? `(${t.category})` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
        {(form.home_team_id === "_custom" || !form.home_team_id) && (
          <Input value={form.home_team} onChange={e => set("home_team", e.target.value)} className="mt-2" placeholder="Racing San Gabriel" />
        )}
      </div>
      <div><Label className="text-sm">Equipo visitante</Label><Input value={form.away_team} onChange={e => set("away_team", e.target.value)} className="mt-1" /></div>
      <div>
        <Label className="text-sm">Categoría</Label>
        <Select value={categories.includes(form.category) ? form.category : "_custom"} onValueChange={v => set("category", v === "_custom" ? "" : v)}>
          <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_custom">Otra (manual)</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {!categories.includes(form.category) && (
          <Input value={form.category} onChange={e => set("category", e.target.value)} className="mt-2" placeholder="Juvenil, Cadete..." />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-sm">Fecha</Label><Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" /></div>
        <div><Label className="text-sm">Hora</Label><Input type="time" value={form.time} onChange={e => set("time", e.target.value)} className="mt-1" /></div>
      </div>
      <div><Label className="text-sm">Ubicación / Campo</Label><Input value={form.location} onChange={e => set("location", e.target.value)} className="mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm">Estado</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Próximo</SelectItem>
              <SelectItem value="played">Jugado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-sm">Resultado</Label><Input value={form.result} onChange={e => set("result", e.target.value)} className="mt-1" placeholder="2-1" /></div>
      </div>
      <div><Label className="text-sm">Observaciones</Label><Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1" placeholder="Árbitro, incidencias, notas..." /></div>
      <Button onClick={onSave} disabled={!form.away_team} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">{saveLabel}</Button>
    </div>
  );
}

function MatchesManager({ matches, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editMatch, setEditMatch] = useState(null);
  const [dbTeams, setDbTeams] = useState([]);
  const [form, setForm] = useState({ ...BLANK_MATCH });
  const [editForm, setEditForm] = useState({ ...BLANK_MATCH });

  useEffect(() => { ax.get("/teams").then(r => setDbTeams(r.data)).catch(() => {}); }, []);

  const handleCreate = async () => {
    const { home_team_id, ...payload } = form;
    await ax.post("/matches", payload);
    setOpen(false);
    setForm({ ...BLANK_MATCH });
    onRefresh();
  };

  const openEdit = (match) => {
    setEditMatch(match);
    setEditForm({ ...BLANK_MATCH, ...match, home_team_id: "" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    const { home_team_id, ...payload } = editForm;
    await ax.put(`/matches/${editMatch.id}`, payload);
    setEditOpen(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar partido?")) return;
    await ax.delete(`/matches/${id}`);
    onRefresh();
  };

  const STATUS_LABEL = { upcoming: "Próximo", played: "Jugado", cancelled: "Cancelado" };
  const STATUS_COLOR = { upcoming: "bg-blue-50 text-blue-700", played: "bg-green-50 text-green-700", cancelled: "bg-gray-100 text-gray-500" };

  return (
    <div data-testid="admin-matches-manager">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Partidos</h2>
          <p className="text-sm text-[#475569]">{matches.length} partidos registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-match-btn">
              <Plus size={16} className="mr-1" /> Nuevo Partido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo Partido</DialogTitle></DialogHeader>
            <MatchForm form={form} setForm={setForm} dbTeams={dbTeams} onSave={handleCreate} saveLabel="Guardar partido" />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {matches.map(match => (
          <div key={match.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-center gap-3" data-testid={`match-item-${match.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-[#0F172A] text-sm">{match.home_team} vs {match.away_team}</h3>
                {match.category && <span className="text-xs bg-[#F4F7FB] text-[#00296B] px-2 py-0.5 rounded-full">{match.category}</span>}
                <Badge className={`text-xs ${STATUS_COLOR[match.status] || ""}`}>{STATUS_LABEL[match.status] || match.status}</Badge>
              </div>
              <p className="text-xs text-[#475569] mt-0.5">{match.date}{match.time ? ` · ${match.time}` : ""}{match.location ? ` · ${match.location}` : ""}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {match.result && <Badge className="bg-green-50 text-green-700 text-xs font-bold">{match.result}</Badge>}
              <Button onClick={() => openEdit(match)} variant="ghost" size="sm" className="text-[#2460FF] h-8 w-8 p-0">
                <Edit size={14} />
              </Button>
              <Button onClick={() => handleDelete(match.id)} variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0" data-testid={`delete-match-${match.id}`}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-10 text-center text-[#94A3B8] text-sm">
            Sin partidos registrados. Crea el primero con "Nuevo Partido".
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar Partido</DialogTitle></DialogHeader>
          <MatchForm form={editForm} setForm={setEditForm} dbTeams={dbTeams} onSave={handleEdit} saveLabel="Guardar cambios" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

const GALLERY_SECTIONS = [
  { id: "all",            label: "Todas",         color: "bg-gray-100 text-gray-700",          dot: "#64748b", desc: "" },
  { id: "hero",           label: "Hero / Portada", color: "bg-blue-100 text-blue-700",          dot: "#2460FF", desc: "Imagen de fondo de la portada del sitio web" },
  { id: "equipos",        label: "Equipos",        color: "bg-green-100 text-green-700",        dot: "#16a34a", desc: "Fotos de equipos y categorías" },
  { id: "instalaciones",  label: "Instalaciones",  color: "bg-amber-100 text-amber-700",        dot: "#d97706", desc: "Fotos de campos, pabellones y espacios" },
  { id: "galeria",        label: "Galería",        color: "bg-purple-100 text-purple-700",      dot: "#9333ea", desc: "Galería general de fotos del club" },
  { id: "patrocinadores", label: "Patrocinadores", color: "bg-rose-100 text-rose-700",          dot: "#e11d48", desc: "Logos e imágenes de patrocinadores" },
  { id: "noticias",       label: "Noticias",       color: "bg-orange-100 text-orange-700",      dot: "#ea580c", desc: "Imágenes para artículos y noticias" },
];

const SECTION_SIZES = {
  hero: "1920×1080px — Horizontal apaisado. Mínimo 1280px de ancho.",
  equipos: "800×600px — Foto de grupo. Horizontal o cuadrada.",
  instalaciones: "1200×800px — Foto del campo o pabellón.",
  galeria: "Cualquier tamaño. Se recomienda mínimo 800px.",
  patrocinadores: "400×200px — Fondo blanco o transparente (PNG). Logo horizontal.",
  noticias: "1200×630px — Horizontal (proporción 1.91:1 ideal para redes).",
};

function GalleryManager({ onRefresh }) {
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [activeSection, setActiveSection] = useState("all");
  const [filterTeam, setFilterTeam] = useState("");
  const [open, setOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState("file");
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({ title: "", image_url: "", description: "", section: "galeria", team_id: "", facility_id: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setEF = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    const r = await ax.get("/gallery");
    setItems(r.data);
  };

  useEffect(() => {
    load();
    ax.get("/teams").then(r => setTeams(r.data)).catch(() => {});
    ax.get("/facilities").then(r => setFacilities(r.data)).catch(() => {});
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    if (!form.title) set("title", file.name.replace(/\.[^.]+$/, ""));
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      if (uploadMode === "file" && selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("title", form.title || selectedFile.name);
        fd.append("section", form.section);
        fd.append("description", form.description);
        fd.append("team_id", form.team_id || "");
        fd.append("facility_id", form.facility_id || "");
        await ax.post("/gallery/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await ax.post("/gallery", { ...form });
      }
      setOpen(false);
      setForm({ title: "", image_url: "", description: "", section: "galeria", team_id: "", facility_id: "" });
      setSelectedFile(null);
      setFilePreview(null);
      load();
      onRefresh();
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({ title: item.title || "", description: item.description || "", section: item.section || "galeria", team_id: item.team_id || "", facility_id: item.facility_id || "" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    await ax.put(`/gallery/${editItem.id}`, editForm);
    setEditOpen(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar imagen?")) return;
    await ax.delete(`/gallery/${id}`);
    load();
    onRefresh();
  };

  const handleToggleVisible = async (item) => {
    await ax.put(`/gallery/${item.id}`, { visible: !item.visible });
    load();
  };

  const secInfo = (secId) => GALLERY_SECTIONS.find(s => s.id === secId) || GALLERY_SECTIONS[0];

  const filtered = items.filter(i => {
    if (activeSection !== "all" && i.section !== activeSection) return false;
    if (filterTeam && i.team_id !== filterTeam) return false;
    return true;
  });

  const resolveImg = (url) => url?.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${url}` : url;

  return (
    <div data-testid="admin-gallery-manager">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-bold text-[#00296B] text-xl">Galería de Imágenes</h2>
          <p className="text-sm text-[#475569]">Organiza las fotos por sección, equipo e instalación</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-gallery-btn">
              <Plus size={16} className="mr-1" /> Añadir imagen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva imagen</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm">¿Dónde aparece en la web? *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {GALLERY_SECTIONS.filter(s => s.id !== "all").map(s => (
                    <button key={s.id} onClick={() => set("section", s.id)}
                      className={`text-left px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${form.section === s.id ? "border-[#2460FF] bg-blue-50" : "border-[#E2E8F0] hover:border-[#2460FF]/40"}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }}></span>
                        {s.label}
                      </div>
                    </button>
                  ))}
                </div>
                {SECTION_SIZES[form.section] && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    📐 Tamaño recomendado: {SECTION_SIZES[form.section]}
                  </p>
                )}
              </div>
              {/* Asociar a equipo o instalación */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Equipo (opcional)</Label>
                  <Select value={form.team_id || "_none"} onValueChange={v => set("team_id", v === "_none" ? "" : v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin equipo</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Instalación (opcional)</Label>
                  <Select value={form.facility_id || "_none"} onValueChange={v => set("facility_id", v === "_none" ? "" : v)}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin instalación" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin instalación</SelectItem>
                      {facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setUploadMode("file")} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${uploadMode === "file" ? "border-[#2460FF] bg-blue-50 text-[#2460FF]" : "border-[#E2E8F0] text-[#475569]"}`}>
                  📂 Subir archivo
                </button>
                <button onClick={() => setUploadMode("url")} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${uploadMode === "url" ? "border-[#2460FF] bg-blue-50 text-[#2460FF]" : "border-[#E2E8F0] text-[#475569]"}`}>
                  🔗 URL externa
                </button>
              </div>
              {uploadMode === "file" ? (
                <label className="block w-full border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 text-center cursor-pointer hover:border-[#2460FF] transition-colors">
                  {filePreview ? (
                    <img src={filePreview} alt="preview" className="h-36 mx-auto object-contain rounded-lg mb-2" />
                  ) : (
                    <div className="py-4 text-[#94A3B8]">
                      <div className="text-3xl mb-2">🖼️</div>
                      <p className="text-sm">Haz clic para seleccionar imagen</p>
                      <p className="text-xs mt-1">JPG, PNG, WEBP hasta 10 MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
              ) : (
                <div><Label className="text-sm">URL de la imagen</Label><Input value={form.image_url} onChange={e => set("image_url", e.target.value)} className="mt-1" placeholder="https://..." /></div>
              )}
              <div><Label className="text-sm">Título</Label><Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" placeholder="Ej: Partido Prebenjamín vs Elche" /></div>
              <div><Label className="text-sm">Descripción</Label><Input value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" placeholder="Opcional" /></div>
              <Button onClick={handleSave} disabled={uploading || (uploadMode === "file" && !selectedFile) || (uploadMode === "url" && !form.image_url)} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-gallery-btn">
                {uploading ? "Subiendo..." : "Guardar imagen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-3">
        {GALLERY_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeSection === s.id ? "bg-[#00296B] text-white border-[#00296B]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B]"}`}>
            {s.label}
            {s.id !== "all" && <span className="ml-1 opacity-60">({items.filter(i => i.section === s.id).length})</span>}
          </button>
        ))}
      </div>

      {/* Filtro por equipo */}
      {teams.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4 items-center">
          <span className="text-xs text-[#94A3B8] font-medium">Equipo:</span>
          <button onClick={() => setFilterTeam("")} className={`px-2 py-1 rounded-full text-xs border transition-all ${!filterTeam ? "bg-[#2460FF] text-white border-[#2460FF]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#2460FF]"}`}>Todos</button>
          {teams.map(t => (
            <button key={t.id} onClick={() => setFilterTeam(filterTeam === t.id ? "" : t.id)}
              className={`px-2 py-1 rounded-full text-xs border transition-all ${filterTeam === t.id ? "bg-[#2460FF] text-white border-[#2460FF]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#2460FF]"}`}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Tamaño recomendado de sección activa */}
      {activeSection !== "all" && SECTION_SIZES[activeSection] && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-4 flex items-center gap-2">
          <span className="text-amber-600">📐</span>
          <p className="text-xs text-amber-800"><strong>Tamaño recomendado:</strong> {SECTION_SIZES[activeSection]}</p>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-12 text-center text-[#94A3B8]">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="font-medium">No hay imágenes con estos filtros</p>
          <p className="text-sm mt-1">Haz clic en "Añadir imagen" para subir la primera</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(item => {
            const sec = secInfo(item.section);
            const teamName = teams.find(t => t.id === item.team_id)?.name;
            return (
              <div key={item.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${item.visible !== false ? "border-[#E2E8F0]" : "border-dashed border-[#E2E8F0] opacity-50"}`} data-testid={`gallery-admin-item-${item.id}`}>
                <div className="relative">
                  <img src={resolveImg(item.image_url)} alt={item.title} className="h-32 w-full object-cover" onError={e => { e.target.src = "https://placehold.co/300x200/e2e8f0/94a3b8?text=Sin+imagen"; }} />
                  <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold ${sec.color}`}>{sec.label}</span>
                  {teamName && <span className="absolute top-2 right-2 text-xs bg-white/90 text-[#00296B] px-1.5 py-0.5 rounded-full font-medium">{teamName}</span>}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-[#0F172A] truncate mb-1">{item.title || "Sin título"}</p>
                  {item.description && <p className="text-xs text-[#94A3B8] truncate mb-1">{item.description}</p>}
                  <div className="flex items-center gap-1 mt-1">
                    <button onClick={() => handleToggleVisible(item)} className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors flex-1 ${item.visible !== false ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {item.visible !== false ? "✓ Visible" : "Oculta"}
                    </button>
                    <Button onClick={() => openEdit(item)} variant="ghost" size="sm" className="text-[#2460FF] h-7 w-7 p-0">
                      <Edit size={12} />
                    </Button>
                    <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="text-red-400 h-7 w-7 p-0 hover:text-red-600" data-testid={`delete-gallery-${item.id}`}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Editar imagen</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {editItem && (
              <img src={resolveImg(editItem.image_url)} alt="" className="h-28 w-full object-cover rounded-xl" onError={e => { e.target.style.display="none"; }} />
            )}
            <div><Label className="text-sm">Título</Label><Input value={editForm.title || ""} onChange={e => setEF("title", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-sm">Descripción</Label><Input value={editForm.description || ""} onChange={e => setEF("description", e.target.value)} className="mt-1" /></div>
            <div>
              <Label className="text-sm">Sección</Label>
              <Select value={editForm.section || "galeria"} onValueChange={v => setEF("section", v)}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{GALLERY_SECTIONS.filter(s => s.id !== "all").map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Equipo</Label>
                <Select value={editForm.team_id || "_none"} onValueChange={v => setEF("team_id", v === "_none" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin equipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin equipo</SelectItem>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Instalación</Label>
                <Select value={editForm.facility_id || "_none"} onValueChange={v => setEF("facility_id", v === "_none" ? "" : v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sin inst." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin instalación</SelectItem>
                    {facilities.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleEdit} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white">Guardar cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactsManager({ onRefresh }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unread | read
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    const r = await ax.get("/contact");
    setItems(r.data);
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id, read) => {
    await ax.put(`/contact/${id}/read`, { read });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este mensaje?")) return;
    await ax.delete(`/contact/${id}`);
    load();
    onRefresh();
  };

  const openReply = (c) => {
    setReplyTarget(c);
    setReplyBody(`Hola ${c.name},\n\n`);
    setReplyError("");
    setReplyOpen(true);
    if (!c.read) handleMarkRead(c.id, true);
  };

  const handleReply = async () => {
    if (!replyBody.trim()) return;
    setReplying(true);
    setReplyError("");
    try {
      await ax.post(`/contact/${replyTarget.id}/reply`, { message: replyBody });
      setReplyOpen(false);
      setReplyBody("");
      load();
    } catch (e) {
      setReplyError(e.response?.data?.detail || "Error al enviar. Verifica la configuración SMTP en Ajustes.");
    } finally {
      setReplying(false);
    }
  };

  const unreadCount = items.filter(c => !c.read).length;
  const filtered = filter === "unread" ? items.filter(c => !c.read) : filter === "read" ? items.filter(c => c.read) : items;

  return (
    <div data-testid="admin-contacts-manager">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-bold text-[#00296B] text-xl">Mensajes recibidos</h2>
            {unreadCount > 0 && (
              <span className="bg-[#2460FF] text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} nuevo{unreadCount > 1 ? "s" : ""}</span>
            )}
          </div>
          <p className="text-xs text-[#475569] mt-0.5">Formularios de contacto recibidos · Para enviar comunicados, usa <span className="font-bold">Comunicaciones</span></p>
        </div>
        <div className="flex gap-2">
          {["all","unread","read"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filter === f ? "bg-[#00296B] text-white border-[#00296B]" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#00296B]"}`}>
              {f === "all" ? "Todos" : f === "unread" ? "No leídos" : "Leídos"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-12 text-center text-[#94A3B8]">
          <div className="text-4xl mb-3">📭</div>
          <p className="font-medium">{filter === "unread" ? "No hay mensajes sin leer" : "No hay mensajes"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className={`bg-white rounded-xl border p-4 transition-all ${!c.read ? "border-[#2460FF]/30 shadow-sm" : "border-[#E2E8F0]"}`} data-testid={`contact-item-${c.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  {!c.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2460FF] flex-shrink-0"></span>}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#0F172A] text-sm">{c.name}</h3>
                      {c.replied && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">✓ Respondido</span>}
                    </div>
                    <p className="text-xs text-[#475569] mt-0.5">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{c.created_at ? new Date(c.created_at).toLocaleString("es-ES") : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleMarkRead(c.id, !c.read)} className={`text-xs px-2 py-1 rounded-lg font-medium border transition-colors ${c.read ? "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100" : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"}`}>
                    {c.read ? "Marcar no leído" : "Marcar leído"}
                  </button>
                  <Button onClick={() => openReply(c)} size="sm" className="bg-[#2460FF] hover:bg-[#00296B] text-white h-8 px-3 text-xs">Responder</Button>
                  <Button onClick={() => handleDelete(c.id)} variant="ghost" size="sm" className="text-red-400 h-8 w-8 p-0 hover:text-red-600" data-testid={`delete-contact-${c.id}`}><Trash2 size={13} /></Button>
                </div>
              </div>
              <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="mt-3 text-left w-full">
                <p className={`text-sm text-[#475569] ${expanded === c.id ? "" : "line-clamp-2"}`}>{c.message}</p>
                {c.message?.length > 120 && <span className="text-xs text-[#2460FF] font-medium">{expanded === c.id ? "Ver menos" : "Ver más"}</span>}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#00296B]">Responder a {replyTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-[#F4F7FB] rounded-lg p-3 border border-[#E2E8F0]">
              <p className="text-xs text-[#475569] font-medium mb-1">Para: {replyTarget?.email}</p>
              <p className="text-xs text-[#94A3B8] italic line-clamp-2">{replyTarget?.message}</p>
            </div>
            <div>
              <Label className="text-sm">Tu respuesta</Label>
              <Textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={6} className="mt-1 font-mono text-sm" placeholder="Escribe tu respuesta aquí..." />
            </div>
            {replyError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{replyError}</p>}
            <div className="flex gap-2">
              <Button onClick={() => setReplyOpen(false)} variant="outline" className="flex-1">Cancelar</Button>
              <Button onClick={handleReply} disabled={replying || !replyBody.trim()} className="flex-1 bg-[#2460FF] hover:bg-[#00296B] text-white">
                {replying ? "Enviando..." : "Enviar respuesta"}
              </Button>
            </div>
            <p className="text-xs text-[#94A3B8] text-center">El email se enviará desde la cuenta SMTP configurada en Ajustes</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function SettingsSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#E2E8F0]">
        <Icon size={18} className="text-[#2460FF]" />
        <h3 className="font-heading font-bold text-[#00296B] text-base">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-[#2460FF]" : "bg-gray-200"}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-[#475569]">{label}</span>
    </label>
  );
}

function SettingsManager({ settings, onRefresh }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState("");
  const [tab, setTab] = useState("club");

  useEffect(() => {
    const s = { ...settings };
    if (!s.bank_accounts || s.bank_accounts.length === 0) {
      s.bank_accounts = s.bank_iban
        ? [{ id: "1", label: "Cuenta principal", iban: s.bank_iban || "", bic: s.bank_bic || "", bank_name: s.bank_name || "", holder: s.bank_holder || "" }]
        : [];
    }
    setForm(s);
  }, [settings]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    try {
      await ax.put("/settings", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onRefresh();
    } catch {
      alert("Error al guardar los ajustes.");
    }
  };

  const handleTestEmail = async () => {
    setTestEmailStatus("enviando...");
    try {
      await ax.post("/settings/test-email");
      setTestEmailStatus("✅ Email de prueba enviado correctamente");
    } catch (e) {
      setTestEmailStatus("❌ " + (e.response?.data?.detail || "Error al enviar"));
    }
    setTimeout(() => setTestEmailStatus(""), 5000);
  };

  const tabs = [
    { id: "club", label: "Club" },
    { id: "stripe", label: "Stripe" },
    { id: "redsys", label: "Redsys TPV" },
    { id: "bank", label: "Transferencia" },
    { id: "sepa_cfg", label: "SEPA" },
    { id: "email", label: "Email SMTP" },
  ];

  return (
    <div data-testid="admin-settings-manager">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-5">Ajustes del Club</h2>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.id ? "bg-[#2460FF] text-white" : "bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#2460FF]"}`}
          >{t.label}</button>
        ))}
      </div>

      {tab === "club" && (
        <SettingsSection title="Información del Club" icon={Building2}>
          <div><Label className="text-sm">Nombre del club</Label><Input value={form.club_name || ""} onChange={e => set("club_name", e.target.value)} className="mt-1" data-testid="settings-club-name" /></div>
          <div><Label className="text-sm">Descripción</Label><Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={3} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">Dirección</Label><Input value={form.address || ""} onChange={e => set("address", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-sm">Teléfono</Label><Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} className="mt-1" /></div>
          </div>
          <div><Label className="text-sm">Email público del club</Label><Input value={form.email || ""} onChange={e => set("email", e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">Instagram URL</Label><Input value={form.instagram_url || ""} onChange={e => set("instagram_url", e.target.value)} className="mt-1" /></div>
            <div><Label className="text-sm">Facebook URL</Label><Input value={form.facebook_url || ""} onChange={e => set("facebook_url", e.target.value)} className="mt-1" /></div>
          </div>
        </SettingsSection>
      )}

      {tab === "stripe" && (
        <SettingsSection title="Stripe — Pagos online con tarjeta" icon={CreditCard}>
          <Toggle checked={!!form.stripe_enabled} onChange={v => set("stripe_enabled", v)} label="Activar pagos con Stripe" />
          <div><Label className="text-sm">Clave pública (pk_live_... o pk_test_...)</Label><Input value={form.stripe_public_key || ""} onChange={e => set("stripe_public_key", e.target.value)} className="mt-1 font-mono text-xs" placeholder="pk_live_..." /></div>
          <div><Label className="text-sm">Clave secreta (sk_live_... o sk_test_...)</Label><Input type="password" value={form.stripe_secret_key || ""} onChange={e => set("stripe_secret_key", e.target.value)} className="mt-1 font-mono text-xs" placeholder="sk_live_..." /></div>
          <div><Label className="text-sm">Webhook Secret (whsec_...)</Label><Input type="password" value={form.stripe_webhook_secret || ""} onChange={e => set("stripe_webhook_secret", e.target.value)} className="mt-1 font-mono text-xs" placeholder="whsec_..." /></div>
          <p className="text-xs text-[#94A3B8]">Consigue tus claves en <b>dashboard.stripe.com → Developers → API keys</b>. El webhook debe apuntar a <code>/api/stripe/webhook</code>.</p>
        </SettingsSection>
      )}

      {tab === "redsys" && (
        <SettingsSection title="Redsys TPV Virtual" icon={CreditCard}>
          <Toggle checked={!!form.redsys_enabled} onChange={v => set("redsys_enabled", v)} label="Activar TPV Redsys" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">Código de comercio (FUC)</Label><Input value={form.redsys_merchant_code || ""} onChange={e => set("redsys_merchant_code", e.target.value)} className="mt-1" placeholder="999008881" /></div>
            <div><Label className="text-sm">Terminal</Label><Input value={form.redsys_terminal || ""} onChange={e => set("redsys_terminal", e.target.value)} className="mt-1" placeholder="001" /></div>
          </div>
          <div><Label className="text-sm">Clave secreta SHA-256</Label><Input type="password" value={form.redsys_secret_key || ""} onChange={e => set("redsys_secret_key", e.target.value)} className="mt-1 font-mono text-xs" /></div>
          <div>
            <Label className="text-sm">Entorno</Label>
            <Select value={form.redsys_environment || "test"} onValueChange={v => set("redsys_environment", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Pruebas (sandbox)</SelectItem>
                <SelectItem value="production">Producción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-[#94A3B8]">Los datos los facilita tu banco. El callback de notificación (URL OK/KO) debe configurarse en el panel Redsys.</p>
        </SettingsSection>
      )}

      {tab === "bank" && (
        <SettingsSection title="Transferencia Bancaria" icon={Landmark}>
          <Toggle checked={!!form.bank_transfer_enabled} onChange={v => set("bank_transfer_enabled", v)} label="Permitir pago por transferencia bancaria" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-[#00296B]">Cuentas bancarias ({(form.bank_accounts || []).length})</Label>
              <Button size="sm" variant="outline" className="text-xs text-[#2460FF] border-[#2460FF]"
                onClick={() => {
                  const accounts = [...(form.bank_accounts || [])];
                  accounts.push({ id: Date.now().toString(), label: "", iban: "", bic: "", bank_name: "", holder: "" });
                  set("bank_accounts", accounts);
                }}>
                <Plus size={12} className="mr-1" />Añadir cuenta
              </Button>
            </div>
            {(form.bank_accounts || []).length === 0 && (
              <p className="text-sm text-[#94A3B8] py-6 text-center border-2 border-dashed border-[#E2E8F0] rounded-xl">
                No hay cuentas. Haz clic en "Añadir cuenta".
              </p>
            )}
            <div className="space-y-3">
              {(form.bank_accounts || []).map((acct, idx) => {
                const updateAcct = (field, val) => {
                  const accounts = (form.bank_accounts || []).map((a, i) => i === idx ? { ...a, [field]: val } : a);
                  set("bank_accounts", accounts);
                };
                const removeAcct = () => {
                  const accounts = (form.bank_accounts || []).filter((_, i) => i !== idx);
                  set("bank_accounts", accounts);
                };
                return (
                  <div key={acct.id || idx} className="border border-[#E2E8F0] rounded-xl p-4 space-y-3 relative bg-[#FAFBFF]">
                    <div className="flex items-center gap-2 pr-6">
                      {idx === 0 && <span className="text-xs bg-[#2460FF] text-white px-2 py-0.5 rounded-full font-bold">Principal</span>}
                      <Input value={acct.label} onChange={e => updateAcct("label", e.target.value)} className="text-sm flex-1" placeholder="Etiqueta (ej: Cuenta principal, Cuota SEPA...)" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-[#475569]">IBAN</Label><Input value={acct.iban} onChange={e => updateAcct("iban", e.target.value.toUpperCase())} className="mt-1 font-mono text-xs" placeholder="ES76 2100 0813..." /></div>
                      <div><Label className="text-xs text-[#475569]">BIC / SWIFT</Label><Input value={acct.bic} onChange={e => updateAcct("bic", e.target.value.toUpperCase())} className="mt-1 font-mono text-xs" placeholder="CAIXESBBXXX" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs text-[#475569]">Nombre del banco</Label><Input value={acct.bank_name} onChange={e => updateAcct("bank_name", e.target.value)} className="mt-1 text-sm" placeholder="CaixaBank" /></div>
                      <div><Label className="text-xs text-[#475569]">Titular</Label><Input value={acct.holder} onChange={e => updateAcct("holder", e.target.value)} className="mt-1 text-sm" /></div>
                    </div>
                    <button onClick={removeAcct} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1">
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div><Label className="text-sm">Instrucciones adicionales (se muestran al socio/jugador)</Label><Textarea value={form.bank_transfer_instructions || ""} onChange={e => set("bank_transfer_instructions", e.target.value)} rows={3} className="mt-1" placeholder="Indica tu nombre y apellidos en el concepto de la transferencia." /></div>
        </SettingsSection>
      )}

      {tab === "sepa_cfg" && (
        <SettingsSection title="SEPA — Domiciliación bancaria" icon={FileText}>
          <Toggle checked={!!form.sepa_enabled} onChange={v => set("sepa_enabled", v)} label="Activar domiciliación bancaria SEPA" />
          <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">Necesitas obtener un Identificador de Acreedor SEPA en el Banco de España antes de operar.</p>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">Identificador de Acreedor SEPA (CID)</Label><Input value={form.sepa_creditor_id || ""} onChange={e => set("sepa_creditor_id", e.target.value)} className="mt-1 font-mono text-xs" placeholder="ES12ZZZ12345678" /></div>
            <div><Label className="text-sm">Nombre del Acreedor</Label><Input value={form.sepa_creditor_name || ""} onChange={e => set("sepa_creditor_name", e.target.value)} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">IBAN del acreedor</Label><Input value={form.sepa_creditor_iban || ""} onChange={e => set("sepa_creditor_iban", e.target.value)} className="mt-1 font-mono text-xs" placeholder="ES76 2100..." /></div>
            <div><Label className="text-sm">BIC del acreedor</Label><Input value={form.sepa_creditor_bic || ""} onChange={e => set("sepa_creditor_bic", e.target.value)} className="mt-1 font-mono" placeholder="CAIXESBBXXX" /></div>
          </div>
          <p className="text-xs text-[#94A3B8]">El XML pain.008 generado desde la sección SEPA/Domiciliaciones se enviará a tu banco para ejecutar los cobros.</p>
        </SettingsSection>
      )}

      {tab === "email" && (
        <SettingsSection title="Email SMTP — Cuenta del club" icon={Mail}>
          <Toggle checked={!!form.smtp_enabled} onChange={v => set("smtp_enabled", v)} label="Activar envío de emails automáticos" />
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">Servidor SMTP</Label><Input value={form.smtp_host || ""} onChange={e => set("smtp_host", e.target.value)} className="mt-1" placeholder="smtp.gmail.com" /></div>
            <div><Label className="text-sm">Puerto</Label><Input type="number" value={form.smtp_port || 587} onChange={e => set("smtp_port", parseInt(e.target.value))} className="mt-1" /></div>
          </div>
          <div><Label className="text-sm">Usuario / Email de envío</Label><Input value={form.smtp_user || ""} onChange={e => set("smtp_user", e.target.value)} className="mt-1" placeholder="racingsangabriel@gmail.com" /></div>
          <div><Label className="text-sm">Contraseña (App Password en Gmail)</Label><Input type="password" value={form.smtp_password || ""} onChange={e => set("smtp_password", e.target.value)} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm">Nombre del remitente</Label><Input value={form.smtp_from_name || ""} onChange={e => set("smtp_from_name", e.target.value)} className="mt-1" placeholder="Racing San Gabriel ADC" /></div>
            <div className="flex flex-col justify-end pb-1"><Toggle checked={form.smtp_use_tls !== false} onChange={v => set("smtp_use_tls", v)} label="Usar TLS (STARTTLS)" /></div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleTestEmail} variant="outline" size="sm" className="text-[#2460FF] border-[#2460FF]">
              <Send size={14} className="mr-1" /> Enviar email de prueba
            </Button>
            {testEmailStatus && <span className="text-sm text-[#475569]">{testEmailStatus}</span>}
          </div>
          <p className="text-xs text-[#94A3B8]">Gmail: activa la verificación en 2 pasos y genera una <b>Contraseña de aplicación</b> en tu cuenta Google. Nunca uses tu contraseña normal.</p>
        </SettingsSection>
      )}

      <div className="mt-6 max-w-2xl">
        <Button onClick={handleSave} className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-settings-btn">
          {saved ? <><CheckCircle size={14} className="mr-1" /> Guardado</> : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
