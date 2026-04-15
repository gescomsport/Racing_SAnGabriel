import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg";

export default function Footer() {
  return (
    <footer className="bg-[#00296B] text-white" data-testid="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Club Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={LOGO_URL} alt="RSGADC" className="h-12 w-12" />
              <div>
                <h3 className="font-heading font-bold text-lg">Racing San Gabriel</h3>
                <p className="text-sm text-blue-200">ADC</p>
              </div>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed">
              Club deportivo multidisciplinar comprometido con el desarrollo deportivo y social de nuestra comunidad.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider mb-4">Enlaces</h4>
            <div className="space-y-2">
              {["Inicio", "Noticias", "Equipos", "Calendario", "Galeria", "Contacto"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const el = document.querySelector(`#${item.toLowerCase()}`);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="block text-sm text-blue-200 hover:text-white transition-colors"
                  data-testid={`footer-link-${item.toLowerCase()}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-blue-200">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>San Gabriel, Alicante</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <Phone size={16} className="shrink-0" />
                <span>+34 600 000 000</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-200">
                <Mail size={16} className="shrink-0" />
                <span>info@racingsangabriel.es</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <a href="https://www.instagram.com/racingsangabrieladc/" target="_blank" rel="noopener noreferrer"
                   className="bg-white/10 p-2 rounded hover:bg-white/20 transition-colors" data-testid="footer-instagram">
                  <Instagram size={18} />
                </a>
                <a href="https://www.facebook.com/RacingSanGabrielADC/" target="_blank" rel="noopener noreferrer"
                   className="bg-white/10 p-2 rounded hover:bg-white/20 transition-colors" data-testid="footer-facebook">
                  <Facebook size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-blue-300">&copy; {new Date().getFullYear()} Racing San Gabriel ADC. Todos los derechos reservados.</p>
          <a href="https://webs.sudeporte.com/home" target="_blank" rel="noopener noreferrer"
             className="text-xs text-blue-300 hover:text-white transition-colors" data-testid="footer-sudeporte-link">
            Creado por sudeporte.com
          </a>
        </div>
      </div>
    </footer>
  );
}
