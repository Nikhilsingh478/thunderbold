import { Search } from 'lucide-react';
import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import Navbar from '../components/Navbar';
import HeroBanner from '../components/HeroBanner';
import Footer from '../components/Footer';
import CategoriesSection from '../components/CategoriesSection';

function MobileSearchBar() {
  const openSearch = () => window.dispatchEvent(new CustomEvent('open-search-overlay'));

  return (
    <div className="block md:hidden px-3 mb-3">
      <button
        onClick={openSearch}
        aria-label="Search products"
        className="group w-full flex items-center gap-3 px-4 py-3 border border-white/[0.11] hover:border-white/25 rounded-sm bg-white/[0.025] active:bg-white/[0.05] transition-all duration-200 focus:outline-none"
      >
        <Search
          size={14}
          strokeWidth={1.8}
          className="text-sv-mid flex-shrink-0"
        />
        <span className="font-condensed text-[0.68rem] tracking-[0.2em] uppercase text-sv-dim">
          Search styles & fits…
        </span>
      </button>
    </div>
  );
}

const Index = () => (
  <div className="noise-overlay min-h-screen flex flex-col">
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <main className="flex-1">
      {/* pt clears: announcement bar (36px) + navbar (~64px mobile / ~72px desktop) */}
      <div className="pt-[100px] md:pt-[108px]">
        <MobileSearchBar />
        <HeroBanner />
      </div>
      <CategoriesSection />
    </main>
    <Footer />
  </div>
);

export default Index;
