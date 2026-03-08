import { UserPlus, Upload, Send } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your free account in seconds.",
    step: "01",
  },
  {
    icon: Upload,
    title: "Add Recipients or Use API",
    description: "Upload contacts or integrate with your system.",
    step: "02",
  },
  {
    icon: Send,
    title: "Send SMS",
    description: "Send instantly and view delivery results.",
    step: "03",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with SEWMR SMS in three simple steps
          </p>
        </div>

        {/* Steps with a single connector line */}
        <div className="relative">  
          {/* The single horizontal line */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-px bg-border" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center space-y-6">
                  {/* Step Number & Icon */}
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-primary/10 rounded-full"></div>
                    <div className="absolute inset-2 bg-primary rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
