import { NoiseOverlay } from '../components/landing/NoiseOverlay';
import { Navigation } from '../components/landing/Navigation';
import { Hero } from '../components/landing/Hero';
import { BentoGrid } from '../components/landing/BentoGrid';
import { Methodology } from '../components/landing/Methodology';
import { FAQ } from '../components/landing/FAQ';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <NoiseOverlay />
      <Navigation />
      <Hero />
      <BentoGrid />
      <Methodology />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
