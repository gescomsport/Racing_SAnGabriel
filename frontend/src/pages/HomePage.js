import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import SocialPostsSection from "../components/SocialPostsSection";
import SocialFeedSection from "../components/SocialFeedSection";
import TeamSection from "../components/TeamSection";
import TrainingScheduleSection from "../components/TrainingScheduleSection";
import MatchCalendar from "../components/MatchCalendar";
import GallerySection from "../components/GallerySection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen" data-testid="home-page">
      <Header />
      <HeroSection />
      <SocialPostsSection />
      <SocialFeedSection />
      <TeamSection />
      <TrainingScheduleSection />
      <MatchCalendar />
      <GallerySection />
      <ContactSection />
      <Footer />
    </div>
  );
}
