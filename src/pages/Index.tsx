import CustomCursor from '@/components/CustomCursor';
import ScrollProgress from '@/components/ScrollProgress';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Ticker from '@/components/Ticker';
import Manifesto from '@/components/Manifesto';
import Pillars from '@/components/Pillars';
import Craft from '@/components/Craft';
import Statement from '@/components/Statement';
import Numbers from '@/components/Numbers';
import Legacy from '@/components/Legacy';
import Footer from '@/components/Footer';

const Index = () => (
  <div className="noise">
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <Hero />
    <Ticker />
    <Manifesto />
    <Pillars />
    <Craft />
    <Statement />
    <Numbers />
    <Legacy />
    <Footer />
  </div>
);

export default Index;
