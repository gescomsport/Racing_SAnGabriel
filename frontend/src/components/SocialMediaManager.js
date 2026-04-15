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
  const [activeTab, setActiveTab] = useState("automatizacion");

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
      <p className="text-sm text-[#475569] mb-4">
        Configura tus redes sociales para que las publicaciones aparezcan automaticamente en la web.
      </p>

      {/* Quick Guide Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h3 className="font-heading font-bold text-[#00296B] text-sm mb-2">Como funciona - Publica en redes y la web se actualiza sola</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="bg-[#2460FF] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
            <p className="text-[#475569]"><strong>Conecta Make.com</strong> con tu Instagram y Facebook (una vez, 15 min)</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-[#E1306C] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
            <p className="text-[#475569]"><strong>Publica en redes</strong> como siempre desde el movil</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-green-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
            <p className="text-[#475569]"><strong>Aparece en la web</strong> automaticamente en 15 minutos</p>
          </div>
        </div>
      </div>

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
      <div className="flex gap-1 mb-6 bg-[#F4F7FB] p-1 rounded-lg w-fit flex-wrap">
        <button
          onClick={() => setActiveTab("automatizacion")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "automatizacion" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-automatizacion"
        >
          <Rss size={14} className="text-green-500" /> Make.com (Recomendado)
        </button>
        <button
          onClick={() => setActiveTab("facebook")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "facebook" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-facebook"
        >
          <Facebook size={14} className="text-[#1877F2]" /> Facebook Embed
        </button>
        <button
          onClick={() => setActiveTab("instagram")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "instagram" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-instagram"
        >
          <Instagram size={14} className="text-[#E1306C]" /> Instagram Embed
        </button>
        <button
          onClick={() => setActiveTab("multi")}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${activeTab === "multi" ? "bg-white font-medium shadow-sm text-[#00296B]" : "text-[#475569] hover:text-[#00296B]"}`}
          data-testid="social-tab-multi"
        >
          <Rss size={14} className="text-[#2460FF]" /> Feed Completo
        </button>
      </div>

      {/* Automatizacion Tab - Make.com */}
      {activeTab === "automatizacion" && (
        <div className="space-y-5" data-testid="social-automatizacion-config">
          {/* Webhook Info Box */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Rss size={20} className="text-green-500" />
              <h3 className="font-heading font-bold text-[#00296B]">Automatizacion con Make.com</h3>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Gratis - Recomendado</span>
            </div>
            <p className="text-sm text-[#475569] mb-5">
              Con Make.com, cada vez que publiques en Instagram o Facebook desde el movil,
              la publicacion aparece automaticamente en la web en 15 minutos. <strong>Cero mantenimiento.</strong>
            </p>

            {/* Webhook credentials */}
            <div className="bg-[#0F172A] rounded-lg p-5 mb-5">
              <h4 className="text-sm font-bold text-white mb-3">Datos para configurar Make.com</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Webhook URL (copiar y pegar en Make.com):</p>
                  <div className="bg-[#1E293B] rounded p-2 flex items-center justify-between">
                    <code className="text-green-400 text-xs break-all">{process.env.REACT_APP_BACKEND_URL}/api/webhook/social-post</code>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">API Key (para seguridad):</p>
                  <div className="bg-[#1E293B] rounded p-2">
                    <code className="text-amber-400 text-xs">rsg-webhook-2025-secret</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Step by step */}
            <h4 className="font-heading font-bold text-[#00296B] text-sm mb-3">Pasos para configurar (15 minutos, una sola vez)</h4>
            
            <div className="space-y-4">
              <StepBlock num="1" title="Preparar Instagram" color="bg-[#E1306C]">
                <ul className="text-xs text-[#475569] space-y-1 list-disc pl-4">
                  <li>Instagram debe ser <strong>cuenta Business o Creator</strong> (no personal)</li>
                  <li>Debe estar <strong>vinculada a la pagina de Facebook</strong> del club</li>
                  <li>Se cambia en: Instagram &gt; Configuracion &gt; Cuenta &gt; Cambiar a cuenta profesional</li>
                </ul>
              </StepBlock>

              <StepBlock num="2" title="Crear cuenta en Make.com" color="bg-[#2460FF]">
                <ul className="text-xs text-[#475569] space-y-1 list-disc pl-4">
                  <li>Ve a <a href="https://www.make.com" target="_blank" rel="noopener noreferrer" className="text-[#2460FF] underline">make.com</a> y crea cuenta gratuita</li>
                  <li>Plan gratis = 1.000 operaciones/mes (mas que suficiente)</li>
                  <li>No necesitas tarjeta de credito</li>
                </ul>
              </StepBlock>

              <StepBlock num="3" title="Crear escenario de Instagram" color="bg-[#E1306C]">
                <ul className="text-xs text-[#475569] space-y-1 list-disc pl-4">
                  <li>Scenarios &gt; Create new scenario</li>
                  <li>Modulo 1: <strong>Instagram for Business &gt; Watch Media</strong></li>
                  <li>Conecta tu cuenta de Instagram (via Facebook)</li>
                  <li>Modulo 2: <strong>HTTP &gt; Make a request</strong></li>
                  <li>URL: el webhook de arriba | Method: POST | Body: JSON</li>
                  <li>En el body mapea: source=instagram, content=caption, image_url=mediaUrl, post_url=permalink</li>
                  <li>Activa y pon frecuencia cada 15 minutos</li>
                </ul>
              </StepBlock>

              <StepBlock num="4" title="Crear escenario de Facebook" color="bg-[#1877F2]">
                <ul className="text-xs text-[#475569] space-y-1 list-disc pl-4">
                  <li>Igual que Instagram pero con: <strong>Facebook Pages &gt; Watch Posts</strong></li>
                  <li>En el body mapea: source=facebook, content=message, image_url=fullPicture, post_url=permalinkUrl</li>
                  <li>Activa y pon frecuencia cada 15 minutos</li>
                </ul>
              </StepBlock>

              <StepBlock num="5" title="Listo - Olvidate" color="bg-green-500">
                <p className="text-xs text-[#475569]">
                  A partir de ahora, cada vez que publiques en Instagram o Facebook, la web se actualiza sola.
                  No hay que tocar nada mas. Funciona para siempre.
                </p>
              </StepBlock>
            </div>

            {/* JSON template for Make.com */}
            <div className="mt-5 border border-[#E2E8F0] rounded-lg p-4">
              <h4 className="font-heading font-bold text-[#00296B] text-sm mb-2">Plantilla JSON para Instagram (copiar en Make.com)</h4>
              <pre className="bg-[#F4F7FB] rounded p-3 text-xs text-[#0F172A] overflow-x-auto whitespace-pre-wrap">
{`{
  "source": "instagram",
  "content": "{{1.caption}}",
  "image_url": "{{1.mediaUrl}}",
  "post_url": "{{1.permalink}}",
  "author": "@racingsangabrieladc",
  "timestamp": "{{1.timestamp}}",
  "api_key": "rsg-webhook-2025-secret"
}`}
              </pre>
            </div>

            <div className="mt-3 border border-[#E2E8F0] rounded-lg p-4">
              <h4 className="font-heading font-bold text-[#00296B] text-sm mb-2">Plantilla JSON para Facebook (copiar en Make.com)</h4>
              <pre className="bg-[#F4F7FB] rounded p-3 text-xs text-[#0F172A] overflow-x-auto whitespace-pre-wrap">
{`{
  "source": "facebook",
  "content": "{{1.message}}",
  "image_url": "{{1.fullPicture}}",
  "post_url": "{{1.permalinkUrl}}",
  "author": "Racing San Gabriel ADC",
  "timestamp": "{{1.createdTime}}",
  "api_key": "rsg-webhook-2025-secret"
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

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

function StepBlock({ num, title, color = "bg-[#2460FF]", children }) {
  return (
    <div className="flex items-start gap-3 border border-[#E2E8F0] rounded-lg p-4">
      <span className={`${color} text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0`}>{num}</span>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#00296B] mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}

