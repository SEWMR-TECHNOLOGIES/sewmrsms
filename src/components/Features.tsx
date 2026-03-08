import { 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Code, 
  Globe, 
  GraduationCap 
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "High-Volume Messaging",
    description: "Send thousands of SMS messages instantly with enterprise-grade infrastructure.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Delivery Reports",
    description: "Track message delivery status and get detailed analytics in real-time.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description: "Bank-level security with encrypted tokens and secure API endpoints.",
  },
  {
    icon: Code,
    title: "Easy API Integration",
    description: "Simple REST API with comprehensive documentation and code examples.",
  },
  {
    icon: Globe,
    title: "Swahili + Multilingual Support",
    description: "Send messages in Swahili, English, and other local languages with ease.",
  },
  {
    icon: GraduationCap,
    title: "Student-Friendly API (EasyTextAPI)",
    description: "Simplified API designed specifically for students and learning projects.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Why Choose SEWMR SMS?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to send SMS at scale, backed by reliable infrastructure 
            and developer-friendly tools.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-6 bg-card rounded-lg border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};