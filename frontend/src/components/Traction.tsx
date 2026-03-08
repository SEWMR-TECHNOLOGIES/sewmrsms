import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";

const stats = [
  { value: 5000000, suffix: "+", label: "Messages Delivered", description: "Reliable delivery across Tanzania" },
  { value: 500, suffix: "+", label: "Active Businesses", description: "From startups to enterprises" },
  { value: 99.9, suffix: "%", label: "Uptime Guarantee", description: "Always available when you need us" },
  { value: 2, prefix: "<", suffix: "s", label: "Average Delivery", description: "Lightning-fast message delivery" },
];

const clients = [
  "Betasoko Store",
  "Teksafari Systems",
  "Kanisa Langu",
  "eTelectro",
  "Caffe Gelato",
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

const marqueeClients = [...clients, ...clients, ...clients];

export const Traction = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

    <div className="container mx-auto relative z-10">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-24">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="group relative text-center p-8 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
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
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60 mb-10">
          Trusted by leading organizations
        </p>

        <div className="relative overflow-hidden py-4">
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee gap-16 sm:gap-20 w-max items-center">
            {marqueeClients.map((name, idx) => (
              <span
                key={idx}
                className="text-lg sm:text-xl font-semibold text-muted-foreground/40 hover:text-foreground transition-colors duration-300 whitespace-nowrap select-none"
              >
                {name}
              </span>
            ))}
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
        animation: marquee 20s linear infinite;
      }
      .animate-marquee:hover {
        animation-play-state: paused;
      }
    `}</style>
  </section>
);