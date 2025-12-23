import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { ToolKitShowcase } from '@/components/landing/ToolKitShowcase';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-nunito selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      <Navbar />
      <Hero />
      <FeatureGrid />
      <ToolKitShowcase />
      <CTA />
      <Footer />
    </div>
  );
}
