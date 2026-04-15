import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Instagram, Facebook } from "lucide-react";
import { Button } from "../components/ui/button";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_sg-racing-portal/artifacts/5w55i820_Racing%20San%20Gabriel.svg";

const navItems = [
  { label: "Inicio", href: "#hero" },
  { label: "Noticias", href: "#noticias" },
  { label: "Equipos", href: "#equipos" },
  { label: "Calendario", href: "#calendario" },
  { label: "Galeria", href: "#galeria" },
  { label: "Contacto", href: "#contacto" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) return null;

  const handleNavClick = (href) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3" data-testid="header-logo-link">
            <img src={LOGO_URL} alt="RSGADC" className="h-10 w-10" />
            <span className="font-heading font-bold text-[#00296B] text-lg tracking-tight hidden sm:block">
              Racing San Gabriel ADC
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="px-3 py-2 text-sm font-medium text-[#475569] hover:text-[#00296B] transition-colors duration-150"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="https://www.instagram.com/racingsangabrieladc/" target="_blank" rel="noopener noreferrer"
               className="text-[#475569] hover:text-[#E1306C] transition-colors" data-testid="header-instagram-link">
              <Instagram size={18} />
            </a>
            <a href="https://www.facebook.com/RacingSanGabrielADC/" target="_blank" rel="noopener noreferrer"
               className="text-[#475569] hover:text-[#1877F2] transition-colors" data-testid="header-facebook-link">
              <Facebook size={18} />
            </a>
            <button
              className="md:hidden p-2 text-[#00296B]"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E2E8F0] fade-in" data-testid="mobile-menu">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-[#475569] hover:text-[#00296B] hover:bg-[#F4F7FB] rounded"
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
