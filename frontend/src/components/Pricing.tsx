import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Tembo",
    price: "22",
    minimum: "1",
    popular: false,
    features: [
      "1 or more SMS",
      "API access included",
      "24/7 email support",
      "99.9% service uptime",
    ],
  },
  {
    name: "Twiga",
    price: "20",
    minimum: "6,000",
    popular: true,
    features: [
      "6,000+ SMS messages",
      "API access included",
      "24/7 email support",
      "99.9% service uptime",
    ],
  },
  {
    name: "Simba",
    price: "18",
    minimum: "55,000",
    popular: false,
    features: [
      "55,000+ SMS messages",
      "API access included",
      "24/7 email support",
      "99.9% service uptime",
    ],
  },
  {
    name: "Kifaru",
    price: "16",
    minimum: "410,000",
    popular: false,
    features: [
      "410,000+ SMS messages",
      "API access included",
      "24/7 email support",
      "99.9% service uptime",
    ],
  },
  {
    name: "Nyati",
    price: "14",
    minimum: "500,001",
    popular: false,
    features: [
      "500,001+ SMS messages",
      "API access included",
      "24/7 email support",
      "99.9% service uptime",
    ],
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your messaging needs. All prices are in TZS per SMS.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-6 bg-card rounded-lg border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                plan.popular
                  ? "border-primary shadow-primary/20 scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-primary">
                      TZS {plan.price}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      per SMS
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Min. {plan.minimum} messages
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Select Plan
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            Need a custom solution? We've got you covered.
          </p>
          <Button variant="outline">
            Request Custom Quote
          </Button>
        </div>
      </div>
    </section>
  );
};
