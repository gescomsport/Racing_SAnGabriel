import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import NewsSection from "../components/NewsSection";
import TeamSection from "../components/TeamSection";
import MatchCalendar from "../components/MatchCalendar";
import GallerySection from "../components/GallerySection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen" data-testid="home-page">
      <Header />
      <HeroSection />
      <NewsSection />
      <TeamSection />
      <MatchCalendar />
      <GallerySection />
      <ContactSection />
      <Footer />
    </div>
  );
}
