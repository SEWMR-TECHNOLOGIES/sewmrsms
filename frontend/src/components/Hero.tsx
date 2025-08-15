import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import welcomeImage from "@/assets/welcome.png";

export const Hero = () => {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Deliver SMS at Scale —{" "}
                <span className="text-primary">Fast, Secure, Reliable</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                SEWMR SMS helps businesses, developers, and institutions send 
                thousands of messages with ease.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" className="group" asChild>
                <Link to="/signup">
                  Start Sending SMS
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline-hero" asChild>
                <Link to="/pricing">
                  <MessageCircle />
                  See Pricing Plans
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 space-y-4">
              <p className="text-sm text-muted-foreground font-medium">
                Trusted by businesses across Tanzania
              </p>
              <div className="flex items-center space-x-8 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm">99.9% Uptime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">Instant Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <span className="text-sm">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-scale-in">
            <div className="relative z-10">
              <img
                src={welcomeImage}
                alt="SEWMR SMS Platform"
                className="w-full h-auto rounded-2xl shadow-xl"
              />
            </div>
            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 w-full h-full bg-primary/10 rounded-2xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
