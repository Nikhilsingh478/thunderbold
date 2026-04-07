import CustomCursor from '../components/CustomCursor';
import ScrollProgress from '../components/ScrollProgress';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CategoriesSection from '../components/CategoriesSection';

const Index = () => (
  <div className="noise-overlay min-h-screen flex flex-col">
    <CustomCursor />
    <ScrollProgress />
    <Navbar />
    <main className="flex-1">
      <CategoriesSection />
    </main>
    <Footer />
  </div>
);

export default Index;
