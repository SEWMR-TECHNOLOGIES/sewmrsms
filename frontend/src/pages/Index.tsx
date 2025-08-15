import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Traction } from "@/components/Traction";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Traction />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
