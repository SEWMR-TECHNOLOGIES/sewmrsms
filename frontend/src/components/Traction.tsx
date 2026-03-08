import { useEffect, useRef } from "react";
import {
  Users,
  MessageSquare,
  Globe,
  Award,
  Store,
  Server,
  Church,
  Zap,
  Coffee,
} from "lucide-react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

const stats = [
  { icon: MessageSquare, value: 5000000, suffix: "+", label: "Messages Delivered", description: "Reliable delivery across Tanzania" },
  { icon: Users, value: 500, suffix: "+", label: "Active Businesses", description: "From startups to enterprises" },
  { icon: Globe, value: 99.9, suffix: "%", label: "Uptime Guarantee", description: "Always available when you need us" },
  { icon: Award, value: 2, prefix: "<", suffix: "s", label: "Average Delivery", description: "Lightning-fast message delivery" },
];

const clients = [
  { icon: Store, name: "Betasoko Store" },
  { icon: Server, name: "Teksafari Systems" },
  { icon: Church, name: "Kanisa Langu" },
  { icon: Zap, name: "eTelectro" },
  { icon: Coffee, name: "Caffe Gelato" },
];

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => {
    if (value >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(v / 1000).toFixed(0)}K`;
    if (value % 1 !== 0) return v.toFixed(1);
    return Math.round(v).toString();
  });

  useEffect(() => {
    if (isInView) {
      animate(motionVal, value, { duration: 2, ease: "easeOut" });
    }
  }, [isInView, value, motionVal]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

// Double the clients array for seamless infinite scroll
const marqueeClients = [...clients, ...clients, ...clients];

export const Traction = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    {/* Subtle background pattern */}
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
    <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

    <div className="container mx-auto relative z-10">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 space-y-4"
      >
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20">
          Proven Results
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
          Why Choose SEWMR SMS?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Join hundreds of businesses who trust us with their communication needs.
          Fast, reliable, and built for the Tanzanian market.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-24">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative text-center p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold text-foreground mb-2 tracking-tight">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <div className="font-semibold text-foreground mb-1 text-sm">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trusted By - Infinite Marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-8">
          Trusted by leading organizations
        </p>

        {/* Marquee container with gradient masks */}
        <div className="relative overflow-hidden py-4">
          {/* Left gradient mask */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          {/* Right gradient mask */}
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="flex animate-marquee gap-8 w-max">
            {marqueeClients.map((client, idx) => {
              const Icon = client.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-6 py-3.5 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/20 hover:bg-card transition-all duration-300 shrink-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80 whitespace-nowrap">
                    {client.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>

    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-33.333%); }
      }
      .animate-marquee {
        animation: marquee 25s linear infinite;
      }
      .animate-marquee:hover {
        animation-play-state: paused;
      }
    `}</style>
  </section>
);
