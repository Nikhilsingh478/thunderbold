import CustomCursor from '@/components/CustomCursor';
import ScrollProgress from '@/components/ScrollProgress';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Ticker from '@/components/Ticker';
import ManifestoSection from '@/components/ManifestoSection';
import BrassButtonSection from '@/components/BrassButtonSection';
import Pillars from '@/components/Pillars';
import HangTagSection from '@/components/HangTagSection';
import TraitsSection from '@/components/TraitsSection';
import Statement from '@/components/Statement';
import Numbers from '@/components/Numbers';
import Legacy from '@/components/Legacy';
import Footer from '@/components/Footer';

const About = () => (
  <div className="noise-overlay">
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <HeroSection />
    <Ticker />
    <ManifestoSection />
    <BrassButtonSection />
    <Pillars />
    <HangTagSection />
    <TraitsSection />
    <Statement />
    <Numbers />
    <Legacy />
    <Footer />
  </div>
);

export default About;
