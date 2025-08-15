import { Button } from "@/components/ui/button";
import { Code, BookOpen, Zap, Users, FileText, Rocket } from "lucide-react";

export const Developers = () => {
  return (
    <section id="developers" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            For Developers & Students
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful tools for developers and simple solutions for students
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Developers Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Code className="h-8 w-8 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">
                  Built for Developers
                </h3>
              </div>
              <p className="text-muted-foreground text-lg">
                Professional-grade SMS API with enterprise features and reliability.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: Zap,
                  title: "Secure Token Access",
                  description: "OAuth 2.0 and API key authentication with rate limiting",
                },
                {
                  icon: FileText,
                  title: "Clean API Docs",
                  description: "Comprehensive documentation with interactive examples",
                },
                {
                  icon: Rocket,
                  title: "Fast Setup & Testing",
                  description: "Get started in minutes with our testing sandbox",
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex space-x-4 p-4 bg-card rounded-lg border border-border">
                    <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Students Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">
                  EasyTextAPI for Students
                </h3>
              </div>
              <p className="text-muted-foreground text-lg">
                Simplified API designed specifically for learning and student projects.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                {
                  icon: BookOpen,
                  title: "Simple Guides",
                  description: "Step-by-step tutorials perfect for beginners",
                },
                {
                  icon: Zap,
                  title: "Free Sandbox",
                  description: "Test your apps without any upfront costs",
                },
                {
                  icon: Code,
                  title: "Perfect for Projects",
                  description: "Ideal for school messaging tools and demos",
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex space-x-4 p-4 bg-card rounded-lg border border-border">
                    <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Ready to integrate SMS into your application?
            </h3>
            <p className="text-muted-foreground">
              Get started with our comprehensive API documentation
            </p>
          </div>
          <Button variant="default" size="lg">
            <BookOpen className="mr-2" />
            View API Docs
          </Button>
        </div>
      </div>
    </section>
  );
};