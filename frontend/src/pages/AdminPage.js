import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  LayoutDashboard, Newspaper, Users, CalendarDays, Images,
  Mail, Settings, LogOut, Plus, Trash2, Edit, ChevronRight, Menu, X
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

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

const sidebarItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "news", label: "Noticias", icon: Newspaper },
  { id: "teams", label: "Equipos", icon: Users },
  { id: "matches", label: "Partidos", icon: CalendarDays },
  { id: "gallery", label: "Galeria", icon: Images },
  { id: "contacts", label: "Mensajes", icon: Mail },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
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

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [n, t, m, g, c, s] = await Promise.all([
        ax.get("/news"), ax.get("/teams"), ax.get("/matches"),
        ax.get("/gallery"), ax.get("/contact"), ax.get("/settings")
      ]);
      setNews(n.data); setTeams(t.data); setMatches(m.data);
      setGallery(g.data); setContacts(c.data); setSettings(s.data);
    } catch {}
  };

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;
  if (!user) return null;

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
          <h1 className="font-heading font-bold text-[#00296B] text-lg">Admin Panel</h1>
          <p className="text-xs text-[#475569]">{user?.email}</p>
        </div>
        <nav className="flex-1 py-3">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`admin-sidebar-item w-full flex items-center gap-3 px-5 py-2.5 text-sm ${section === item.id ? "active text-[#2460FF] font-medium" : "text-[#475569]"}`}
              data-testid={`admin-nav-${item.id}`}
            >
              <item.icon size={16} />
              {item.label}
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
        {section === "dashboard" && <DashboardSection news={news} teams={teams} matches={matches} contacts={contacts} />}
        {section === "news" && <NewsManager news={news} onRefresh={loadData} />}
        {section === "teams" && <TeamsManager teams={teams} onRefresh={loadData} />}
        {section === "matches" && <MatchesManager matches={matches} onRefresh={loadData} />}
        {section === "gallery" && <GalleryManager gallery={gallery} onRefresh={loadData} />}
        {section === "contacts" && <ContactsManager contacts={contacts} onRefresh={loadData} />}
        {section === "settings" && <SettingsManager settings={settings} onRefresh={loadData} />}
      </main>
    </div>
  );
}

