import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Traction } from "@/components/Traction";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { useMeta } from "@/hooks/useMeta";

const Index = () => {
  useMeta({
    title: "Home",
    description: "Deliver your message effectively with SEWMR SMS. Send, manage, and track SMS campaigns easily."
  });
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
