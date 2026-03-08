import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    content:
      "SEWMR SMS helps us send thousands of alerts to students and parents on time. It’s reliable and fast — just what our school needs.",
    author: "Jane M.",
    role: "School Administrator, St. Mary’s International School",
    location: "Arusha",
    rating: 5,
  },
  {
    content:
      "Integrating SEWMR SMS API was easy. We had user notifications running in just a few hours. It’s now a key part of our system at TEKSAFARI SYSTEMS.",
    author: "Medson Chimande",
    role: "Lead Developer, TEKSAFARI SYSTEMS",
    location: "Dar es Salaam",
    rating: 5,
  },
  {
    content:
      "EasyTextAPI for students enabled me to easily integrate SMS-based user authentication into my mobile app project. Everything was straightforward and worked flawlessly.",
    author: "Amina S.",
    role: "Computer Science Student, University of Dodoma",
    location: "Dodoma",
    rating: 5,
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers across Tanzania
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 bg-card rounded-lg border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-4 w-4 fill-warning text-warning"
                    />
                  ))}
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                  <p className="text-muted-foreground italic leading-relaxed pl-6">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Author */}
                <div className="pt-4 border-t border-border">
                  <p className="font-semibold text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-muted-foreground">
            Ready to join our growing community?
          </p>
          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>1000+ Happy Customers</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>5M+ Messages Sent</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span>99.9% Delivery Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
