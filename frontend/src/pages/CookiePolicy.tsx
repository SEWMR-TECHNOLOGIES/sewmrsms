import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Cookie Policy
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Last updated: January 2025
            </p>

            <div className="prose prose-lg max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">What Are Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Cookies are small pieces of text sent by your web browser by a website you visit. 
                    A cookie file is stored in your web browser and allows the Service or a third-party 
                    to recognize you and make your next visit easier and the Service more useful to you.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    When you use and access the Service, we may place a number of cookies files in your 
                    web browser. We use cookies for the following purposes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>To enable certain functions of the Service</li>
                    <li>To provide analytics and track usage</li>
                    <li>To store your preferences and settings</li>
                    <li>To enable our advertising partners to serve relevant ads</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Types of Cookies We Use</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Essential Cookies</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        These cookies are essential to provide you with services available through our 
                        website and to enable you to use some of its features, such as access to secure areas.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Analytics Cookies</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        These cookies help us understand how visitors interact with our website by 
                        collecting information anonymously. This helps us improve our website and services.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Functional Cookies</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        These cookies allow us to remember choices you make when you use our website, 
                        such as remembering your login details or language preference.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Targeting Cookies</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        These cookies record your visit to our website, the pages you have visited, 
                        and the links you have followed to provide more relevant advertisements.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    In addition to our own cookies, we may also use various third-party cookies to 
                    report usage statistics of the Service and deliver advertisements on and through the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Your Cookie Choices</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You have several options to control or limit how we and our partners use cookies:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Use our cookie consent tool to manage your preferences</li>
                    <li>Modify your browser settings to decline cookies</li>
                    <li>Delete cookies that have already been placed on your device</li>
                    <li>Use private browsing mode to prevent cookies from being stored</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have any questions about this Cookie Policy, please contact us:
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

export default CookiePolicy;