function DashboardSection({ news, teams, matches, contacts }) {
  const stats = [
    { label: "Noticias", count: news.length, icon: Newspaper, color: "text-[#2460FF]" },
    { label: "Equipos", count: teams.length, icon: Users, color: "text-green-600" },
    { label: "Partidos", count: matches.length, icon: CalendarDays, color: "text-amber-600" },
    { label: "Mensajes", count: contacts.length, icon: Mail, color: "text-purple-600" },
  ];
  return (
    <div data-testid="admin-dashboard">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-5" data-testid={`dashboard-stat-${s.label.toLowerCase()}`}>
            <s.icon size={20} className={s.color} />
            <p className="font-heading font-bold text-2xl text-[#00296B] mt-2">{s.count}</p>
            <p className="text-sm text-[#475569]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="font-heading font-bold text-[#00296B] mb-3">Ultimos mensajes</h3>
        {contacts.length === 0 ? <p className="text-sm text-[#475569]">Sin mensajes</p> :
          contacts.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
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

function NewsManager({ news, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", image_url: "", source: "web", category: "general" });

  const handleCreate = async () => {
    await ax.post("/news", form);
    setOpen(false);
    setForm({ title: "", content: "", image_url: "", source: "web", category: "general" });
    onRefresh();
  };

  const handleDelete = async (id) => {
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
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Titulo</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1" data-testid="news-title-input" />
              </div>
              <div>
                <Label className="text-sm">Contenido</Label>
                <Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={3} className="mt-1" data-testid="news-content-input" />
              </div>
              <div>
                <Label className="text-sm">URL Imagen</Label>
                <Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="mt-1" data-testid="news-image-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Fuente</Label>
                  <Select value={form.source} onValueChange={v => setForm({...form, source: v})}>
                    <SelectTrigger className="mt-1" data-testid="news-source-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="mt-1" data-testid="news-category-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="resultados">Resultados</SelectItem>
                      <SelectItem value="eventos">Eventos</SelectItem>
                      <SelectItem value="fichajes">Fichajes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-news-btn">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {news.map(item => (
          <div key={item.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-start justify-between gap-3" data-testid={`news-item-${item.id}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-[#0F172A] text-sm">{item.title}</h3>
                <Badge className="text-xs bg-[#F4F7FB] text-[#00296B]">{item.category}</Badge>
              </div>
              <p className="text-xs text-[#475569] line-clamp-2">{item.content}</p>
            </div>
            <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-news-${item.id}`}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamsManager({ teams, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", coach: "", image_url: "", description: "" });

  const handleCreate = async () => {
    await ax.post("/teams", form);
    setOpen(false);
    setForm({ name: "", category: "", coach: "", image_url: "", description: "" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    await ax.delete(`/teams/${id}`);
    onRefresh();
  };

  return (
    <div data-testid="admin-teams-manager">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-[#00296B] text-xl">Equipos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-team-btn">
              <Plus size={16} className="mr-1" /> Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo Equipo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm">Nombre</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" data-testid="team-name-input" /></div>
              <div><Label className="text-sm">Categoria</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="mt-1" placeholder="Juvenil, Cadete, Infantil..." data-testid="team-category-input" /></div>
              <div><Label className="text-sm">Entrenador</Label><Input value={form.coach} onChange={e => setForm({...form, coach: e.target.value})} className="mt-1" data-testid="team-coach-input" /></div>
              <div><Label className="text-sm">URL Imagen</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="mt-1" data-testid="team-image-input" /></div>
              <div><Label className="text-sm">Descripcion</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="mt-1" data-testid="team-description-input" /></div>
              <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-team-btn">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {teams.map(team => (
          <div key={team.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-center justify-between" data-testid={`team-item-${team.id}`}>
            <div>
              <h3 className="font-medium text-[#0F172A] text-sm">{team.name}</h3>
              <p className="text-xs text-[#475569]">{team.category} {team.coach ? `- ${team.coach}` : ""}</p>
            </div>
            <Button onClick={() => handleDelete(team.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-team-${team.id}`}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchesManager({ matches, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ home_team: "Racing San Gabriel", away_team: "", date: "", time: "", location: "", category: "", result: "", status: "upcoming" });

  const handleCreate = async () => {
    await ax.post("/matches", form);
    setOpen(false);
    setForm({ home_team: "Racing San Gabriel", away_team: "", date: "", time: "", location: "", category: "", result: "", status: "upcoming" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    await ax.delete(`/matches/${id}`);
    onRefresh();
  };

  return (
    <div data-testid="admin-matches-manager">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-[#00296B] text-xl">Partidos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-match-btn">
              <Plus size={16} className="mr-1" /> Nuevo Partido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nuevo Partido</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Local</Label><Input value={form.home_team} onChange={e => setForm({...form, home_team: e.target.value})} className="mt-1" data-testid="match-home-input" /></div>
                <div><Label className="text-sm">Visitante</Label><Input value={form.away_team} onChange={e => setForm({...form, away_team: e.target.value})} className="mt-1" data-testid="match-away-input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Fecha</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="mt-1" data-testid="match-date-input" /></div>
                <div><Label className="text-sm">Hora</Label><Input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="mt-1" data-testid="match-time-input" /></div>
              </div>
              <div><Label className="text-sm">Ubicacion</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1" data-testid="match-location-input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm">Categoria</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="mt-1" data-testid="match-category-input" /></div>
                <div>
                  <Label className="text-sm">Estado</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger className="mt-1" data-testid="match-status-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Proximo</SelectItem>
                      <SelectItem value="played">Jugado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-sm">Resultado</Label><Input value={form.result} onChange={e => setForm({...form, result: e.target.value})} className="mt-1" placeholder="2-1" data-testid="match-result-input" /></div>
              <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-match-btn">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {matches.map(match => (
          <div key={match.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4 flex items-center justify-between" data-testid={`match-item-${match.id}`}>
            <div>
              <h3 className="font-medium text-[#0F172A] text-sm">{match.home_team} vs {match.away_team}</h3>
              <p className="text-xs text-[#475569]">{match.date} {match.time} - {match.location}</p>
            </div>
            <div className="flex items-center gap-2">
              {match.result && <Badge className="bg-green-50 text-green-700 text-xs">{match.result}</Badge>}
              <Button onClick={() => handleDelete(match.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-match-${match.id}`}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GalleryManager({ gallery, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "", description: "", category: "general" });

  const handleCreate = async () => {
    await ax.post("/gallery", form);
    setOpen(false);
    setForm({ title: "", image_url: "", description: "", category: "general" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    await ax.delete(`/gallery/${id}`);
    onRefresh();
  };

  return (
    <div data-testid="admin-gallery-manager">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-[#00296B] text-xl">Galeria</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="add-gallery-btn">
              <Plus size={16} className="mr-1" /> Nueva Imagen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-[#00296B]">Nueva Imagen</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm">Titulo</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1" data-testid="gallery-title-input" /></div>
              <div><Label className="text-sm">URL Imagen</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="mt-1" data-testid="gallery-image-input" /></div>
              <div><Label className="text-sm">Descripcion</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="mt-1" data-testid="gallery-description-input" /></div>
              <Button onClick={handleCreate} className="w-full bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-gallery-btn">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {gallery.map(item => (
          <div key={item.id} className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden" data-testid={`gallery-admin-item-${item.id}`}>
            <img src={item.image_url} alt={item.title} className="h-32 w-full object-cover" />
            <div className="p-3 flex items-center justify-between">
              <p className="text-sm font-medium text-[#0F172A] truncate">{item.title}</p>
              <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-gallery-${item.id}`}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsManager({ contacts, onRefresh }) {
  const handleDelete = async (id) => {
    await ax.delete(`/contact/${id}`);
    onRefresh();
  };

  return (
    <div data-testid="admin-contacts-manager">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-6">Mensajes de Contacto</h2>
      {contacts.length === 0 ? <p className="text-sm text-[#475569]">No hay mensajes</p> :
        <div className="space-y-3">
          {contacts.map(c => (
            <div key={c.id} className="bg-white rounded-lg border border-[#E2E8F0] p-4" data-testid={`contact-item-${c.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[#0F172A] text-sm">{c.name}</h3>
                  <p className="text-xs text-[#475569]">{c.email} {c.phone ? `- ${c.phone}` : ""}</p>
                </div>
                <Button onClick={() => handleDelete(c.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" data-testid={`delete-contact-${c.id}`}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <p className="text-sm text-[#475569] mt-2">{c.message}</p>
              <p className="text-xs text-[#94A3B8] mt-2">{c.created_at ? new Date(c.created_at).toLocaleString("es-ES") : ""}</p>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function SettingsManager({ settings, onRefresh }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = async () => {
    await ax.put("/settings", form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onRefresh();
  };

  return (
    <div data-testid="admin-settings-manager">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-6">Ajustes del Club</h2>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-4 max-w-2xl">
        <div><Label className="text-sm">Nombre del club</Label><Input value={form.club_name || ""} onChange={e => setForm({...form, club_name: e.target.value})} className="mt-1" data-testid="settings-club-name" /></div>
        <div><Label className="text-sm">Descripcion</Label><Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="mt-1" data-testid="settings-description" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-sm">Direccion</Label><Input value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} className="mt-1" data-testid="settings-address" /></div>
          <div><Label className="text-sm">Telefono</Label><Input value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1" data-testid="settings-phone" /></div>
        </div>
        <div><Label className="text-sm">Email</Label><Input value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} className="mt-1" data-testid="settings-email" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-sm">Instagram URL</Label><Input value={form.instagram_url || ""} onChange={e => setForm({...form, instagram_url: e.target.value})} className="mt-1" data-testid="settings-instagram" /></div>
          <div><Label className="text-sm">Facebook URL</Label><Input value={form.facebook_url || ""} onChange={e => setForm({...form, facebook_url: e.target.value})} className="mt-1" data-testid="settings-facebook" /></div>
        </div>
        <Button onClick={handleSave} className="bg-[#2460FF] hover:bg-[#00296B] text-white" data-testid="save-settings-btn">
          {saved ? "Guardado!" : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
