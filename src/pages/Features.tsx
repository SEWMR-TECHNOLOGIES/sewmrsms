import { Header } from "@/components/Header";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { useMeta } from "@/hooks/useMeta";

const FeaturesPage = () => {
   useMeta({
    title: "Features",
    description: "Explore SEWMR SMS features: bulk messaging, templates, API integration, and more."
  });
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-24">
          <div className="container mx-auto px-4 text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Powerful Features
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to send SMS at scale with confidence and reliability.
            </p>
          </div>
          <Features />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;