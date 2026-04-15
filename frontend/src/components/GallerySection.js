import { useEffect, useState } from "react";
import axios from "axios";
import { Images, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GallerySection() {
  const [gallery, setGallery] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    axios.get(`${API}/gallery`).then(r => setGallery(r.data)).catch(() => {});
  }, []);

  if (gallery.length === 0) return null;

  return (
    <section id="galeria" className="py-16 lg:py-24 bg-white" data-testid="gallery-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <Images size={20} className="text-[#2460FF]" />
          <p className="text-sm font-medium text-[#2460FF] uppercase tracking-widest">Galeria</p>
        </div>
        <h2 className="font-heading font-bold text-[#00296B] text-2xl lg:text-3xl tracking-tight mb-8">
          Momentos del club
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((item, i) => (
            <div
              key={item.id}
              className={`gallery-item cursor-pointer group fade-in stagger-${i % 4 + 1}`}
              onClick={() => setLightbox(item)}
              data-testid={`gallery-item-${i}`}
            >
              <div className="relative h-56 overflow-hidden">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[#00296B]/0 group-hover:bg-[#00296B]/40 transition-colors duration-300 flex items-end">
                  <div className="p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <h3 className="text-white font-heading font-bold text-sm">{item.title}</h3>
                    {item.description && <p className="text-white/80 text-xs mt-1">{item.description}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)} data-testid="gallery-lightbox">
          <button className="absolute top-4 right-4 text-white hover:text-white/80" onClick={() => setLightbox(null)} data-testid="lightbox-close">
            <X size={28} />
          </button>
          <div className="max-w-4xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
            <div className="text-center mt-4">
              <h3 className="text-white font-heading font-bold text-lg">{lightbox.title}</h3>
              {lightbox.description && <p className="text-white/70 text-sm mt-1">{lightbox.description}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
