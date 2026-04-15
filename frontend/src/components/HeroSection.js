import { ChevronDown, Instagram, Facebook } from "lucide-react";
import { Button } from "../components/ui/button";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/3hoft56y_Racing%20San%20Gabriel.png";
const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/aa4aac70-2da7-49b9-b970-59a86d8b85ed/images/682e19316c70353e5239c60498f15f96abc81c8407903b301b74f7e1879187b1.png";
const STADIUM_IMG = "https://static.prod-images.emergentagent.com/jobs/aa4aac70-2da7-49b9-b970-59a86d8b85ed/images/2e97b7f318b408c34d0d83e3483ffb1fb1d9ea389c42fb72c00f0fdd9219dad4.png";
const TEAM_IMG = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/twkjfnq4_image.png";

export default function HeroSection() {
  const scrollToSection = (id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen pt-16" data-testid="hero-section">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 pb-16">
        {/* Bento Grid Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Main Title Block */}
          <div className="lg:col-span-7 flex flex-col justify-center py-8 lg:py-16 fade-in">
            <div className="flex items-center gap-4 mb-6">
              <img src={LOGO_URL} alt="RSGADC" className="h-20 w-20 lg:h-28 lg:w-28 rounded-lg" />
              <div>
                <p className="text-blue-200 text-sm font-medium tracking-widest uppercase">Club Deportivo</p>
                <h1 className="font-heading font-black text-white text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-none">
                  Racing<br />San Gabriel
                </h1>
                <p className="text-blue-200 font-heading font-bold text-lg mt-1">A.D.C.</p>
              </div>
            </div>
            <p className="text-blue-100 text-base lg:text-lg max-w-xl leading-relaxed mb-8">
              Escuela de futbol de referencia en Alicante. Ubicada en el corazon de Alacant, ofrecemos experiencia deportiva de primer nivel. Futbol base, futbol femenino, futbol sala y mucho mas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => scrollToSection("#contacto")}
                className="bg-[#2460FF] hover:bg-[#00296B] text-white font-heading font-bold px-6 py-3 rounded-full transition-colors duration-150"
                data-testid="hero-cta-contact"
              >
                Contactar
              </Button>
              <Button
                onClick={() => scrollToSection("#noticias")}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-heading font-bold px-6 py-3 rounded-full transition-colors duration-150"
                data-testid="hero-cta-news"
              >
                Ver Noticias
              </Button>
            </div>
          </div>

          {/* Right Bento Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 fade-in stagger-2">
            {/* Stadium Image */}
            <div className="col-span-2 rounded-xl overflow-hidden border border-white/10 h-48 lg:h-56">
              <img src={STADIUM_IMG} alt="Estadio" className="w-full h-full object-cover" />
            </div>
            {/* Team Photo */}
            <div className="rounded-xl overflow-hidden border border-white/10 h-36 lg:h-44">
              <img src={TEAM_IMG} alt="Equipo" className="w-full h-full object-cover" />
            </div>
            {/* Social Links Card */}
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 flex flex-col justify-center items-center gap-3 h-36 lg:h-44">
              <p className="text-white text-xs font-medium uppercase tracking-wider">Siguenos</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/racingsangabrieladc/" target="_blank" rel="noopener noreferrer"
                   className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors" data-testid="hero-instagram-link">
                  <Instagram size={22} className="text-white" />
                </a>
                <a href="https://www.facebook.com/RacingSanGabrielADC/" target="_blank" rel="noopener noreferrer"
                   className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors" data-testid="hero-facebook-link">
                  <Facebook size={22} className="text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex justify-center mt-8">
          <button onClick={() => scrollToSection("#noticias")} className="animate-bounce text-white/60 hover:text-white transition-colors" data-testid="hero-scroll-down">
            <ChevronDown size={28} />
          </button>
        </div>
      </div>
    </section>
  );
}
