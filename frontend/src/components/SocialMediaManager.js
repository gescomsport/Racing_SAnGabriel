import { useState, useEffect } from "react";
import axios from "axios";
import {
  Rss, Instagram, Facebook, Info, CheckCircle, ExternalLink
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = axios.create({ baseURL: API, withCredentials: true });

export default function SocialMediaManager() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    facebook_embed_enabled: false,
    facebook_page_url: "",
    instagram_embed_code: "",
    custom_embed_code: "",
    instagram_url: "",
    facebook_url: "",
    instagram_username: "",
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("facebook");

  useEffect(() => {
    ax.get("/settings").then(r => {
      const s = r.data;
      setSettings(s);
      setForm({
        facebook_embed_enabled: s.facebook_embed_enabled || false,
        facebook_page_url: s.facebook_page_url || "",
        instagram_embed_code: s.instagram_embed_code || "",
        custom_embed_code: s.custom_embed_code || "",
        instagram_url: s.instagram_url || "",
        facebook_url: s.facebook_url || "",
        instagram_username: s.instagram_username || "",
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await ax.put("/settings", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  return (
    <div data-testid="admin-social-manager">
      <h2 className="font-heading font-bold text-[#00296B] text-xl mb-2">Redes Sociales</h2>
      <p className="text-sm text-[#475569] mb-6">
        Configura la integracion automatica de tus redes sociales en la web. Las publicaciones se mostraran en tiempo real.
      </p>

      {/* Status Banner */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${form.facebook_embed_enabled && form.facebook_page_url ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-sm text-[#0F172A]">Facebook: {form.facebook_embed_enabled && form.facebook_page_url ? "Activo" : "Inactivo"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${form.instagram_embed_code ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-sm text-[#0F172A]">Instagram: {form.instagram_embed_code ? "Activo" : "Inactivo"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${form.custom_embed_code ? "bg-green-500" : "bg-gray-300"}`} />
          <span className="text-sm text-[#0F172A]">Feed personalizado: {form.custom_embed_code ? "Activo" : "Inactivo"}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F4F7FB] p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("facebook")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "facebook" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-facebook"
        >
          <Facebook size={14} className="text-[#1877F2]" /> Facebook
        </button>
        <button
          onClick={() => setActiveTab("instagram")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "instagram" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-instagram"
        >
          <Instagram size={14} className="text-[#E1306C]" /> Instagram
        </button>
        <button
          onClick={() => setActiveTab("multi")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "multi" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-multi"
        >
          <Rss size={14} className="text-[#2460FF]" /> Feed Completo
        </button>
      </div>

      {/* Facebook Tab */}
      {activeTab === "facebook" && (
        <div className="space-y-6" data-testid="social-facebook-config">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Facebook size={20} className="text-[#1877F2]" />
              <h3 className="font-heading font-bold text-[#00296B]">Facebook Page Plugin</h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Gratis - Oficial</span>
            </div>

            <div className="bg-[#F4F7FB] rounded-lg p-4 mb-5">
              <h4 className="text-sm font-bold text-[#00296B] mb-2 flex items-center gap-2">
                <Info size={14} className="text-[#2460FF]" /> Como funciona
              </h4>
              <p className="text-sm text-[#475569] leading-relaxed">
                Facebook ofrece un widget oficial gratuito que muestra las publicaciones de tu pagina
                directamente en la web. Solo necesitas pegar la URL de tu pagina de Facebook.
                Las publicaciones se actualizan automaticamente.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <StepItem num="1" title="Activa el feed de Facebook" desc="Marca la casilla de abajo para activar el widget." />
              <StepItem num="2" title="Pega la URL de tu pagina de Facebook" desc="Ejemplo: https://www.facebook.com/RacingSanGabrielADC/" />
              <StepItem num="3" title="Guarda y listo" desc="Las publicaciones de tu pagina de Facebook apareceran automaticamente en la web." />
            </div>

            <div className="space-y-4 border-t border-[#E2E8F0] pt-5">
              <label className="flex items-center gap-3 cursor-pointer" data-testid="facebook-embed-toggle">
                <input
                  type="checkbox"
                  checked={form.facebook_embed_enabled}
                  onChange={e => setForm({...form, facebook_embed_enabled: e.target.checked})}
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#2460FF] focus:ring-[#2460FF]"
                />
                <span className="text-sm font-medium text-[#0F172A]">Activar feed de Facebook en la web</span>
              </label>
              <div>
                <Label className="text-sm">URL de la pagina de Facebook</Label>
                <Input
                  value={form.facebook_page_url}
                  onChange={e => setForm({...form, facebook_page_url: e.target.value})}
                  placeholder="https://www.facebook.com/TuPagina/"
                  className="mt-1"
                  data-testid="facebook-page-url-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Tab */}
      {activeTab === "instagram" && (
        <div className="space-y-6" data-testid="social-instagram-config">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Instagram size={20} className="text-[#E1306C]" />
              <h3 className="font-heading font-bold text-[#00296B]">Feed de Instagram</h3>
            </div>

            <div className="bg-[#F4F7FB] rounded-lg p-4 mb-5">
              <h4 className="text-sm font-bold text-[#00296B] mb-2 flex items-center gap-2">
                <Info size={14} className="text-[#2460FF]" /> Como funciona
              </h4>
              <p className="text-sm text-[#475569] leading-relaxed">
                Instagram no tiene un widget oficial gratuito como Facebook. Para mostrar tus
                publicaciones de Instagram automaticamente, necesitas usar un servicio externo
                (gratuito). Te recomendamos Elfsight o Curator.io.
              </p>
            </div>

            {/* Option A */}
            <div className="border border-[#E2E8F0] rounded-lg p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-[#00296B] text-sm">Opcion A: Elfsight (Recomendado)</h4>
                <span className="text-xs bg-blue-50 text-[#2460FF] px-2 py-0.5 rounded-full font-medium">Plan gratis disponible</span>
              </div>
              <StepItem num="1" desc="Ve a elfsight.com/instagram-feed-widget y crea una cuenta gratuita." color="bg-[#E1306C]" />
              <StepItem num="2" desc="Conecta tu cuenta de Instagram y elige el diseno que mas te guste." color="bg-[#E1306C]" />
              <StepItem num="3" desc="Copia el codigo embed que te proporciona Elfsight." color="bg-[#E1306C]" />
              <StepItem num="4" desc="Pegalo en el campo de abajo y guarda." color="bg-[#E1306C]" />
              <a href="https://elfsight.com/instagram-feed-widget/" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-sm text-[#2460FF] hover:underline mt-2" data-testid="elfsight-link">
                Ir a Elfsight <ExternalLink size={12} />
              </a>
            </div>

            {/* Option B */}
            <div className="border border-[#E2E8F0] rounded-lg p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-[#00296B] text-sm">Opcion B: Curator.io</h4>
                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Sin marca de agua</span>
              </div>
              <StepItem num="1" desc="Ve a curator.io y crea una cuenta gratuita." color="bg-[#2460FF]" />
              <StepItem num="2" desc="Conecta tu Instagram y personaliza el feed." color="bg-[#2460FF]" />
              <StepItem num="3" desc="Copia el codigo embed y pegalo abajo." color="bg-[#2460FF]" />
              <a href="https://curator.io" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-sm text-[#2460FF] hover:underline mt-2" data-testid="curator-link">
                Ir a Curator.io <ExternalLink size={12} />
              </a>
            </div>

            {/* Embed Code Input */}
            <div className="border-t border-[#E2E8F0] pt-5">
              <Label className="text-sm font-medium">Codigo embed de Instagram</Label>
              <Textarea
                value={form.instagram_embed_code}
                onChange={e => setForm({...form, instagram_embed_code: e.target.value})}
                placeholder="Pega aqui el codigo embed de Elfsight o Curator..."
                rows={4}
                className="mt-1 font-mono text-xs"
                data-testid="instagram-embed-code-input"
              />
              <p className="text-xs text-[#475569] mt-1">
                Pega el codigo tal cual te lo proporcione Elfsight o Curator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-feed Tab */}
      {activeTab === "multi" && (
        <div className="space-y-6" data-testid="social-multi-config">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Rss size={20} className="text-[#2460FF]" />
              <h3 className="font-heading font-bold text-[#00296B]">Feed Completo Personalizado</h3>
            </div>

            <div className="bg-[#F4F7FB] rounded-lg p-4 mb-5">
              <h4 className="text-sm font-bold text-[#00296B] mb-2 flex items-center gap-2">
                <Info size={14} className="text-[#2460FF]" /> Para que sirve
              </h4>
              <p className="text-sm text-[#475569] leading-relaxed">
                Si quieres un unico feed que combine Instagram, Facebook, TikTok, YouTube y mas redes
                en uno solo, puedes usar servicios como Curator.io, Juicer.io o POWR.
                Solo tienes que pegar el codigo embed que te proporcionen.
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <h4 className="text-sm font-bold text-[#00296B]">Servicios recomendados:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href="https://curator.io" target="_blank" rel="noopener noreferrer"
                   className="border border-[#E2E8F0] rounded-lg p-3 hover:border-[#2460FF] transition-colors text-center" data-testid="service-curator">
                  <p className="font-heading font-bold text-[#00296B] text-sm">Curator.io</p>
                  <p className="text-xs text-[#475569]">Gratis, sin marca</p>
                </a>
                <a href="https://www.powr.io/social-feed" target="_blank" rel="noopener noreferrer"
                   className="border border-[#E2E8F0] rounded-lg p-3 hover:border-[#2460FF] transition-colors text-center" data-testid="service-powr">
                  <p className="font-heading font-bold text-[#00296B] text-sm">POWR</p>
                  <p className="text-xs text-[#475569]">Multi-red, facil</p>
                </a>
                <a href="https://www.juicer.io" target="_blank" rel="noopener noreferrer"
                   className="border border-[#E2E8F0] rounded-lg p-3 hover:border-[#2460FF] transition-colors text-center" data-testid="service-juicer">
                  <p className="font-heading font-bold text-[#00296B] text-sm">Juicer.io</p>
                  <p className="text-xs text-[#475569]">15+ plataformas</p>
                </a>
              </div>
            </div>

            <div className="border-t border-[#E2E8F0] pt-5">
              <Label className="text-sm font-medium">Codigo embed del feed completo</Label>
              <Textarea
                value={form.custom_embed_code}
                onChange={e => setForm({...form, custom_embed_code: e.target.value})}
                placeholder="Pega aqui el codigo embed de Curator, POWR, Juicer, etc."
                rows={4}
                className="mt-1 font-mono text-xs"
                data-testid="custom-embed-code-input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} className="bg-[#2460FF] hover:bg-[#00296B] text-white font-heading font-bold px-8" data-testid="save-social-settings-btn">
          {saved ? "Guardado!" : "Guardar Configuracion"}
        </Button>
        {saved && <span className="text-sm text-green-600">Los cambios se reflejan inmediatamente en la web.</span>}
      </div>
    </div>
  );
}

function StepItem({ num, title, desc, color = "bg-[#2460FF]" }) {
  return (
    <div className="flex items-start gap-3 mb-2">
      <span className={`${color} text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5`}>{num}</span>
      <div>
        {title && <p className="text-sm font-medium text-[#0F172A]">{title}</p>}
        <p className="text-xs text-[#475569]">{desc}</p>
      </div>
    </div>
  );
}
