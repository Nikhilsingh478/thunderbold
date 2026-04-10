import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import Footer from '../components/Footer';
import CategoriesSection from '../components/CategoriesSection';

const Index = () => (
  <div className="noise-overlay min-h-screen flex flex-col">
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <main className="flex-1">
      {/* pt clears: announcement bar (36px) + navbar (~64px mobile / ~72px desktop) */}
      <div className="pt-[100px] md:pt-[108px]">
        <HeroBanner />
      </div>
      <CategoriesSection />
    </main>
    <Footer />
  </div>
);

export default Index;
