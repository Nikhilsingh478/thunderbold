import { useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import BrandsSection from '../components/BrandsSection';
import LiveSaleSection from '../components/LiveSaleSection';
import Footer from '../components/Footer';
import CategoriesSection from '../components/CategoriesSection';

const Index = () => {
  useSEO({
    title: "Curated Streetwear & Fashion India",
    description: "Thunderbold is a curated fashion store offering premium denim, streetwear, t-shirts, shirts, and kurtas. Handpicked collections. Honest pricing. Style that works every day.",
  });

  useEffect(() => {
    // Prefetch brands in background to warm session cache for instant load times
    if (!sessionStorage.getItem('tb_brands_cache')) {
      fetch('/api/brands')
        .then(r => r.json())
        .then(d => {
          if (d.brands) {
            sessionStorage.setItem('tb_brands_cache', JSON.stringify(d.brands));
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
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
};

export default Index;
