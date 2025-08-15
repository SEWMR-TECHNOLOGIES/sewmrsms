import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Last updated: January 2025
            </p>

            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We collect information you provide directly to us, such as when you create an account, 
                    use our services, or contact us for support.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Account information (name, email, phone number)</li>
                    <li>Payment information (processed securely by our payment providers)</li>
                    <li>SMS content and recipient data</li>
                    <li>Usage data and analytics</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Provide and maintain our SMS services</li>
                    <li>Process your transactions</li>
                    <li>Send you technical notices and support messages</li>
                    <li>Improve our services and develop new features</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Information Sharing</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not sell, trade, or otherwise transfer your personal information to third parties 
                    except as described in this policy. We may share information with service providers who 
                    assist us in operating our platform and conducting our business.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement appropriate security measures to protect your personal information against 
                    unauthorized access, alteration, disclosure, or destruction. This includes encryption 
                    of data in transit and at rest.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We retain your information for as long as necessary to provide our services and comply 
                    with legal obligations. SMS content is typically retained for 30 days for delivery 
                    tracking purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Access and update your personal information</li>
                    <li>Request deletion of your data</li>
                    <li>Opt out of promotional communications</li>
                    <li>Request a copy of your data</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-foreground">
                      Email: support@sewmrsms.co.tz<br />
                      Phone: +255 653 750 805<br />
                      Address: Arusha, Tanzania
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;