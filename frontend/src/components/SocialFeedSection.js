import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Instagram, Facebook, ExternalLink, Rss, Info, CheckCircle } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SocialFeedSection() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    axios.get(`${API}/settings`).then(r => setSettings(r.data)).catch(() => {});
  }, []);

  if (!settings) return null;

  const hasFacebookEmbed = settings.facebook_embed_enabled && settings.facebook_page_url;
  const hasInstagramEmbed = settings.instagram_embed_code && settings.instagram_embed_code.trim();
  const hasCustomEmbed = settings.custom_embed_code && settings.custom_embed_code.trim();
  const hasAnyEmbed = hasFacebookEmbed || hasInstagramEmbed || hasCustomEmbed;

  return (
    <section className="py-16 lg:py-24 bg-white" data-testid="social-feed-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Rss size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Redes Sociales</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-3">
          Siguenos en redes
        </h2>
        <p className="text-[#475569] text-sm mb-8 max-w-2xl">
          Todas nuestras publicaciones de redes sociales se muestran aqui automaticamente. Sigue nuestras cuentas para no perderte nada.
        </p>

        {hasAnyEmbed ? (
          <div className={`grid grid-cols-1 ${hasFacebookEmbed && (hasInstagramEmbed || hasCustomEmbed) ? "lg:grid-cols-2" : ""} gap-6`}>
            {/* Facebook Page Plugin */}
            {hasFacebookEmbed && (
              <FacebookEmbed pageUrl={settings.facebook_page_url} />
            )}

            {/* Instagram Embed (Elfsight/Curator/Custom) */}
            {hasInstagramEmbed && (
              <EmbedBlock
                title="Instagram"
                icon={<Instagram size={20} className="text-[#E1306C]" />}
                embedCode={settings.instagram_embed_code}
                profileUrl={settings.instagram_url}
                profileLabel={`@${settings.instagram_username || "racingsangabrieladc"}`}
              />
            )}

            {/* Custom embed (e.g., Curator, Elfsight multi-feed) */}
            {hasCustomEmbed && !hasInstagramEmbed && (
              <EmbedBlock
                title="Feed Social"
                icon={<Rss size={20} className="text-[#2460FF]" />}
                embedCode={settings.custom_embed_code}
              />
            )}
          </div>
        ) : (
          /* Fallback: Nice link cards when no embeds configured */
          <FallbackCards settings={settings} />
        )}

        {/* Combined embed if custom code is present AND instagram is also present */}
        {hasCustomEmbed && hasInstagramEmbed && (
          <div className="mt-6">
            <EmbedBlock
              title="Feed Social Completo"
              icon={<Rss size={20} className="text-[#2460FF]" />}
              embedCode={settings.custom_embed_code}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function FacebookEmbed({ pageUrl }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(500);

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      setWidth(Math.min(w - 2, 500));
    }

    // Load Facebook SDK
    if (!window.FB) {
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/es_ES/sdk.js#xfbml=1&version=v21.0";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      document.body.appendChild(script);
      script.onload = () => {
        if (window.FB) window.FB.XFBML.parse();
      };
    } else {
      window.FB.XFBML.parse();
    }
  }, [pageUrl]);

  // Clean the page URL for the embed
  const cleanUrl = pageUrl.replace(/\/$/, "");

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" data-testid="facebook-live-embed" ref={containerRef}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E2E8F0] bg-[#F4F7FB]">
        <Facebook size={18} className="text-[#1877F2]" />
        <h3 className="font-heading font-bold text-[#00296B] text-sm">Facebook - En directo</h3>
        <a href={pageUrl} target="_blank" rel="noopener noreferrer"
           className="ml-auto text-[#2460FF] hover:text-[#00296B] flex items-center gap-1 text-xs" data-testid="facebook-live-link">
          Ver pagina <ExternalLink size={12} />
        </a>
      </div>
      <div className="p-4 flex justify-center">
        <div
          className="fb-page"
          data-href={cleanUrl}
          data-tabs="timeline"
          data-width={width}
          data-height="600"
          data-small-header="false"
          data-adapt-container-width="true"
          data-hide-cover="false"
          data-show-facepile="true"
        >
          <blockquote cite={cleanUrl} className="fb-xfbml-parse-ignore">
            <a href={cleanUrl} target="_blank" rel="noopener noreferrer">Racing San Gabriel ADC</a>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

function EmbedBlock({ title, icon, embedCode, profileUrl, profileLabel }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !embedCode) return;

    // Parse and execute scripts in embed code
    const container = containerRef.current;
    container.innerHTML = embedCode;

    // Find and re-execute script tags
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }, [embedCode]);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden" data-testid={`embed-block-${title.toLowerCase().replace(/\s/g, "-")}`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E2E8F0] bg-[#F4F7FB]">
        {icon}
        <h3 className="font-heading font-bold text-[#00296B] text-sm">{title} - En directo</h3>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer"
             className="ml-auto text-[#2460FF] hover:text-[#00296B] flex items-center gap-1 text-xs">
            {profileLabel} <ExternalLink size={12} />
          </a>
        )}
      </div>
      <div className="p-4 min-h-[300px]" ref={containerRef} />
    </div>
  );
}

function FallbackCards({ settings }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Instagram Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 relative overflow-hidden" data-testid="instagram-fallback-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#833AB4]/5 via-[#E1306C]/5 to-transparent rounded-bl-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-2 rounded-lg">
              <Instagram size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-[#00296B]">Instagram</h3>
              <p className="text-xs text-[#475569]">@{settings.instagram_username || "racingsangabrieladc"}</p>
            </div>
          </div>
          <p className="text-sm text-[#475569] mb-4 leading-relaxed">
            Sigue nuestras publicaciones, stories e historias destacadas del club.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#475569] mb-4 bg-[#F4F7FB] p-3 rounded-lg">
            <Info size={14} className="text-[#2460FF] shrink-0" />
            <span>Para ver el feed en directo, configura Elfsight o Curator.io desde el panel de admin.</span>
          </div>
          <a href={settings.instagram_url || "https://www.instagram.com/racingsangabrieladc/"}
             target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
             data-testid="instagram-visit-button">
            <Instagram size={16} /> Visitar Instagram
          </a>
        </div>
      </div>

      {/* Facebook Card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 relative overflow-hidden" data-testid="facebook-fallback-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1877F2]/5 rounded-bl-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-[#1877F2] p-2 rounded-lg">
              <Facebook size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-[#00296B]">Facebook</h3>
              <p className="text-xs text-[#475569]">{settings.facebook_page || "RacingSanGabrielADC"}</p>
            </div>
          </div>
          <p className="text-sm text-[#475569] mb-4 leading-relaxed">
            Noticias, eventos y toda la actividad del club en Facebook.
          </p>
          <div className="flex items-center gap-2 text-xs text-[#475569] mb-4 bg-[#F4F7FB] p-3 rounded-lg">
            <CheckCircle size={14} className="text-green-500 shrink-0" />
            <span>El feed de Facebook se activa automaticamente al guardar la URL en ajustes.</span>
          </div>
          <a href={settings.facebook_url || "https://www.facebook.com/RacingSanGabrielADC/"}
             target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-2 bg-[#1877F2] text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#1565C0] transition-colors"
             data-testid="facebook-visit-button">
            <Facebook size={16} /> Visitar Facebook
          </a>
        </div>
      </div>
    </div>
  );
}
