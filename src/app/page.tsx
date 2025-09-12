import Header from '@/components/landing/header';
import Hero from '@/components/landing/hero';
import Features from '@/components/landing/features';
import CollaborationShowcase from '@/components/landing/collaboration-showcase';
import CtaSection from '@/components/landing/cta';
import Footer from '@/components/landing/footer';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <CollaborationShowcase />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
