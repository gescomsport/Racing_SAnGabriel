import { useEffect, useState } from "react";
import axios from "axios";
import { Newspaper, Instagram, Facebook, Globe, ExternalLink } from "lucide-react";
import { Badge } from "../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const sourceIcons = {
  instagram: <Instagram size={14} className="text-[#E1306C]" />,
  facebook: <Facebook size={14} className="text-[#1877F2]" />,
  web: <Globe size={14} className="text-[#2460FF]" />,
};

const categoryColors = {
  general: "bg-[#F4F7FB] text-[#00296B]",
  resultados: "bg-green-50 text-green-700",
  eventos: "bg-amber-50 text-amber-700",
  fichajes: "bg-purple-50 text-purple-700",
};

export default function NewsSection() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    axios.get(`${API}/news`).then(r => setNews(r.data)).catch(() => {});
  }, []);

  if (news.length === 0) return null;

  return (
    <section id="noticias" className="py-16 lg:py-24 bg-[#F4F7FB]" data-testid="news-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Noticias</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-8">
          Ultimas novedades del club
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {news.map((item, i) => (
            <article
              key={item.id}
              className={`bento-card bg-white rounded-xl overflow-hidden fade-in stagger-${i % 4 + 1}`}
              data-testid={`news-card-${i}`}
            >
              {item.image_url && (
                <div className="h-44 overflow-hidden">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  {sourceIcons[item.source] || sourceIcons.web}
                  <span className="text-xs text-[#475569]">{item.source}</span>
                  <Badge className={`text-xs px-2 py-0.5 ${categoryColors[item.category] || categoryColors.general}`}>
                    {item.category}
                  </Badge>
                </div>
                <h3 className="font-heading font-bold text-[#00296B] text-base mb-2 line-clamp-2">{item.title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed line-clamp-3">{item.content}</p>
                <p className="text-xs text-[#94A3B8] mt-3">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }) : ""}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Social Media Embeds */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6" data-testid="instagram-feed-card">
            <div className="flex items-center gap-2 mb-4">
              <Instagram size={20} className="text-[#E1306C]" />
              <h3 className="font-heading font-bold text-[#00296B]">Instagram</h3>
              <a href="https://www.instagram.com/racingsangabrieladc/" target="_blank" rel="noopener noreferrer"
                 className="ml-auto text-[#2460FF] hover:text-[#00296B] flex items-center gap-1 text-sm" data-testid="instagram-follow-link">
                @racingsangabrieladc <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-sm text-[#475569] mb-3">Sigue nuestras publicaciones en Instagram para estar al dia de todo lo que pasa en el club.</p>
            <a href="https://www.instagram.com/racingsangabrieladc/" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
               data-testid="instagram-visit-button">
              <Instagram size={16} /> Visitar Instagram
            </a>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6" data-testid="facebook-feed-card">
            <div className="flex items-center gap-2 mb-4">
              <Facebook size={20} className="text-[#1877F2]" />
              <h3 className="font-heading font-bold text-[#00296B]">Facebook</h3>
              <a href="https://www.facebook.com/RacingSanGabrielADC/" target="_blank" rel="noopener noreferrer"
                 className="ml-auto text-[#2460FF] hover:text-[#00296B] flex items-center gap-1 text-sm" data-testid="facebook-follow-link">
                RacingSanGabrielADC <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-sm text-[#475569] mb-3">Encuentra toda la informacion del club en nuestra pagina de Facebook.</p>
            <a href="https://www.facebook.com/RacingSanGabrielADC/" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 bg-[#1877F2] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#1565C0] transition-colors"
               data-testid="facebook-visit-button">
              <Facebook size={16} /> Visitar Facebook
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
