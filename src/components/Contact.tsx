import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@sewmrsms.co.tz",
    link: "mailto:support@sewmrsms.co.tz",
    description: "Send us an email for general inquiries",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+255 653 750 805",
    link: "tel:+255653750805",
    description: "Speak with our support team",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Chat",
    value: "Quick Support",
    link: "https://wa.me/+255653750805",
    description: "Get instant help via WhatsApp",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Arusha, Tanzania",
    link: "https://sewmrtechnologies.com/",
    description: "Serving businesses nationwide",
  },
];

export const Contact = () => {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Get in Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions? Need a custom solution? We're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Methods */}
          <div className="space-y-8">
            <div className="grid gap-6">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {method.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        {method.description}
                      </p>
                      {method.link ? (
                        <a
                          href={method.link}
                          className="text-primary hover:text-primary-hover font-medium transition-colors"
                          target={method.link.startsWith("http") ? "_blank" : "_self"}
                          rel={method.link.startsWith("http") ? "noopener noreferrer" : ""}
                        >
                          {method.value}
                        </a>
                      ) : (
                        <span className="text-foreground font-medium">
                          {method.value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-8 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button variant="default" className="w-full justify-start">
                  <MessageCircle className="mr-2" />
                  Request a Custom Plan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2" />
                  Schedule a Demo Call
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Form / Info */}
          <div className="bg-card p-8 rounded-lg border border-border">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Ready to Get Started?
                </h3>
                <p className="text-muted-foreground">
                  Choose your plan and start sending SMS messages instantly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div>
                    <p className="font-medium text-foreground">Free Trial</p>
                    <p className="text-sm text-muted-foreground">
                      Test with 10 free SMS messages
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Start Free
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-success/5 rounded-lg border border-success/20">
                  <div>
                    <p className="font-medium text-foreground">Enterprise</p>
                    <p className="text-sm text-muted-foreground">
                      Custom pricing for large volumes
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Contact Sales
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">
                  Business Hours
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>8:00 AM - 6:00 PM EAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>9:00 AM - 2:00 PM EAT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Emergency support only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
