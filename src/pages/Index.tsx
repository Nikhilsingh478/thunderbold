import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import BrandsSection from '../components/BrandsSection';
import LiveSaleSection from '../components/LiveSaleSection';
import Footer from '../components/Footer';
import CategoriesSection from '../components/CategoriesSection';

const Index = () => (
  <div className="noise-overlay min-h-screen flex flex-col">
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <main className="flex-1">
      {/* pt clears: apk banner (36px) + announcement bar (36px) + navbar (~64px mobile / ~72px desktop) */}
      <div className="pt-[calc(100px+var(--tb-banner-h))] md:pt-[calc(108px+var(--tb-banner-h))]">
        <HeroBanner />
      </div>
      <BrandsSection />
      <LiveSaleSection />
      <CategoriesSection />
    </main>
    <Footer />
  </div>
);

export default Index;
