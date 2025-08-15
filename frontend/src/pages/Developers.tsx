import { Header } from "@/components/Header";
import { Developers } from "@/components/Developers";
import { Footer } from "@/components/Footer";

const DevelopersPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-24">
          <div className="container mx-auto px-4 text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Built for Developers
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful APIs, comprehensive documentation, and tools designed for modern development workflows.
            </p>
          </div>
          <Developers />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DevelopersPage;