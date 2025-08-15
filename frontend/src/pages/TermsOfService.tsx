import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Last updated: January 2025
            </p>

            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing and using SEWMR SMS services, you accept and agree to be bound by the 
                    terms and provision of this agreement. If you do not agree to abide by the above, 
                    please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Service Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    SEWMR SMS provides bulk SMS messaging services for businesses, developers, and 
                    institutions. Our platform allows users to send SMS messages through our API 
                    and web interface.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Acceptable Use</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You agree not to use our services for:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Sending spam or unsolicited messages</li>
                    <li>Promoting illegal activities or content</li>
                    <li>Harassment or threatening communications</li>
                    <li>Phishing or fraudulent activities</li>
                    <li>Violating any applicable laws or regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Account Responsibilities</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You are responsible for:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Ensuring compliance with all applicable laws</li>
                    <li>Obtaining proper consent from SMS recipients</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Payment Terms</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Payment for services is required in advance. All fees are non-refundable unless 
                    otherwise specified. We reserve the right to change our pricing with 30 days notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Service Availability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    While we strive for 99.9% uptime, we do not guarantee uninterrupted service. 
                    We may perform maintenance that temporarily affects service availability.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    SEWMR SMS shall not be liable for any indirect, incidental, special, or 
                    consequential damages arising from the use of our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Termination</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may terminate or suspend your account immediately, without prior notice, 
                    for violations of these Terms of Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Information</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    For questions regarding these terms, please contact us:
                  </p>
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-foreground">
                      Email: info@sewmr-sms.sewmr.com<br />
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

export default TermsOfService;