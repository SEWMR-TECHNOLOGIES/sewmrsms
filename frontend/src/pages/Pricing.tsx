import { Header } from "@/components/Header";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { useMeta } from "@/hooks/useMeta";

const PricingPage = () => {
  useMeta({
    title: "Pricing",
    description: "View SEWMR SMS pricing plans and choose the best option for your messaging needs."
  });
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-24">
          <div className="container mx-auto px-4 text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your SMS messaging needs. No hidden fees, no surprises.
            </p>
          </div>
          <Pricing />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;