import {
  Users,
  MessageSquare,
  Globe,
  Award,
  Store,
  Server,
  Church,
  Zap,
  Coffee
} from "lucide-react";

const stats = [
  {
    icon: MessageSquare,
    value: "5M+",
    label: "Messages Delivered",
    description: "Reliable delivery across Tanzania",
  },
  {
    icon: Users,
    value: "500+",
    label: "Active Businesses",
    description: "From startups to enterprises",
  },
  {
    icon: Globe,
    value: "99.9%",
    label: "Uptime Guarantee",
    description: "Always available when you need us",
  },
  {
    icon: Award,
    value: "<2s",
    label: "Average Delivery",
    description: "Lightning-fast message delivery",
  },
];

const clients = [
  { icon: Store, name: "Betasoko Store" },
  { icon: Server, name: "Teksafari Systems" },
  { icon: Church, name: "Kanisa Langu" },
  { icon: Zap, name: "eTelectro" },
  { icon: Coffee, name: "Caffe Gelato" },
];

export const Traction = () => (
  <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
    <div className="container mx-auto">
      {/* Value Proposition */}
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Why Choose SEWMR SMS?
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Join hundreds of businesses who trust us with their communication needs.
          Fast, reliable, and built for the Tanzanian market.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="text-center p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">
                {stat.value}
              </div>
              <div className="font-semibold text-foreground mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Creative Clients Brand Wall */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-10">
          Trusted by Leading Organizations
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {clients.map((client, idx) => {
            const Icon = client.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-3 px-5 py-3 rounded-full border border-border bg-card hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {client.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);
