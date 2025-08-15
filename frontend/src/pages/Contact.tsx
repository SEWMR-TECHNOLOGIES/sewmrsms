import { Header } from "@/components/Header";
import { Contact } from "@/components/Contact";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-24">
          <div className="container mx-auto px-4 text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions? Need a custom plan? Our team is here to help you succeed.
            </p>
          </div>
          <Contact />
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;